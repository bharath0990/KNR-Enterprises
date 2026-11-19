import React, { useState } from 'react';
import { Screen, Language } from '../../types';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ExternalLink,
  Users,
  Scale,
  Handshake,
  ArrowRight,
  Send,
  CheckCircle2,
  FileText,
  Clock,
  Home,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';
import { submitRfqEnquiry } from '../../services/enquiryService';
import { getAssetUrl } from '../../utils/assets';

interface ContactScreenProps {
  onNavigate?: (screen: Screen) => void;
  language?: Language;
}

export const ContactScreen: React.FC<ContactScreenProps> = ({ onNavigate }) => {
  const { settings } = useWebsiteSettings();

  const phone1 = settings?.phonePrimary || '+91 8886175855';
  const phone2 = settings?.phoneSecondary || '+91 9640195798';
  const email = settings?.officialEmail || 'knrenterprises679@gmail.com';
  const gstin = settings?.gstin || '36CUHPK5939D1ZG';
  const address = settings?.depotAddress || 'H.No: 1-77/6, Near HP Petrol Pump, Mdl & Vill Chevella, Ranga Reddy, Telangana 501503';
  const whatsappDigits = (settings?.whatsappNumber || '918886175855').replace(/[^0-9]/g, '');

  const googleMapsUrl =
    'https://www.google.com/maps/search/?api=1&query=Near+HP+Petrol+Pump+Chevella+Telangana+501503';

  // RFQ Form state
  const [officerName, setOfficerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [mandal, setMandal] = useState('');
  const [district, setDistrict] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{ ref: string } | null>(null);

  const handleSubmitRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim() || !mobileNumber.trim()) return;

    setIsSubmitting(true);
    try {
      const enq = await submitRfqEnquiry(
        {
          customerName: officerName.trim(),
          mobileNumber: mobileNumber.trim(),
          email: emailInput.trim(),
          organisation: organisation.trim(),
          mandal: mandal.trim(),
          district: district.trim(),
          notes: requirements.trim(),
          source: 'contact_page_form',
        },
        [
          {
            productName: requirements.trim() || 'Wholesale Material Enquiry',
            quantity: 1,
            unit: 'lot',
            unitPrice: 0,
            totalPrice: 0,
          },
        ]
      );

      setSubmitSuccess({ ref: enq.enquiryNumber });

      // Launch WhatsApp with prefilled enquiry
      const message = `Hello KNR Enterprises,\nI have submitted an RFQ enquiry ref: *${enq.enquiryNumber}*.\nName: ${officerName}\nOrganisation: ${organisation || 'N/A'}\nLocation: ${mandal}, ${district}\nRequirements: ${requirements}\nPlease share price quotation and stock availability.`;
      window.open(
        `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener,noreferrer'
      );

      setOfficerName('');
      setMobileNumber('');
      setEmailInput('');
      setOrganisation('');
      setMandal('');
      setDistrict('');
      setRequirements('');
    } catch (err) {
      alert(`Error submitting enquiry: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactCards = [
    {
      id: 'call-us',
      title: 'Call Depot Hotlines',
      icon: Phone,
      lines: [`K. Narendar Reddy: ${phone1}`, `G. Siva: ${phone2}`],
      btnText: 'Call Now',
      btnIcon: Phone,
      btnHref: `tel:${phone1.replace(/[^0-9+]/g, '')}`,
      isExternal: false,
    },
    {
      id: 'email-us',
      title: 'Email Tender Desk',
      icon: Mail,
      lines: [email, '15-min proforma turnaround'],
      btnText: 'Send Email',
      btnIcon: Mail,
      btnHref: `mailto:${email}`,
      isExternal: false,
    },
    {
      id: 'visit-us',
      title: 'Visit Central Depot',
      icon: MapPin,
      lines: [address],
      btnText: 'Google Maps Directions',
      btnIcon: MapPin,
      btnHref: googleMapsUrl,
      isExternal: true,
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Dispatch',
      icon: MessageCircle,
      lines: [
        'Direct procurement and stock availability discussion via WhatsApp.'
      ],
      btnText: 'Chat on WhatsApp',
      btnIcon: MessageCircle,
      btnHref: `https://wa.me/${whatsappDigits}?text=Hello%20KNR%20Enterprises,%20I%20would%20like%20to%20enquire%20about%20your%20products%20and%20supplies`,
      isExternal: true,
    },
  ];

  return (
    <div className="w-full bg-[#F8FAFC] text-[#111827] selection:bg-[#F57C00]/20 selection:text-[#F57C00]">
      {/* =========================================================================
          1. HERO SECTION (White + Warm Orange Eyebrow)
         ========================================================================= */}
      <section className="relative bg-gradient-to-b from-[#FFF3E0]/50 via-white to-[#F8FAFC] text-[#111827] pt-10 sm:pt-16 pb-14 sm:pb-20 border-b border-[#E2E8F0] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              {onNavigate && (
                <nav className="flex items-center space-x-2 text-xs text-[#64748B] mb-2 font-medium">
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <button
                    onClick={() => onNavigate('home')}
                    className="hover:text-[#F57C00] transition-colors cursor-pointer"
                  >
                    Home
                  </button>
                  <span>/</span>
                  <span className="text-[#111827] font-bold">Contact & Depot</span>
                </nav>
              )}

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF3E0] border border-orange-200 text-[#F57C00] text-xs font-bold tracking-wider uppercase">
                <Building className="w-3.5 h-3.5" />
                <span>FAST-TRACK PROCUREMENT DESK</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111827] tracking-tight leading-[1.12] font-display">
                Let's Discuss <br />
                <span className="text-[#F57C00]">Your Supply Requirements.</span>
              </h1>

              <p className="text-[#64748B] text-sm sm:text-base leading-relaxed max-w-xl">
                Have a wholesale product requirement or need statutory GST proforma estimates for Gram Panchayat or municipal token sanctions? Our Chevella central depot team is on standby.
              </p>
            </div>

            <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-xl border border-[#E2E8F0] bg-white p-3">
                <img
                  src={getAssetUrl('/building-knr-hq.jpg')}
                  alt="KNR Enterprises Chevella Central Depot"
                  className="w-full h-auto aspect-[16/10] object-cover rounded-2xl"
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
          2. CONTACT METHODS CARDS (4 Columns)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 pb-14 sm:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactCards.map((card) => {
            const Icon = card.icon;
            const BtnIcon = card.btnIcon;

            return (
              <div
                key={card.id}
                className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs hover:shadow-xl p-6 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-base font-bold text-[#111827] mt-4 tracking-tight font-display">
                    {card.title}
                  </h3>

                  <div className="mt-2 space-y-1">
                    {card.lines.map((line, idx) => (
                      <p
                        key={idx}
                        className="text-xs text-[#64748B] leading-relaxed"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                <a
                  href={card.btnHref}
                  target={card.isExternal ? '_blank' : undefined}
                  rel={card.isExternal ? 'noopener noreferrer' : undefined}
                  className="mt-6 w-full bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <BtnIcon className="w-4 h-4 text-white" />
                  <span>{card.btnText}</span>
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          3. TWO-COLUMN: RFQ FORM (RIGHT) + DEPOT MAP & DETAILS (LEFT)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Depot Map & Office Hours */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <div className="text-[#F57C00] font-bold text-xs uppercase tracking-wider mb-1">
                CENTRAL DEPOT FACILITY
              </div>
              <h3 className="text-xl font-bold text-[#111827] font-display">
                Location &amp; Operating Hours
              </h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                {address}
              </p>
            </div>

            {/* Interactive Map Embed / Preview */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-xs hover:shadow-md transition-shadow group cursor-pointer"
              title="Open KNR Enterprises on Google Maps"
            >
              <img
                src={getAssetUrl('/contact-map-knr.jpg')}
                alt="KNR Enterprises Chevella Location Map"
                className="w-full h-auto aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const parent = (e.target as HTMLElement).parentElement;
                  if (parent) {
                    parent.innerHTML = `<iframe src="https://maps.google.com/maps?q=HP+Petrol+Pump,+Chevella,+Telangana+501503&t=&z=14&ie=UTF8&iwloc=&output=embed" class="w-full h-64 border-0 rounded-2xl"></iframe>`;
                  }
                }}
              />
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-[#111827] text-xs font-bold px-3 py-1 rounded-lg border border-[#E2E8F0] shadow-xs flex items-center gap-1 group-hover:text-[#F57C00] transition-colors">
                <span>Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>

            {/* Timings & Key Info */}
            <div className="space-y-3 pt-2 text-xs border-t border-slate-100">
              <div className="flex items-center gap-2.5 text-[#111827]">
                <Clock className="w-4 h-4 text-[#F57C00] shrink-0" />
                <span>Mon – Sat: <strong>8:30 AM – 7:30 PM</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-[#111827]">
                <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>GSTIN Registered: <strong className="font-mono">{gstin}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Column: Fast-Track RFQ Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-10">
            <div className="mb-6">
              <span className="text-[#F57C00] font-bold text-xs uppercase tracking-wider block mb-1">
                INSTITUTIONAL TENDER &amp; WHOLESALE RFQ
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight font-display">
                Submit Your Product Requirement
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Your enquiry will be recorded directly into our depot procurement database with instant proforma estimate support.
              </p>
            </div>

            {submitSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs sm:text-sm font-semibold animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p>Enquiry submitted successfully! Reference: <strong>{submitSuccess.ref}</strong></p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Our team will verify stock and contact you within 15 minutes.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitRfq} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#111827] mb-1">
                    Officer / Contractor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    placeholder="e.g. K. Rajesh (Sarpanch / Contractor)"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#111827] mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 font-mono text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#111827] mb-1">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="panchayat.chevella@telangana.gov.in"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#111827] mb-1">
                    Organisation / Panchayat / Firm
                  </label>
                  <input
                    type="text"
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                    placeholder="e.g. Gram Panchayat Chevella"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#111827] mb-1">
                    Mandal
                  </label>
                  <input
                    type="text"
                    value={mandal}
                    onChange={(e) => setMandal(e.target.value)}
                    placeholder="e.g. Chevella Mandal"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#111827] mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Ranga Reddy / Vikarabad"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#111827] mb-1">
                  Required Wholesale Products &amp; Slabs *
                </label>
                <textarea
                  rows={3}
                  required
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Specify product items (e.g. 20 bags Grade 1 Bleaching Powder, 4 wheeled dustbins, 2 fogging machines) and target delivery timeline..."
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 text-[#111827] focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-sm py-3 px-6 rounded-xl shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit RFQ &amp; Open WhatsApp Desk</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};
