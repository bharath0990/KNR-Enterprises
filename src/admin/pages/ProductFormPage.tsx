import React, { useState, useEffect } from 'react';
import { Product, Category } from '../../types';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { createProduct, updateProduct } from '../../services/productService';
import { fetchCategories } from '../../services/categoryService';
import { ImageUploader } from '../components/ImageUploader';

interface ProductFormPageProps {
  product?: Product | null; // if present, edit mode; else create mode
  onBack: () => void;
  onSaved: (product: Product) => void;
}

export const ProductFormPage: React.FC<ProductFormPageProps> = ({
  product,
  onBack,
  onSaved,
}) => {
  const isEditing = Boolean(product);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(product?.name || '');
  const [teluguName, setTeluguName] = useState(product?.teluguName || '');
  const [slug, setSlug] = useState(product?.id || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [category, setCategory] = useState(product?.category || 'Disinfectants & Chemicals');
  const [brand, setBrand] = useState(product?.brand || 'KNR Enterprises');
  const [description, setDescription] = useState(product?.description || '');
  const [descriptionTelugu, setDescriptionTelugu] = useState(product?.descriptionTelugu || '');

  // Commercial Details
  const [price, setPrice] = useState<number>(product?.price || 0);
  const [originalPrice, setOriginalPrice] = useState<number>(product?.originalPrice || 0);
  const [gstPercent, setGstPercent] = useState<number>(product?.gstPercent || 18);
  const [hsnCode, setHsnCode] = useState(product?.hsnCode || '3808.91');
  const [moq, setMoq] = useState<number>(product?.moq || 1);
  const [unit, setUnit] = useState(product?.unit || 'unit');
  const [moqDescription, setMoqDescription] = useState(product?.moqDescription || '');

  // Availability (Wholesale Model - Manual Availability Control)
  const [availability, setAvailability] = useState<'Available' | 'Enquire for Availability' | 'Discontinued'>(
    product?.availability || (product?.inStock !== false ? 'Available' : 'Enquire for Availability')
  );

  // Images
  const [image, setImage] = useState(product?.image || '/hero-knr-products.jpg');
  const [galleryImages, setGalleryImages] = useState<string[]>(product?.galleryImages || []);

  // Additional Specifications & Features
  const [specifications, setSpecifications] = useState<string[]>(
    product?.specifications && product.specifications.length > 0
      ? product.specifications
      : ['33% Min Available Chlorine content', 'Heavy-duty HDPE laminated outer bag']
  );
  const [features, setFeatures] = useState<string[]>(
    product?.features && product.features.length > 0
      ? product.features
      : ['Immediate highway dispatch', 'Telangana audit compliant']
  );
  const [badge, setBadge] = useState(product?.badge || '');
  const [badgeColor, setBadgeColor] = useState(product?.badgeColor || 'orange');
  const [isFeatured, setIsFeatured] = useState<boolean>(product?.isFeatured ?? false);
  const [isBestseller, setIsBestseller] = useState<boolean>(product?.isBestseller ?? false);
  const [isActive, setIsActive] = useState<boolean>(product?.isActive ?? true);

  // Load categories
  useEffect(() => {
    fetchCategories().then((res) => setCategories(res));
  }, []);

  // Auto-generate slug and SKU if creating new
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !slug) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  };

  // Spec handlers
  const handleAddSpec = () => {
    setSpecifications([...specifications, '']);
  };
  const handleSpecChange = (idx: number, val: string) => {
    const updated = [...specifications];
    updated[idx] = val;
    setSpecifications(updated);
  };
  const handleRemoveSpec = (idx: number) => {
    setSpecifications(specifications.filter((_, i) => i !== idx));
  };

  // Feature handlers
  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };
  const handleFeatureChange = (idx: number, val: string) => {
    const updated = [...features];
    updated[idx] = val;
    setFeatures(updated);
  };
  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage('Product English Name is required.');
      return;
    }
    if (price <= 0) {
      setErrorMessage('Selling price must be greater than zero.');
      return;
    }
    if (moq <= 0) {
      setErrorMessage('Minimum Order Quantity (MOQ) must be at least 1.');
      return;
    }
    if (!image) {
      setErrorMessage('Main Product Image is required.');
      return;
    }

    setIsSaving(true);
    try {
      const cleanSpecs = specifications.filter((s) => s.trim().length > 0);
      const cleanFeatures = features.filter((f) => f.trim().length > 0);
      const selectedCategoryObj = categories.find((c) => c.name === category);

      const productPayload: Partial<Product> = {
        name: name.trim(),
        teluguName: teluguName.trim() || name.trim(),
        categoryId: selectedCategoryObj?.id,
        category: category,
        categoryTelugu: selectedCategoryObj?.teluguName || category,
        sku: sku.trim() || `KNR-${Math.floor(1000 + Math.random() * 9000)}`,
        hsnCode: hsnCode.trim(),
        price: Number(price),
        originalPrice: Number(originalPrice || price),
        discountPercent:
          originalPrice > price
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : 0,
        gstPercent: Number(gstPercent),
        unit: unit.trim(),
        moq: Number(moq),
        moqDescription: moqDescription.trim() || `${moq} ${unit.trim()}`,
        availability,
        inStock: availability !== 'Discontinued',
        badge: badge.trim(),
        badgeColor: badgeColor,
        image: image,
        galleryImages: galleryImages,
        specifications: cleanSpecs,
        features: cleanFeatures,
        description: description.trim(),
        descriptionTelugu: descriptionTelugu.trim(),
        brand: brand.trim(),
        isFeatured,
        isBestseller,
        isActive,
      };

      let savedProduct: Product;
      if (isEditing && product) {
        savedProduct = await updateProduct(product.id, productPayload);
      } else {
        productPayload.id = slug.trim();
        savedProduct = await createProduct(productPayload);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onSaved(savedProduct);
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fadeIn">
      {/* Top action header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isEditing ? `Edit Product: ${product?.name}` : 'Add New Product'}
            </h1>
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Update commercial specifications, Telugu descriptions, or stock levels'
                : 'Fill details to publish a new wholesale item to the KNR catalog'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isEditing ? 'Save Changes' : 'Publish Product'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Product saved successfully! Updating catalog and live website...</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-semibold animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: BASIC DETAILS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            1. Basic Product Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name English */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Name (English) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Commercial Bleaching Powder Grade 1 (33% Chlorine)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Name Telugu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Name (Telugu)
              </label>
              <input
                type="text"
                value={teluguName}
                onChange={(e) => setTeluguName(e.target.value)}
                placeholder="e.g. కమర్షియల్ బ్లీచింగ్ పౌడర్ గ్రేడ్ 1 (33% క్లోరిన్)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Product Slug / Unique ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Slug / ID *
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. bleaching-powder-grade1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            {/* SKU / Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SKU / Depot Inventory Code
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. KNR-BLC-001"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="KNR Enterprises"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Description English */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description (English)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed wholesale product overview, application scope, and packaging..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Description Telugu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description (Telugu)
            </label>
            <textarea
              rows={2}
              value={descriptionTelugu}
              onChange={(e) => setDescriptionTelugu(e.target.value)}
              placeholder="తెలుగు వివరణ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* SECTION 2: COMMERCIAL DETAILS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            2. Commercial Pricing &amp; GST Details
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Selling Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Original / MRP Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Original Price / MRP (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* GST Percentage */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                GST Rate (%)
              </label>
              <select
                value={gstPercent}
                onChange={(e) => setGstPercent(parseFloat(e.target.value) || 18)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18% (Standard Municipal)</option>
                <option value={28}>28%</option>
              </select>
            </div>

            {/* HSN Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                HSN Code *
              </label>
              <input
                type="text"
                required
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="e.g. 2828.10.10"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* MOQ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Order Quantity (MOQ) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={moq}
                onChange={(e) => setMoq(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Unit of Measurement */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unit of Measurement *
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. bag, unit, can, fixture, roll"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: AVAILABILITY STATUS (Wholesale RFQ Model) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Product Availability Status
            </h3>
            <span className="text-[11px] text-slate-400">Wholesale RFQ Model (No Fake Inventory Counts)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Available */}
            <label
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                availability === 'Available'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 shadow-xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-emerald-800">Available</span>
                <input
                  type="radio"
                  name="availability"
                  value="Available"
                  checked={availability === 'Available'}
                  onChange={() => setAvailability('Available')}
                  className="accent-emerald-600 w-4 h-4"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                In Stock &amp; ready for immediate truckload dispatch from Chevella depot.
              </p>
            </label>

            {/* Enquire for Availability */}
            <label
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                availability === 'Enquire for Availability'
                  ? 'border-amber-500 bg-amber-50/50 text-amber-950 shadow-xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-amber-800">Enquire for Availability</span>
                <input
                  type="radio"
                  name="availability"
                  value="Enquire for Availability"
                  checked={availability === 'Enquire for Availability'}
                  onChange={() => setAvailability('Enquire for Availability')}
                  className="accent-amber-600 w-4 h-4"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Supplied on confirmed purchase order with factory lead time.
              </p>
            </label>

            {/* Discontinued */}
            <label
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                availability === 'Discontinued'
                  ? 'border-rose-500 bg-rose-50/50 text-rose-950 shadow-xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-rose-800">Discontinued</span>
                <input
                  type="radio"
                  name="availability"
                  value="Discontinued"
                  checked={availability === 'Discontinued'}
                  onChange={() => setAvailability('Discontinued')}
                  className="accent-rose-600 w-4 h-4"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Archived product no longer supplied or manufactured.
              </p>
            </label>
          </div>
        </div>

        {/* SECTION 4: PRODUCT IMAGES */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            4. Product Images (Main &amp; Gallery)
          </h3>

          <ImageUploader
            value={image}
            onChange={setImage}
            galleryImages={galleryImages}
            onGalleryChange={setGalleryImages}
            label="Product Images"
            allowMultiple={true}
          />
        </div>

        {/* SECTION 5: SPECIFICATIONS & FEATURES */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            5. Technical Specifications &amp; Key Features
          </h3>

          {/* Dynamic Specifications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Specifications List (Displayed on Product Card &amp; Quote Sheet)
              </label>
              <button
                type="button"
                onClick={handleAddSpec}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Specification</span>
              </button>
            </div>

            {specifications.map((spec, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={spec}
                  onChange={(e) => handleSpecChange(idx, e.target.value)}
                  placeholder={`Specification line ${idx + 1}`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Dynamic Features */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Key Features / Highlights
              </label>
              <button
                type="button"
                onClick={handleAddFeature}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Feature</span>
              </button>
            </div>

            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={feat}
                  onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  placeholder={`Feature bullet ${idx + 1}`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 6: PROMOTIONAL & VISIBILITY TOGGLES */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            6. Display &amp; Promotion Controls
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Featured */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Featured on Homepage</span>
                <span className="text-[11px] text-slate-500 block">Showcases in primary hero carousel</span>
              </div>
            </label>

            {/* Bestseller */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Bestseller Badge</span>
                <span className="text-[11px] text-slate-500 block">Flags as top municipal volume item</span>
              </div>
            </label>

            {/* Active Visibility */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Published (Active)</span>
                <span className="text-[11px] text-slate-500 block">Public catalog visibility</span>
              </div>
            </label>
          </div>
        </div>

        {/* Bottom Save bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
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
            <span>{isEditing ? 'Save Changes' : 'Publish Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

