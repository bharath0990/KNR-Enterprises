import React, { useState, useEffect } from 'react';
import { Screen, Language, CartItem, Product } from './types';
import { CatalogItem, catalogItemToProduct } from './services/productService';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ProformaModal } from './components/ProformaModal';
import { HomeScreen } from './components/Screens/HomeScreen';
import { CatalogScreen } from './components/Screens/CatalogScreen';
import { AboutScreen } from './components/Screens/AboutScreen';
import { ServicesScreen } from './components/Screens/ServicesScreen';
import { FaqsScreen } from './components/Screens/FaqsScreen';
import { ContactScreen } from './components/Screens/ContactScreen';
import { AdminApp } from './admin/AdminApp';
import { AuthProvider } from './context/AuthContext';
import { WebsiteSettingsProvider, useWebsiteSettings } from './context/WebsiteSettingsContext';
import { RealtimeProvider } from './context/RealtimeContext';
import {
  MessageCircle,
  ArrowUp,
  Home,
  Package,
  Info,
  ShoppingCart,
  PhoneCall,
  AlertTriangle,
  Lock,
  Truck,
} from 'lucide-react';
import { Logo } from './components/Logo';

function AppContent() {
  const { settings } = useWebsiteSettings();
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    return hash.startsWith('#admin') || path.startsWith('/admin');
  });

  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProformaOpen, setIsProformaOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Cart items validated from localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('knr_cart_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated = parsed.filter(
            (item): item is CartItem =>
              Boolean(
                item &&
                item.product &&
                typeof item.product.id === 'string' &&
                typeof item.product.price === 'number' &&
                typeof item.quantity === 'number' &&
                item.quantity > 0
              )
          );
          if (validated.length > 0) return validated;
        }
      }
    } catch {
      // fallback to empty cart
    }
    return [];
  });

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('knr_cart_items', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen to hash and pathname changes
  useEffect(() => {
    const handleRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      if (hash.startsWith('#admin') || path.startsWith('/admin')) {
        setIsAdminRoute(true);
        return;
      }

      setIsAdminRoute(false);

      const target = window.location.hash || window.location.pathname;
      const clean = target.replace(/^#|\//g, '').toLowerCase();

      if (clean === 'enquiry') {
        window.location.hash = 'contact';
        setCurrentScreen('contact');
        return;
      }

      if (['home', 'about', 'products', 'services', 'faqs', 'contact'].includes(clean)) {
        setCurrentScreen(clean as Screen);
      } else {
        setCurrentScreen('home');
      }
    };

    handleRoute();
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('popstate', handleRoute);
    return () => {
      window.removeEventListener('hashchange', handleRoute);
      window.removeEventListener('popstate', handleRoute);
    };
  }, []);

  const handleNavigate = (screen: Screen) => {
    const targetScreen = (screen as string) === 'enquiry' ? 'contact' : screen;
    setCurrentScreen(targetScreen);
    window.location.hash = targetScreen;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (item: Product | CatalogItem) => {
    const product: Product = 'hsnCode' in item ? item : catalogItemToProduct(item);
    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.product.id === product.id);
      if (existing) {
        return prev.map((entry) =>
          entry.product.id === product.id
            ? { ...entry, quantity: entry.quantity + 1, product: { ...entry.product, price: product.price } }
            : entry
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'te' : 'en'));
  };

  // If URL is /admin or #admin, render AdminApp
  if (isAdminRoute) {
    return (
      <AdminApp
        onBackToWebsite={() => {
          setIsAdminRoute(false);
          window.location.hash = 'home';
        }}
      />
    );
  }

  // Maintenance mode active for public visitors (Administrators can still access /admin/login)
  if (settings?.maintenanceMode) {
    return (
      <div className="min-h-screen bg-[#070b12] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="flex justify-center">
            <Logo variant="dark" className="h-10 w-auto" />
          </div>

          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">
              Scheduled System Maintenance
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {settings.maintenanceMessage ||
                'We are currently performing scheduled system updates. For urgent wholesale orders, please call depot dispatch directly.'}
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-2">
            <div className="text-slate-400 font-bold uppercase text-[10px]">
              Direct Depot Dispatch Hotlines
            </div>
            <div className="font-mono text-slate-200">
              <a href={`tel:${settings.phonePrimary}`} className="text-orange-400 font-bold hover:underline">
                {settings.phonePrimary} (K. Narendar Reddy)
              </a>
            </div>
            <div className="font-mono text-slate-200">
              <a href={`tel:${settings.phoneSecondary}`} className="text-orange-400 font-bold hover:underline">
                {settings.phoneSecondary} (G. Siva)
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <a
              href="#admin"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Administrator Sign In</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const whatsappPhone = (settings?.whatsappNumber || '918886175855').replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-orange-500/20 selection:text-orange-600">
      {/* Shared Header Navigation (includes top announcement bar) */}
      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAdmin={() => {
          setIsAdminRoute(true);
          window.location.hash = 'admin';
        }}
      />

      {/* Main Screen Views: 6 Synchronized Public Pages */}
      <main className="flex-1">
        {currentScreen === 'home' && (
          <HomeScreen
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              handleNavigate('products');
            }}
            language={language}
          />
        )}

        {currentScreen === 'about' && (
          <AboutScreen
            onNavigate={handleNavigate}
            language={language}
          />
        )}

        {currentScreen === 'products' && (
          <CatalogScreen
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            language={language}
          />
        )}

        {currentScreen === 'services' && (
          <ServicesScreen
            onNavigate={handleNavigate}
            onOpenProforma={() => setIsProformaOpen(true)}
            language={language}
          />
        )}

        {currentScreen === 'faqs' && (
          <FaqsScreen
            onNavigate={handleNavigate}
            language={language}
          />
        )}

        {currentScreen === 'contact' && (
          <ContactScreen
            onNavigate={handleNavigate}
            language={language}
          />
        )}
      </main>

      {/* Shared Footer */}
      <Footer
        onNavigate={handleNavigate}
        language={language}
      />

      {/* Mobile Web Application App Bar (Public Pages + Cart) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden py-1.5 px-2 flex items-center justify-around shadow-xl print:hidden text-slate-700">
        <button
          onClick={() => handleNavigate('home')}
          className={`min-w-[44px] min-h-[44px] flex flex-col items-center justify-center p-1 cursor-pointer transition-colors ${
            currentScreen === 'home' ? 'text-[#F57C00] font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{language === 'te' ? 'హోమ్' : 'Home'}</span>
        </button>

        <button
          onClick={() => handleNavigate('about')}
          className={`min-w-[44px] min-h-[44px] flex flex-col items-center justify-center p-1 cursor-pointer transition-colors ${
            currentScreen === 'about' ? 'text-[#F57C00] font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Info className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{language === 'te' ? 'గురించి' : 'About'}</span>
        </button>

        <button
          onClick={() => handleNavigate('products')}
          className={`min-w-[44px] min-h-[44px] flex flex-col items-center justify-center p-1 cursor-pointer transition-colors ${
            currentScreen === 'products' ? 'text-[#F57C00] font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{language === 'te' ? 'ఉత్పత్తులు' : 'Products'}</span>
        </button>

        <button
          onClick={() => handleNavigate('services')}
          className={`min-w-[44px] min-h-[44px] flex flex-col items-center justify-center p-1 cursor-pointer transition-colors ${
            currentScreen === 'services' ? 'text-[#F57C00] font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{language === 'te' ? 'సేవలు' : 'Services'}</span>
        </button>

        <button
          onClick={() => handleNavigate('contact')}
          className={`min-w-[44px] min-h-[44px] flex flex-col items-center justify-center p-1 cursor-pointer transition-colors ${
            currentScreen === 'contact' ? 'text-[#F57C00] font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <PhoneCall className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{language === 'te' ? 'కాంటాక్ట్' : 'Contact'}</span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className="relative min-w-[44px] min-h-[44px] flex flex-col items-center justify-center p-1 cursor-pointer text-slate-500 hover:text-[#F57C00] transition-colors"
          aria-label="View RFQ Cart"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartItems.length > 0 && (
            <span className="absolute -top-0.5 right-1.5 bg-[#F57C00] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
          <span className="text-[10px] mt-0.5">{language === 'te' ? 'కార్ట్' : 'Cart'}</span>
        </button>
      </nav>

      {/* Slide-over Cart & RFQ Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOpenProforma={() => {
          setIsCartOpen(false);
          setIsProformaOpen(true);
        }}
        language={language}
        onBrowseProducts={() => handleNavigate('products')}
      />

      {/* Official GST-3B Proforma Invoice Modal */}
      <ProformaModal
        isOpen={isProformaOpen}
        onClose={() => setIsProformaOpen(false)}
        items={cartItems}
        language={language}
      />

      {/* Floating WhatsApp Action Button */}
      <a
        href={`https://wa.me/${whatsappPhone}?text=Hello%20KNR%20Enterprises,%20I%20would%20like%20to%20enquire%20about%20your%20supplies`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center cursor-pointer group print:hidden"
        title="Chat on WhatsApp"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-2">
          Chat with Us
        </span>
      </a>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-36 md:bottom-20 right-4 md:right-6 z-30 bg-slate-800/80 hover:bg-slate-900 text-white p-2.5 rounded-full shadow-md transition-all cursor-pointer print:hidden"
          title="Scroll to Top"
          aria-label="Scroll to Top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WebsiteSettingsProvider>
        <RealtimeProvider>
          <AppContent />
        </RealtimeProvider>
      </WebsiteSettingsProvider>
    </AuthProvider>
  );
}
