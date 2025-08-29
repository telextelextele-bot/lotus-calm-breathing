
import React, { useEffect, useRef } from 'react';
import type { PpgData } from '../types';

interface PpgSetupScreenProps {
  ppgData: PpgData;
  onStart: () => void;
  onCancel: () => void;
}

const HRVGraph: React.FC<{ rrIntervals: number[] }> = ({ rrIntervals }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        if (rrIntervals.length < 2) return;

        const data = rrIntervals.slice(-50);
        const maxVal = Math.max(...data) * 1.1;
        const minVal = Math.min(...data) * 0.9;

        ctx.strokeStyle = 'rgba(100, 255, 218, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < data.length; i++) {
            const x = (i / (data.length - 1)) * w;
            const y = h - ((data[i] - minVal) / (maxVal - minVal)) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }, [rrIntervals]);

    return <canvas ref={canvasRef} className="h-full w-full" width="300" height="60" />;
};


export const PpgSetupScreen: React.FC<PpgSetupScreenProps & { rrIntervals: number[] }> = ({ ppgData, onStart, onCancel, rrIntervals }) => {
    const isCoherent = ppgData.coherence !== null && ppgData.coherence > 50;

    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="w-full max-w-md rounded-2xl bg-black/25 p-6 text-center text-stone-100 shadow-2xl backdrop-blur-md">
                <h2 className="text-[clamp(1.8em,6vw,2.2em)] font-bold mb-4 text-shadow">Camera Heart Rate Setup</h2>
                <p className="mx-auto max-w-sm text-[clamp(0.9em,4vw,1.1em)] mb-5 text-shadow-sm">Gently place your index finger over the rear camera and flash. Remain still.</p>

                <div className={`relative mx-auto flex h-[180px] w-[180px] items-center justify-center rounded-full border-2 border-dashed transition-all duration-500 ${isCoherent ? 'border-green-400 animate-pulse' : 'border-white/30'}`}>
                    <span className="text-[clamp(2.5em,10vw,3.5em)] font-bold text-red-300">{ppgData.bpm || '--'}</span>
                    <span className="ml-2 text-base text-white/70">BPM</span>
                </div>

                <div className="my-3 text-sm text-white/80">
                    <p>Variability (RMSSD): <span className="font-semibold text-teal-300">{ppgData.hrv?.toFixed(1) || '--'}</span> ms</p>
                    <p>Coherence Score: <span className="font-semibold text-teal-300">{ppgData.coherence?.toFixed(1) || '--'}</span>%</p>
                </div>

                <p className="my-4 min-h-[1.5em] text-base text-white/90">{ppgData.status}</p>

                <div className="my-4 h-16 w-full rounded-lg bg-black/30 p-1">
                   <HRVGraph rrIntervals={rrIntervals} />
                </div>

                <div className="flex flex-col items-center gap-3">
                    <button onClick={onStart} disabled={!ppgData.isReady} className="w-full max-w-xs rounded-lg border border-white/30 bg-pink-600/80 px-5 py-3 text-lg font-bold shadow-lg transition hover:bg-pink-500/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
                        Begin Coherence Breathing
                    </button>
                    <button onClick={onCancel} className="w-full max-w-xs rounded-lg border border-white/30 bg-gray-500/70 px-5 py-3 text-lg font-bold shadow-lg transition hover:bg-gray-400/80 active:scale-95">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
