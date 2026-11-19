import React, { useState, useEffect } from 'react';
import { Screen, Language, Product, Category } from '../../types';
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
} from 'lucide-react';
import { getCatalogProducts, formatINR, CatalogItem, fetchProducts } from '../../services/productService';
import { fetchCategories } from '../../services/categoryService';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
  onAddToCart?: (product: Product | CatalogItem) => void;
  onSelectCategory: (category: string) => void;
  language?: Language;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onAddToCart,
  onSelectCategory,
  language = 'en',
}) => {
  const { homepageContent, settings } = useWebsiteSettings();
  const [products, setProducts] = useState<CatalogItem[]>(() => getCatalogProducts());
  const [categories, setCategories] = useState<Category[]>([]);

  // Listen for admin live price updates and products
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

  const handleScrollToExplore = () => {
    const aboutElem = document.getElementById('about-section');
    if (aboutElem) {
      aboutElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const whyChoosePoints = [
    'High-Quality Products',
    'Competitive Pricing',
    'Timely Delivery',
    'Customer-Centric Approach',
  ];

  const whatsappPhone = (settings?.whatsappNumber || '918886175855').replace(/[^0-9]/g, '');

  return (
    <div className="w-full bg-[#f8f9fc] text-slate-900 selection:bg-orange-500/20 selection:text-orange-600">
      {/* =========================================================================
          1. HERO SECTION (Dynamic Content with Glowing Neon Halo)
         ========================================================================= */}
      {(homepageContent?.showHero ?? true) && (
        <section className="relative bg-[#0a0e17] text-white pt-8 sm:pt-14 pb-20 sm:pb-28 overflow-hidden">
          {/* Ambient background glow & industrial light bokeh */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Content (6.5 cols) */}
              <div className="lg:col-span-6 xl:col-span-6 space-y-6 text-left">
                {/* Badge / Overline */}
                <div className="inline-block text-orange-400 font-semibold text-xs sm:text-sm tracking-wide">
                  {homepageContent?.heroBadge || 'Building Stronger Tomorrow'}
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl min-[380px]:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
                  {homepageContent?.heroHeading || 'KNR Enterprises'}
                </h1>

                {/* Subheading */}
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                  {homepageContent?.heroSubheading || 'Quality Products. Trusted Partnership.'}
                </h2>

                {/* Paragraph Description */}
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg">
                  {homepageContent?.heroDescription || 'Your one-stop destination for premium industrial products with unmatched quality and service.'}
                </p>

                {/* CTA Action Buttons */}
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  {/* Explore Products Button */}
                  <button
                    onClick={() => onNavigate('products')}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm sm:text-base px-6 sm:px-7 py-3 rounded-full shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Explore Products</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* WhatsApp Button */}
                  <a
                    href={`https://wa.me/${whatsappPhone}?text=Hello%20KNR%20Enterprises,%20we%20require%20industrial%20products%20quotation`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-transparent border border-white/60 hover:border-white hover:bg-white/10 text-white font-semibold text-sm sm:text-base px-5 sm:px-6 py-3 rounded-full transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>

                {/* Scroll to Explore Indicator */}
                <div
                  onClick={handleScrollToExplore}
                  className="flex items-center gap-2.5 text-slate-400 hover:text-orange-400 text-xs pt-6 sm:pt-10 cursor-pointer select-none transition-colors w-fit group"
                >
                  <div className="w-4 h-7 border border-slate-400 group-hover:border-orange-400 rounded-full flex justify-center pt-1 transition-colors">
                    <div className="w-1 h-1.5 bg-orange-400 rounded-full animate-bounce" />
                  </div>
                  <span>Scroll to explore</span>
                </div>
              </div>

              {/* Right Showcase: 3D Platform with Glowing Neon Orange Ring Halo (6 cols) */}
              <div className="lg:col-span-6 xl:col-span-6 relative flex items-center justify-center">
                <div className="absolute w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px] rounded-full border-4 border-orange-500/70 shadow-[0_0_80px_rgba(249,115,22,0.5)] -z-10 animate-pulse pointer-events-none" />

                <div className="relative w-full max-w-lg lg:max-w-xl group">
                  <img
                    src={homepageContent?.heroBannerImage || '/hero-knr-products.jpg'}
                    alt="KNR Enterprises Industrial Products Showcase"
                    className="w-full h-auto rounded-2xl shadow-2xl object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/hero-knr-products.jpg';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          2. FLOATING TRUST / FEATURES PILL BAR
         ========================================================================= */}
      {(homepageContent?.showTrustStrip ?? true) && (
        <div className="relative -mt-10 sm:-mt-12 z-20 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-[#0e1626]/95 backdrop-blur-md border border-slate-700/80 rounded-2xl sm:rounded-full py-4 sm:py-5 px-4 sm:px-8 shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 items-center">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="text-white font-bold text-xs sm:text-sm truncate">Premium Quality</div>
                  <div className="text-slate-400 text-[10px] sm:text-xs">{homepageContent?.statDepotOrders || '500+'} Orders</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Handshake className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="text-white font-bold text-xs sm:text-sm truncate">Trusted by</div>
                  <div className="text-slate-400 text-[10px] sm:text-xs">{homepageContent?.statActiveClients || '100+'} Bodies</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="text-white font-bold text-xs sm:text-sm truncate">Statewide Transit</div>
                  <div className="text-slate-400 text-[10px] sm:text-xs">{homepageContent?.statDistricts || '33'} Districts</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="text-white font-bold text-xs sm:text-sm truncate">Dedicated Support</div>
                  <div className="text-slate-400 text-[10px] sm:text-xs">GST Proforma</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. ABOUT SECTION
         ========================================================================= */}
      {(homepageContent?.showAboutSection ?? true) && (
        <section id="about-section" className="bg-white pt-20 sm:pt-28 pb-16 sm:pb-20 border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="text-orange-500 font-bold text-xs sm:text-sm uppercase tracking-wider">
                  About KNR Enterprises
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight leading-[1.12]">
                  {homepageContent?.aboutHeading || 'Building Trust Through Quality'}
                </h2>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg pt-1">
                  {homepageContent?.aboutDescription ||
                    'At KNR Enterprises, we are committed to deliver high-quality industrial products, innovative solutions and exceptional service to help your business grow.'}
                </p>

                <div className="pt-4">
                  <button
                    onClick={() => onNavigate('about')}
                    className="inline-flex items-center gap-2 border border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-xs"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6 relative">
                <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 w-4/5 h-4/5 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-3xl -z-10 shadow-lg shadow-orange-500/20" />

                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-slate-100">
                  <img
                    src={homepageContent?.aboutImage || '/building-knr-hq.jpg'}
                    alt="KNR Enterprises Headquarters & Logistics Facility"
                    className="w-full h-auto aspect-[16/10] object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/building-knr-hq.jpg';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          4. PRODUCTS SECTION ("Explore Our Product Range" - Direct Add to Cart)
         ========================================================================= */}
      {(homepageContent?.showFeaturedProducts ?? true) && (
        <section className="bg-[#f8f9fc] py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <div className="text-orange-500 font-bold text-xs sm:text-sm uppercase tracking-wider mb-1.5">
                Our Products
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0f172a] tracking-tight">
                Explore Our Product Range
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1.5">
                Premium quality products for your industrial and operational needs
              </p>
            </div>

            {/* Product Cards with Direct Add to Cart & Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {products.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between p-4 group"
                >
                  <div>
                    <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-100 mb-3.5 border border-slate-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/hero-knr-products.jpg';
                        }}
                      />
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#0f172a] tracking-tight leading-snug">
                      {product.name}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
                      {product.description}
                    </p>

                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-base sm:text-lg font-black text-[#0f172a]">
                        {formatINR(product.price)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {product.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                      <span>{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onAddToCart && onAddToCart(product)}
                    className="w-full mt-3.5 min-h-[44px] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-10 sm:mt-12 text-center">
              <button
                onClick={() => onNavigate('products')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-full shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Explore All Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          5. WHY CHOOSE KNR ENTERPRISES BANNER
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12 sm:my-16">
        <div className="bg-[#0c1322] text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                <span className="text-white">Why Choose </span>
                <span className="text-orange-500">KNR Enterprises</span>?
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                We combine quality, reliability and innovation to deliver the best for your business.
              </p>
            </div>

            <div className="lg:col-span-4 space-y-3">
              {whyChoosePoints.map((point) => (
                <div key={point} className="flex items-center gap-3 text-sm font-semibold text-white">
                  <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="lg:col-span-3 flex justify-center lg:justify-end">
              <div className="w-full max-w-xs bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-2xl p-5 sm:p-6 shadow-xl shadow-orange-500/25 flex items-center justify-between gap-4 text-white hover:scale-105 transition-transform duration-300">
                <div className="text-xl sm:text-2xl font-black leading-tight tracking-tight">
                  Growing<br />Together
                </div>
                <svg
                  className="w-12 h-12 text-white shrink-0"
                  viewBox="0 0 64 64"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 50 L26 34 L38 42 L54 18" />
                  <path d="M38 18 H54 V34" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
