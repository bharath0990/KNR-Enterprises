import { Category, Product } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../data/products';

const CATEGORIES_STORAGE_KEY = 'knr_admin_categories_store';

// Helper to map DB row to frontend Category model
function mapDbCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    teluguName: String(row.telugu_name || ''),
    description: String(row.description || ''),
    image: String(row.image || ''),
    displayOrder: Number(row.display_order || 0),
    isActive: Boolean(row.is_active ?? true),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

// Initial in-memory/localStorage seed
function getInitialLocalCategories(): Category[] {
  try {
    const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }

  const seeded: Category[] = DEFAULT_CATEGORIES.map((cat, idx) => ({
    id: cat.id,
    name: cat.name,
    teluguName: cat.teluguName,
    description: cat.description,
    image: cat.image,
    displayOrder: idx + 1,
    isActive: true,
    count: cat.count,
  }));

  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    // ignore
  }

  return seeded;
}

export async function fetchCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      if (data) {
        // Fetch active products to compute real, synchronized assigned product counts
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('id, category, category_id, is_active');

        if (prodErr) {
          console.warn('Could not query products for category counts:', prodErr);
        }

        const counts: Record<string, number> = {};
        // Initialize counts to 0 for all categories
        data.forEach((row) => {
          counts[String(row.id)] = 0;
        });

        if (prodData && prodData.length > 0) {
          prodData.forEach((p) => {
            if (p.is_active === false) return; // count only active products
            const prodCatId = String(p.category_id || '');
            const prodCatName = String(p.category || '');

            // Find matching category by ID or Name
            const matched = data.find(
              (c) =>
                c.id === prodCatId ||
                c.id === prodCatName ||
                c.name.toLowerCase() === prodCatName.toLowerCase() ||
                (c.name && prodCatId && c.name.toLowerCase() === prodCatId.toLowerCase())
            );

            if (matched) {
              counts[matched.id] = (counts[matched.id] || 0) + 1;
            }
          });
        }

        const mapped = data.map((row) => {
          const cat = mapDbCategory(row);
          cat.count = counts[cat.id] || 0;
          return cat;
        });

        try {
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Falling back to local categories:', err);
    }
  }

  return getInitialLocalCategories();
}

/**
 * Fetch all active products assigned to a specific category
 */
export async function fetchProductsByCategory(categoryId: string, categoryName?: string): Promise<Partial<Product>[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data: catRow } = await supabase
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .maybeSingle();

      const nameToMatch = categoryName || catRow?.name || categoryId;

      let query = supabase
        .from('products')
        .select('id, name, telugu_name, category, category_id, sku, price, in_stock, is_active, image')
        .or(`category_id.eq."${categoryId}",category.eq."${nameToMatch}",category.eq."${categoryId}"`)
        .order('name');

      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        return data.map((p) => ({
          id: p.id,
          name: p.name,
          teluguName: p.telugu_name,
          category: p.category,
          categoryId: p.category_id,
          sku: p.sku,
          price: Number(p.price || 0),
          inStock: p.in_stock,
          isActive: p.is_active,
          image: p.image,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch products for category:', err);
    }
  }
  return [];
}

export async function createCategory(cat: Omit<Category, 'id'> & { id?: string }): Promise<Category> {
  const slug =
    cat.id ||
    cat.name
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const newCat: Category = {
    id: slug,
    name: cat.name.trim(),
    teluguName: cat.teluguName?.trim() || cat.name.trim(),
    description: cat.description?.trim() || '',
    image: cat.image?.trim() || '',
    displayOrder: Number(cat.displayOrder) || 1,
    isActive: cat.isActive ?? true,
    createdAt: new Date().toISOString(),
    count: 0,
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        id: newCat.id,
        name: newCat.name,
        telugu_name: newCat.teluguName,
        description: newCat.description,
        image: newCat.image,
        display_order: newCat.displayOrder,
        is_active: newCat.isActive,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }
    if (data) {
      window.dispatchEvent(new CustomEvent('knr_categories_updated'));
      return { ...mapDbCategory(data), count: 0 };
    }
  }

  // Update local storage
  const current = getInitialLocalCategories();
  const updated = [...current, newCat];
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('knr_categories_updated'));
  return newCat;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  if (isSupabaseConfigured()) {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.teluguName !== undefined) payload.telugu_name = updates.teluguName.trim();
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.image !== undefined) payload.image = updates.image.trim();
    if (updates.displayOrder !== undefined) payload.display_order = Number(updates.displayOrder);
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
    if (data) {
      window.dispatchEvent(new CustomEvent('knr_categories_updated'));
      return mapDbCategory(data);
    }
  }

  const current = getInitialLocalCategories();
  const updated = current.map((c) => (c.id === id ? { ...c, ...updates } : c));
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('knr_categories_updated'));
  return updated.find((c) => c.id === id)!;
}

/**
 * Sequential reordering of categories (1, 2, 3...)
 */
export async function reorderCategories(orderedIds: string[]): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const updates = orderedIds.map((id, index) =>
        supabase
          .from('categories')
          .update({ display_order: index + 1 })
          .eq('id', id)
      );
      await Promise.all(updates);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to reorder categories: ${msg}`);
    }
  }

  const current = getInitialLocalCategories();
  const updated = current.map((c) => {
    const idx = orderedIds.indexOf(c.id);
    return idx !== -1 ? { ...c, displayOrder: idx + 1 } : c;
  });
  updated.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('knr_categories_updated'));
  return true;
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      // Check if products exist in this category (check both category_id and category name)
      const { data: catRow } = await supabase
        .from('categories')
        .select('name')
        .eq('id', id)
        .maybeSingle();

      const catName = catRow?.name || id;

      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .or(`category_id.eq."${id}",category.eq."${catName}",category.eq."${id}"`);

      if (count && count > 0) {
        return {
          success: false,
          error: `Cannot delete: ${count} product(s) are currently assigned to this category. Please reassign the products first or archive the category.`,
        };
      }

      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMsg };
    }
  }

  const current = getInitialLocalCategories();
  const filtered = current.filter((c) => c.id !== id);
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('knr_categories_updated'));
  return { success: true };
}
