import React, { useState, useRef } from 'react';
import { Upload, X, Check, Image as ImageIcon, Link as LinkIcon, Loader2 } from 'lucide-react';
import { uploadProductImage } from '../../services/storageService';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  galleryImages?: string[];
  onGalleryChange?: (images: string[]) => void;
  label?: string;
  allowMultiple?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  galleryImages = [],
  onGalleryChange,
  label = 'Product Image',
  allowMultiple = true,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      if (allowMultiple && files.length > 1 && onGalleryChange) {
        const uploadPromises = Array.from(files).map((f) => uploadProductImage(f));
        const results = await Promise.all(uploadPromises);
        const validUrls = results.map((r) => r.url);

        if (!value && validUrls.length > 0) {
          onChange(validUrls[0]);
          onGalleryChange([...galleryImages, ...validUrls.slice(1)]);
        } else {
          onGalleryChange([...galleryImages, ...validUrls]);
        }
      } else {
        const res = await uploadProductImage(files[0]);
        if (res.error) {
          setUploadError(`Note: ${res.error}`);
        }
        onChange(res.url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    if (!value) {
      onChange(urlInput.trim());
    } else if (onGalleryChange) {
      onGalleryChange([...galleryImages, urlInput.trim()]);
    } else {
      onChange(urlInput.trim());
    }
    setUrlInput('');
  };

  const handleRemoveMain = () => {
    if (!window.confirm('Are you sure you want to remove this image?')) return;
    if (galleryImages.length > 0 && onGalleryChange) {
      // Promote first gallery image to main
      onChange(galleryImages[0]);
      onGalleryChange(galleryImages.slice(1));
    } else {
      onChange('');
    }
  };

  const handleRemoveGallery = (index: number) => {
    if (!onGalleryChange) return;
    const updated = galleryImages.filter((_, idx) => idx !== index);
    onGalleryChange(updated);
  };

  const handleSetPrimary = (imageUrl: string, index: number) => {
    if (!onGalleryChange) return;
    const oldMain = value;
    onChange(imageUrl);
    const updatedGallery = galleryImages.filter((_, idx) => idx !== index);
    if (oldMain) {
      updatedGallery.push(oldMain);
    }
    onGalleryChange(updatedGallery);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">
          {label}
        </label>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'upload' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'url' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          {uploadError}
        </div>
      )}

      {/* Input Mode 1: File Upload */}
      {activeTab === 'upload' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition-colors group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            multiple={allowMultiple}
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {isUploading ? 'Uploading to Supabase Storage...' : 'Click to select or drag and drop image'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PNG, JPG, WEBP or SVG up to 5MB {allowMultiple && '(Multiple files supported)'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Input Mode 2: Direct URL */}
      {activeTab === 'url' && (
        <form onSubmit={handleAddUrl} className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/product-image.jpg"
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Add URL
          </button>
        </form>
      )}

      {/* Images Preview Grid */}
      <div className="space-y-2 pt-2">
        {/* Main Image */}
        {value ? (
          <div>
            <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
              <span className="font-bold">{label} Preview</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Replace Image
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleRemoveMain}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="relative group w-48 sm:w-64 h-32 rounded-xl border-2 border-blue-500 overflow-hidden bg-slate-100 shadow-xs">
              <img
                src={value}
                alt="Selected preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveMain}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
                title="Remove image (requires confirmation)"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold py-1 px-2 flex items-center justify-between truncate">
                <span className="truncate">{value.startsWith('data:') ? 'Uploaded base64 preview' : value.split('/').pop()}</span>
                <span className="text-emerald-400 font-mono shrink-0 ml-1">Live</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl text-xs text-slate-500">
            <ImageIcon className="w-4 h-4 text-slate-400" />
            <span>No image selected yet. Upload a file above or enter a public URL.</span>
          </div>
        )}

        {/* Gallery Images */}
        {galleryImages.length > 0 && (
          <div className="pt-2">
            <div className="text-[11px] font-semibold text-slate-500 mb-1">
              Gallery Images ({galleryImages.length})
            </div>
            <div className="flex flex-wrap gap-2.5">
              {galleryImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative group w-24 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-xs"
                >
                  <img
                    src={img}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img, idx)}
                      className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                      title="Set as Main Image"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveGallery(idx)}
                      className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

