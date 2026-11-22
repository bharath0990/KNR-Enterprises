import React from 'react';
import { Screen, Language } from '../../types';
import { getAssetUrl } from '../../utils/assets';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';
import {
  Home,
  Award,
  Handshake,
  ShieldCheck,
  Headphones,
  ArrowRight,
  Building,
  Target,
  Eye,
  CheckCircle2,
  Truck
} from 'lucide-react';

interface AboutScreenProps {
  onNavigate: (screen: Screen) => void;
  onOpenProforma?: () => void;
  language?: Language;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ onNavigate, language = 'en' }) => {
  const { homepageContent } = useWebsiteSettings();

  const aboutImageUrl =
    homepageContent?.aboutImage && homepageContent.aboutImage.trim() !== ''
      ? homepageContent.aboutImage.startsWith('http') || homepageContent.aboutImage.startsWith('data:')
        ? homepageContent.aboutImage
        : getAssetUrl(homepageContent.aboutImage)
      : getAssetUrl('/about-hero-building.jpg');

  const aboutSectionHeading =
    homepageContent?.aboutHeading?.trim() || "Dedicated Wholesale Supply for Telangana's Civic Infrastructure";

  const aboutSectionDesc =
    homepageContent?.aboutDescription?.trim() ||
    'At KNR Enterprises, we are committed to supplying high-quality municipal, sanitation and industrial products. We work directly with Gram Panchayats, Municipal Corporations, and infrastructure EPC contractors to deliver dependable bulk products and end-to-end procurement support.';

  const values = [
    {
      icon: Award,
      titleLine1: 'Quality',
      titleLine2: 'Products',
      desc: 'Tested formulations and ISI-compliant standards'
    },
    {
      icon: Handshake,
      titleLine1: 'Reliable',
      titleLine2: 'Partnership',
      desc: 'Institutional wholesale distributor for Panchayats'
    },
    {
      icon: ShieldCheck,
      titleLine1: 'Trusted',
      titleLine2: 'Service',
      desc: 'Transparent GST invoicing and batch lab assays'
    },
    {
      icon: Headphones,
      titleLine1: 'Dedicated',
      titleLine2: 'Support',
      desc: 'Rapid highway dispatch and audit paperwork support'
    },
  ];

  return (
    <div className="w-full bg-white text-[#111827] selection:bg-[#F57C00]/20 selection:text-[#F57C00]">
      {/* =========================================================================
          1. ABOUT HERO SECTION (Modern White + Warm Orange Eyebrow)
         ========================================================================= */}
      <section className="relative bg-gradient-to-b from-[#FFF3E0]/50 via-white to-white text-[#111827] pt-10 sm:pt-16 pb-12 sm:pb-16 border-b border-[#E2E8F0] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content (7 cols) */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF3E0] border border-orange-200 text-[#F57C00] text-xs font-bold tracking-wider uppercase">
                <Building className="w-3.5 h-3.5" />
                <span>ABOUT KNR ENTERPRISES</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111827] tracking-tight leading-[1.12] font-display">
                Building Trust Through <span className="text-[#F57C00]">Quality.</span>
              </h1>

              <p className="text-base sm:text-lg font-bold text-[#0D2B5B] tracking-tight">
                Quality Supply Solutions. Built on Trust.
              </p>

              <p className="text-[#64748B] text-sm sm:text-base leading-relaxed max-w-xl">
                Serving Gram Panchayats, Municipal Corporations, and infrastructure contractors across all 33 Telangana districts with certified sanitation chemicals, vector control equipment, and civic supplies.
              </p>

              {/* Breadcrumbs: Home > About */}
              <div className="flex items-center gap-2 text-xs text-[#64748B] pt-2 select-none font-medium">
                <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#F57C00] transition-colors cursor-pointer"
                >
                  Home
                </button>
                <span className="text-slate-400">&gt;</span>
                <span className="text-[#111827] font-bold">About Us</span>
              </div>
            </div>

            {/* Right Architectural Building Exterior (5 cols) */}
            <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-lg rounded-3xl overflow-hidden shadow-xl border border-[#E2E8F0] bg-white p-3 group">
                <img
                  src={aboutImageUrl}
                  alt="KNR Enterprises Commercial Facility"
                  className="w-full h-auto aspect-[16/10] object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.indexOf('building-knr-hq.jpg') === -1) {
                      target.src = getAssetUrl('/building-knr-hq.jpg');
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. MAIN CONTENT: OUR STORY & CORE VALUES
         ========================================================================= */}
      <section className="bg-white py-16 sm:py-24 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Our Story & Mission (6 cols) */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF3E0] text-[#F57C00] font-bold text-xs uppercase tracking-wider">
                OUR JOURNEY & MISSION
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight font-display">
                {aboutSectionHeading}
              </h2>

              <p className="text-[#64748B] text-sm sm:text-base leading-relaxed">
                {aboutSectionDesc}
              </p>

              <p className="text-[#64748B] text-sm sm:text-base leading-relaxed">
                Headquartered along the Chevella–Vikarabad highway in Ranga Reddy District, KNR Enterprises operates dedicated warehousing for Swachh Bharat supplies, CIB-registered vector control chemicals, civic LED streetlights, and sanitation worker safety kits with prompt highway dispatch across all 33 Telangana districts.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('products')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  <span>Explore Product Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('contact')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#111827] border border-[#E2E8F0] font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  <span>Contact Chevella Depot</span>
                </button>
              </div>
            </div>

            {/* Right Column: Institutional Core Values (6 cols) */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {values.map((val, idx) => {
                  const Icon = val.icon;
                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#F57C00]/40 transition-all shadow-xs space-y-2 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-[#111827]">
                        {val.titleLine1} {val.titleLine2}
                      </h4>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {val.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Bottom statutory highlight strip */}
              <div className="mt-4 p-4 rounded-2xl bg-[#0D2B5B] text-white flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold">Highway Dispatch Fleet</div>
                    <div className="text-slate-300 text-[11px]">Same-Day &amp; 24-48 Hr delivery across Telangana</div>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono text-xs font-bold text-emerald-400">
                  GST: 36CUHPK5939D1ZG
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. MISSION, VISION & COMMITMENT (3 Cards)
         ========================================================================= */}
      <section className="bg-[#F8FAFC] py-16 sm:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight font-display">
              Our Institutional Pillars
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Guiding every bulk dispatch and government procurement fulfillment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#111827]">Our Mission</h4>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                To streamline municipal procurement across Telangana by stocking laboratory-tested Grade 1 chemicals, robust equipment, and transparent pricing.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#111827]">Our Vision</h4>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                To be the most trusted supply partner for clean, hygienic, and brightly illuminated rural and urban civic bodies throughout Telangana.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#111827]">Our Commitment</h4>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Factory-sealed quality, 100% audit-compliant GST documentation, and dedicated emergency truck loading during monsoon vector surges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. CONTACT CALL-TO-ACTION SECTION (Navy + Orange CTA)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="bg-[#0D2B5B] text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-700/60 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF3E0]/15 text-[#F57C00] flex items-center justify-center shrink-0">
              <Handshake className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
                Let's Build a <span className="text-[#F57C00]">Stronger Partnership</span>
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-lg">
                Partner with KNR Enterprises for institutional municipal supplies and wholesale contractor slabs.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('contact')}
            className="bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-sm px-8 py-3.5 rounded-full shadow-md shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Contact Us</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
