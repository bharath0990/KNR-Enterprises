import React, { useState, useEffect } from 'react';
import { AdminTab } from '../../types';
import {
  Globe,
  Layers,
  Briefcase,
  HelpCircle,
  Quote,
} from 'lucide-react';
import { WebsiteContentPage } from './WebsiteContentPage';
import { CategoriesPage } from './CategoriesPage';
import { ServicesPage } from './ServicesPage';
import { FaqsPage } from './FaqsPage';
import { TestimonialsPage } from './TestimonialsPage';

export type WebsiteControlSubtab =
  | 'content'
  | 'categories'
  | 'services'
  | 'faqs'
  | 'testimonials';

interface WebsiteControlPageProps {
  initialSubtab?: WebsiteControlSubtab;
  onNavigateTab?: (tab: AdminTab) => void;
}

export const WebsiteControlPage: React.FC<WebsiteControlPageProps> = ({
  initialSubtab = 'content',
}) => {
  const [activeSubtab, setActiveSubtab] = useState<WebsiteControlSubtab>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('categories')) return 'categories';
    if (hash.includes('services')) return 'services';
    if (hash.includes('faqs')) return 'faqs';
    if (hash.includes('testimonials')) return 'testimonials';
    return initialSubtab;
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('categories')) setActiveSubtab('categories');
      else if (hash.includes('services')) setActiveSubtab('services');
      else if (hash.includes('faqs')) setActiveSubtab('faqs');
      else if (hash.includes('testimonials')) setActiveSubtab('testimonials');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const subtabs = [
    { id: 'content' as const, label: 'Hero & Content', icon: Globe },
    { id: 'categories' as const, label: 'Categories', icon: Layers },
    { id: 'services' as const, label: 'Civic Services', icon: Briefcase },
    { id: 'faqs' as const, label: 'FAQs', icon: HelpCircle },
    { id: 'testimonials' as const, label: 'Testimonials', icon: Quote },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Sub-navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Website Control (CMS)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure homepage banners, public categories, institutional services, FAQs, and testimonials.
            </p>
          </div>
        </div>

        {/* Subtab Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          {subtabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubtab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubtab(tab.id);
                  window.location.hash = `admin/website-control#${tab.id}`;
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#F57C00] text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active View */}
      <div>
        {activeSubtab === 'content' && <WebsiteContentPage />}
        {activeSubtab === 'categories' && <CategoriesPage />}
        {activeSubtab === 'services' && <ServicesPage />}
        {activeSubtab === 'faqs' && <FaqsPage />}
        {activeSubtab === 'testimonials' && <TestimonialsPage />}
      </div>
    </div>
  );
};
