import React, { useState, useEffect } from 'react';
import { HomepageContent } from '../../types';
import {
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Sparkles,
  Building,
  Image as ImageIcon,
} from 'lucide-react';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';
import { ImageUploader } from '../components/ImageUploader';

export const WebsiteContentPage: React.FC = () => {
  const { homepageContent, updateHomepage, isLoading } = useWebsiteSettings();
  const [activeSubTab, setActiveSubTab] = useState<'homepage' | 'sections' | 'about'>('homepage');

  // Form State
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubheading, setHeroSubheading] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [heroBadge, setHeroBadge] = useState('');
  const [heroBannerImage, setHeroBannerImage] = useState('');

  // Stats
  const [statDepotOrders, setStatDepotOrders] = useState('');
  const [statActiveClients, setStatActiveClients] = useState('');
  const [statProductLines, setStatProductLines] = useState('');
  const [statDistricts, setStatDistricts] = useState('');

  // Visibility Toggles
  const [showHero, setShowHero] = useState(true);
  const [showTrustStrip, setShowTrustStrip] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showFeaturedProducts, setShowFeaturedProducts] = useState(true);
  const [showAboutSection, setShowAboutSection] = useState(true);
  const [showTestimonials, setShowTestimonials] = useState(true);
  const [showFaqSection, setShowFaqSection] = useState(true);

  // About Section
  const [aboutHeading, setAboutHeading] = useState('');
  const [aboutDescription, setAboutDescription] = useState('');
  const [aboutImage, setAboutImage] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (homepageContent) {
      setHeroHeading(homepageContent.heroHeading || 'KNR Enterprises');
      setHeroSubheading(homepageContent.heroSubheading || 'Quality Products. Trusted Partnership.');
      setHeroDescription(homepageContent.heroDescription || '');
      setHeroBadge(homepageContent.heroBadge || 'Building Stronger Tomorrow');
      setHeroBannerImage(homepageContent.heroBannerImage || '/hero-knr-products.jpg');

      setStatDepotOrders(homepageContent.statDepotOrders || '500+');
      setStatActiveClients(homepageContent.statActiveClients || '100+');
      setStatProductLines(homepageContent.statProductLines || '8+');
      setStatDistricts(homepageContent.statDistricts || '33');

      setShowHero(homepageContent.showHero ?? true);
      setShowTrustStrip(homepageContent.showTrustStrip ?? true);
      setShowCategories(homepageContent.showCategories ?? true);
      setShowFeaturedProducts(homepageContent.showFeaturedProducts ?? true);
      setShowAboutSection(homepageContent.showAboutSection ?? true);
      setShowTestimonials(homepageContent.showTestimonials ?? true);
      setShowFaqSection(homepageContent.showFaqSection ?? true);

      setAboutHeading(homepageContent.aboutHeading || 'Building Trust Through Quality');
      setAboutDescription(homepageContent.aboutDescription || '');
      setAboutImage(homepageContent.aboutImage || '/building-knr-hq.jpg');
    }
  }, [homepageContent]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    try {
      const payload: Partial<HomepageContent> = {
        heroHeading: heroHeading.trim(),
        heroSubheading: heroSubheading.trim(),
        heroDescription: heroDescription.trim(),
        heroBadge: heroBadge.trim(),
        heroBannerImage,
        statDepotOrders: statDepotOrders.trim(),
        statActiveClients: statActiveClients.trim(),
        statProductLines: statProductLines.trim(),
        statDistricts: statDistricts.trim(),
        showHero,
        showTrustStrip,
        showCategories,
        showFeaturedProducts,
        showAboutSection,
        showTestimonials,
        showFaqSection,
        aboutHeading: aboutHeading.trim(),
        aboutDescription: aboutDescription.trim(),
        aboutImage,
      };

      await updateHomepage(payload);
      setSuccessMessage('Website content updated successfully! Live website refreshed instantly.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      alert(`Failed to save content: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn pb-16">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Website Content Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Independently manage homepage hero messaging, metrics, about section, and section visibility
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save All Changes</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('homepage')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'homepage'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Homepage Hero &amp; Stats</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sections')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'sections'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Section Visibility Toggles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('about')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'about'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>About Us Section</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SUBTAB 1: HOMEPAGE HERO & STATS */}
        {activeSubTab === 'homepage' && (
          <div className="space-y-6">
            {/* Hero Messaging Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Homepage Hero Headline &amp; Subheadings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Overline Badge / Tagline
                  </label>
                  <input
                    type="text"
                    value={heroBadge}
                    onChange={(e) => setHeroBadge(e.target.value)}
                    placeholder="e.g. Building Stronger Tomorrow"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hero Main Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={heroHeading}
                    onChange={(e) => setHeroHeading(e.target.value)}
                    placeholder="KNR Enterprises"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hero Subheading
                </label>
                <input
                  type="text"
                  value={heroSubheading}
                  onChange={(e) => setHeroSubheading(e.target.value)}
                  placeholder="e.g. Quality Products. Trusted Partnership."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hero Paragraph Description
                </label>
                <textarea
                  rows={3}
                  value={heroDescription}
                  onChange={(e) => setHeroDescription(e.target.value)}
                  placeholder="Your one-stop destination for premium industrial products with unmatched quality and service."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Banner Image */}
              <div className="pt-2">
                <ImageUploader
                  value={heroBannerImage}
                  onChange={setHeroBannerImage}
                  label="Hero 3D Platform Banner Image"
                  allowMultiple={false}
                />
              </div>
            </div>

            {/* Homepage Key Statistics Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Homepage Metrics &amp; Trust Counters
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Depot Orders Delivered
                  </label>
                  <input
                    type="text"
                    value={statDepotOrders}
                    onChange={(e) => setStatDepotOrders(e.target.value)}
                    placeholder="500+"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Active Institutional Clients
                  </label>
                  <input
                    type="text"
                    value={statActiveClients}
                    onChange={(e) => setStatActiveClients(e.target.value)}
                    placeholder="100+"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Core Product Lines
                  </label>
                  <input
                    type="text"
                    value={statProductLines}
                    onChange={(e) => setStatProductLines(e.target.value)}
                    placeholder="8+"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telangana Districts Covered
                  </label>
                  <input
                    type="text"
                    value={statDistricts}
                    onChange={(e) => setStatDistricts(e.target.value)}
                    placeholder="33"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: SECTION VISIBILITY TOGGLES */}
        {activeSubTab === 'sections' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Public Homepage Section Controls
            </h3>
            <p className="text-xs text-slate-500">
              Easily show or hide sections on the public homepage with zero code modifications
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Hero Section</span>
                  <span className="text-[11px] text-slate-500 block">3D ring halo, headline &amp; WhatsApp CTA</span>
                </div>
                <input
                  type="checkbox"
                  checked={showHero}
                  onChange={(e) => setShowHero(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Trust Strip (Floating Bar)</span>
                  <span className="text-[11px] text-slate-500 block">Quality, Trust, Logistics &amp; Support badges</span>
                </div>
                <input
                  type="checkbox"
                  checked={showTrustStrip}
                  onChange={(e) => setShowTrustStrip(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Product Categories Showcase</span>
                  <span className="text-[11px] text-slate-500 block">Category cards linked with catalog filters</span>
                </div>
                <input
                  type="checkbox"
                  checked={showCategories}
                  onChange={(e) => setShowCategories(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Featured Products Carousel</span>
                  <span className="text-[11px] text-slate-500 block">Add-to-cart product cards</span>
                </div>
                <input
                  type="checkbox"
                  checked={showFeaturedProducts}
                  onChange={(e) => setShowFeaturedProducts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">About KNR Brief Section</span>
                  <span className="text-[11px] text-slate-500 block">Company overview &amp; HQ photo preview</span>
                </div>
                <input
                  type="checkbox"
                  checked={showAboutSection}
                  onChange={(e) => setShowAboutSection(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Client Testimonials</span>
                  <span className="text-[11px] text-slate-500 block">Verified Sarpanch &amp; Municipality reviews</span>
                </div>
                <input
                  type="checkbox"
                  checked={showTestimonials}
                  onChange={(e) => setShowTestimonials(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">FAQ Accordion</span>
                  <span className="text-[11px] text-slate-500 block">Quick procurement &amp; tender questions</span>
                </div>
                <input
                  type="checkbox"
                  checked={showFaqSection}
                  onChange={(e) => setShowFaqSection(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>
          </div>
        )}

        {/* SUBTAB 3: ABOUT US SECTION */}
        {activeSubTab === 'about' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              About Section Content
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                About Heading
              </label>
              <input
                type="text"
                value={aboutHeading}
                onChange={(e) => setAboutHeading(e.target.value)}
                placeholder="Building Trust Through Quality"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                About Description
              </label>
              <textarea
                rows={4}
                value={aboutDescription}
                onChange={(e) => setAboutDescription(e.target.value)}
                placeholder="Detailed mission, values, and client dedication..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="pt-2">
              <ImageUploader
                value={aboutImage}
                onChange={setAboutImage}
                label="Corporate Headquarters Facility Photo"
                allowMultiple={false}
              />
            </div>
          </div>
        )}

        {/* Bottom Save bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save All Content Updates</span>
          </button>
        </div>
      </form>
    </div>
  );
};

