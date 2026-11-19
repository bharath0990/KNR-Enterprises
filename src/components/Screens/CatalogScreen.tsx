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
} from 'lucide-react';
import {
  getCatalogProducts,
  formatINR,
  CatalogItem,
  fetchProducts,
} from '../../services/productService';
import { fetchCategories } from '../../services/categoryService';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';

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
  const [products, setProducts] = useState<CatalogItem[]>(getCatalogProducts());
  const [categories, setCategories] = useState<string[]>(['All Products']);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState<string>(
    initialCategory === 'all' ? 'All Products' : initialCategory
  );

  // Load live products & categories
  useEffect(() => {
    const handleUpdate = () => {
      setProducts(getCatalogProducts());
    };

    window.addEventListener('knr_product_price_updated', handleUpdate);
    window.addEventListener('knr_products_updated', handleUpdate);

    fetchCategories().then((cats) => {
      const activeCats = cats.filter((c) => c.isActive).map((c) => c.name);
      setCategories(['All Products', ...activeCats]);
    });

    return () => {
      window.removeEventListener('knr_product_price_updated', handleUpdate);
      window.removeEventListener('knr_products_updated', handleUpdate);
    };
  }, []);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (categoryFilter !== 'All Products' && prod.category !== categoryFilter) {
        return false;
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
    const formattedPrice = `${formatINR(product.price)} ${product.unit}`;
    const text = `Hello KNR Enterprises,\nI am interested in the following product:\nProduct: ${product.name}\nDisplayed Price: ${formattedPrice}\nPlease share more details and availability.`;
    window.open(
      `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="w-full bg-[#f8f9fc] text-slate-900 selection:bg-orange-500/20 selection:text-orange-600">
      {/* =========================================================================
          1. PRODUCTS HERO SECTION
         ========================================================================= */}
      <section className="relative bg-[#0a0e17] text-white pt-8 sm:pt-12 pb-16 sm:pb-20 border-b border-slate-800/80 overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="inline-block bg-orange-500 text-white font-bold text-[10px] sm:text-xs px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                OUR CATALOGUE
              </div>

              <h1 className="text-2xl min-[360px]:text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
                Products That Support<br />
                <span className="text-orange-500">Better Communities.</span>
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-lg">
                Explore our range of industrial, sanitation, chemical and infrastructure supplies for diverse operational requirements.
              </p>

              <div className="w-16 h-1 bg-orange-500 rounded-full mt-4" />
            </div>

            {/* Right Column: Hero Products Composition Visual (5 cols) */}
            <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 bg-slate-900 group">
                <img
                  src="/hero-knr-products.jpg"
                  alt="KNR Enterprises Product Catalog Showcase"
                  className="w-full h-auto aspect-[16/10] object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/hero-knr-products.jpg';
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
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input (6 cols) */}
            <div className="sm:col-span-1 lg:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name or category..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Category Dropdown (4 cols) */}
            <div className="sm:col-span-1 lg:col-span-4 relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-colors cursor-pointer"
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
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. PRODUCTS GRID (Responsive 4-column layout)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
            <h3 className="text-lg font-bold text-slate-800">No products found</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't find any products matching &ldquo;{searchTerm}&rdquo; in category &ldquo;{categoryFilter}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('All Products');
              }}
              className="mt-4 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-full shadow-md cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((product) => (
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
                    <span>In Stock</span>
                  </div>
                </div>

                {/* Actions: Add to Cart & WhatsApp Enquiry */}
                <div className="mt-3.5 space-y-2">
                  <button
                    onClick={() => onAddToCart && onAddToCart(product)}
                    className="w-full min-h-[44px] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onClick={() => handleEnquire(product)}
                    className="w-full min-h-[38px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Enquire on WhatsApp</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          4. BOTTOM BANNER
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className="bg-[#0c1322] text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Need Bulk Consignments for Gram Panchayats or Civil Projects?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Contact our Chevella logistics depot directly for official GST proforma invoices and full truckload freight rates.
            </p>
          </div>

          <button
            onClick={() => onNavigate('contact')}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm px-7 py-3 rounded-full shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Contact Depot Team</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
