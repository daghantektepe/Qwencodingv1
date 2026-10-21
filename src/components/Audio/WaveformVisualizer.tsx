import React, { useEffect, useState } from 'react';

interface WaveformVisualizerProps {
  isRecording?: boolean;
  barCount?: number;
  height?: number;
  barColor?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isRecording = false,
  barCount = 28,
  height = 48,
  barColor = '#38bdf8'
}) => {
  const [amplitudes, setAmplitudes] = useState<number[]>(() =>
    Array(barCount).fill(0.1)
  );

  useEffect(() => {
    if (!isRecording) {
      setAmplitudes(Array(barCount).fill(0.08));
      return;
    }

    const interval = setInterval(() => {
      setAmplitudes(
        Array.from({ length: barCount }, () =>
          Math.max(0.15, Math.random() * 0.95)
        )
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isRecording, barCount]);

  return (
    <div
      className="waveform-visualizer flex items-center justify-center gap-1 w-full bg-slate-950/70 p-3 rounded-lg border border-slate-800"
      style={{ height }}
      aria-label="Ses Dalgası Görselleştiricisi"
      role="img"
    >
      {amplitudes.map((amp, idx) => {
        const barHeight = Math.max(4, Math.round(amp * (height - 12)));
        return (
          <div
            key={idx}
            className="w-1 rounded-full transition-all duration-100 ease-out"
            style={{
              height: `${barHeight}px`,
              backgroundColor: isRecording ? barColor : '#475569',
              opacity: isRecording ? 0.7 + amp * 0.3 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
};

export default WaveformVisualizer;
