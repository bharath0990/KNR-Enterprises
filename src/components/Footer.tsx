import React from 'react';
import { Screen, Language } from '../types';
import { Logo } from './Logo';
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Youtube, Lock, Clock, ShieldCheck } from 'lucide-react';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';

interface FooterProps {
  onNavigate: (screen: Screen) => void;
  language?: Language;
  onOpenProforma?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, language = 'en' }) => {
  const { settings } = useWebsiteSettings();

  const handleNavClick = (screen: Screen) => {
    onNavigate(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const phone1 = settings?.phonePrimary || '+91 8886175855';
  const phone2 = settings?.phoneSecondary || '+91 9640195798';
  const email = settings?.officialEmail || 'knrenterprises679@gmail.com';
  const gstin = settings?.gstin || '36CUHPK5939D1ZG';
  const address = settings?.depotAddress || 'H.No: 1-77/6, Near HP Petrol Pump, Chevella, Ranga Reddy District, Telangana – 501503';

  // Contact Person (Harivardhan Reddy)
  const contactPersonName = settings?.contactPersonName || 'Harivardhan Reddy';
  const contactPersonPhone = settings?.contactPersonPhone || settings?.phoneSecondary || '+91 9666469679';
  const contactPersonPhoneClean = contactPersonPhone.replace(/[^0-9+]/g, '');
  const contactPersonWhatsappDigits = (settings?.contactPersonWhatsapp || contactPersonPhone).replace(/[^0-9]/g, '');

  return (
    <footer className="bg-[#0D2B5B] text-slate-300 pt-16 pb-24 md:pb-12 border-t border-slate-700/60 print:hidden selection:bg-[#F57C00]/30 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12">
          {/* Column 1: Company (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Logo
              variant="dark"
              showTagline={false}
              className="h-8 sm:h-9 w-auto"
              onClick={() => handleNavClick('home')}
            />
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm leading-relaxed">
              {settings?.tagline ||
                'Leading wholesale distributor supplying municipal, sanitation, civil infrastructure and vector control products to Gram Panchayats, Municipal Corporations, and EPC contractors across Telangana.'}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-white">
              <ShieldCheck className="w-4 h-4 text-[#F57C00]" />
              <span>GSTIN: <strong className="font-mono text-amber-300">{gstin}</strong></span>
            </div>
          </div>

          {/* Column 2: Quick Links (2.5 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide uppercase text-xs text-orange-400">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => handleNavClick('home')}
                  className="hover:text-[#F57C00] transition-colors cursor-pointer text-slate-300 flex items-center gap-1.5"
                >
                  <span>{language === 'te' ? 'హోమ్' : 'Home'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('about')}
                  className="hover:text-[#F57C00] transition-colors cursor-pointer text-slate-300 flex items-center gap-1.5"
                >
                  <span>{language === 'te' ? 'మా గురించి' : 'About'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('products')}
                  className="hover:text-[#F57C00] transition-colors cursor-pointer text-slate-300 flex items-center gap-1.5"
                >
                  <span>{language === 'te' ? 'ఉత్పత్తుల కేటలాగ్' : 'Products Catalog'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('services')}
                  className="hover:text-[#F57C00] transition-colors cursor-pointer text-slate-300 flex items-center gap-1.5"
                >
                  <span>{language === 'te' ? 'సేవలు & లాజిస్టిక్స్' : 'Services & Logistics'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('faqs')}
                  className="hover:text-[#F57C00] transition-colors cursor-pointer text-slate-300 flex items-center gap-1.5"
                >
                  <span>{language === 'te' ? 'తరచుగా అడిగే ప్రశ్నలు' : 'FAQs & Tenders'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('contact')}
                  className="hover:text-[#F57C00] transition-colors cursor-pointer text-slate-300 flex items-center gap-1.5"
                >
                  <span>{language === 'te' ? 'సంప్రదించండి' : 'Contact Depot'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact (3.5 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide uppercase text-xs text-orange-400">
              Procurement & Depot
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#F57C00] shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1.5">
                  <div>
                    <span className="text-[11px] text-orange-300 font-semibold uppercase block">Contact Person:</span>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${contactPersonPhoneClean}`} className="hover:text-[#F57C00] transition-colors font-medium">
                        {contactPersonPhone} <span className="text-[11px] text-slate-300">({contactPersonName})</span>
                      </a>
                      <a
                        href={`https://wa.me/${contactPersonWhatsappDigits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded transition-colors"
                        title={`WhatsApp ${contactPersonName}`}
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase block">Managing Partner:</span>
                    <a href={`tel:${phone1.replace(/[^0-9+]/g, '')}`} className="hover:text-[#F57C00] transition-colors font-medium">
                      {phone1} <span className="text-[11px] text-slate-400">(K. Narendar Reddy)</span>
                    </a>
                  </div>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#F57C00] shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-[#F57C00] transition-colors">
                  {email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#F57C00] shrink-0 mt-0.5" />
                <span className="leading-relaxed text-xs">
                  {address}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#F57C00] shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  Mon – Sat: 8:30 AM – 7:30 PM | Sunday Emergency On-Call
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Follow Us & Admin Link (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wide uppercase text-xs text-orange-400">
              Connect With Us
            </h4>
            <div className="flex items-center gap-2.5 text-white">
              <a
                href={settings?.facebookUrl || 'https://facebook.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F57C00] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={settings?.instagramUrl || 'https://instagram.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F57C00] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings?.linkedinUrl || 'https://linkedin.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F57C00] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={settings?.youtubeUrl || 'https://youtube.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F57C00] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>

            <div className="pt-3">
              <a
                href="#admin"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-slate-200 hover:text-white transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-[#F57C00]" />
                <span>Admin Portal</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} {settings?.websiteName || 'KNR Enterprises'}. All rights reserved. Wholesale Supply Partner.
          </div>
          <div className="flex items-center gap-4">
            <a href="#about" onClick={() => handleNavClick('about')} className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <span>|</span>
            <a href="#contact" onClick={() => handleNavClick('contact')} className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
