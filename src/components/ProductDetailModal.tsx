import React, { useState } from 'react';
import { Product, Language } from '../types';
import {
  X,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  FileText,
  Plus,
  Minus,
  MessageCircle,
  Share2,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { getAssetUrl } from '../utils/assets';
import { formatINR } from '../services/productService';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  language: Language;
  onSelectProduct?: (product: Product) => void;
  relatedProducts?: Product[];
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  language,
  onSelectProduct,
  relatedProducts = [],
}) => {
  if (!isOpen || !product) return null;

  const [quantity, setQuantity] = useState<number>(product.moq || 1);
  const [activeImage, setActiveImage] = useState<string>(product.image);

  const images = [
    product.image,
    ...(product.galleryImages || []),
  ].filter(Boolean);

  const isBelowMoq = quantity < product.moq;
  const indicativeLineTotal = product.price * quantity;

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden animate-fadeIn my-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-800 bg-white/80 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shadow-xs"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
            {/* Left Column: Image Gallery (5 cols) */}
            <div className="md:col-span-5 p-6 bg-[#F8FAFC] flex flex-col justify-between">
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-square rounded-2xl bg-white border border-[#E2E8F0] overflow-hidden flex items-center justify-center p-4 shadow-xs">
                  <img
                    src={getAssetUrl(activeImage)}
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getAssetUrl('/hero-knr-products.jpg');
                    }}
                  />
                  {product.inStock ? (
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase rounded-md tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      In Stock at Depot
                    </span>
                  ) : (
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase rounded-md tracking-wider">
                      Batch Made to Order
                    </span>
                  )}
                </div>

                {/* Thumbnails if multiple images exist */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        className={`w-14 h-14 rounded-xl bg-white border p-1 shrink-0 overflow-hidden transition-all cursor-pointer ${
                          activeImage === img
                            ? 'border-[#F57C00] ring-2 ring-orange-200'
                            : 'border-[#E2E8F0] hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={getAssetUrl(img)}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Depot Trust Badges */}
              <div className="mt-6 pt-4 border-t border-[#E2E8F0] space-y-2 text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#F57C00] shrink-0" />
                  <span>Direct Highway Dispatch from Chevella Depot</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tested Batch Assay Certificate with Every Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Column: Product Information & RFQ Actions (7 cols) */}
            <div className="md:col-span-7 p-6 sm:p-8 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Category & SKU */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#F57C00] bg-[#FFF3E0] px-3 py-1 rounded-full">
                    {language === 'te' && product.categoryTelugu ? product.categoryTelugu : product.category}
                  </span>
                  <div className="text-xs text-slate-400 font-mono">
                    SKU: <span className="font-semibold text-[#111827]">{product.sku || product.id}</span>
                    {product.hsnCode && ` | HSN: ${product.hsnCode}`}
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight leading-snug font-display">
                    {product.name}
                  </h2>
                  {language === 'te' && product.teluguName && (
                    <p className="text-sm font-semibold text-[#64748B] mt-1 font-sans">
                      {product.teluguName}
                    </p>
                  )}
                </div>

                {/* Estimated Unit Price Display */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-[#64748B] font-semibold">Estimated Price:</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#F57C00] font-mono">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-[#64748B] font-medium">/ {product.unit}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                    <span>Depot MOQ: <strong>{product.moq} {product.unit}</strong></span>
                    <span>•</span>
                    <span>GST Rate: <strong>{product.gstPercent || 18}%</strong></span>
                  </div>
                </div>

                {/* Mandatory Pricing Disclaimer Box */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-900 leading-relaxed">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Indicative Pricing Notice:</strong> Prices displayed on this website are indicative estimates. Final prices may vary depending on order quantity, custom specifications, availability, transportation distance, and applicable taxes. A confirmed quotation will be provided by KNR Enterprises.
                  </span>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">
                    Product Overview
                  </h4>
                  <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                    {product.description ||
                      'Heavy-duty institutional formulation manufactured for municipal hygiene, Gram Panchayat sanitation drives, and industrial sanitation compliance.'}
                  </p>
                </div>

                {/* Technical Specifications */}
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                      Technical Specifications
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(product.specifications).map(([key, val]) => (
                        <div key={key} className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">{key}</span>
                          <span className="font-semibold text-[#111827]">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Selector & Add to RFQ Action */}
              <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#111827] block">Requested Quantity:</span>
                    <span className="text-[10px] text-[#64748B]">MOQ: {product.moq} {product.unit}</span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 rounded-xl p-1">
                    <button
                      onClick={handleDecrement}
                      className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center font-mono font-bold text-sm bg-transparent focus:outline-none"
                    />
                    <button
                      onClick={handleIncrement}
                      className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isBelowMoq && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Note: Selected quantity ({quantity}) is below depot MOQ ({product.moq} {product.unit}). Smaller dispatch requires depot clearance.
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAddToCartClick}
                    className="flex-1 bg-[#F57C00] hover:bg-[#E06D00] text-white py-3 px-6 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to RFQ Cart ({quantity} {product.unit})</span>
                  </button>

                  <a
                    href={`https://wa.me/918886175855?text=${encodeURIComponent(`Hello KNR Enterprises, I am inquiring about wholesale rates for: ${product.name} (Qty: ${quantity} ${product.unit}). Please provide stock and dispatch quotation.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="Quick Inquiry on WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="p-6 bg-[#F8FAFC] border-t border-[#E2E8F0]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
                Related Wholesale Products in {product.category}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedProducts.slice(0, 4).map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => {
                      if (onSelectProduct) onSelectProduct(rel);
                      setActiveImage(rel.image);
                      setQuantity(rel.moq || 1);
                    }}
                    className="bg-white p-3 rounded-xl border border-[#E2E8F0] hover:border-[#F57C00] transition-colors cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="aspect-square rounded-lg bg-slate-50 mb-2 overflow-hidden flex items-center justify-center p-2">
                      <img
                        src={getAssetUrl(rel.image)}
                        alt={rel.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-[#111827] line-clamp-1 group-hover:text-[#F57C00]">
                        {rel.name}
                      </h5>
                      <span className="text-[11px] font-mono font-semibold text-[#F57C00]">
                        ₹{rel.price.toLocaleString('en-IN')} / {rel.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

