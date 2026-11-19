import { InventoryLog, Product } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchProducts, updateProduct } from './productService';

const LOGS_STORAGE_KEY = 'knr_admin_inventory_logs';

function getInitialLocalLogs(): InventoryLog[] {
  try {
    const saved = localStorage.getItem(LOGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }

  const seeded: InventoryLog[] = [
    {
      id: 'log-1',
      productId: 'bleaching-powder-grade1',
      productName: 'Commercial Bleaching Powder Grade 1',
      previousStock: 0,
      newStock: 250,
      changeAmount: 250,
      changeType: 'initial_stock',
      notes: 'Initial depot warehouse consignment intake',
      createdBy: 'K. Narendar Reddy',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'log-2',
      productId: 'hdpe-wheeled-garbage-bin-240l',
      productName: 'Heavy-Duty HDPE Wheeled Garbage Bin (240L SBM)',
      previousStock: 0,
      newStock: 120,
      changeAmount: 120,
      changeType: 'initial_stock',
      notes: 'Swachh Bharat factory batch intake',
      createdBy: 'G. Siva',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'log-3',
      productId: 'heavy-thermal-fogging-machine',
      productName: 'Heavy Pulse-Jet Thermal Fogging Machine (Delta Fog)',
      previousStock: 20,
      newStock: 25,
      changeAmount: 5,
      changeType: 'shipment_received',
      notes: 'Received 5 additional SS304 units for monsoon vector hot-spots',
      createdBy: 'K. Narendar Reddy',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    // ignore
  }

  return seeded;
}

export async function fetchInventoryLogs(productId?: string): Promise<InventoryLog[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('inventory_logs')
        .select('*, products(name)')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          id: String(row.id),
          productId: String(row.product_id),
          productName: row.products && typeof row.products === 'object' && 'name' in row.products
            ? String((row.products as { name: string }).name)
            : undefined,
          previousStock: Number(row.previous_stock || 0),
          newStock: Number(row.new_stock || 0),
          changeAmount: Number(row.change_amount || 0),
          changeType: row.change_type,
          notes: String(row.notes || ''),
          createdBy: String(row.created_by || 'Admin'),
          createdAt: String(row.created_at || new Date().toISOString()),
        }));
      }
    } catch (err) {
      console.warn('Could not query inventory logs from Supabase:', err);
    }
  }

  const local = getInitialLocalLogs();
  if (productId) {
    return local.filter((l) => l.productId === productId);
  }
  return local;
}

/**
 * Adjust product stock quantity and record an audit log entry
 */
export async function adjustStock(
  productId: string,
  newStockQuantity: number,
  changeType: InventoryLog['changeType'] = 'manual_adjustment',
  notes: string = '',
  adminName: string = 'Depot Admin'
): Promise<Product> {
  const products = await fetchProducts();
  const target = products.find((p) => p.id === productId);
  if (!target) throw new Error(`Product not found: ${productId}`);

  const previousStock = target.stockQuantity ?? 0;
  const newStock = Math.max(0, newStockQuantity);
  const changeAmount = newStock - previousStock;
  const inStock = newStock > 0;

  // 1. Update product stock in database
  const updated = await updateProduct(productId, {
    stockQuantity: newStock,
    inStock: inStock,
  });

  // 2. Insert audit log
  const newLog: InventoryLog = {
    id: `log-${Date.now()}`,
    productId,
    productName: target.name,
    previousStock,
    newStock,
    changeAmount,
    changeType,
    notes,
    createdBy: adminName,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('inventory_logs').insert({
        product_id: productId,
        previous_stock: previousStock,
        new_stock: newStock,
        change_amount: changeAmount,
        change_type: changeType,
        notes,
        created_by: adminName,
      });
    } catch (err) {
      console.warn('Failed to insert inventory log in Supabase:', err);
    }
  }

  // Save to local logs
  const currentLogs = getInitialLocalLogs();
  const updatedLogs = [newLog, ...currentLogs];
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
  window.dispatchEvent(new CustomEvent('knr_inventory_updated'));

  return updated;
}

