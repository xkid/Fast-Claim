
import React, { useState, useRef, useEffect } from 'react';
import { Receipt } from '../types';
import { Move, Maximize2 } from 'lucide-react';

interface AttachmentBoardProps {
  receipts: Receipt[];
  onUpdateReceipt: (id: string, layout: Receipt['layout']) => void;
  isPrintView?: boolean;
}

export const AttachmentBoard: React.FC<AttachmentBoardProps> = ({ receipts, onUpdateReceipt, isPrintView = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [initialLayout, setInitialLayout] = useState<Receipt['layout'] | null>(null);

  const filteredReceipts = receipts.filter(r => !!r.croppedImage);

  const handlePointerDown = (id: string, mode: 'move' | 'resize', e: React.PointerEvent) => {
    if (isPrintView) return;
    setActiveId(id);
    setDragMode(mode);
    setStartPos({ x: e.clientX, y: e.clientY });
    const receipt = receipts.find(r => r.id === id);
    if (receipt) setInitialLayout({ ...receipt.layout });
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeId || !dragMode || !initialLayout || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - startPos.x) / rect.width) * 100;
      const dy = ((e.clientY - startPos.y) / rect.height) * 100;

      const newLayout = { ...initialLayout };

      if (dragMode === 'move') {
        newLayout.x = Math.max(0, Math.min(100 - initialLayout.width, initialLayout.x + dx));
        newLayout.y = Math.max(0, Math.min(100 - initialLayout.height, initialLayout.y + dy));
      } else if (dragMode === 'resize') {
        newLayout.width = Math.max(10, initialLayout.width + dx);
        newLayout.height = Math.max(10, initialLayout.height + dy);
      }

      onUpdateReceipt(activeId, newLayout);
    };

    const handlePointerUp = () => {
      setActiveId(null);
      setDragMode(null);
    };

    if (activeId) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeId, dragMode, initialLayout, startPos, onUpdateReceipt]);

  return (
    <div 
      ref={containerRef}
      className={`relative a4-preview ${isPrintView ? 'print-page' : 'mx-auto'}`}
    >
      <div className="absolute top-4 left-4 text-slate-300 font-bold text-2xl uppercase pointer-events-none">
        Attachments
      </div>
      
      {filteredReceipts.map((r) => (
        <div
          key={r.id}
          className={`absolute border border-slate-200 bg-white group select-none ${activeId === r.id ? 'z-20 ring-2 ring-blue-500' : 'z-10'}`}
          style={{
            left: `${r.layout.x}%`,
            top: `${r.layout.y}%`,
            width: `${r.layout.width}%`,
            height: `${r.layout.height}%`,
            touchAction: 'none'
          }}
        >
          <img 
            src={r.croppedImage!} 
            className="w-full h-full object-contain pointer-events-none" 
            alt="Receipt"
          />
          
          {!isPrintView && (
            <>
              {/* Move Handle */}
              <div 
                className="absolute inset-0 cursor-move flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition"
                onPointerDown={(e) => handlePointerDown(r.id, 'move', e)}
              >
                <Move className="text-blue-500 bg-white p-1 rounded-full shadow-lg" size={32} />
              </div>
              
              {/* Resize Handle (Bottom Right) */}
              <div 
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 cursor-nwse-resize flex items-center justify-center rounded-tl-lg shadow-lg"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handlePointerDown(r.id, 'resize', e);
                }}
              >
                <Maximize2 size={16} className="text-white" />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};
