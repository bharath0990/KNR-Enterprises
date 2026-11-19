import React, { useState, useEffect } from 'react';
import { WebsiteSettings } from '../../types';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  Share2,
  BellRing,
} from 'lucide-react';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';
import { ImageUploader } from '../components/ImageUploader';

export const WebsiteSettingsPage: React.FC = () => {
  const { settings, updateSettings, isLoading } = useWebsiteSettings();

  // Form Fields
  const [websiteName, setWebsiteName] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');

  const [phonePrimary, setPhonePrimary] = useState('');
  const [phoneSecondary, setPhoneSecondary] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [depotAddress, setDepotAddress] = useState('');
  const [operatingHours, setOperatingHours] = useState('');

  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [defaultLanguage, setDefaultLanguage] = useState<'en' | 'te'>('en');
  const [announcementBannerEnabled, setAnnouncementBannerEnabled] = useState(false);
  const [announcementBannerText, setAnnouncementBannerText] = useState('');

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setWebsiteName(settings.websiteName || 'KNR Enterprises');
      setTagline(settings.tagline || 'Municipal & Industrial Wholesale Supplies');
      setLogoUrl(settings.logoUrl || '/logo.png');
      setFaviconUrl(settings.faviconUrl || '/favicon.ico');

      setPhonePrimary(settings.phonePrimary || '+91 8886175855');
      setPhoneSecondary(settings.phoneSecondary || '+91 9640195798');
      setWhatsappNumber(settings.whatsappNumber || '+91 8886175855');
      setOfficialEmail(settings.officialEmail || 'knrenterprises679@gmail.com');
      setGstin(settings.gstin || '36CUHPK5939D1ZG');
      setDepotAddress(settings.depotAddress || 'H.No: 1-77/6, Near HP Petrol Pump, Mdl & Vill Chevella, Ranga Reddy, Telangana 501503');
      setOperatingHours(settings.operatingHours || 'Mon - Sat: 8:30 AM - 7:30 PM');

      setFacebookUrl(settings.facebookUrl || 'https://facebook.com');
      setInstagramUrl(settings.instagramUrl || 'https://instagram.com');
      setLinkedinUrl(settings.linkedinUrl || 'https://linkedin.com');
      setYoutubeUrl(settings.youtubeUrl || 'https://youtube.com');

      setDefaultLanguage(settings.defaultLanguage || 'en');
      setAnnouncementBannerEnabled(settings.announcementBannerEnabled ?? false);
      setAnnouncementBannerText(settings.announcementBannerText || '');

      setMaintenanceMode(settings.maintenanceMode ?? false);
      setMaintenanceMessage(settings.maintenanceMessage || '');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const payload: Partial<WebsiteSettings> = {
        websiteName: websiteName.trim(),
        tagline: tagline.trim(),
        logoUrl: logoUrl.trim(),
        faviconUrl: faviconUrl.trim(),
        phonePrimary: phonePrimary.trim(),
        phoneSecondary: phoneSecondary.trim(),
        whatsappNumber: whatsappNumber.trim(),
        officialEmail: officialEmail.trim(),
        gstin: gstin.trim(),
        depotAddress: depotAddress.trim(),
        operatingHours: operatingHours.trim(),
        facebookUrl: facebookUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
        defaultLanguage,
        announcementBannerEnabled,
        announcementBannerText: announcementBannerText.trim(),
        maintenanceMode,
        maintenanceMessage: maintenanceMessage.trim(),
      };

      await updateSettings(payload);
      setSaveSuccessMsg('Settings updated successfully! Changes applied across public website.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      alert(`Failed to save settings: ${err}`);
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
            Website Control Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global branding, GSTIN, depot contact hotlines, announcement banner, and maintenance controls
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
          <span>Save Settings</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-700">
        {/* SECTION 1: SYSTEM CONTROLS (MAINTENANCE MODE & ANNOUNCEMENT) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>1. System Status &amp; Announcements</span>
          </h3>

          {/* Maintenance Mode Card */}
          <div
            className={`p-4 rounded-xl border transition-colors ${
              maintenanceMode
                ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">Maintenance Mode</span>
                  {maintenanceMode && (
                    <span className="bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-slate-500 leading-relaxed text-xs">
                  When enabled, public visitors will see a maintenance notice. Administrators will retain full access to this admin dashboard.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {maintenanceMode && (
              <div className="mt-3 pt-3 border-t border-rose-200/60">
                <label className="block font-bold text-xs mb-1">
                  Public Maintenance Message
                </label>
                <input
                  type="text"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="We are performing scheduled updates..."
                  className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}
          </div>

          {/* Announcement Banner Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-sm text-slate-900">
                    Website Announcement Banner
                  </span>
                </div>
                <p className="text-slate-500 text-xs">
                  Display an urgent notice at the top of the public website (e.g. monsoon supply alerts, emergency dispatch).
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={announcementBannerEnabled}
                  onChange={(e) => setAnnouncementBannerEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {announcementBannerEnabled && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">
                  Banner Text
                </label>
                <input
                  type="text"
                  value={announcementBannerText}
                  onChange={(e) => setAnnouncementBannerText(e.target.value)}
                  placeholder="e.g. Monsoon Sanitation & Vector Control Supplies in Stock at Chevella Depot..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: BRANDING & IDENTITY */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            2. Branding &amp; Identity
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Website / Enterprise Name *
              </label>
              <input
                type="text"
                required
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                placeholder="KNR Enterprises"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Municipal & Industrial Wholesale Supplies"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <ImageUploader
              value={logoUrl}
              onChange={setLogoUrl}
              label="Website Brand Logo"
              allowMultiple={false}
            />

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Default Language
              </label>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value as 'en' | 'te')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="en">English (Default)</option>
                <option value="te">తెలుగు (Telugu Default)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: STATUTORY & DEPOT CONTACT INFORMATION */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            3. Statutory Details &amp; Depot Hotlines
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Official GSTIN *
              </label>
              <input
                type="text"
                required
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="36CUHPK5939D1ZG"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Official Email *
              </label>
              <input
                type="email"
                required
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
                placeholder="knrenterprises679@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Primary Phone (Managing Partner: K. Narendar Reddy) *
              </label>
              <input
                type="text"
                required
                value={phonePrimary}
                onChange={(e) => setPhonePrimary(e.target.value)}
                placeholder="+91 8886175855"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Secondary Phone (Logistics Incharge: G. Siva)
              </label>
              <input
                type="text"
                value={phoneSecondary}
                onChange={(e) => setPhoneSecondary(e.target.value)}
                placeholder="+91 9640195798"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                WhatsApp Order Hotline *
              </label>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+91 8886175855"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Operating Hours
              </label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="Mon - Sat: 8:30 AM - 7:30 PM (Sunday Emergency Dispatch Available)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Central Depot Highway Address *
            </label>
            <input
              type="text"
              required
              value={depotAddress}
              onChange={(e) => setDepotAddress(e.target.value)}
              placeholder="H.No: 1-77/6, Near HP Petrol Pump, Mdl & Vill Chevella, Ranga Reddy, Telangana 501503"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* SECTION 4: SOCIAL MEDIA LINKS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            4. Social Media Profiles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Facebook URL
              </label>
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/knrenterprises"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/knrenterprises"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/company/knr-enterprises"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                YouTube URL
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/@knrenterprises"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
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
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

