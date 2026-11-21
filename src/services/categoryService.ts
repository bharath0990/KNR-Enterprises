import { Category } from '../types';
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
        // Also fetch product counts for each category
        const { data: prodData } = await supabase
          .from('products')
          .select('category');

        const counts: Record<string, number> = {};
        if (prodData) {
          prodData.forEach((p) => {
            const cat = String(p.category || '');
            counts[cat] = (counts[cat] || 0) + 1;
          });
        }

        const mapped = data.map((row) => {
          const cat = mapDbCategory(row);
          cat.count = counts[cat.name] || counts[cat.id] || 0;
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

export async function createCategory(cat: Omit<Category, 'id'> & { id?: string }): Promise<Category> {
  const slug = cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newCat: Category = {
    id: slug,
    name: cat.name,
    teluguName: cat.teluguName || '',
    description: cat.description || '',
    image: cat.image || '',
    displayOrder: cat.displayOrder || 1,
    isActive: cat.isActive ?? true,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
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
        throw new Error(error.message);
      }
      if (data) {
        return mapDbCategory(data);
      }
    } catch (err) {
      console.warn('Failed to insert category in Supabase, saving locally:', err);
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
    try {
      const payload: Record<string, unknown> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.teluguName !== undefined) payload.telugu_name = updates.teluguName;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.image !== undefined) payload.image = updates.image;
      if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (data) return mapDbCategory(data);
    } catch (err) {
      console.warn('Failed to update category in Supabase, updating locally:', err);
    }
  }

  const current = getInitialLocalCategories();
  const updated = current.map((c) => (c.id === id ? { ...c, ...updates } : c));
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('knr_categories_updated'));
  return updated.find((c) => c.id === id)!;
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      // Check if products exist in this category
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id);

      if (count && count > 0) {
        return {
          success: false,
          error: `Cannot delete: ${count} product(s) are currently assigned to this category. Please reassign them first.`,
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

