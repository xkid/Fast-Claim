
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface CropToolProps {
  imageSrc: string;
  onCrop: (croppedBase64: string) => void;
  onCancel: () => void;
}

export const CropTool: React.FC<CropToolProps> = ({ imageSrc, onCrop, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Normalized coordinates (0-1) for the 4 corners
  const [corners, setCorners] = useState<Point[]>([
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ]);

  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (draggingIdx === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setCorners(prev => {
      const next = [...prev];
      next[draggingIdx] = { x, y };
      return next;
    });
  }, [draggingIdx]);

  const handlePointerUp = () => setDraggingIdx(null);

  const performCrop = () => {
    if (!imgRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    
    // For simplicity, we'll do a rectangular crop based on the bounds of the 4 points
    const minX = Math.min(...corners.map(c => c.x)) * img.naturalWidth;
    const maxX = Math.max(...corners.map(c => c.x)) * img.naturalWidth;
    const minY = Math.min(...corners.map(c => c.y)) * img.naturalHeight;
    const maxY = Math.max(...corners.map(c => c.y)) * img.naturalHeight;

    const width = maxX - minX;
    const height = maxY - minY;

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, minX, minY, width, height, 0, 0, width, height);
    onCrop(canvas.toDataURL('image/jpeg', 0.8));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg flex flex-col gap-4">
        <div className="flex justify-between items-center text-white">
          <h2 className="text-xl font-bold">Crop Receipt</h2>
          <button onClick={onCancel} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
            <X size={24} />
          </button>
        </div>

        <div 
          ref={containerRef}
          className="relative w-full aspect-[3/4] bg-slate-800 rounded-lg overflow-hidden touch-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <img 
            ref={imgRef}
            src={imageSrc} 
            className="w-full h-full object-contain pointer-events-none select-none"
            alt="To crop"
          />
          
          {/* Overlay Grid */}
          <div className="absolute inset-0 pointer-events-none">
             <svg className="w-full h-full">
                <polygon 
                  points={corners.map(c => `${c.x * 100}%,${c.y * 100}%`).join(' ')} 
                  className="fill-blue-500/20 stroke-blue-400 stroke-2"
                />
             </svg>
          </div>

          {/* Draggable Corners */}
          {corners.map((p, i) => (
            <div
              key={i}
              onPointerDown={(e) => {
                e.preventDefault();
                setDraggingIdx(i);
              }}
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
              className="absolute w-8 h-8 -ml-4 -mt-4 bg-white border-4 border-blue-500 rounded-full shadow-lg cursor-pointer z-10 flex items-center justify-center"
            >
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            </div>
          ))}
        </div>

        <button
          onClick={performCrop}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition"
        >
          <Check size={20} />
          Apply Selection
        </button>
      </div>
    </div>
  );
};
