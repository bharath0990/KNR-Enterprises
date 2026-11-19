export type Screen = 'home' | 'products' | 'services' | 'about' | 'faqs' | 'contact';

export type Language = 'en' | 'te';

export type AdminTab = 
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'enquiries'
  | 'customers'
  | 'analytics'
  | 'website-content'
  | 'content'
  | 'testimonials'
  | 'faqs'
  | 'services'
  | 'website-settings'
  | 'settings'
  | 'admin-profile';

export interface Product {
  id: string;
  name: string;
  teluguName: string;
  categoryId?: string;
  category: string;
  categoryTelugu: string;
  sku?: string;
  badge?: string;
  badgeColor?: string;
  image: string;
  galleryImages?: string[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  gstPercent?: number;
  unit: string;
  moq: number;
  moqDescription: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  hsnCode: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  specifications: string[];
  features?: string[];
  certifications?: string[];
  description: string;
  descriptionTelugu?: string;
  brand?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isActive?: boolean;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  teluguName: string;
  description?: string;
  image?: string;
  displayOrder: number;
  isActive: boolean;
  count?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName?: string;
  previousStock: number;
  newStock: number;
  changeAmount: number;
  changeType: 'manual_adjustment' | 'shipment_received' | 'damaged' | 'audit_correction' | 'initial_stock';
  notes: string;
  createdBy: string;
  createdAt: string;
}

export type EnquiryStatus = 
  | 'New' 
  | 'Contacted' 
  | 'Quotation Preparing' 
  | 'Quotation Sent' 
  | 'Negotiation' 
  | 'Order Confirmed' 
  | 'Lost' 
  | 'Approved' 
  | 'Rejected' 
  | 'Completed';

export interface EnquiryItem {
  id?: string;
  enquiryId?: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  hsnCode?: string;
  totalPrice: number;
}

export interface CustomerEnquiry {
  id: string;
  enquiryNumber: string;
  customerName: string;
  mobileNumber: string;
  email?: string;
  organisation?: string;
  designation?: string;
  mandal?: string;
  district?: string;
  state: string;
  address?: string;
  city?: string;
  pincode?: string;
  deliveryInstructions?: string;
  expectedDeliveryDate?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  gstin?: string;
  followUpDate?: string;
  status: EnquiryStatus;
  notes?: string;
  internalNotes?: string;
  subtotal: number;
  estimatedGst: number;
  totalAmount: number;
  source: string;
  items?: EnquiryItem[];
  createdAt: string;
  updatedAt?: string;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Revised' | 'Accepted' | 'Declined' | 'Expired';

export interface Quotation {
  id: string;
  quotationNumber: string;
  enquiryId?: string;
  customerName: string;
  mobileNumber: string;
  email: string;
  organisation: string;
  gstin: string;
  deliveryAddress: string;
  placeOfSupply: string;
  taxType: 'INTRA_STATE' | 'INTER_STATE';
  subtotal: number;
  discountAmount: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
  transportCharges: number;
  packagingCharges: number;
  otherCharges: number;
  grandTotal: number;
  amountInWords: string;
  validityDate: string;
  paymentTerms: string;
  deliveryTerms: string;
  warrantyTerms: string;
  notes: string;
  termsAndConditions: string;
  status: QuotationStatus;
  version: number;
  items?: QuotationItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId?: string;
  productName: string;
  sku?: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  taxableValue: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalPrice: number;
  notes?: string;
  createdAt?: string;
}

export interface EnquiryStatusHistoryItem {
  id: string;
  enquiryId: string;
  previousStatus?: string;
  newStatus: string;
  notes?: string;
  updatedBy: string;
  createdAt: string;
}

export interface CommunicationLogItem {
  id: string;
  enquiryId: string;
  quotationId?: string;
  channel: 'whatsapp' | 'email' | 'phone' | 'in_person';
  recipient: string;
  subject?: string;
  messagePreview?: string;
  status: 'not_shared' | 'shared_manually' | 'sent' | 'delivered' | 'failed';
  errorDetails?: string;
  sentBy: string;
  createdAt: string;
}

export interface ConfirmedOrder {
  id: string;
  orderNumber: string;
  enquiryId?: string;
  quotationId?: string;
  customerName: string;
  mobileNumber: string;
  email?: string;
  organisation?: string;
  deliveryAddress?: string;
  totalAmount: number;
  agreedQuantitiesSummary?: string;
  status: 'Confirmed' | 'Dispatched' | 'Completed' | 'Cancelled';
  createdBy: string;
  createdAt: string;
}

export interface RfqSubmissionPayload {
  customerName: string;
  mobileNumber: string;
  email: string;
  organisation: string;
  department?: string;
  gstin?: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  deliveryInstructions?: string;
  expectedDeliveryDate?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  notes?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  verifiedBadge: string;
  quote: string;
  rating: number;
  avatar?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  questionTelugu?: string;
  answer: string;
  answerTelugu?: string;
  tags: string[];
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  teluguTitle?: string;
  sla: string;
  description: string;
  features: string[];
  icon?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebsiteSettings {
  id: string;
  websiteName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  phonePrimary: string;
  phoneSecondary?: string;
  whatsappNumber: string;
  officialEmail: string;
  gstin: string;
  depotAddress: string;
  operatingHours: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  defaultLanguage: Language;
  announcementBannerEnabled: boolean;
  announcementBannerText?: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  updatedAt?: string;
}

export interface HomepageContent {
  id: string;
  heroHeading: string;
  heroSubheading: string;
  heroDescription: string;
  heroBadge: string;
  heroBannerImage: string;
  statDepotOrders: string;
  statActiveClients: string;
  statProductLines: string;
  statDistricts: string;
  showHero: boolean;
  showTrustStrip: boolean;
  showCategories: boolean;
  showFeaturedProducts: boolean;
  showAboutSection: boolean;
  showTestimonials: boolean;
  showFaqSection: boolean;
  aboutHeading: string;
  aboutDescription: string;
  aboutImage: string;
  updatedAt?: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'manager';
  avatarUrl?: string;
  phone?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ProformaInvoiceData {
  invoiceNumber: string;
  date: string;
  panchayatName: string;
  officerName: string;
  designation: string;
  mandal: string;
  district: string;
  state: string;
  phone: string;
  email: string;
  buyerGstin: string;
  deliveryTimeline: string;
  transportMode: string;
  notes: string;
}

export interface CatalogFilterState {
  category: string;
  searchQuery: string;
  maxPrice: number;
  inStockOnly: boolean;
  moqTier: string;
  minRating: number;
  sortBy: 'popularity' | 'price-asc' | 'price-desc' | 'rating';
}

export type RealtimeConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'rfq' | 'contact' | 'product' | 'inventory' | 'status';
  timestamp: string;
  read: boolean;
  referenceId?: string;
  referenceTab?: AdminTab;
  customerName?: string;
  amount?: number;
}
