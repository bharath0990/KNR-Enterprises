import React, { useState, useEffect } from 'react';
import { Category, Product } from '../../types';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Eye,
  Package,
  Archive,
  ExternalLink,
} from 'lucide-react';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  fetchProductsByCategory,
} from '../../services/categoryService';
import { ImageUploader } from '../components/ImageUploader';
import { ConfirmModal } from '../components/ConfirmModal';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Assigned Products Modal
  const [viewingCategoryProducts, setViewingCategoryProducts] = useState<Category | null>(null);
  const [assignedProducts, setAssignedProducts] = useState<Partial<Product>[]>([]);
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [teluguName, setTeluguName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchCategories();
      setCategories(res);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('knr_categories_updated', handleUpdate);
    return () => window.removeEventListener('knr_categories_updated', handleUpdate);
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setTeluguName('');
    setDescription('');
    setImage('');
    setDisplayOrder(categories.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
    setFeedbackMessage(null);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setTeluguName(cat.teluguName);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setDisplayOrder(cat.displayOrder || 1);
    setIsActive(cat.isActive ?? true);
    setIsModalOpen(true);
    setFeedbackMessage(null);
  };

  const handleToggleStatus = async (cat: Category) => {
    try {
      const updatedStatus = !cat.isActive;
      await updateCategory(cat.id, { isActive: updatedStatus });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: updatedStatus } : c))
      );
    } catch (err) {
      alert(`Failed to toggle category status: ${err}`);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newOrder = [...categories];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    // Immediately update UI
    setCategories(newOrder);

    try {
      await reorderCategories(newOrder.map((c) => c.id));
    } catch (err) {
      alert(`Failed to save new order: ${err}`);
      loadData();
    }
  };

  const handleViewProducts = async (cat: Category) => {
    setViewingCategoryProducts(cat);
    setIsLoadingAssigned(true);
    try {
      const prods = await fetchProductsByCategory(cat.id, cat.name);
      setAssignedProducts(prods);
    } catch (err) {
      console.error('Error fetching assigned products:', err);
    } finally {
      setIsLoadingAssigned(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setFeedbackMessage(null);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          teluguName: teluguName.trim() || name.trim(),
          description: description.trim(),
          image: image.trim(),
          displayOrder: Number(displayOrder),
          isActive,
        });
      } else {
        await createCategory({
          name: name.trim(),
          teluguName: teluguName.trim() || name.trim(),
          description: description.trim(),
          image: image.trim(),
          displayOrder: Number(displayOrder),
          isActive,
        });
      }

      await loadData();
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedbackMessage({ text: msg, isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      const res = await deleteCategory(deleteCandidate.id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== deleteCandidate.id));
        setDeleteCandidate(null);
      } else {
        alert(res.error || 'Failed to delete category');
      }
    } catch (err) {
      alert(`Error deleting category: ${err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchiveInstead = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await updateCategory(deleteCandidate.id, { isActive: false });
      setCategories((prev) =>
        prev.map((c) => (c.id === deleteCandidate.id ? { ...c, isActive: false } : c))
      );
      setDeleteCandidate(null);
    } catch (err) {
      alert(`Failed to archive category: ${err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize products into wholesale supply lines synchronized with public catalog filters
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* 2. Categories Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-28">Order</th>
                <th className="py-3 px-4">Category Name (English &amp; Telugu)</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-3 text-center">Assigned Products</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No records available yet.
                  </td>
                </tr>
              ) : (
                categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Order & Reorder Controls */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-500">
                        <span className="w-6 text-center text-xs">#{cat.displayOrder || idx + 1}</span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMove(idx, 'up')}
                            disabled={idx === 0}
                            className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(idx, 'down')}
                            disabled={idx === categories.length - 1}
                            className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Name & Image */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80';
                            }}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{cat.name}</div>
                          {cat.teluguName && (
                            <div className="text-[11px] text-slate-500">{cat.teluguName}</div>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {cat.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                      {cat.description || '—'}
                    </td>

                    {/* Product Count & View Link */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleViewProducts(cat)}
                        className="inline-flex items-center gap-1.5 font-mono font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer group"
                        title="Click to view assigned products"
                      >
                        <Package className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                        <span>{cat.count ?? 0} items</span>
                      </button>
                    </td>

                    {/* Status & 1-Click Toggle */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(cat)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all hover:scale-105 ${
                          cat.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        title="Click to toggle Active/Inactive"
                      >
                        {cat.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewProducts(cat)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View assigned products"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCandidate(cat)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete / Archive category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-slate-900 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackMessage && (
              <div
                className={`mt-3 p-3 rounded-xl text-xs font-semibold ${
                  feedbackMessage.isError
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                {feedbackMessage.text}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cleaning Chemicals"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name (Telugu)
                </label>
                <input
                  type="text"
                  value={teluguName}
                  onChange={(e) => setTeluguName(e.target.value)}
                  placeholder="e.g. క్లీనింగ్ రసాయనాలు"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of product lines in this category..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Active (Visible in Catalog)
                    </span>
                  </label>
                </div>
              </div>

              {/* Category Image */}
              <ImageUploader
                value={image}
                onChange={setImage}
                label="Category Banner / Icon Image"
                allowMultiple={false}
              />

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Assigned Products Modal */}
      {viewingCategoryProducts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-slate-900 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assigned Products: {viewingCategoryProducts.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Products currently organized under this category in the live database ({assignedProducts.length} items)
                </p>
              </div>
              <button
                onClick={() => setViewingCategoryProducts(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {isLoadingAssigned ? (
                <div className="py-12 text-center text-slate-400">
                  <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block" />
                  <p className="text-xs text-slate-500 mt-2">Loading assigned products...</p>
                </div>
              ) : assignedProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No products assigned yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Assign products to this category from Products Management.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {assignedProducts.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-xs text-slate-900">{p.name}</div>
                          {p.teluguName && (
                            <div className="text-[11px] text-slate-500">{p.teluguName}</div>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            {p.sku && <span>SKU: {p.sku}</span>}
                            <span>•</span>
                            <span>Indicative: ₹{(p.price || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingCategoryProducts(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Safe Delete / Archive Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  (deleteCandidate.count || 0) > 0
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {(deleteCandidate.count || 0) > 0 ? 'Archive Category' : 'Delete Category'}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {(deleteCandidate.count || 0) > 0 ? (
                    <>
                      <strong>"{deleteCandidate.name}"</strong> currently has{' '}
                      <span className="font-bold text-amber-600">
                        {deleteCandidate.count} assigned product(s)
                      </span>
                      . Permanent deletion is blocked to prevent orphaned products. You can safely{' '}
                      <strong>Archive</strong> this category to hide it from public catalog filters without
                      affecting products.
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete category{' '}
                      <strong>"{deleteCandidate.name}"</strong>? It has 0 assigned products.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-5 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              {(deleteCandidate.count || 0) > 0 ? (
                <button
                  type="button"
                  onClick={handleArchiveInstead}
                  disabled={isDeleting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive Category (Set Inactive)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Permanently</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
