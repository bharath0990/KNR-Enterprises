import React, { useState, useEffect } from 'react';
import { Screen, Language, Product, Category } from '../../types';
import { getAssetUrl } from '../../utils/assets';
import {
  ShieldCheck,
  Handshake,
  Truck,
  Headphones,
  ArrowRight,
  MessageCircle,
  Check,
  ShoppingCart,
  CheckCircle2,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  FileText,
  Send,
  Building,
  Star,
  ExternalLink,
  Eye,
  Tag,
} from 'lucide-react';
import { getCatalogProducts, formatINR, CatalogItem, fetchProducts, catalogItemToProduct } from '../../services/productService';
import { fetchCategories } from '../../services/categoryService';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';
import { TESTIMONIALS, FAQS_DATA } from '../../data/products';
import { submitRfqEnquiry } from '../../services/enquiryService';
import { ProductDetailModal } from '../ProductDetailModal';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
  onAddToCart?: (product: Product | CatalogItem) => void;
  onSelectCategory: (category: string) => void;
  onRequestQuote?: () => void;
  language?: Language;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onAddToCart,
  onSelectCategory,
  onRequestQuote,
  language = 'en',
}) => {
  const { homepageContent, settings } = useWebsiteSettings();
  const [products, setProducts] = useState<CatalogItem[]>(() => getCatalogProducts());
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('All');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // RFQ Form state
  const [rfqName, setRfqName] = useState('');
  const [rfqPhone, setRfqPhone] = useState('');
  const [rfqOrg, setRfqOrg] = useState('');
  const [rfqDistrict, setRfqDistrict] = useState('');
  const [rfqDetails, setRfqDetails] = useState('');
  const [rfqSubmitting, setRfqSubmitting] = useState(false);
  const [rfqSuccess, setRfqSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handlePriceUpdate = () => {
      setProducts(getCatalogProducts());
    };
    window.addEventListener('knr_product_price_updated', handlePriceUpdate);
    window.addEventListener('knr_products_updated', handlePriceUpdate);

    fetchCategories().then((cats) => {
      setCategories(cats.filter((c) => c.isActive));
    });

    return () => {
      window.removeEventListener('knr_product_price_updated', handlePriceUpdate);
      window.removeEventListener('knr_products_updated', handlePriceUpdate);
    };
  }, []);

  const whatsappPhone = (settings?.whatsappNumber || '918886175855').replace(/[^0-9]/g, '');

  const filteredProducts = selectedCatFilter === 'All'
    ? products
    : products.filter((p) => p.category.toLowerCase().includes(selectedCatFilter.toLowerCase()) || p.category === selectedCatFilter);

  const handleRfqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqName.trim() || !rfqPhone.trim()) return;

    setRfqSubmitting(true);
    setRfqSuccess(null);

    try {
      const res = await submitRfqEnquiry(
        {
          customerName: rfqName,
          mobileNumber: rfqPhone,
          organisation: rfqOrg || 'Panchayat / Contractor',
          district: rfqDistrict || 'Telangana',
          notes: rfqDetails || 'Requested wholesale quotation from homepage form',
          source: 'homepage_rfq_form',
        },
        []
      );

      if (res && res.enquiryNumber) {
        setRfqSuccess(res.enquiryNumber);
        setRfqName('');
        setRfqPhone('');
        setRfqOrg('');
        setRfqDistrict('');
        setRfqDetails('');
      }
    } catch {
      // fallback
    } finally {
      setRfqSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white text-[#111827] selection:bg-[#F57C00]/20 selection:text-[#F57C00]">
      {/* =========================================================================
          1. HOMEPAGE HERO SECTION (Spacious Two-Column Modern White + Orange)
         ========================================================================= */}
      {(homepageContent?.showHero ?? true) && (
        <section className="relative bg-gradient-to-b from-orange-50/40 via-white to-white pt-10 sm:pt-16 pb-16 sm:pb-24 overflow-hidden border-b border-[#E2E8F0]">
          {/* Subtle soft orange background glow */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#FFF3E0]/70 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-1/3 left-10 w-[350px] h-[350px] bg-orange-100/30 rounded-full blur-2xl pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column (6.5 cols) */}
              <div className="lg:col-span-7 space-y-6 text-left">
                {/* Small Orange Eyebrow */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF3E0] border border-orange-200 text-[#F57C00] text-xs font-bold tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#F57C00] animate-pulse" />
                  <span>YOUR TRUSTED WHOLESALE SUPPLY PARTNER</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl min-[400px]:text-4xl sm:text-5xl lg:text-[3.4rem] font-black tracking-tight leading-[1.1] text-[#111827] font-display">
                  {homepageContent?.heroHeading || 'Building Stronger Communities Through Quality Supplies.'}
                </h1>

                {/* Supporting Heading */}
                <h2 className="text-xl sm:text-2xl font-bold text-[#0D2B5B] tracking-tight">
                  {homepageContent?.heroSubheading || 'Quality Products. Trusted Partnership.'}
                </h2>

                {/* Description */}
                <p className="text-[#64748B] text-sm sm:text-base leading-relaxed max-w-xl">
                  {homepageContent?.heroDescription ||
                    'Your one-stop destination for premium municipal, sanitation and industrial products with dependable quality, competitive wholesale pricing and reliable delivery across Telangana.'}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <button
                    onClick={() => onNavigate('products')}
                    className="bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-full shadow-md shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Explore Products</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => (onRequestQuote ? onRequestQuote() : onNavigate('contact'))}
                    className="bg-white border-2 border-[#0D2B5B] text-[#0D2B5B] hover:bg-[#0D2B5B] hover:text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-full transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <span>Request a Bulk Quote</span>
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/80">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[#111827]">GST Registered</div>
                    <div className="text-[11px] text-[#64748B] font-mono">36CUHPK5939D1ZG</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[#111827]">500+ Depot Orders</div>
                    <div className="text-[11px] text-[#64748B]">Statewide verified</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[#111827]">Serving 33 Districts</div>
                    <div className="text-[11px] text-[#64748B]">Telangana statewide</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[#111827]">Reliable Supply</div>
                    <div className="text-[11px] text-[#64748B]">Same-day highway dispatch</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Premium Industrial Product Showcase Image */}
              <div className="lg:col-span-5 relative flex items-center justify-center">
                <div className="relative w-full max-w-lg rounded-3xl p-3 bg-white border border-[#E2E8F0] shadow-xl group">
                  {/* Subtle orange accent badge */}
                  <div className="absolute top-6 right-6 z-20 bg-[#F57C00] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Depot Stock Ready</span>
                  </div>

                  <div className="overflow-hidden rounded-2xl bg-slate-50 aspect-[4/3] flex items-center justify-center">
                    <img
                      src={getAssetUrl(homepageContent?.heroBannerImage || '/hero-knr-products.jpg')}
                      alt="KNR Enterprises Wholesale Supplies - Bleaching Powder, Bins, Foggers & LED Streetlights"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getAssetUrl('/hero-knr-products.jpg');
                      }}
                    />
                  </div>

                  {/* Caption card */}
                  <div className="p-3.5 mt-2 bg-[#F8FAFC] rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#111827]">Chevella Regional Depot Facility</div>
                      <div className="text-[#64748B] text-[11px]">Highway Logistics & Instant Truckload Dispatch</div>
                    </div>
                    <span className="text-[#F57C00] font-black text-xs font-mono">24-48h SLA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          2. TRUST AND BUSINESS HIGHLIGHTS (Horizontal Trust Strip)
         ========================================================================= */}
      {(homepageContent?.showTrustStrip ?? true) && (
        <section className="relative -mt-8 sm:-mt-10 z-20 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-lg p-5 sm:p-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {/* Item 1 */}
              <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:px-3 first:pt-0 first:px-0">
                <div className="w-11 h-11 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#111827]">Premium Quality</h4>
                  <p className="text-xs text-[#64748B]">Reliable industrial products</p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:px-3">
                <div className="w-11 h-11 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center shrink-0 shadow-xs">
                  <Handshake className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#111827]">Trusted Partnerships</h4>
                  <p className="text-xs text-[#64748B]">Institutional wholesale supply</p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:px-3">
                <div className="w-11 h-11 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center shrink-0 shadow-xs">
                  <Truck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#111827]">Statewide Delivery</h4>
                  <p className="text-xs text-[#64748B]">Serving all 33 Telangana districts</p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:px-3">
                <div className="w-11 h-11 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center shrink-0 shadow-xs">
                  <Headphones className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#111827]">Dedicated Support</h4>
                  <p className="text-xs text-[#64748B]">Procurement & quotation assistance</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          3. ABOUT KNR ENTERPRISES (Two-Column Corporate Presentation)
         ========================================================================= */}
      {(homepageContent?.showAboutSection ?? true) && (
        <section id="about-section" className="bg-white pt-20 sm:pt-28 pb-16 sm:pb-24 border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column */}
              <div className="lg:col-span-6 space-y-5">
                <div className="text-[#F57C00] font-bold text-xs uppercase tracking-wider">
                  ABOUT KNR ENTERPRISES
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111827] tracking-tight leading-[1.12] font-display">
                  {homepageContent?.aboutHeading || 'Building Trust Through Quality.'}
                </h2>

                <p className="text-[#64748B] text-sm sm:text-base leading-relaxed">
                  {homepageContent?.aboutDescription ||
                    'At KNR Enterprises, we are committed to supplying high-quality municipal, sanitation and industrial products. We work with Gram Panchayats, Municipal Corporations and infrastructure contractors to deliver dependable products and procurement support.'}
                </p>

                {/* 3 Core Value Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
                    <div className="text-[#F57C00] font-bold text-xs uppercase tracking-wide">Our Mission</div>
                    <div className="text-xs text-[#64748B] mt-1">Dependable wholesale procurement with verified quality.</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
                    <div className="text-[#F57C00] font-bold text-xs uppercase tracking-wide">Our Vision</div>
                    <div className="text-xs text-[#64748B] mt-1">A cleaner, hygienic, and well-lit Telangana.</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
                    <div className="text-[#F57C00] font-bold text-xs uppercase tracking-wide">Commitment</div>
                    <div className="text-xs text-[#64748B] mt-1">Transparent GST billing & certified formulations.</div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onNavigate('about')}
                    className="inline-flex items-center gap-2 border-2 border-[#F57C00] text-[#F57C00] hover:bg-[#F57C00] hover:text-white font-bold text-sm px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-xs"
                  >
                    <span>Learn More About Us</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Column: Depot Photograph */}
              <div className="lg:col-span-6 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-xl border border-[#E2E8F0] bg-slate-100">
                  <img
                    src={getAssetUrl(homepageContent?.aboutImage || '/building-knr-hq.jpg')}
                    alt="KNR Enterprises Headquarters and Distribution Facility"
                    className="w-full h-auto aspect-[16/11] object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getAssetUrl('/building-knr-hq.jpg');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D2B5B]/60 via-transparent to-transparent flex items-end p-6">
                    <div className="text-white">
                      <div className="font-bold text-base">KNR Enterprises Depot & Logistics Center</div>
                      <div className="text-xs text-slate-200">Chevella Mandal, Ranga Reddy District, Telangana</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          4. PRODUCT CATALOG SHOWCASE ("Explore Our Product Range")
         ========================================================================= */}
      {(homepageContent?.showFeaturedProducts ?? true) && (
        <section className="bg-[#F8FAFC] py-16 sm:py-24 border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2">
              <div className="text-[#F57C00] font-bold text-xs uppercase tracking-wider">
                OUR WHOLESALE CATALOG
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight font-display">
                Explore Our Product Range
              </h2>
              <p className="text-[#64748B] text-sm sm:text-base">
                Quality products for municipal, sanitation and industrial requirements.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {['All', 'Disinfectants', 'Vector', 'Waste', 'Lighting', 'Safety', 'Landscaping'].map((catLabel) => {
                const isSelected = selectedCatFilter === catLabel;
                return (
                  <button
                    key={catLabel}
                    onClick={() => setSelectedCatFilter(catLabel)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F57C00] text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:text-[#111827] border border-[#E2E8F0] hover:border-orange-300'
                    }`}
                  >
                    {catLabel === 'All' ? 'All Products' : catLabel}
                  </button>
                );
              })}
            </div>

            {/* Product Cards with Direct Add to Cart & Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between p-4 group"
                >
                  <div>
                    {/* Image Container with contain fit */}
                    <div
                      onClick={() => {
                        setSelectedProductForDetail(catalogItemToProduct(product));
                        setIsDetailModalOpen(true);
                      }}
                      className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-50 mb-3.5 border border-slate-100 flex items-center justify-center p-3 cursor-pointer group-hover:border-orange-200 transition-colors"
                    >
                      <img
                        src={getAssetUrl(product.image)}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getAssetUrl('/hero-knr-products.jpg');
                        }}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs p-1.5 rounded-lg shadow-xs text-slate-700 hover:text-[#F57C00]">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Category pill */}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F57C00] bg-[#FFF3E0] px-2 py-0.5 rounded-md">
                      {product.category}
                    </span>

                    <h3
                      onClick={() => {
                        setSelectedProductForDetail(catalogItemToProduct(product));
                        setIsDetailModalOpen(true);
                      }}
                      className="text-sm font-bold text-[#111827] tracking-tight leading-snug mt-2 line-clamp-2 min-h-[40px] hover:text-[#F57C00] cursor-pointer transition-colors"
                    >
                      {product.name}
                    </h3>

                    <p className="text-xs text-[#64748B] line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
                      {product.description}
                    </p>

                    {/* Pricing */}
                    <div className="mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Estimated Price
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-[#111827]">
                          {formatINR(product.price)}
                        </span>
                        <span className="text-xs font-semibold text-[#64748B]">
                          / {product.unit}
                        </span>
                      </div>
                    </div>

                    {/* Stock & MOQ Info */}
                    <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1 font-semibold text-[#16A34A]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
                      </div>
                      <span className="text-[#64748B] font-mono text-[11px]">
                        MOQ: {product.moq ? `${product.moq} ${product.unit}` : `1 ${product.unit}`}
                      </span>
                    </div>
                  </div>

                  {/* Add to RFQ Cart Button & View Details */}
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => onAddToCart && onAddToCart(product)}
                      className="w-full bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to RFQ Cart</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedProductForDetail(catalogItemToProduct(product));
                        setIsDetailModalOpen(true);
                      }}
                      className="w-full bg-[#F8FAFC] hover:bg-slate-100 text-[#111827] border border-[#E2E8F0] font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#F57C00]" />
                      <span>View Specifications</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            <div className="mt-12 text-center">
              <button
                onClick={() => onNavigate('products')}
                className="inline-flex items-center gap-2 bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-sm px-8 py-3.5 rounded-full shadow-md shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>View All Products →</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          5. WHY CHOOSE KNR ENTERPRISES (Light Grey Background + White Card)
         ========================================================================= */}
      <section className="bg-[#F8FAFC] py-16 sm:py-24 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-14 border border-[#E2E8F0] shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-3">
                <div className="text-[#F57C00] font-bold text-xs uppercase tracking-wider">
                  ENTERPRISE ADVANTAGES
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight font-display">
                  Why Choose <span className="text-[#F57C00]">KNR Enterprises</span>?
                </h2>
                <p className="text-[#64748B] text-sm leading-relaxed max-w-sm">
                  We combine verified quality, institutional reliability and transparent wholesale governance.
                </p>
              </div>

              <div className="lg:col-span-4 space-y-4">
                {[
                  { title: 'High-Quality Products', desc: 'Guaranteed chlorine potency, CIB registrations and ISI marks' },
                  { title: 'Competitive Wholesale Pricing', desc: 'Direct depot rates with volume slab savings' },
                  { title: 'Reliable Delivery', desc: 'Highway logistical pipeline across all 33 Telangana districts' },
                  { title: 'Customer-Centric Support', desc: 'Dedicated proforma invoice and government audit support' }
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#111827]">{item.title}</h4>
                      <p className="text-xs text-[#64748B]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-3 flex justify-center lg:justify-end">
                <div className="w-full max-w-xs bg-gradient-to-br from-[#F57C00] to-[#E06D00] text-white rounded-2xl p-6 shadow-xl shadow-orange-500/25 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-bold text-amber-200 uppercase tracking-wider">Partnership</div>
                    <div className="text-2xl font-black tracking-tight mt-1 leading-snug">Let's Grow Together.</div>
                  </div>
                  <p className="text-xs text-orange-100 leading-relaxed">
                    Partner with Telangana's leading municipal supply distributor for your seasonal drives.
                  </p>
                  <button
                    onClick={() => onNavigate('contact')}
                    className="w-full bg-white text-[#F57C00] hover:bg-orange-50 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Contact Procurement Team
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. SERVICES AND LOGISTICS SECTION (4 Core Services + 4-Step Workflow)
         ========================================================================= */}
      <section className="bg-white py-16 sm:py-24 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="text-[#F57C00] font-bold text-xs uppercase tracking-wider">
              SERVICES & LOGISTICS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight font-display">
              Institutional Supply Capabilities
            </h2>
            <p className="text-[#64748B] text-sm sm:text-base">
              Serving Gram Panchayats, Municipal Corporations and civic infrastructure contractors.
            </p>
          </div>

          {/* 4 Core Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Truck,
                title: 'Gram Panchayat Bulk Fulfillment',
                desc: 'Tested Grade 1 bleaching powder, hydrated lime, and 240L SBM dustbins dispatched directly to Mandal bhavans.',
                sla: '24-48 Hr Statewide'
              },
              {
                icon: ShieldCheck,
                title: 'Emergency Vector & Epidemic Response',
                desc: 'Rapid-deployment mosquito vector inventory with pulse-jet thermal foggers, Malathion 5% DP and larvicides.',
                sla: 'Immediate 4-Hr Local'
              },
              {
                icon: Building,
                title: 'Civic Infrastructure Illumination',
                desc: 'IP66 die-cast civic LED streetlights (60W/120W) with 10kV surge protection for urban medians.',
                sla: 'Wholesale Depot Slabs'
              },
              {
                icon: FileText,
                title: 'e-Procurement & Audit Documentation',
                desc: 'Formal GST-3B proforma invoices, verified batch lab assays, and MDO treasury token compliance papers.',
                sla: '100% Tax Compliant'
              }
            ].map((srv) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.title}
                  className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-6 flex flex-col justify-between hover:border-orange-300 hover:shadow-lg transition-all group"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-[#F57C00] uppercase tracking-wider font-mono">
                      {srv.sla}
                    </span>
                    <h3 className="font-bold text-base text-[#111827] leading-snug">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {srv.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-200">
                    <button
                      onClick={() => onNavigate('services')}
                      className="text-xs font-bold text-[#F57C00] hover:text-[#E06D00] flex items-center gap-1 cursor-pointer"
                    >
                      <span>Learn More</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4-Step Procurement Workflow */}
          <div className="mt-14 p-6 sm:p-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
            <h4 className="text-center font-bold text-sm sm:text-base text-[#111827] mb-6">
              Our 4-Step Transparent Procurement Workflow
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '01', title: 'Requirement Submission', desc: 'Select items or send list via WhatsApp/Form' },
                { step: '02', title: 'GST Proforma Generation', desc: 'Instant official invoice with HSN & CGST/SGST' },
                { step: '03', title: 'Depot Dispatch', desc: 'Factory-sealed packing & highway truck loading' },
                { step: '04', title: 'Panchayat Delivery', desc: 'Direct unloading at mandal bhavan or depot' },
              ].map((st) => (
                <div key={st.step} className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
                  <span className="text-xs font-black text-[#F57C00] font-mono">{st.step}</span>
                  <div className="text-xs font-bold text-[#111827] mt-1">{st.title}</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">{st.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. TESTIMONIALS AND TRUST
         ========================================================================= */}
      <section className="bg-[#F8FAFC] py-16 sm:py-24 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="text-[#F57C00] font-bold text-xs uppercase tracking-wider">
              CLIENT TESTIMONIALS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight font-display">
              Trusted by Local Government & Contractors
            </h2>
            <p className="text-[#64748B] text-sm">
              Authentic feedback from Panchayat Sarpanches, Municipal Inspectors and EPC partners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-amber-500 mb-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-[#111827] italic leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-[#111827]">{t.name}</h5>
                    <p className="text-[11px] text-[#64748B]">{t.role}</p>
                    <p className="text-[10px] text-[#F57C00] font-semibold">{t.location}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-[#FFF3E0] text-[#F57C00] px-2 py-0.5 rounded-md">
                    {t.verifiedBadge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FAQ SECTION (Accordion)
         ========================================================================= */}
      <section className="bg-white py-16 sm:py-24 border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <div className="text-[#F57C00] font-bold text-xs uppercase tracking-wider">
              HELP & COMPLIANCE
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight font-display">
              Frequently Asked Questions
            </h2>
            <p className="text-[#64748B] text-sm">
              Everything you need to know about bulk wholesale orders, GST billing, and highway delivery.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS_DATA.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-[#E2E8F0] overflow-hidden transition-all bg-white"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#FFF3E0] text-[#F57C00] shrink-0 font-mono">
                        {faq.category}
                      </span>
                      <span className="font-bold text-sm sm:text-base text-[#111827]">
                        {faq.question}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-[#F57C00] shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-slate-100 bg-[#F8FAFC]">
                      <p>{faq.answer}</p>
                      {faq.questionTelugu && (
                        <p className="text-[#111827] font-medium mt-2 pt-2 border-t border-slate-200/60 text-xs">
                          {faq.questionTelugu}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => onNavigate('faqs')}
              className="text-xs font-bold text-[#F57C00] hover:underline"
            >
              View All Frequently Asked Questions & Compliance Details →
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. CONTACT AND DEPOT SECTION ("Let's Discuss Your Supply Requirements")
         ========================================================================= */}
      <section className="bg-[#F8FAFC] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="text-[#F57C00] font-bold text-xs uppercase tracking-wider">
              FAST-TRACK QUOTATION DESK
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight font-display">
              Let's Discuss Your Supply Requirements.
            </h2>
            <p className="text-[#64748B] text-sm sm:text-base">
              Call our depot logistics hotlines directly or submit your requirement list for a formal GST proforma.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Contact Information */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-[#111827]">
                Chevella Main Depot Logistics Desk
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center shrink-0 mt-0.5">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#111827]">Managing Partner (Govt Relations)</div>
                    <a href={`tel:${settings?.phonePrimary || '+918886175855'}`} className="text-[#F57C00] font-bold hover:underline">
                      {settings?.phonePrimary || '+91 8886175855'} (K. Narendar Reddy)
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center shrink-0 mt-0.5">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#111827]">Logistics & Dispatch Incharge</div>
                    <a href={`tel:${settings?.phoneSecondary || '+919640195798'}`} className="text-[#F57C00] font-bold hover:underline">
                      {settings?.phoneSecondary || '+91 9640195798'} (G. Siva)
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#111827]">Official Tender Email</div>
                    <a href={`mailto:${settings?.officialEmail || 'knrenterprises679@gmail.com'}`} className="text-[#64748B] hover:text-[#111827]">
                      {settings?.officialEmail || 'knrenterprises679@gmail.com'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#111827]">Depot Location</div>
                    <p className="text-[#64748B] leading-relaxed">
                      {settings?.depotAddress || 'H.No: 1-77/6, Near HP Petrol Pump, Chevella, Ranga Reddy District, Telangana – 501503'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#111827]">Operating Hours</div>
                    <p className="text-[#64748B]">Mon – Sat: 8:30 AM – 7:30 PM | Sunday Emergency On-Call</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Quick Button */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/${whatsappPhone}?text=Hello%20KNR%20Enterprises,%20I%20would%20like%20to%20request%20a%20quotation`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Direct WhatsApp Enquiry Desk</span>
                </a>
              </div>
            </div>

            {/* Right Column: Fast-Track RFQ Form */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm">
              <h3 className="text-lg font-bold text-[#111827] mb-1">
                Request a Formal Wholesale Quotation
              </h3>
              <p className="text-xs text-[#64748B] mb-6">
                Receive official GST-compliant pricing slabs and dispatch availability for your mandal.
              </p>

              {rfqSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-emerald-900 text-base">Quotation Request Logged!</h4>
                  <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                    Your RFQ reference is <span className="font-mono font-bold text-emerald-800">{rfqSuccess}</span>. Our depot manager will verify stock and contact you within 2 business hours.
                  </p>
                  <button
                    onClick={() => setRfqSuccess(null)}
                    className="text-xs font-bold text-emerald-800 underline pt-2"
                  >
                    Submit another request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRfqSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#111827] mb-1">
                        Officer / Contractor Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={rfqName}
                        onChange={(e) => setRfqName(e.target.value)}
                        placeholder="e.g. Ramesh Reddy"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#F57C00] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#111827] mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={rfqPhone}
                        onChange={(e) => setRfqPhone(e.target.value)}
                        placeholder="e.g. 9848012345"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#F57C00] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#111827] mb-1">
                        Gram Panchayat / Department
                      </label>
                      <input
                        type="text"
                        value={rfqOrg}
                        onChange={(e) => setRfqOrg(e.target.value)}
                        placeholder="e.g. Chevella Gram Panchayat"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#F57C00] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#111827] mb-1">
                        District
                      </label>
                      <input
                        type="text"
                        value={rfqDistrict}
                        onChange={(e) => setRfqDistrict(e.target.value)}
                        placeholder="e.g. Ranga Reddy"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#F57C00] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111827] mb-1">
                      Required Supplies & Quantities
                    </label>
                    <textarea
                      rows={3}
                      value={rfqDetails}
                      onChange={(e) => setRfqDetails(e.target.value)}
                      placeholder="e.g. 50 bags bleaching powder Grade 1, 10 units 240L dustbins..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#F57C00] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={rfqSubmitting}
                    className="w-full bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-sm py-3 px-6 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {rfqSubmitting ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit RFQ for Proforma Quotation</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProductForDetail && (
        <ProductDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedProductForDetail(null);
          }}
          product={selectedProductForDetail}
          onAddToCart={(product, quantity) => {
            if (onAddToCart) {
              onAddToCart({ ...product, quantity } as any);
            }
          }}
          language={language}
        />
      )}
    </div>
  );
};
