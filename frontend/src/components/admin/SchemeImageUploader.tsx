import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Link as LinkIcon, Sparkles, Check, Trash2, Eye } from 'lucide-react';
import { getSchemeImageUrl } from '../../utils/imageHelper';

interface SchemeImageUploaderProps {
  imageUrl: string;
  category: string;
  schemeName: string;
  shortDescription?: string;
  state?: string;
  schemeId?: number;
  onChange: (newImageUrl: string) => void;
}

const IMAGE_PRESETS = [
  { label: 'Education / Scholarship', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800' },
  { label: 'Agriculture / Farmers', url: 'https://images.unsplash.com/photo-1595275372297-f51b4efb07a5?auto=format&fit=crop&q=80&w=800' },
  { label: 'Small Business / MSME', url: 'https://images.unsplash.com/photo-1556742049-0a67daf64f42?auto=format&fit=crop&q=80&w=800' },
  { label: 'Housing & Urban', url: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&q=80&w=800' },
  { label: 'Women & Child Welfare', url: 'https://images.unsplash.com/photo-1609139324428-0cd1144a374b?auto=format&fit=crop&q=80&w=800' },
  { label: 'Senior Citizens', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800' },
  { label: 'Healthcare & Care', url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=800' },
  { label: 'Skill Development', url: 'https://images.unsplash.com/photo-15881092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800' }
];

export const SchemeImageUploader: React.FC<SchemeImageUploaderProps> = ({
  imageUrl,
  category,
  schemeName,
  shortDescription,
  state,
  schemeId,
  onChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (e.g. PNG, JPG, WEBP, SVG).');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawResult = e.target?.result as string;
      if (rawResult) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            onChange(compressed);
          } else {
            onChange(rawResult);
          }
          setUploadSuccess(`Successfully optimized & loaded image: ${file.name}`);
          setTimeout(() => setUploadSuccess(''), 4000);
          setUploading(false);
        };
        img.onerror = () => {
          onChange(rawResult);
          setUploading(false);
        };
        img.src = rawResult;
      } else {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      alert('Failed to read image file.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const activeBannerUrl = getSchemeImageUrl(category, schemeName, schemeId, imageUrl);

  return (
    <div className="space-y-4 p-5 bg-slate-50 border border-slate-200/90 rounded-3xl shadow-sm text-xs text-left">
      
      <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
        <label className="font-extrabold text-sm text-gov-blue-900 flex items-center gap-2">
          <ImageIcon className="w-4.5 h-4.5 text-gov-blue-600" /> Scheme Cover Image Management
        </label>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          Upload file or paste web link
        </span>
      </div>

      {uploadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-2 animate-slideDown">
          <Check className="w-4 h-4 text-emerald-600" /> {uploadSuccess}
        </div>
      )}

      {/* Upload Zone & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Upload File Box */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragOver 
              ? 'border-gov-blue-500 bg-gov-blue-50/80 shadow-md' 
              : 'border-slate-300 hover:border-gov-blue-400 bg-white hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          <div className="w-10 h-10 rounded-2xl bg-gov-blue-100 text-gov-blue-600 flex items-center justify-center mb-2 shadow-sm">
            <Upload className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-slate-800 text-xs">
            {uploading ? 'Processing Image...' : 'Click or Drag & Drop Image Here'}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 font-medium">
            Supports PNG, JPG, WEBP, SVG (Max 5MB)
          </span>
        </div>

        {/* Paste URL Input & Presets */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" /> External Image URL Link
            </label>
            <input
              type="url"
              value={imageUrl || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://images.unsplash.com/... (Paste image web address)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-gov-blue-500 text-xs"
            />
          </div>

          <div>
            <span className="text-[10px] font-extrabold text-slate-500 block mb-1.5 uppercase tracking-wider">
              Quick Curated Presets:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
              {IMAGE_PRESETS.map((preset, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  className="px-2.5 py-1 bg-white hover:bg-gov-blue-50 border border-slate-200 hover:border-gov-blue-300 text-slate-700 hover:text-gov-blue-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  📷 {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Live Citizen Banner Preview Box */}
      <div className="pt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-gov-blue-500" /> Live Citizen Image Banner Card Preview
          </span>
          {imageUrl && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Clear Image
            </button>
          )}
        </div>

        <div className="w-full h-44 rounded-2xl overflow-hidden relative border border-slate-200 shadow-md bg-slate-950">
          <img 
            src={activeBannerUrl} 
            alt="Banner Preview" 
            className="w-full h-full object-cover opacity-85 transition-opacity" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-5 flex flex-col justify-end text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 bg-gov-blue-500/90 backdrop-blur-md text-white font-extrabold text-[9px] uppercase tracking-wider rounded-md shadow-sm">
                {category || 'Category Domain'}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/90 backdrop-blur-md text-white font-extrabold text-[9px] uppercase tracking-wider rounded-md shadow-sm">
                {state || 'All India'}
              </span>
            </div>
            <h4 className="text-white font-black text-base font-display truncate">
              {schemeName || 'Scheme Name Banner Preview'}
            </h4>
            <p className="text-slate-200 text-xs line-clamp-1 opacity-90">
              {shortDescription || 'Short scheme summary text preview...'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
