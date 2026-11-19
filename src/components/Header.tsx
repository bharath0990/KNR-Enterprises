import React, { useState, useEffect } from 'react';
import { Screen, Language, Category } from '../types';
import { Logo } from './Logo';
import {
  Lock,
  ChevronDown,
  ShoppingCart,
  Menu,
  X,
  MessageCircle,
  Bell,
  ArrowRight,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import { fetchCategories } from '../services/categoryService';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';

interface HeaderProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenProforma?: () => void;
  language: Language;
  onToggleLanguage: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  cartCount,
  onOpenCart,
  language,
  onToggleLanguage,
  onOpenAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { settings } = useWebsiteSettings();

  useEffect(() => {
    fetchCategories().then((res) => {
      setCategories(res.filter((c) => c.isActive));
    });

    const handleCatUpdate = () => {
      fetchCategories().then((res) => {
        setCategories(res.filter((c) => c.isActive));
      });
    };

    window.addEventListener('knr_categories_updated', handleCatUpdate);
    return () => window.removeEventListener('knr_categories_updated', handleCatUpdate);
  }, []);

  const handleNavClick = (screen: Screen) => {
    onNavigate(screen);
    setMobileMenuOpen(false);
    setProductsDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminClick = () => {
    if (onOpenAdmin) {
      onOpenAdmin();
    } else {
      window.location.hash = 'admin';
    }
    setMobileMenuOpen(false);
  };

  const isActive = (screen: Screen) => currentScreen === screen;
  const whatsappDigits = (settings?.whatsappNumber || '918886175855').replace(/[^0-9]/g, '');

  const showAnnouncement = settings ? settings.announcementBannerEnabled : true;
  const announcementText =
    (settings?.announcementBannerText && settings.announcementBannerText.trim()) ||
    "Monsoon Sanitation & Vector Control Supplies in Stock at Chevella Depot. Same-Day Highway Dispatch across Telangana.";

  return (
    <>
      {/* =========================================================================
          1. TOP ANNOUNCEMENT BAR (Slim Orange Announcement Bar)
         ========================================================================= */}
      {showAnnouncement && (
        <div className="bg-[#F57C00] text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-xs print:hidden z-50 relative">
          <Bell className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-200" />
          <span className="tracking-wide line-clamp-1">{announcementText}</span>
        </div>
      )}

      {/* =========================================================================
          2. MAIN NAVIGATION (White background, subtle bottom border)
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] text-[#111827] shadow-xs transition-all print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left: Brand Logo + Company Name */}
            <div className="flex items-center shrink-0">
              <Logo
                variant="light"
                showTagline={false}
                className="h-8 sm:h-9 w-auto"
                onClick={() => handleNavClick('home')}
              />
            </div>

            {/* Center: 6 Main Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-7 xl:space-x-8 text-sm font-semibold">
              {/* Home */}
              <button
                onClick={() => handleNavClick('home')}
                className={`relative py-1 transition-colors cursor-pointer ${
                  isActive('home')
                    ? 'text-[#F57C00] font-bold after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-[2.5px] after:bg-[#F57C00] after:rounded-full'
                    : 'text-[#111827] hover:text-[#F57C00]'
                }`}
              >
                {language === 'te' ? 'హోమ్' : 'Home'}
              </button>

              {/* About */}
              <button
                onClick={() => handleNavClick('about')}
                className={`relative py-1 transition-colors cursor-pointer ${
                  isActive('about')
                    ? 'text-[#F57C00] font-bold after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-[2.5px] after:bg-[#F57C00] after:rounded-full'
                    : 'text-[#111827] hover:text-[#F57C00]'
                }`}
              >
                {language === 'te' ? 'మా గురించి' : 'About'}
              </button>

              {/* Products with Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setProductsDropdownOpen(true)}
                onMouseLeave={() => setProductsDropdownOpen(false)}
              >
                <button
                  onClick={() => handleNavClick('products')}
                  className={`relative flex items-center gap-1 py-1 transition-colors cursor-pointer ${
                    isActive('products')
                      ? 'text-[#F57C00] font-bold after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-[2.5px] after:bg-[#F57C00] after:rounded-full'
                      : 'text-[#111827] hover:text-[#F57C00]'
                  }`}
                >
                  <span>{language === 'te' ? 'ఉత్పత్తులు' : 'Products'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      productsDropdownOpen ? 'rotate-180 text-[#F57C00]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {productsDropdownOpen && (
                  <div className="absolute top-full left-0 w-64 pt-2 z-50 animate-fadeIn">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-2 overflow-hidden">
                      <div className="px-3.5 py-1.5 text-[11px] font-bold tracking-wider uppercase text-[#F57C00] bg-[#FFF3E0]/50 border-b border-[#E2E8F0]">
                        {language === 'te' ? 'కేటగిరీలు' : 'Product Categories'}
                      </div>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setProductsDropdownOpen(false);
                            handleNavClick('products');
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#111827] hover:text-[#F57C00] hover:bg-orange-50/60 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>{language === 'te' && cat.teluguName ? cat.teluguName : cat.name}</span>
                          <span className="text-[10px] text-[#F57C00] font-mono">&rarr;</span>
                        </button>
                      ))}
                      <div className="p-2 border-t border-[#E2E8F0]">
                        <button
                          onClick={() => handleNavClick('products')}
                          className="w-full text-center py-1.5 bg-[#FFF3E0] hover:bg-[#F57C00] hover:text-white text-[#F57C00] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          {language === 'te' ? 'అన్ని ఉత్పత్తులు చూడండి →' : 'View All Products →'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Services */}
              <button
                onClick={() => handleNavClick('services')}
                className={`relative py-1 transition-colors cursor-pointer ${
                  isActive('services')
                    ? 'text-[#F57C00] font-bold after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-[2.5px] after:bg-[#F57C00] after:rounded-full'
                    : 'text-[#111827] hover:text-[#F57C00]'
                }`}
              >
                {language === 'te' ? 'సేవలు' : 'Services'}
              </button>

              {/* FAQs */}
              <button
                onClick={() => handleNavClick('faqs')}
                className={`relative py-1 transition-colors cursor-pointer ${
                  isActive('faqs')
                    ? 'text-[#F57C00] font-bold after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-[2.5px] after:bg-[#F57C00] after:rounded-full'
                    : 'text-[#111827] hover:text-[#F57C00]'
                }`}
              >
                {language === 'te' ? 'తరచుగా అడిగే ప్రశ్నలు' : 'FAQs'}
              </button>

              {/* Contact */}
              <button
                onClick={() => handleNavClick('contact')}
                className={`relative py-1 transition-colors cursor-pointer ${
                  isActive('contact')
                    ? 'text-[#F57C00] font-bold after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-[2.5px] after:bg-[#F57C00] after:rounded-full'
                    : 'text-[#111827] hover:text-[#F57C00]'
                }`}
              >
                {language === 'te' ? 'సంప్రదించండి' : 'Contact'}
              </button>
            </nav>

            {/* Right: Contact Us Button, Language Switcher, RFQ Cart, Admin Link */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {/* Contact Us button */}
              <button
                onClick={() => handleNavClick('contact')}
                className="bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-xs sm:text-sm px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden min-[400px]:inline">
                  {language === 'te' ? 'సంప్రదించండి' : 'Contact Us'}
                </span>
                <span className="min-[400px]:hidden">Contact</span>
              </button>

              {/* English / Telugu Switcher */}
              <button
                onClick={onToggleLanguage}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#111827] hover:text-[#F57C00] px-2.5 py-1.5 rounded-full border border-[#E2E8F0] hover:border-orange-300 bg-slate-50 transition-colors cursor-pointer"
                title="Toggle English / Telugu"
              >
                <span className={language === 'en' ? 'text-[#F57C00] font-bold' : ''}>EN</span>
                <span className="text-slate-300">|</span>
                <span className={language === 'te' ? 'text-[#F57C00] font-bold' : ''}>తెలుగు</span>
              </button>

              {/* RFQ Cart Icon with Quantity Badge */}
              <button
                onClick={onOpenCart}
                className="relative p-2 text-[#111827] hover:text-[#F57C00] rounded-full hover:bg-orange-50 transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center border border-transparent hover:border-orange-200"
                title="View RFQ Cart"
                aria-label="View RFQ Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#F57C00] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Admin Portal Discrete Button */}
              <button
                onClick={handleAdminClick}
                className="hidden sm:inline-flex p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Administrator Portal"
                aria-label="Admin Portal"
              >
                <Lock className="w-4 h-4" />
              </button>

              {/* Mobile Hamburger Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-700 hover:text-[#F57C00] rounded-lg focus:outline-none min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer hover:bg-slate-100"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-[#111827]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-[#E2E8F0] px-4 py-4 space-y-2 shadow-xl animate-fadeIn">
            <button
              onClick={() => handleNavClick('home')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                isActive('home')
                  ? 'bg-[#FFF3E0] text-[#F57C00] font-bold'
                  : 'text-[#111827] hover:bg-slate-50'
              }`}
            >
              <span>{language === 'te' ? 'హోమ్' : 'Home'}</span>
              {isActive('home') && <span className="w-2 h-2 rounded-full bg-[#F57C00]" />}
            </button>

            <button
              onClick={() => handleNavClick('about')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                isActive('about')
                  ? 'bg-[#FFF3E0] text-[#F57C00] font-bold'
                  : 'text-[#111827] hover:bg-slate-50'
              }`}
            >
              <span>{language === 'te' ? 'మా గురించి' : 'About'}</span>
              {isActive('about') && <span className="w-2 h-2 rounded-full bg-[#F57C00]" />}
            </button>

            <button
              onClick={() => handleNavClick('products')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                isActive('products')
                  ? 'bg-[#FFF3E0] text-[#F57C00] font-bold'
                  : 'text-[#111827] hover:bg-slate-50'
              }`}
            >
              <span>{language === 'te' ? 'ఉత్పత్తులు' : 'Products'}</span>
              {isActive('products') && <span className="w-2 h-2 rounded-full bg-[#F57C00]" />}
            </button>

            <button
              onClick={() => handleNavClick('services')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                isActive('services')
                  ? 'bg-[#FFF3E0] text-[#F57C00] font-bold'
                  : 'text-[#111827] hover:bg-slate-50'
              }`}
            >
              <span>{language === 'te' ? 'సేవలు' : 'Services'}</span>
              {isActive('services') && <span className="w-2 h-2 rounded-full bg-[#F57C00]" />}
            </button>

            <button
              onClick={() => handleNavClick('faqs')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                isActive('faqs')
                  ? 'bg-[#FFF3E0] text-[#F57C00] font-bold'
                  : 'text-[#111827] hover:bg-slate-50'
              }`}
            >
              <span>{language === 'te' ? 'తరచుగా అడిగే ప్రశ్నలు' : 'FAQs'}</span>
              {isActive('faqs') && <span className="w-2 h-2 rounded-full bg-[#F57C00]" />}
            </button>

            <button
              onClick={() => handleNavClick('contact')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                isActive('contact')
                  ? 'bg-[#FFF3E0] text-[#F57C00] font-bold'
                  : 'text-[#111827] hover:bg-slate-50'
              }`}
            >
              <span>{language === 'te' ? 'సంప్రదించండి' : 'Contact'}</span>
              {isActive('contact') && <span className="w-2 h-2 rounded-full bg-[#F57C00]" />}
            </button>

            {/* Mobile Actions */}
            <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
              <a
                href={`https://wa.me/${whatsappDigits}?text=Hello%20KNR%20Enterprises,%20I%20would%20like%20to%20enquire%20about%20your%20products%20and%20supplies`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={onToggleLanguage}
                  className="text-xs font-bold text-[#F57C00] px-3 py-1.5 rounded-lg bg-[#FFF3E0]"
                >
                  {language === 'en' ? 'తెలుగులోకి మార్చండి' : 'Switch to English'}
                </button>

                <button
                  onClick={handleAdminClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 hover:text-slate-900"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Admin Login</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
