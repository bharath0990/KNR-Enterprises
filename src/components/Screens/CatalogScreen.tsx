import React, { useState, useEffect, useMemo } from 'react';
import { Screen, Language, Product, Category } from '../../types';
import {
  Search,
  ChevronDown,
  Mail,
  CheckCircle2,
  Handshake,
  ArrowRight,
  ExternalLink,
  ShoppingCart,
  MessageCircle,
  Tag,
  Filter,
  Package,
  Eye,
  Info,
} from 'lucide-react';
import {
  getCatalogProducts,
  CatalogItem,
  fetchProducts,
  catalogItemToProduct,
} from '../../services/productService';
import { fetchCategories } from '../../services/categoryService';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';
import { getAssetUrl } from '../../utils/assets';
import { ProductDetailModal } from '../ProductDetailModal';

interface CatalogScreenProps {
  onNavigate: (screen: Screen) => void;
  onAddToCart?: (product: Product | CatalogItem) => void;
  onOpenProforma?: () => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  language?: Language;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  onNavigate,
  onAddToCart,
  selectedCategory: initialCategory = 'all',
  searchQuery: initialSearch = '',
  language = 'en',
}) => {
  const { settings } = useWebsiteSettings();
  const [products, setProducts] = useState<CatalogItem[]>(() => getCatalogProducts());
  const [categories, setCategories] = useState<string[]>(['All Products']);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState<string>(
    initialCategory === 'all' ? 'All Products' : initialCategory
  );
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Load live products & categories
  useEffect(() => {
    const handleUpdate = () => {
      setProducts(getCatalogProducts());
    };
    window.addEventListener('knr_product_price_updated', handleUpdate);
    window.addEventListener('knr_products_updated', handleUpdate);

    // Synchronize live with remote Supabase database
    fetchProducts({ activeOnly: true }).then(() => {
      setProducts(getCatalogProducts());
    });

    const loadCategories = () => {
      fetchCategories().then((cats) => {
        const activeCatNames = cats.filter((c) => c.isActive).map((c) => c.name);
        setCategories(['All Products', ...activeCatNames]);
      });
    };

    loadCategories();
    window.addEventListener('knr_categories_updated', loadCategories);

    return () => {
      window.removeEventListener('knr_product_price_updated', handleUpdate);
      window.removeEventListener('knr_products_updated', handleUpdate);
      window.removeEventListener('knr_categories_updated', loadCategories);
    };
  }, []);

  // Filter products by category & search term
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (categoryFilter !== 'All Products') {
        const matchesCategory =
          prod.category === categoryFilter ||
          (prod as unknown as { categoryId?: string }).categoryId === categoryFilter ||
          prod.category.toLowerCase() === categoryFilter.toLowerCase();
        if (!matchesCategory) return false;
      }
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(query);
        const matchesDesc = prod.description.toLowerCase().includes(query);
        const matchesCat = prod.category.toLowerCase().includes(query);
        return matchesName || matchesDesc || matchesCat;
      }
      return true;
    });
  }, [products, searchTerm, categoryFilter]);

  const whatsappPhone = (settings?.whatsappNumber || '918886175855').replace(/[^0-9]/g, '');

  const handleEnquire = (product: CatalogItem) => {
    const text = `Hello KNR Enterprises,\nI am interested in the following wholesale product:\nProduct: ${product.name}\nPlease share wholesale bulk availability and formal proforma quote.`;
    window.open(
      `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="w-full bg-[#F8FAFC] text-[#111827] selection:bg-[#F57C00]/20 selection:text-[#F57C00]">
      {/* =========================================================================
          1. PRODUCTS HERO SECTION (Modern White + Warm Orange Eyebrow)
         ========================================================================= */}
      <section className="relative bg-gradient-to-b from-[#FFF3E0]/50 via-white to-[#F8FAFC] text-[#111827] pt-10 sm:pt-16 pb-14 sm:pb-20 border-b border-[#E2E8F0] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF3E0] border border-orange-200 text-[#F57C00] text-xs font-bold tracking-wider uppercase">
                <Package className="w-3.5 h-3.5" />
                <span>WHOLESALE & INSTITUTIONAL CATALOG</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111827] tracking-tight leading-[1.12] font-display">
                Products That Support<br />
                <span className="text-[#F57C00]">Better Communities.</span>
              </h1>

              <p className="text-[#64748B] text-sm sm:text-base leading-relaxed max-w-xl">
                Explore our certified range of industrial, municipal, sanitation, chemical and infrastructure supplies with verified potency and guaranteed depot dispatch across all 33 Telangana districts.
              </p>

              <div className="w-16 h-1 bg-[#F57C00] rounded-full mt-4" />
            </div>

            {/* Right Column: Hero Products Composition Visual (5 cols) */}
            <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-lg rounded-3xl overflow-hidden shadow-xl border border-[#E2E8F0] bg-white p-3 group">
                <img
                  src={getAssetUrl('/hero-knr-products.jpg')}
                  alt="KNR Enterprises Product Catalog Showcase"
                  className="w-full h-auto aspect-[16/10] object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getAssetUrl('/hero-knr-products.jpg');
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. FILTER & SEARCH CONTROL STRIP
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-md p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input (6 cols) */}
            <div className="sm:col-span-1 lg:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name, HSN, or category..."
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
              />
            </div>

            {/* Category Dropdown (4 cols) */}
            <div className="sm:col-span-1 lg:col-span-4 relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#111827] font-medium focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Clear Button (2 cols) */}
            <div className="sm:col-span-2 lg:col-span-2 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('All Products');
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E2E8F0] hover:border-orange-300 text-slate-600 hover:text-[#F57C00] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. PRODUCTS GRID (Responsive 4-column layout with object-contain images)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Indicative Pricing Disclaimer Banner */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-xs flex items-start gap-3.5">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
            <Tag className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5">
              <span>Wholesale Quotation & Pricing Notice</span>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full uppercase">
                B2B Bulk Supply
              </span>
            </h4>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Official wholesale quotations are issued directly by KNR Enterprises for all institutional, municipal, and commercial procurement. Final rates depend on order volume, customized specifications, depot stock availability, and highway dispatch logistics.
            </p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#E2E8F0] p-8 shadow-xs">
            <h3 className="text-lg font-bold text-[#111827]">No products found</h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-sm mx-auto">
              We couldn't find any products matching &ldquo;{searchTerm}&rdquo; in category &ldquo;{categoryFilter}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('All Products');
              }}
              className="mt-4 px-6 py-2.5 bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-xs rounded-full shadow-sm cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between p-4 group"
              >
                <div>
                  {/* Image container using contain for industrial packaging */}
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

                  {/* Category Pill */}
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

                  {/* Wholesale Pricing */}
                  <div className="mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F57C00] block">
                      Wholesale Rate
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-bold text-[#111827] bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-md">
                        Request a Quote
                      </span>
                      <span className="text-xs font-semibold text-[#64748B]">
                        / {product.unit}
                      </span>
                    </div>
                  </div>

                  {/* Availability Badge & MOQ Info */}
                  <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100">
                    {(() => {
                      const avail = product.availability || (product.inStock ? 'Available' : 'Enquire for Availability');
                      if (avail === 'Available') {
                        return (
                          <div className="flex items-center gap-1 font-semibold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Available</span>
                          </div>
                        );
                      }
                      if (avail === 'Enquire for Availability') {
                        return (
                          <div className="flex items-center gap-1 font-semibold text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Enquire</span>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-1 font-semibold text-rose-700">
                          <span>Discontinued</span>
                        </div>
                      );
                    })()}
                    <span className="text-[#64748B] font-mono text-[11px]">
                      MOQ: {product.moq ? `${product.moq} ${product.unit}` : `1 ${product.unit}`}
                    </span>
                  </div>
                </div>

                {/* Actions: Add to Enquiry, View Details & WhatsApp Enquiry */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => onAddToCart && onAddToCart(product)}
                    className="w-full bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Enquiry</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedProductForDetail(catalogItemToProduct(product));
                        setIsDetailModalOpen(true);
                      }}
                      className="w-full bg-[#F8FAFC] hover:bg-slate-100 text-[#111827] border border-[#E2E8F0] font-semibold text-xs py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#F57C00]" />
                      <span>View Details</span>
                    </button>

                    <button
                      onClick={() => handleEnquire(product)}
                      className="w-full bg-[#F8FAFC] hover:bg-emerald-50 hover:text-emerald-700 border border-[#E2E8F0] text-slate-700 font-semibold text-xs py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          4. BOTTOM BULK TENDER BANNER
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <div className="bg-[#0D2B5B] text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-700/60 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black text-white font-display">
              Need Bulk Consignments for Gram Panchayats or Civil Projects?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Contact our Chevella logistics depot directly for official GST proforma invoices and full truckload freight rates.
            </p>
          </div>

          <button
            onClick={() => onNavigate('contact')}
            className="bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-sm px-8 py-3.5 rounded-full shadow-md shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Contact Depot Team</span>
            <ArrowRight className="w-4 h-4" />
          </button>
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
