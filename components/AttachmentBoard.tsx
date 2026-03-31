
import React from 'react';
import { Receipt } from '../types';

interface AttachmentBoardProps {
  receipts: Receipt[];
}

export const AttachmentBoard: React.FC<AttachmentBoardProps> = ({ receipts }) => {
  const filteredReceipts = receipts.filter(r => !!r.croppedImage);
  
  if (filteredReceipts.length === 0) return null;

  return (
    <div className="a4-preview-auto print-page-auto bg-white mx-auto shadow-xl mb-12 print:mb-0 flex flex-col p-0">
      <div className="text-slate-300 font-bold text-2xl uppercase pointer-events-none mb-4 text-center no-print pt-4">
        Attachments
      </div>
      
      <div className="w-full p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-2 gap-4 items-start">
        {filteredReceipts.map((r) => (
          <div 
            key={r.id} 
            className="break-inside-avoid"
            style={{ pageBreakInside: 'avoid' }}
          >
            <img 
              src={r.croppedImage!} 
              className="w-full h-auto object-contain rounded shadow-sm border border-slate-200" 
              alt="Receipt"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
