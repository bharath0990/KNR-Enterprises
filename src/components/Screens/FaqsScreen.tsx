import React, { useState, useMemo } from 'react';
import { Screen, Language } from '../../types';
import { FAQS_DATA } from '../../data/products';
import { TRANSLATIONS } from '../../data/translations';
import {
  Search,
  HelpCircle,
  Plus,
  Minus,
  MessageCircle,
  Phone,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  Tag,
  Home
} from 'lucide-react';

interface FaqsScreenProps {
  onNavigate: (screen: Screen) => void;
  language: Language;
}

export const FaqsScreen: React.FC<FaqsScreenProps> = ({ onNavigate, language }) => {
  const t = TRANSLATIONS[language];
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openIds, setOpenIds] = useState<string[]>(['faq-1']);

  const categories = [
    'All',
    'Bulk Orders & MOQ',
    'Tenders & Billing',
    'Delivery & Logistics',
    'Payments & Support',
  ];

  const toggleAccordion = (id: string) => {
    if (openIds.includes(id)) {
      setOpenIds(openIds.filter((item) => item !== id));
    } else {
      setOpenIds([...openIds, id]);
    }
  };

  const filteredFaqs = useMemo(() => {
    return FAQS_DATA.filter((faq) => {
      if (activeCategory !== 'All' && faq.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesQ = faq.question.toLowerCase().includes(q);
        const matchesTeluguQ = faq.questionTelugu ? faq.questionTelugu.toLowerCase().includes(q) : false;
        const matchesA = faq.answer.toLowerCase().includes(q);
        const matchesCat = faq.category.toLowerCase().includes(q);
        const matchesTags = faq.tags ? faq.tags.some((tag) => tag.toLowerCase().includes(q)) : false;
        return matchesQ || matchesTeluguQ || matchesA || matchesCat || matchesTags;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="w-full bg-[#F8FAFC] text-[#111827] space-y-12 pb-20 selection:bg-[#F57C00]/20 selection:text-[#F57C00]">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <section className="relative bg-gradient-to-b from-[#FFF3E0]/50 via-white to-[#F8FAFC] text-[#111827] pt-10 sm:pt-16 pb-12 sm:pb-16 border-b border-[#E2E8F0] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-xs text-[#64748B] mb-3 font-medium">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-[#F57C00] transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-[#111827] font-bold">Frequently Asked Questions</span>
          </nav>

          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#FFF3E0] border border-orange-200 text-[#F57C00]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>DEPOT HELP & PROCUREMENT KNOWLEDGE BASE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111827] tracking-tight font-display">
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-2xl mx-auto">
              Clear, transparent answers regarding government tenders, bulk municipal pricing, GST invoices, logistics delivery schedules, and payment terms for institutional buyers across Telangana.
            </p>

            {/* Search Input */}
            <div className="pt-4 max-w-xl mx-auto">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions or keywords (e.g. GST, MOQ, Tenders, Bleaching, Delivery)..."
                  aria-label="Search frequently asked questions"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#F57C00] shadow-xs transition-all"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => {
                const isSelected = activeCategory === cat;
                const count =
                  cat === 'All'
                    ? FAQS_DATA.length
                    : FAQS_DATA.filter((f) => f.category === cat).length;

                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F57C00] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-[#E2E8F0] hover:border-orange-300 hover:text-[#111827]'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. ACCORDION LIST */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        {filteredFaqs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#E2E8F0] shadow-xs">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-[#111827] text-base">No questions found matching your query</h3>
            <p className="text-xs text-[#64748B] mt-1">
              Try searching with different terms or contact our Chevella desk directly for immediate answers.
            </p>
            <button
              onClick={() => {
                setActiveCategory('All');
                setSearchQuery('');
              }}
              className="mt-4 bg-[#F57C00] hover:bg-[#E06D00] text-white text-xs font-bold px-5 py-2.5 rounded-full cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openIds.includes(faq.id);
              const numberStr = (index + 1).toString().padStart(2, '0');

              return (
                <div
                  key={faq.id}
                  className={`bg-white rounded-2xl border transition-all shadow-xs ${
                    isOpen ? 'border-[#F57C00] ring-1 ring-[#F57C00]/20' : 'border-[#E2E8F0] hover:border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <span className="font-mono text-base font-black text-[#F57C00] shrink-0 mt-0.5">
                        {numberStr}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#F57C00] bg-[#FFF3E0] px-2 py-0.5 rounded block w-fit mb-1.5">
                          {faq.category}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-[#111827] leading-snug">
                          {language === 'te' && faq.questionTelugu ? faq.questionTelugu : faq.question}
                        </h3>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-full bg-slate-100 text-slate-600 shrink-0 mt-1">
                      {isOpen ? <Minus className="w-4 h-4 text-[#F57C00]" /> : <Plus className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${faq.id}`}
                      className="px-6 pb-6 pt-0 border-t border-slate-100 mt-2 text-xs sm:text-sm text-[#64748B] leading-relaxed bg-[#F8FAFC]"
                    >
                      <p className="pt-4">{faq.answer}</p>

                      {faq.tags && faq.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-slate-200/60">
                          {faq.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="inline-flex items-center gap-1 bg-white text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#E2E8F0]"
                            >
                              <Tag className="w-3 h-3 text-[#F57C00]" />
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. BOTTOM CHEVELLA DIRECT HELPDESK CARD */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#F57C00] uppercase tracking-wider block">
              CHEVELLA DIRECT PROCUREMENT HELPDESK
            </span>
            <h4 className="text-lg font-bold text-[#111827]">
              Still have questions or need tender documents?
            </h4>
            <p className="text-xs text-[#64748B] max-w-md leading-relaxed">
              Direct procurement assistance from Managing Partner <strong>K. Narendar Reddy</strong> (8886175855) and Logistics Incharge <strong>G. Siva</strong> (9640195798). We provide fast turnaround on compliance paperwork.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-[#64748B] pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#F57C00]" />
                <span>Chevella Depot, Telangana</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>15-Min Response</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
            <a
              href="https://wa.me/918886175855?text=Hello%20KNR%20Enterprises,%20I%20have%20a%20question%20about%20procurement"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs px-5 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>

            <a
              href="tel:8886175855"
              className="bg-white hover:bg-slate-50 text-[#111827] border border-[#E2E8F0] font-bold text-xs px-5 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-[#F57C00]" />
              <span>Call Depot (+91 8886175855)</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
