'use client';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  bottomPx?: number;
}

export function ProgressBar({ currentTime, duration, bottomPx = 0 }: ProgressBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute left-0 w-full z-30" style={{ bottom: bottomPx }}>
      {/* Time display */}
      <div className="flex justify-between px-3 pb-1">
        <span className="text-[10px] text-white/60">{formatTime(currentTime)}</span>
        <span className="text-[10px] text-white/60">{formatTime(duration)}</span>
      </div>
      {/* Bar */}
      <div className="w-full h-1 bg-white/20">
        <div
          className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-r-full relative transition-[width] duration-200"
          style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(6, 182, 212, 0.7)' }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-md transform scale-125" />
        </div>
      </div>
    </div>
  );
}
