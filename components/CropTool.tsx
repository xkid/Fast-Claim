
import React, { useState, useRef, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface CropToolProps {
  imageSrc: string;
  onCrop: (croppedBase64: string) => void;
  onCancel: () => void;
}

export const CropTool: React.FC<CropToolProps> = ({ imageSrc, onCrop, onCancel }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 10,
    y: 10,
    width: 80,
    height: 80
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Auto crop: 90% of the image centered
    setCrop({
      unit: '%',
      x: 5,
      y: 5,
      width: 90,
      height: 90
    });
  }, []);

  const performCrop = () => {
    if (!imgRef.current || !completedCrop) {
      // If no crop was made, just return the original image
      onCrop(imageSrc);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg flex flex-col gap-4 h-full max-h-[90vh]">
        <div className="flex justify-between items-center text-white shrink-0">
          <h2 className="text-xl font-bold">Crop Receipt</h2>
          <button onClick={onCancel} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 min-h-0 bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            className="max-h-full max-w-full"
          >
            <img 
              ref={imgRef}
              src={imageSrc} 
              onLoad={onImageLoad}
              className="max-h-full max-w-full object-contain"
              alt="To crop"
            />
          </ReactCrop>
        </div>

        <button
          onClick={performCrop}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition shrink-0"
        >
          <Check size={20} />
          Apply Selection
        </button>
      </div>
    </div>
  );
};
