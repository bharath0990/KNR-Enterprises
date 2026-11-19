import React from 'react';
import { CartItem, Language, EnquiryItem } from '../types';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { submitRfqEnquiry } from '../services/enquiryService';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOpenProforma?: () => void;
  onOpenRfqForm?: () => void;
  language: Language;
  onBrowseProducts: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenProforma,
  onOpenRfqForm,
  language,
  onBrowseProducts,
}) => {
  const { settings } = useWebsiteSettings();
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const gstAmount = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + gstAmount;

  const whatsappPhone = (settings?.whatsappNumber || '918886175855').replace(/[^0-9]/g, '');

  const handleWhatsAppCheckout = async () => {
    // 1. Record enquiry in Supabase database
    const enquiryItems: EnquiryItem[] = items.map((it) => ({
      productId: it.product.id,
      productName: it.product.name,
      quantity: it.quantity,
      unit: it.product.unit,
      unitPrice: it.product.price,
      hsnCode: it.product.hsnCode,
      totalPrice: it.product.price * it.quantity,
    }));

    let refNumber = '';
    try {
      const saved = await submitRfqEnquiry(
        {
          customerName: 'Online Procurement Client',
          mobileNumber: '+91 (WhatsApp Dispatch)',
          organisation: 'Gram Panchayat / Institutional Tender',
          source: 'cart_whatsapp',
          notes: 'Customer initiated tender basket quote on WhatsApp',
        },
        enquiryItems
      );
      refNumber = saved.enquiryNumber;
    } catch (err) {
      console.warn('Could not record enquiry in DB:', err);
    }

    // 2. Open WhatsApp desk
    let message = `*KNR ENTERPRISES - ORDER ENQUIRY*\n`;
    if (refNumber) message += `*Ref: ${refNumber}*\n`;
    message += `=======================================\n`;
    items.forEach((item, index) => {
      const lineTotal = item.product.price * item.quantity;
      message += `${index + 1}. *${item.product.name}*\n   Qty: ${item.quantity} ${item.product.unit} @ ₹${item.product.price.toLocaleString('en-IN')} / ${item.product.unit}\n   Line Total: ₹${lineTotal.toLocaleString('en-IN')}\n\n`;
    });
    message += `=======================================\n`;
    message += `Subtotal: ₹${subtotal.toLocaleString('en-IN')}\n`;
    message += `Estimated GST (18%): ₹${gstAmount.toLocaleString('en-IN')}\n`;
    message += `*Total Order Amount: ₹${totalAmount.toLocaleString('en-IN')}*\n`;
    message += `=======================================\n`;
    message += `Please confirm stock availability and dispatch timeline to our location.`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden print:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {language === 'te' ? 'మీ కార్ట్' : 'Your Cart'}
                </h3>
                <p className="text-xs text-slate-500">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">
                  Your cart is empty
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Add wholesale items from our catalog to calculate GST estimates and request institutional quotes.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onBrowseProducts();
                  }}
                  className="mt-5 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const lineTotal = item.product.price * item.quantity;
                  const isBelowMoq = item.quantity < item.product.moq;

                  return (
                    <div
                      key={item.product.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-mono">
                            ₹{item.product.price.toLocaleString('en-IN')} / {item.product.unit}
                          </p>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quantity & Line Total */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-xs text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {isBelowMoq && (
                        <div className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-md font-medium">
                          Note: Depot MOQ is {item.product.moq} {item.product.unit}. Smaller quantities require depot confirmation.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Calculations & Action Buttons */}
          {items.length > 0 && (
            <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono font-bold text-slate-800">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST (18%):</span>
                  <span className="font-mono font-bold text-slate-800">
                    ₹{gstAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Estimated Total:</span>
                  <span className="font-mono text-orange-600">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {onOpenRfqForm && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRfqForm();
                    }}
                    className="w-full bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Proceed to Official RFQ Form</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleWhatsAppCheckout}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Quick RFQ via WhatsApp</span>
                </button>

                {onOpenProforma && (
                  <button
                    onClick={onOpenProforma}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-[#111827] font-semibold text-xs py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Generate Proforma Invoice</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
