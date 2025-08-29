
import { useState, useRef, useCallback, useEffect } from 'react';
import type { PpgData } from '../types';

// --- Signal Processing Helpers ---
const highpassFilter = (data: number[], cutoffHz: number, dt = 0.033) => {
    const rc = 1.0 / (2 * Math.PI * cutoffHz);
    const alpha = rc / (rc + dt);
    const filtered = [data[0]];
    for (let i = 1; i < data.length; i++) {
        filtered[i] = alpha * (filtered[i - 1] + data[i] - data[i - 1]);
    }
    return filtered;
};

const lowpassFilter = (data: number[], cutoffHz: number, dt = 0.033) => {
    const rc = 1.0 / (2 * Math.PI * cutoffHz);
    const alpha = dt / (rc + dt);
    const filtered = [data[0]];
    for (let i = 1; i < data.length; i++) {
        filtered[i] = filtered[i - 1] + (alpha * (data[i] - filtered[i - 1]));
    }
    return filtered;
};

const findPeaks = (data: number[], thresholdFactor: number) => {
    const peaks: number[] = [];
    if(data.length === 0) return peaks;
    const mean = data.reduce((a, b) => a + b) / data.length;
    const threshold = mean + thresholdFactor * (Math.max(...data) - mean);
    for (let i = 1; i < data.length - 1; i++) {
        if (data[i] > threshold && data[i] > data[i - 1] && data[i] > data[i + 1]) {
            peaks.push(i);
        }
    }
    return peaks;
};

const fft = (data: number[]): { re: number; im: number }[] => {
    const N = data.length;
    if (N <= 1) return [{ re: data[0] || 0, im: 0 }];
    const even = fft(data.filter((_, i) => i % 2 === 0));
    const odd = fft(data.filter((_, i) => i % 2 !== 0));
    const result = new Array(N);
    for (let k = 0; k < N / 2; k++) {
        const t = { re: Math.cos(-2 * Math.PI * k / N), im: Math.sin(-2 * Math.PI * k / N) };
        const product = { re: t.re * odd[k].re - t.im * odd[k].im, im: t.re * odd[k].im + t.im * odd[k].re };
        result[k] = { re: even[k].re + product.re, im: even[k].im + product.im };
        result[k + N / 2] = { re: even[k].re - product.re, im: even[k].im - product.im };
    }
    return result;
};

const calculateHrvAndCoherence = (intervals: number[]) => {
    if (intervals.length < 2) return { rmssd: 0, coherence: 0 };
    let sumSqDiff = 0;
    for (let i = 0; i < intervals.length - 1; i++) {
        sumSqDiff += Math.pow(intervals[i + 1] - intervals[i], 2);
    }
    const rmssd = Math.sqrt(sumSqDiff / (intervals.length - 1));

    const meanInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const sampleRate = 4;
    let t = 0;
    let interpolated: number[] = [];
    for (let i = 0; i < intervals.length; i++) {
        t += intervals[i] / 1000;
        while (interpolated.length / sampleRate < t) {
            interpolated.push(intervals[i]);
        }
    }
    const N = Math.pow(2, Math.ceil(Math.log2(interpolated.length)));
    while (interpolated.length < N) interpolated.push(meanInterval);
    const spectrum = fft(interpolated);
    const lowFreqBandStart = Math.floor(0.04 * N / sampleRate);
    const lowFreqBandEnd = Math.floor(0.15 * N / sampleRate);
    let totalPower = 0, peakPower = 0;
    for (let i = 1; i < N / 2; i++) {
        const power = spectrum[i].re * spectrum[i].re + spectrum[i].im * spectrum[i].im;
        if (i >= lowFreqBandStart && i <= lowFreqBandEnd) {
            if (power > peakPower) peakPower = power;
        }
        totalPower += power;
    }
    const coherence = totalPower > 0 ? (peakPower / totalPower) * 100 : 0;
    return { rmssd, coherence };
};

// --- The Hook ---
export const usePpg = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const ppgSamplesRef = useRef<number[]>([]);
    const ppgTimestampsRef = useRef<number[]>([]);
    const ppgPeakTimestampsRef = useRef<number[]>([]);
    const rrIntervalsRef = useRef<number[]>([]);
    const lastAnalysisTimeRef = useRef<number>(0);

    const [ppgData, setPpgData] = useState<PpgData>({
        bpm: null, hrv: null, coherence: null, status: 'Initializing...', isReady: false
    });
    
    const analyzeHeartData = useCallback(() => {
        if (ppgSamplesRef.current.length < 50) return;

        const highpassed = highpassFilter(ppgSamplesRef.current, 0.5);
        const lowpassed = lowpassFilter(highpassed, 3);
        const peaks = findPeaks(lowpassed, 0.4);

        if (peaks.length < 2) return;

        const currentPeakTimestamps = peaks.map(p => ppgTimestampsRef.current[p]);
        const currentRR = [];
        for (let i = 1; i < currentPeakTimestamps.length; i++) {
            const diff = currentPeakTimestamps[i] - currentPeakTimestamps[i - 1];
            if (diff > 300 && diff < 2000) currentRR.push(diff);
        }
        if (currentRR.length < 1) return;

        const avgInterval = currentRR.reduce((a, b) => a + b) / currentRR.length;
        const heartRate = Math.round(60000 / avgInterval);

        if (currentPeakTimestamps.length > 0 && (!ppgPeakTimestampsRef.current.length || currentPeakTimestamps[currentPeakTimestamps.length - 1] > ppgPeakTimestampsRef.current[ppgPeakTimestampsRef.current.length - 1])) {
            ppgPeakTimestampsRef.current.push(...currentPeakTimestamps.filter(t => !ppgPeakTimestampsRef.current.includes(t)));
            const newIntervals = [];
            for (let i = 1; i < ppgPeakTimestampsRef.current.length; i++) {
                newIntervals.push(ppgPeakTimestampsRef.current[i] - ppgPeakTimestampsRef.current[i - 1]);
            }
            rrIntervalsRef.current = newIntervals;
        }

        if (heartRate > 40 && heartRate < 180) {
            const { rmssd, coherence } = calculateHrvAndCoherence(rrIntervalsRef.current);
            setPpgData({
                bpm: heartRate, hrv: rmssd, coherence: coherence,
                status: 'Pulse detected. Ready to begin.', isReady: true
            });
        }
    }, []);

    const processPpgFrame = useCallback(() => {
        if (!streamRef.current || !videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
            animationFrameIdRef.current = requestAnimationFrame(processPpgFrame);
            return;
        }
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if(!ctx) return;
        
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        
        const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        let redSum = 0;
        for (let i = 0; i < imageData.data.length; i += 4) redSum += imageData.data[i];
        
        const now = Date.now();
        ppgSamplesRef.current.push(redSum / (imageData.data.length / 4));
        ppgTimestampsRef.current.push(now);

        const cutoffTime = now - 20000;
        while (ppgTimestampsRef.current.length > 0 && ppgTimestampsRef.current[0] < cutoffTime) {
            ppgTimestampsRef.current.shift();
            ppgSamplesRef.current.shift();
        }

        if (now - lastAnalysisTimeRef.current > 1000) {
            analyzeHeartData();
            lastAnalysisTimeRef.current = now;
        }
        animationFrameIdRef.current = requestAnimationFrame(processPpgFrame);
    }, [analyzeHeartData]);

    const stopPpg = useCallback(() => {
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        streamRef.current = null;
        animationFrameIdRef.current = null;
        ppgSamplesRef.current = [];
        ppgTimestampsRef.current = [];
        ppgPeakTimestampsRef.current = [];
        rrIntervalsRef.current = [];
        setPpgData({ bpm: null, hrv: null, coherence: null, status: 'Disconnected', isReady: false });
    }, []);

    const startPpg = useCallback(async () => {
        if (streamRef.current) stopPpg();
        setPpgData(d => ({...d, status: 'Connecting to camera...'}));
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 320 }, height: { ideal: 240 } }
            });
            streamRef.current = stream;
            if(videoRef.current) videoRef.current.srcObject = stream;
            
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            // @ts-ignore
            if (capabilities.torch) {
                // Fix: Cast constraints to 'any' to allow the 'torch' property, which may not be in default TypeScript lib definitions.
                await track.applyConstraints({ advanced: [{ torch: true }] as any });
            }
            
            setPpgData(d => ({...d, status: 'Detecting pulse. Please wait...'}));
            animationFrameIdRef.current = requestAnimationFrame(processPpgFrame);
        } catch (err) {
            console.error(err);
            setPpgData(d => ({...d, status: 'Error accessing camera.'}));
        }
    }, [stopPpg, processPpgFrame]);
    
    useEffect(() => {
        return () => stopPpg();
    }, [stopPpg]);

    return { ppgData, ppgRefs: { videoRef, canvasRef }, startPpg, stopPpg, rrIntervals: rrIntervalsRef.current };
};
