import React from 'react';
import { Screen, Language } from '../types';
import { Logo } from './Logo';
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Youtube, Lock } from 'lucide-react';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';

interface FooterProps {
  onNavigate: (screen: Screen) => void;
  language?: Language;
  onOpenProforma?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings } = useWebsiteSettings();

  const handleNavClick = (screen: Screen) => {
    onNavigate(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const phone1 = settings?.phonePrimary || '+91 8886175855';
  const phone2 = settings?.phoneSecondary || '+91 9640195798';
  const email = settings?.officialEmail || 'knrenterprises679@gmail.com';
  const gstin = settings?.gstin || '36CUHPK5939D1ZG';
  const address = settings?.depotAddress || 'H.No: 1-77/6, Near HP Petrol Pump, Chevella, Ranga Reddy, Telangana 501503';

  return (
    <footer className="bg-[#070b12] text-slate-400 pt-14 pb-24 md:pb-12 border-t border-slate-800/80 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12">
          {/* Column 1: Brand & Tagline (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Logo
              variant="dark"
              showTagline={true}
              className="h-8 sm:h-9 w-auto"
              onClick={() => handleNavClick('home')}
            />
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              {settings?.tagline || 'Leading wholesale partner for industrial, sanitation, chemical and utility infrastructure supplies across Telangana.'}
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-1">
              GSTIN: <span className="text-slate-300 font-bold">{gstin}</span>
            </div>
          </div>

          {/* Column 2: Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => handleNavClick('home')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('about')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('products')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('contact')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Us (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide">Contact Us</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <a href={`tel:${phone1.replace(/[^0-9+]/g, '')}`} className="hover:text-orange-400 transition-colors">
                    {phone1} (K. Narendar Reddy)
                  </a>
                  <a href={`tel:${phone2.replace(/[^0-9+]/g, '')}`} className="hover:text-orange-400 transition-colors">
                    {phone2} (G. Siva)
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-orange-400 transition-colors">
                  {email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {address}
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Follow Us & Admin Link (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wide">Follow Us</h4>
            <div className="flex items-center gap-3 text-slate-400">
              <a
                href={settings?.facebookUrl || 'https://facebook.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={settings?.instagramUrl || 'https://instagram.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings?.linkedinUrl || 'https://linkedin.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={settings?.youtubeUrl || 'https://youtube.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>

            <div className="pt-4">
              <a
                href="#admin"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-400 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} {settings?.websiteName || 'KNR Enterprises'}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </a>
            <span>|</span>
            <a href="#terms" className="hover:text-slate-300 transition-colors">
              Terms &amp; Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
