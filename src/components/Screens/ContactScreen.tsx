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
} from 'lucide-react';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';
import { submitRfqEnquiry } from '../../services/enquiryService';

interface ContactScreenProps {
  onNavigate: (screen: Screen) => void;
  language?: Language;
}

export const ContactScreen: React.FC<ContactScreenProps> = () => {
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
      title: 'Call Us',
      icon: Phone,
      lines: [phone1, phone2],
      btnText: 'Call Now',
      btnIcon: Phone,
      btnHref: `tel:${phone1.replace(/[^0-9+]/g, '')}`,
      isExternal: false,
    },
    {
      id: 'email-us',
      title: 'Email Us',
      icon: Mail,
      lines: [email],
      btnText: 'Send Email',
      btnIcon: Mail,
      btnHref: `mailto:${email}`,
      isExternal: false,
    },
    {
      id: 'visit-us',
      title: 'Visit Us',
      icon: MapPin,
      lines: [address],
      btnText: 'Get Directions',
      btnIcon: MapPin,
      btnHref: googleMapsUrl,
      isExternal: true,
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      icon: MessageCircle,
      lines: [
        'Contact KNR Enterprises directly for product enquiries and tender discussions.'
      ],
      btnText: 'Chat on WhatsApp',
      btnIcon: MessageCircle,
      btnHref: `https://wa.me/${whatsappDigits}?text=Hello%20KNR%20Enterprises,%20I%20would%20like%20to%20enquire%20about%20your%20products%20and%20supplies`,
      isExternal: true,
    },
  ];

  return (
    <div className="w-full bg-[#f8f9fc] text-slate-900 selection:bg-orange-500/20 selection:text-orange-600">
      {/* =========================================================================
          1. HERO SECTION
         ========================================================================= */}
      <section className="relative bg-[#0a0e17] text-white pt-8 sm:pt-12 pb-16 sm:pb-20 border-b border-slate-800/80 overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-3.5 text-left">
              <div className="text-orange-400 font-bold text-xs sm:text-sm tracking-wider uppercase">
                GET IN TOUCH
              </div>

              <h1 className="text-2xl min-[360px]:text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
                Let's Connect and<br />
                Discuss <span className="text-orange-500">Your Requirements.</span>
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed max-w-lg pt-1">
                Have a wholesale product requirement or need statutory GST proforma estimates for Gram Panchayat or municipal token sanctions?
              </p>
            </div>

            <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900">
                <img
                  src="/building-knr-hq.jpg"
                  alt="KNR Enterprises Chevella Central Depot"
                  className="w-full h-auto aspect-[16/10] object-cover"
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
          2. CONTACT METHODS CARDS
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {contactCards.map((card) => {
            const Icon = card.icon;
            const BtnIcon = card.btnIcon;

            return (
              <div
                key={card.id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-2xl hover:border-slate-300 transition-all group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#0f172a] mt-4 tracking-tight">
                    {card.title}
                  </h3>

                  <div className="mt-2 space-y-1">
                    {card.lines.map((line, idx) => (
                      <p
                        key={idx}
                        className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${
                          card.id === 'call-us' ? 'font-semibold text-slate-800' : ''
                        } ${card.id === 'email-us' ? 'break-all font-medium' : ''}`}
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
                  className="mt-5 w-full min-h-[44px] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                >
                  <BtnIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  <span>{card.btnText}</span>
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          3. INSTITUTIONAL PROCUREMENT RFQ FORM SECTION
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-orange-500 font-bold text-xs uppercase tracking-wider block mb-1">
                Direct Tender &amp; Wholesale RFQ
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Submit Your Product Requirement
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Your enquiry will be recorded directly into our depot procurement database with instant proforma estimate support
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
                  <label className="block font-bold text-slate-700 mb-1">
                    Officer / Contractor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    placeholder="e.g. K. Rajesh (Sarpanch / Contractor)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="panchayat.chevella@telangana.gov.in"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Organisation / Panchayat / Firm
                  </label>
                  <input
                    type="text"
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                    placeholder="e.g. Gram Panchayat Chevella"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mandal
                  </label>
                  <input
                    type="text"
                    value={mandal}
                    onChange={(e) => setMandal(e.target.value)}
                    placeholder="e.g. Chevella Mandal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Ranga Reddy / Vikarabad"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Required Wholesale Products &amp; Slabs *
                </label>
                <textarea
                  rows={3}
                  required
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Specify product items (e.g. 20 bags Grade 1 Bleaching Powder, 4 wheeled dustbins, 2 fogging machines) and target delivery timeline..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
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

      {/* =========================================================================
          4. FIND US / LOCATION SECTION
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center">
                <span className="w-1.5 h-7 bg-orange-500 rounded-full inline-block mr-2.5" />
                <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
                  Find Our Depot
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm pt-1">
                {address}
              </p>

              <div className="pt-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-xs"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Get Directions</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-7">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                title="Open KNR Enterprises on Google Maps"
              >
                <img
                  src="/contact-map-knr.jpg"
                  alt="KNR Enterprises Chevella Location Map"
                  className="w-full h-auto aspect-[16/9] object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent) {
                      parent.innerHTML = `<iframe src="https://maps.google.com/maps?q=HP+Petrol+Pump,+Chevella,+Telangana+501503&t=&z=14&ie=UTF8&iwloc=&output=embed" class="w-full h-64 border-0 rounded-2xl"></iframe>`;
                    }
                  }}
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1 group-hover:text-orange-600 transition-colors">
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. BUSINESS DETAILS STRIP
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-16">
        <div className="border-t border-slate-200/80 pt-8 sm:pt-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5 space-y-2">
              <span className="text-orange-500 font-bold text-xs uppercase tracking-wider block">
                Business Details
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">
                {settings?.websiteName || 'KNR ENTERPRISES'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                A trusted supplier of industrial, municipal, sanitation, chemical and infrastructure-related supplies.
              </p>
              <div className="w-12 h-0.5 bg-orange-500 rounded-full mt-2" />
            </div>

            <div className="md:col-span-4 flex items-start gap-3.5 md:border-l md:border-slate-200 md:pl-8">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-sm text-[#0f172a]">
                  Contact Persons
                </h5>
                <div className="text-xs text-slate-600 font-medium leading-relaxed pt-0.5">
                  <p>K. Narendar Reddy ({phone1})</p>
                  <p>G. Siva ({phone2})</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 flex items-start gap-3.5 md:border-l md:border-slate-200 md:pl-8">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 text-orange-500" />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-sm text-[#0f172a]">
                  GSTIN
                </h5>
                <p className="text-xs font-mono font-bold text-slate-700 tracking-wide pt-0.5">
                  {gstin}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
