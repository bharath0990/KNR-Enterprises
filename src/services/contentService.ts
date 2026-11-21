import {
  WebsiteSettings,
  HomepageContent,
  Testimonial,
  FAQ,
  ServiceItem,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TESTIMONIALS as DEFAULT_TESTIMONIALS, FAQS_DATA as DEFAULT_FAQS } from '../data/products';

// Storage keys for offline / initial state
const SETTINGS_KEY = 'knr_admin_website_settings';
const HOMEPAGE_KEY = 'knr_admin_homepage_content';
const TESTIMONIALS_KEY = 'knr_admin_testimonials';
const FAQS_KEY = 'knr_admin_faqs';
const SERVICES_KEY = 'knr_admin_services';

// ============================================================================
// 1. WEBSITE SETTINGS
// ============================================================================
export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  id: 'primary',
  websiteName: 'KNR Enterprises',
  tagline: 'Municipal & Industrial Wholesale Supplies',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  phonePrimary: '+91 8886175855',
  phoneSecondary: '+91 9640195798',
  whatsappNumber: '+91 8886175855',
  officialEmail: 'knrenterprises679@gmail.com',
  gstin: '36CUHPK5939D1ZG',
  depotAddress: 'H.No: 1-77/6, Near HP Petrol Pump, Mdl & Vill Chevella, Ranga Reddy, Telangana 501503',
  operatingHours: 'Mon - Sat: 8:30 AM - 7:30 PM (Sunday Emergency Dispatch Available)',
  facebookUrl: 'https://facebook.com',
  instagramUrl: 'https://instagram.com',
  linkedinUrl: 'https://linkedin.com',
  youtubeUrl: 'https://youtube.com',
  defaultLanguage: 'en',
  announcementBannerEnabled: true,
  announcementBannerText: 'Monsoon Sanitation & Vector Control Supplies in Stock at Chevella Depot. Same-Day Highway Dispatch across Telangana.',
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing scheduled maintenance. For urgent orders, please call K. Narendar Reddy (+91 8886175855) or G. Siva (+91 9640195798).',
};

export async function fetchWebsiteSettings(): Promise<WebsiteSettings> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .eq('id', 'primary')
        .single();

      if (!error && data) {
        return {
          id: data.id,
          websiteName: data.website_name,
          tagline: data.tagline,
          logoUrl: data.logo_url,
          faviconUrl: data.favicon_url,
          phonePrimary: data.phone_primary,
          phoneSecondary: data.phone_secondary,
          whatsappNumber: data.whatsapp_number,
          officialEmail: data.official_email,
          gstin: data.gstin,
          depotAddress: data.depot_address,
          operatingHours: data.operating_hours,
          facebookUrl: data.facebook_url,
          instagramUrl: data.instagram_url,
          linkedinUrl: data.linkedin_url,
          youtubeUrl: data.youtube_url,
          defaultLanguage: data.default_language,
          announcementBannerEnabled: data.announcement_banner_enabled,
          announcementBannerText: data.announcement_banner_text,
          maintenanceMode: data.maintenance_mode,
          maintenanceMessage: data.maintenance_message,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn('Could not query website settings from Supabase:', err);
    }
  }

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return DEFAULT_WEBSITE_SETTINGS;
}

export async function updateWebsiteSettings(updates: Partial<WebsiteSettings>): Promise<WebsiteSettings> {
  const current = await fetchWebsiteSettings();
  const merged: WebsiteSettings = { ...current, ...updates, updatedAt: new Date().toISOString() };

  if (isSupabaseConfigured()) {
    try {
      const dbPayload: Record<string, unknown> = {
        website_name: merged.websiteName,
        tagline: merged.tagline,
        logo_url: merged.logoUrl,
        favicon_url: merged.faviconUrl,
        phone_primary: merged.phonePrimary,
        phone_secondary: merged.phoneSecondary,
        whatsapp_number: merged.whatsappNumber,
        official_email: merged.officialEmail,
        gstin: merged.gstin,
        depot_address: merged.depotAddress,
        operating_hours: merged.operatingHours,
        facebook_url: merged.facebookUrl,
        instagram_url: merged.instagramUrl,
        linkedin_url: merged.linkedinUrl,
        youtube_url: merged.youtubeUrl,
        default_language: merged.defaultLanguage,
        announcement_banner_enabled: merged.announcementBannerEnabled,
        announcement_banner_text: merged.announcementBannerText,
        maintenance_mode: merged.maintenanceMode,
        maintenance_message: merged.maintenanceMessage,
      };

      await supabase.from('website_settings').upsert({ id: 'primary', ...dbPayload });
    } catch (err) {
      console.warn('Failed to update website settings in Supabase:', err);
    }
  }

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent('knr_settings_updated', { detail: merged }));
  return merged;
}

// ============================================================================
// 2. HOMEPAGE CONTENT
// ============================================================================
export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  id: 'primary',
  heroHeading: 'KNR Enterprises',
  heroSubheading: 'Quality Products. Trusted Partnership.',
  heroDescription: 'Your one-stop destination for premium industrial products with unmatched quality and service.',
  heroBadge: 'Building Stronger Tomorrow',
  heroBannerImage: '/hero-knr-products.jpg',
  statDepotOrders: '500+',
  statActiveClients: '100+',
  statProductLines: '8+',
  statDistricts: '33',
  showHero: true,
  showTrustStrip: true,
  showCategories: true,
  showFeaturedProducts: true,
  showAboutSection: true,
  showTestimonials: true,
  showFaqSection: true,
  aboutHeading: 'Building Trust Through Quality',
  aboutDescription: 'At KNR Enterprises, we are committed to deliver high-quality industrial products, innovative solutions and exceptional service to help your business grow.',
  aboutImage: '/building-knr-hq.jpg',
};

export async function fetchHomepageContent(): Promise<HomepageContent> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('homepage_content')
        .select('*')
        .eq('id', 'primary')
        .single();

      if (!error && data) {
        return {
          id: data.id,
          heroHeading: data.hero_heading,
          heroSubheading: data.hero_subheading,
          heroDescription: data.hero_description,
          heroBadge: data.hero_badge,
          heroBannerImage: data.hero_banner_image,
          statDepotOrders: data.stat_depot_orders,
          statActiveClients: data.stat_active_clients,
          statProductLines: data.stat_product_lines,
          statDistricts: data.stat_districts,
          showHero: data.show_hero,
          showTrustStrip: data.show_trust_strip,
          showCategories: data.show_categories,
          showFeaturedProducts: data.show_featured_products,
          showAboutSection: data.show_about_section,
          showTestimonials: data.show_testimonials,
          showFaqSection: data.show_faq_section,
          aboutHeading: data.about_heading,
          aboutDescription: data.about_description,
          aboutImage: data.about_image,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn('Could not query homepage content from Supabase:', err);
    }
  }

  try {
    const saved = localStorage.getItem(HOMEPAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return DEFAULT_HOMEPAGE_CONTENT;
}

export async function updateHomepageContent(updates: Partial<HomepageContent>): Promise<HomepageContent> {
  const current = await fetchHomepageContent();
  const merged: HomepageContent = { ...current, ...updates, updatedAt: new Date().toISOString() };

  if (isSupabaseConfigured()) {
    try {
      const dbPayload: Record<string, unknown> = {
        hero_heading: merged.heroHeading,
        hero_subheading: merged.heroSubheading,
        hero_description: merged.heroDescription,
        hero_badge: merged.heroBadge,
        hero_banner_image: merged.heroBannerImage,
        stat_depot_orders: merged.statDepotOrders,
        stat_active_clients: merged.statActiveClients,
        stat_product_lines: merged.statProductLines,
        stat_districts: merged.statDistricts,
        show_hero: merged.showHero,
        show_trust_strip: merged.showTrustStrip,
        show_categories: merged.showCategories,
        show_featured_products: merged.showFeaturedProducts,
        show_about_section: merged.showAboutSection,
        show_testimonials: merged.showTestimonials,
        show_faq_section: merged.showFaqSection,
        about_heading: merged.aboutHeading,
        about_description: merged.aboutDescription,
        about_image: merged.aboutImage,
      };

      await supabase.from('homepage_content').upsert({ id: 'primary', ...dbPayload });
    } catch (err) {
      console.warn('Failed to update homepage content in Supabase:', err);
    }
  }

  localStorage.setItem(HOMEPAGE_KEY, JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent('knr_homepage_updated', { detail: merged }));
  return merged;
}

// ============================================================================
// 3. TESTIMONIALS
// ============================================================================
function getInitialLocalTestimonials(): Testimonial[] {
  try {
    const saved = localStorage.getItem(TESTIMONIALS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }

  const seeded: Testimonial[] = DEFAULT_TESTIMONIALS.map((t) => ({
    id: `test-${t.id}`,
    name: t.name,
    role: t.role,
    location: t.location,
    verifiedBadge: t.verifiedBadge,
    quote: t.quote,
    rating: t.rating,
    avatar: t.avatar,
    displayOrder: t.id,
    isActive: true,
  }));

  try {
    localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(seeded));
  } catch {
    // ignore
  }
  return seeded;
}

export async function fetchTestimonials(options?: { activeOnly?: boolean }): Promise<Testimonial[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('testimonials').select('*').order('display_order', { ascending: true });
      if (options?.activeOnly) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        return data.map((t) => ({
          id: String(t.id),
          name: t.name,
          role: t.role,
          location: t.location,
          verifiedBadge: t.verified_badge,
          quote: t.quote,
          rating: t.rating,
          avatar: t.avatar,
          displayOrder: t.display_order,
          isActive: t.is_active,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch testimonials from Supabase:', err);
    }
  }

  const local = getInitialLocalTestimonials();
  return options?.activeOnly ? local.filter((t) => t.isActive) : local;
}

export async function createTestimonial(testimonial: Partial<Testimonial>): Promise<Testimonial> {
  const newT: Testimonial = {
    id: `test-${Date.now()}`,
    name: testimonial.name || 'Official',
    role: testimonial.role || 'Representative',
    location: testimonial.location || 'Telangana',
    verifiedBadge: testimonial.verifiedBadge || 'Verified Client',
    quote: testimonial.quote || '',
    rating: testimonial.rating || 5,
    avatar: testimonial.avatar || (testimonial.name ? testimonial.name.slice(0, 2).toUpperCase() : 'KN'),
    displayOrder: testimonial.displayOrder || 1,
    isActive: testimonial.isActive ?? true,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .insert({
          name: newT.name,
          role: newT.role,
          location: newT.location,
          verified_badge: newT.verifiedBadge,
          quote: newT.quote,
          rating: newT.rating,
          avatar: newT.avatar,
          display_order: newT.displayOrder,
          is_active: newT.isActive,
        })
        .select()
        .single();

      if (!error && data) {
        newT.id = String(data.id);
      }
    } catch (err) {
      console.warn('Failed to insert testimonial in Supabase:', err);
    }
  }

  const current = getInitialLocalTestimonials();
  const updated = [...current, newT];
  localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('knr_content_updated'));
  return newT;
}

export async function updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<Testimonial> {
  if (isSupabaseConfigured()) {
    try {
      const dbPayload: Record<string, unknown> = {};
      if (updates.name !== undefined) dbPayload.name = updates.name;
      if (updates.role !== undefined) dbPayload.role = updates.role;
      if (updates.location !== undefined) dbPayload.location = updates.location;
      if (updates.verifiedBadge !== undefined) dbPayload.verified_badge = updates.verifiedBadge;
      if (updates.quote !== undefined) dbPayload.quote = updates.quote;
      if (updates.rating !== undefined) dbPayload.rating = updates.rating;
      if (updates.avatar !== undefined) dbPayload.avatar = updates.avatar;
      if (updates.displayOrder !== undefined) dbPayload.display_order = updates.displayOrder;
      if (updates.isActive !== undefined) dbPayload.is_active = updates.isActive;

      await supabase.from('testimonials').update(dbPayload).eq('id', id);
    } catch (err) {
      console.warn('Failed to update testimonial in Supabase:', err);
    }
  }

  const current = getInitialLocalTestimonials();
  const updated = current.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
  localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('knr_content_updated'));
  return updated.find((t) => t.id === id)!;
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('testimonials').delete().eq('id', id);
    } catch (err) {
      console.warn('Failed to delete testimonial from Supabase:', err);
    }
  }

  const current = getInitialLocalTestimonials();
  const filtered = current.filter((t) => t.id !== id);
  localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('knr_content_updated'));
  return true;
}

// ============================================================================
// 4. FAQS
// ============================================================================
function getInitialLocalFaqs(): FAQ[] {
  try {
    const saved = localStorage.getItem(FAQS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }

  const seeded: FAQ[] = DEFAULT_FAQS.map((f, idx) => ({
    id: f.id,
    category: f.category,
    question: f.question,
    questionTelugu: f.questionTelugu,
    answer: f.answer,
    answerTelugu: f.questionTelugu ? f.answer : undefined,
    tags: f.tags,
    displayOrder: idx + 1,
    isActive: true,
  }));

  try {
    localStorage.setItem(FAQS_KEY, JSON.stringify(seeded));
  } catch {
    // ignore
  }
  return seeded;
}

export async function fetchFaqs(options?: { activeOnly?: boolean }): Promise<FAQ[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('faqs').select('*').order('display_order', { ascending: true });
      if (options?.activeOnly) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        return data.map((f) => ({
          id: String(f.id),
          category: f.category,
          question: f.question,
          questionTelugu: f.question_telugu,
          answer: f.answer,
          answerTelugu: f.answer_telugu,
          tags: Array.isArray(f.tags) ? f.tags : [],
          displayOrder: f.display_order,
          isActive: f.is_active,
          createdAt: f.created_at,
          updatedAt: f.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch FAQs from Supabase:', err);
    }
  }

  const local = getInitialLocalFaqs();
  return options?.activeOnly ? local.filter((f) => f.isActive) : local;
}

export async function createFaq(faq: Partial<FAQ>): Promise<FAQ> {
  const newF: FAQ = {
    id: `faq-${Date.now()}`,
    category: faq.category || 'General',
    question: faq.question || '',
    questionTelugu: faq.questionTelugu || '',
    answer: faq.answer || '',
    answerTelugu: faq.answerTelugu || '',
    tags: faq.tags || [],
    displayOrder: faq.displayOrder || 1,
    isActive: faq.isActive ?? true,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .insert({
          category: newF.category,
          question: newF.question,
          question_telugu: newF.questionTelugu,
          answer: newF.answer,
          answer_telugu: newF.answerTelugu,
          tags: newF.tags,
          display_order: newF.displayOrder,
          is_active: newF.isActive,
        })
        .select()
        .single();

      if (!error && data) {
        newF.id = String(data.id);
      }
    } catch (err) {
      console.warn('Failed to insert FAQ in Supabase:', err);
    }
  }

  const current = getInitialLocalFaqs();
  const updated = [...current, newF];
  localStorage.setItem(FAQS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('knr_content_updated'));
  return newF;
}

export async function updateFaq(id: string, updates: Partial<FAQ>): Promise<FAQ> {
  if (isSupabaseConfigured()) {
    try {
      const dbPayload: Record<string, unknown> = {};
      if (updates.category !== undefined) dbPayload.category = updates.category;
      if (updates.question !== undefined) dbPayload.question = updates.question;
      if (updates.questionTelugu !== undefined) dbPayload.question_telugu = updates.questionTelugu;
      if (updates.answer !== undefined) dbPayload.answer = updates.answer;
      if (updates.answerTelugu !== undefined) dbPayload.answer_telugu = updates.answerTelugu;
      if (updates.tags !== undefined) dbPayload.tags = updates.tags;
      if (updates.displayOrder !== undefined) dbPayload.display_order = updates.displayOrder;
      if (updates.isActive !== undefined) dbPayload.is_active = updates.isActive;

      await supabase.from('faqs').update(dbPayload).eq('id', id);
    } catch (err) {
      console.warn('Failed to update FAQ in Supabase:', err);
    }
  }

  const current = getInitialLocalFaqs();
  const updated = current.map((f) => (f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f));
  localStorage.setItem(FAQS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('knr_content_updated'));
  return updated.find((f) => f.id === id)!;
}

export async function deleteFaq(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('faqs').delete().eq('id', id);
    } catch (err) {
      console.warn('Failed to delete FAQ from Supabase:', err);
    }
  }

  const current = getInitialLocalFaqs();
  const filtered = current.filter((f) => f.id !== id);
  localStorage.setItem(FAQS_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('knr_content_updated'));
  return true;
}

// ============================================================================
// 5. SERVICES
// ============================================================================
const DEFAULT_SERVICES_LIST: ServiceItem[] = [
  {
    id: 'swachh-bharat',
    title: 'Gram Panchayat Swachh Bharat Bulk Fulfillment',
    teluguTitle: 'గ్రామ పంచాయతీ స్వచ్ఛ భారత్ బల్క్ సరఫరా',
    sla: '24-48 Hr Statewide Dispatch',
    description: 'Dedicated supply pipeline for village sanitation drives, public health drains, and Swachh Telangana initiatives. We furnish tested Grade 1 bleaching powder (33% Cl), hydrated lime, and 240L SBM wheeled waste bins directly to Mandal headquarters and Gram Panchayat bhavans.',
    features: [
      'Guaranteed minimum 33% available chlorine in factory-sealed bags',
      'Direct tractor/pickup truck unloading assistance',
      'Formal MDO & Panchayat Secretary sanction paperwork',
      'Bulk wholesale slab discounts on seasonal monsoon orders'
    ],
    icon: 'Truck',
    color: 'orange',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'vector-epidemic-response',
    title: 'Emergency Vector & Epidemic Response Supplies',
    teluguTitle: 'అత్యవసర సీజనల్ వ్యాధుల నియంత్రణ సామాగ్రి',
    sla: '4-Hour Local Emergency Dispatch',
    description: 'Rapid chemical and machinery deployment to curb seasonal malaria, dengue, and chikungunya outbreaks. We maintain ready-in-stock thermal pulse-jet fogging machines, Malathion 5% DP, and Temephos larvicides at our Chevella central highway yard for immediate dispatch.',
    features: [
      'On-call Sunday and emergency weekend dispatch service',
      'Pre-calibrated pulse-jet machines with on-site operator training',
      'Safe drinking water approved WHO/NVBDCP larvicides',
      'Immediate batch test certificate of analysis furnished'
    ],
    icon: 'ShieldAlert',
    color: 'red',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'civic-illumination',
    title: 'Civic Infrastructure & Public Illumination',
    teluguTitle: 'మున్సిపల్ మౌలిక వసతులు & వీధి దీపాలు',
    sla: 'BIS Certified / 2-Year Warranty',
    description: 'Wholesale lighting and municipal civil works supply for Gram Panchayats, gated communities, and highway townships. High-efficacy IP66 die-cast LED streetlights with 10kV surge protection engineered specifically for high-voltage rural fluctuation environments.',
    features: [
      'High efficacy Osram/Philips LED chips delivering 140 lm/W',
      'High pressure die-cast aluminium housing with IP66 seal',
      'Pre-wired for rapid standard pole clamp installation',
      'Full replacement warranty support from Chevella hub'
    ],
    icon: 'Zap',
    color: 'cyan',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'eprocurement-support',
    title: 'e-Procurement & Audit Documentation Support',
    teluguTitle: 'ఈ-ప్రొక్యూర్మెంట్ & ఆడిట్ డాక్యుమెంటేషన్',
    sla: '15-Minute Proforma Turnaround',
    description: 'We assist Sarpanches, Panchayat Secretaries, and Civil Contractors with complete statutory tender packs. From instant GST-3B compliant proforma invoices to laboratory chemical assay certificates, we ensure 100% audit-cleared procurement records.',
    features: [
      'Instant PDF proforma estimate with HSN codes & tax breakdown',
      'Full vendor pack: GSTIN, PAN, Bank Details & Trade License',
      'Assay lab test certificates for chlorine potency & polymer density',
      'Treasury token and MDO approval format compatibility'
    ],
    icon: 'FileCheck2',
    color: 'emerald',
    displayOrder: 4,
    isActive: true,
  },
];

function getInitialLocalServices(): ServiceItem[] {
  try {
    const saved = localStorage.getItem(SERVICES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_SERVICES_LIST;
}

export async function fetchServices(options?: { activeOnly?: boolean }): Promise<ServiceItem[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('services').select('*').order('display_order', { ascending: true });
      if (options?.activeOnly) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        return data.map((s) => ({
          id: String(s.id),
          title: s.title,
          teluguTitle: s.telugu_title,
          sla: s.sla,
          description: s.description,
          features: Array.isArray(s.features) ? s.features : [],
          icon: s.icon,
          color: s.color,
          displayOrder: s.display_order,
          isActive: s.is_active,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch services from Supabase:', err);
    }
  }

  const local = getInitialLocalServices();
  return options?.activeOnly ? local.filter((s) => s.isActive) : local;
}

export async function createService(service: Partial<ServiceItem>): Promise<ServiceItem> {
  const id = service.id || (service.title || 'service').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newS: ServiceItem = {
    id,
    title: service.title || 'New Service',
    teluguTitle: service.teluguTitle || '',
    sla: service.sla || '24-48 Hr Dispatch',
    description: service.description || '',
    features: service.features || [],
    icon: service.icon || 'Truck',
    color: service.color || 'blue',
    displayOrder: service.displayOrder || 1,
    isActive: service.isActive ?? true,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('services').insert({
        id: newS.id,
        title: newS.title,
        telugu_title: newS.teluguTitle,
        sla: newS.sla,
        description: newS.description,
        features: newS.features,
        icon: newS.icon,
        color: newS.color,
        display_order: newS.displayOrder,
        is_active: newS.isActive,
      });
    } catch (err) {
      console.warn('Failed to insert service in Supabase:', err);
    }
  }

  const current = getInitialLocalServices();
  const updated = [...current, newS];
  localStorage.setItem(SERVICES_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('knr_content_updated'));
  return newS;
}

export async function updateService(id: string, updates: Partial<ServiceItem>): Promise<ServiceItem> {
  if (isSupabaseConfigured()) {
    try {
      const dbPayload: Record<string, unknown> = {};
      if (updates.title !== undefined) dbPayload.title = updates.title;
      if (updates.teluguTitle !== undefined) dbPayload.telugu_title = updates.teluguTitle;
      if (updates.sla !== undefined) dbPayload.sla = updates.sla;
      if (updates.description !== undefined) dbPayload.description = updates.description;
      if (updates.features !== undefined) dbPayload.features = updates.features;
      if (updates.icon !== undefined) dbPayload.icon = updates.icon;
      if (updates.color !== undefined) dbPayload.color = updates.color;
      if (updates.displayOrder !== undefined) dbPayload.display_order = updates.displayOrder;
      if (updates.isActive !== undefined) dbPayload.is_active = updates.isActive;

      await supabase.from('services').update(dbPayload).eq('id', id);
    } catch (err) {
      console.warn('Failed to update service in Supabase:', err);
    }
  }

  const current = getInitialLocalServices();
  const updated = current.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s));
  localStorage.setItem(SERVICES_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('knr_content_updated'));
  return updated.find((s) => s.id === id)!;
}

export async function deleteService(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('services').delete().eq('id', id);
    } catch (err) {
      console.warn('Failed to delete service from Supabase:', err);
    }
  }

  const current = getInitialLocalServices();
  const filtered = current.filter((s) => s.id !== id);
  localStorage.setItem(SERVICES_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('knr_content_updated'));
  return true;
}

