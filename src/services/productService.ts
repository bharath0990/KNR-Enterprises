import { Product } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PRODUCTS as INITIAL_SEED_PRODUCTS } from '../data/products';

const PRODUCTS_STORAGE_KEY = 'knr_admin_products_store';
const PRICE_OVERRIDES_KEY = 'knr_dynamic_product_prices';

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  inStock: boolean;
  category: string;
  image: string;
  moq?: number;
}

// Convert DB row to frontend Product model
function mapDbProduct(row: Record<string, unknown>): Product {
  const specs = Array.isArray(row.specifications)
    ? (row.specifications as string[])
    : typeof row.specifications === 'string'
    ? JSON.parse(row.specifications)
    : [];

  const features = Array.isArray(row.features)
    ? (row.features as string[])
    : typeof row.features === 'string'
    ? JSON.parse(row.features)
    : [];

  const certifications = Array.isArray(row.certifications)
    ? (row.certifications as string[])
    : typeof row.certifications === 'string'
    ? JSON.parse(row.certifications)
    : [];

  return {
    id: String(row.id),
    name: String(row.name || ''),
    teluguName: String(row.telugu_name || row.name || ''),
    categoryId: row.category_id ? String(row.category_id) : undefined,
    category: String(row.category || 'General'),
    categoryTelugu: String(row.category_telugu || row.category || 'General'),
    sku: row.sku ? String(row.sku) : undefined,
    hsnCode: String(row.hsn_code || '3808.91'),
    price: Number(row.price || 0),
    originalPrice: Number(row.original_price || row.price || 0),
    discountPercent: Number(row.discount_percent || 0),
    gstPercent: Number(row.gst_percent || 18),
    unit: String(row.unit || 'Unit'),
    moq: Number(row.moq || 1),
    moqDescription: String(row.moq_description || `${row.moq || 1} ${row.unit || 'Unit'}`),
    stockQuantity: Number(row.stock_quantity ?? 100),
    lowStockThreshold: Number(row.low_stock_threshold ?? 10),
    inStock: Boolean(row.in_stock ?? true),
    badge: row.badge ? String(row.badge) : undefined,
    badgeColor: row.badge_color ? String(row.badge_color) : 'orange',
    image: String(row.image || '/hero-knr-products.jpg'),
    rating: Number(row.rating || 4.8),
    reviewCount: Number(row.review_count || 0),
    specifications: specs,
    features: features,
    certifications: certifications,
    description: String(row.description || ''),
    descriptionTelugu: row.description_telugu ? String(row.description_telugu) : undefined,
    brand: String(row.brand || 'KNR Enterprises'),
    isFeatured: Boolean(row.is_featured ?? false),
    isBestseller: Boolean(row.is_bestseller ?? false),
    isActive: Boolean(row.is_active ?? true),
    viewCount: Number(row.view_count || 0),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

// Map frontend Product model to Supabase DB row format
function mapProductToDb(prod: Partial<Product>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (prod.id !== undefined) row.id = prod.id;
  if (prod.name !== undefined) row.name = prod.name;
  if (prod.teluguName !== undefined) row.telugu_name = prod.teluguName;
  if (prod.categoryId !== undefined) row.category_id = prod.categoryId;
  if (prod.category !== undefined) row.category = prod.category;
  if (prod.categoryTelugu !== undefined) row.category_telugu = prod.categoryTelugu;
  if (prod.sku !== undefined) row.sku = prod.sku;
  if (prod.hsnCode !== undefined) row.hsn_code = prod.hsnCode;
  if (prod.price !== undefined) row.price = prod.price;
  if (prod.originalPrice !== undefined) row.original_price = prod.originalPrice;
  if (prod.discountPercent !== undefined) row.discount_percent = prod.discountPercent;
  if (prod.gstPercent !== undefined) row.gst_percent = prod.gstPercent;
  if (prod.unit !== undefined) row.unit = prod.unit;
  if (prod.moq !== undefined) row.moq = prod.moq;
  if (prod.moqDescription !== undefined) row.moq_description = prod.moqDescription;
  if (prod.stockQuantity !== undefined) row.stock_quantity = prod.stockQuantity;
  if (prod.lowStockThreshold !== undefined) row.low_stock_threshold = prod.lowStockThreshold;
  if (prod.inStock !== undefined) row.in_stock = prod.inStock;
  if (prod.badge !== undefined) row.badge = prod.badge;
  if (prod.badgeColor !== undefined) row.badge_color = prod.badgeColor;
  if (prod.image !== undefined) row.image = prod.image;
  if (prod.rating !== undefined) row.rating = prod.rating;
  if (prod.reviewCount !== undefined) row.review_count = prod.reviewCount;
  if (prod.specifications !== undefined) row.specifications = prod.specifications;
  if (prod.features !== undefined) row.features = prod.features;
  if (prod.certifications !== undefined) row.certifications = prod.certifications;
  if (prod.description !== undefined) row.description = prod.description;
  if (prod.descriptionTelugu !== undefined) row.description_telugu = prod.descriptionTelugu;
  if (prod.brand !== undefined) row.brand = prod.brand;
  if (prod.isFeatured !== undefined) row.is_featured = prod.isFeatured;
  if (prod.isBestseller !== undefined) row.is_bestseller = prod.isBestseller;
  if (prod.isActive !== undefined) row.is_active = prod.isActive;
  if (prod.viewCount !== undefined) row.view_count = prod.viewCount;
  return row;
}

// Local cache/store helper
function getInitialLocalProducts(): Product[] {
  try {
    const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }

  // Seed with INITIAL_SEED_PRODUCTS
  const seeded = INITIAL_SEED_PRODUCTS.map((p) => ({
    ...p,
    stockQuantity: p.id.includes('dustbin') ? 120 : p.id.includes('fogging') ? 25 : 200,
    lowStockThreshold: 10,
    inStock: p.inStock ?? true,
    isActive: true,
    isFeatured: ['bleaching-powder-grade1', 'hdpe-wheeled-garbage-bin-240l', 'heavy-thermal-fogging-machine'].includes(p.id),
    isBestseller: ['bleaching-powder-grade1', 'malathion-5dp-insecticide'].includes(p.id),
  }));

  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    // ignore
  }

  return seeded;
}

/**
 * Fetch all products (for Admin: all; for public: filtered by active unless specified)
 */
export async function fetchProducts(options?: { activeOnly?: boolean }): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      if (options?.activeOnly) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbProduct);
        // Cache to local store
        try {
          localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Could not query Supabase products, using local store:', err);
    }
  }

  const local = getInitialLocalProducts();
  if (options?.activeOnly) {
    return local.filter((p) => p.isActive !== false);
  }
  return local;
}

/**
 * Fetch single product by ID
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        return mapDbProduct(data);
      }
    } catch {
      // fallback
    }
  }

  const local = getInitialLocalProducts();
  return local.find((p) => p.id === id) || null;
}

/**
 * Create a new product in the database
 */
export async function createProduct(prod: Partial<Product>): Promise<Product> {
  const generatedId =
    prod.id ||
    (prod.name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
      '-' +
      Math.floor(100 + Math.random() * 900);

  const newProduct: Product = {
    id: generatedId,
    name: prod.name || 'New Product',
    teluguName: prod.teluguName || prod.name || 'నూతన ఉత్పత్తి',
    categoryId: prod.categoryId,
    category: prod.category || 'Disinfectants & Chemicals',
    categoryTelugu: prod.categoryTelugu || prod.category || 'క్రిమిసంహారకాలు & రసాయనాలు',
    sku: prod.sku || `KNR-${Math.floor(1000 + Math.random() * 9000)}`,
    hsnCode: prod.hsnCode || '3808.91',
    price: Number(prod.price || 0),
    originalPrice: Number(prod.originalPrice || prod.price || 0),
    discountPercent: Number(prod.discountPercent || 0),
    gstPercent: Number(prod.gstPercent || 18),
    unit: prod.unit || 'unit',
    moq: Number(prod.moq || 1),
    moqDescription: prod.moqDescription || `${prod.moq || 1} ${prod.unit || 'unit'}`,
    stockQuantity: Number(prod.stockQuantity ?? 100),
    lowStockThreshold: Number(prod.lowStockThreshold ?? 10),
    inStock: Boolean(prod.inStock ?? true),
    badge: prod.badge || '',
    badgeColor: prod.badgeColor || 'orange',
    image: prod.image || '/hero-knr-products.jpg',
    rating: Number(prod.rating || 4.8),
    reviewCount: Number(prod.reviewCount || 1),
    specifications: prod.specifications || [],
    features: prod.features || [],
    certifications: prod.certifications || [],
    description: prod.description || '',
    descriptionTelugu: prod.descriptionTelugu || '',
    brand: prod.brand || 'KNR Enterprises',
    isFeatured: Boolean(prod.isFeatured ?? false),
    isBestseller: Boolean(prod.isBestseller ?? false),
    isActive: Boolean(prod.isActive ?? true),
    viewCount: 0,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const dbRow = mapProductToDb(newProduct);
      const { data, error } = await supabase
        .from('products')
        .insert(dbRow)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (data) {
        // Log initial stock in inventory_logs
        await supabase.from('inventory_logs').insert({
          product_id: newProduct.id,
          previous_stock: 0,
          new_stock: newProduct.stockQuantity || 100,
          change_amount: newProduct.stockQuantity || 100,
          change_type: 'initial_stock',
          notes: 'Product created via Admin Dashboard',
          created_by: 'Administrator',
        });
        const mapped = mapDbProduct(data);
        syncToLocalStore(mapped, 'add');
        return mapped;
      }
    } catch (err) {
      console.warn('Failed to insert product in Supabase, using local fallback:', err);
    }
  }

  syncToLocalStore(newProduct, 'add');
  return newProduct;
}

/**
 * Update existing product
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  if (isSupabaseConfigured()) {
    try {
      const dbPayload = mapProductToDb(updates);
      delete dbPayload.id; // do not update primary key
      const { data, error } = await supabase
        .from('products')
        .update(dbPayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (data) {
        const mapped = mapDbProduct(data);
        syncToLocalStore(mapped, 'update');
        return mapped;
      }
    } catch (err) {
      console.warn('Failed to update product in Supabase, using local fallback:', err);
    }
  }

  const current = getInitialLocalProducts();
  const existing = current.find((p) => p.id === id);
  if (!existing) throw new Error(`Product not found: ${id}`);
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  syncToLocalStore(updated, 'update');
  return updated;
}

/**
 * Delete product safely
 */
export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMsg };
    }
  }

  const current = getInitialLocalProducts();
  const filtered = current.filter((p) => p.id !== id);
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('knr_products_updated'));
  window.dispatchEvent(new CustomEvent('knr_product_price_updated'));
  return { success: true };
}

/**
 * Activate or deactivate product
 */
export async function toggleProductStatus(id: string, isActive: boolean): Promise<Product> {
  return updateProduct(id, { isActive });
}

/**
 * Duplicate an existing product
 */
export async function duplicateProduct(id: string): Promise<Product> {
  const source = await fetchProductById(id);
  if (!source) throw new Error(`Source product not found: ${id}`);

  const duplicateData: Partial<Product> = {
    ...source,
    id: undefined, // will generate unique ID
    name: `${source.name} (Copy)`,
    teluguName: `${source.teluguName} (కాపీ)`,
    sku: `${source.sku || 'SKU'}-COPY-${Math.floor(100 + Math.random() * 900)}`,
  };

  return createProduct(duplicateData);
}

// Local helper to sync state & dispatch events
function syncToLocalStore(product: Product, action: 'add' | 'update') {
  const current = getInitialLocalProducts();
  let updatedList: Product[];
  if (action === 'add') {
    updatedList = [product, ...current];
  } else {
    updatedList = current.map((p) => (p.id === product.id ? product : p));
  }
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedList));
  window.dispatchEvent(new CustomEvent('knr_products_updated', { detail: { product } }));
  window.dispatchEvent(new CustomEvent('knr_product_price_updated', {
    detail: { productId: product.id, newPrice: product.price },
  }));
}

// ============================================================================
// BACKWARD COMPATIBILITY FUNCTIONS (Preserved for existing public views & cart)
// ============================================================================

export function getCatalogProducts(): CatalogItem[] {
  try {
    const products = getInitialLocalProducts();
    const savedOverrides = localStorage.getItem(PRICE_OVERRIDES_KEY);
    const overrides: Record<string, number> = savedOverrides ? JSON.parse(savedOverrides) : {};

    return products.map((prod) => ({
      id: prod.id,
      name: prod.name,
      description: prod.description,
      price: typeof overrides[prod.id] === 'number' ? overrides[prod.id] : prod.price,
      unit: prod.unit.startsWith('/') ? prod.unit : `/${prod.unit}`,
      inStock: prod.inStock,
      category: prod.category,
      image: prod.image,
    }));
  } catch (err) {
    console.warn('Could not read catalog items:', err);
    return [];
  }
}

export function updateProductPrice(productId: string, newPrice: number): void {
  try {
    const saved = localStorage.getItem(PRICE_OVERRIDES_KEY);
    const overrides: Record<string, number> = saved ? JSON.parse(saved) : {};
    overrides[productId] = newPrice;
    localStorage.setItem(PRICE_OVERRIDES_KEY, JSON.stringify(overrides));

    // Also update in products store
    const products = getInitialLocalProducts();
    const match = products.find((p) => p.id === productId);
    if (match) {
      match.price = newPrice;
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    }

    window.dispatchEvent(new CustomEvent('knr_product_price_updated', {
      detail: { productId, newPrice },
    }));
    window.dispatchEvent(new CustomEvent('knr_products_updated'));
  } catch (err) {
    console.error('Failed to update product price:', err);
  }
}

export function resetProductPrices(): void {
  localStorage.removeItem(PRICE_OVERRIDES_KEY);
  window.dispatchEvent(new CustomEvent('knr_product_price_updated'));
  window.dispatchEvent(new CustomEvent('knr_products_updated'));
}

export function formatINR(price: number): string {
  return '₹' + price.toLocaleString('en-IN');
}

export function catalogItemToProduct(item: CatalogItem): Product {
  const cleanUnit = item.unit.replace(/^\//, '').trim() || 'Unit';
  return {
    id: item.id,
    name: item.name,
    teluguName: item.name,
    category: item.category,
    categoryTelugu: item.category,
    badge: 'In Stock',
    badgeColor: 'emerald',
    image: item.image,
    price: item.price,
    originalPrice: item.price,
    discountPercent: 0,
    unit: cleanUnit,
    moq: 1,
    moqDescription: `1 ${cleanUnit}`,
    hsnCode: '3808.91',
    rating: 4.8,
    reviewCount: 32,
    inStock: item.inStock,
    specifications: [item.description],
    description: item.description,
  };
}
