import React, { useState, useEffect } from 'react';
import { RfqNotificationSettings, RfqNotificationLog } from '../../types';
import {
  BellRing,
  Mail,
  MessageCircle,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Send,
  ShieldCheck,
  Clock,
  ExternalLink,
  Check,
  RefreshCw,
  Server,
  Filter,
} from 'lucide-react';
import {
  getRfqNotificationSettings,
  saveRfqNotificationSettings,
  fetchNotificationLogs,
  retryNotification,
  openWhatsAppDirect,
  dispatchRfqNotifications,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../../services/notificationService';

export const RfqNotificationSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<RfqNotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [logs, setLogs] = useState<RfqNotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed'>('all');
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);
  const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null);

  // Form Fields
  const [adminEmail, setAdminEmail] = useState('');
  const [whatsappRecipient1, setWhatsappRecipient1] = useState('');
  const [whatsappRecipient2, setWhatsappRecipient2] = useState('');
  const [emailIntegrationStatus, setEmailIntegrationStatus] = useState('');
  const [whatsappIntegrationStatus, setWhatsappIntegrationStatus] = useState('');
  const [notifyOnNewRfq, setNotifyOnNewRfq] = useState(true);
  const [notifyOnQuotationCreated, setNotifyOnQuotationCreated] = useState(true);
  const [notifyOnOrderConfirmed, setNotifyOnOrderConfirmed] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [currSettings, currLogs] = await Promise.all([
        getRfqNotificationSettings(),
        fetchNotificationLogs(),
      ]);

      setSettings(currSettings);
      setAdminEmail(currSettings.adminEmail);
      setWhatsappRecipient1(currSettings.whatsappRecipient1);
      setWhatsappRecipient2(currSettings.whatsappRecipient2);
      setEmailIntegrationStatus(currSettings.emailIntegrationStatus);
      setWhatsappIntegrationStatus(currSettings.whatsappIntegrationStatus);
      setNotifyOnNewRfq(currSettings.notifyOnNewRfq);
      setNotifyOnQuotationCreated(currSettings.notifyOnQuotationCreated);
      setNotifyOnOrderConfirmed(currSettings.notifyOnOrderConfirmed);

      setLogs(currLogs);
    } catch (err) {
      console.error('Failed to load notification settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      fetchNotificationLogs().then(setLogs);
    };
    window.addEventListener('knr_notifications_updated', handleUpdate);
    return () => window.removeEventListener('knr_notifications_updated', handleUpdate);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const updated = await saveRfqNotificationSettings({
        adminEmail: adminEmail.trim(),
        whatsappRecipient1: whatsappRecipient1.trim(),
        whatsappRecipient2: whatsappRecipient2.trim(),
        emailIntegrationStatus,
        whatsappIntegrationStatus,
        notifyOnNewRfq,
        notifyOnQuotationCreated,
        notifyOnOrderConfirmed,
      });

      setSettings(updated);
      setSaveSuccessMsg('Notification settings and recipient numbers updated successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      alert(`Failed to save settings: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = async (logId: string) => {
    setRetryingLogId(logId);
    try {
      const updated = await retryNotification(logId);
      setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err) {
      alert(`Retry failed: ${err}`);
    } finally {
      setRetryingLogId(null);
    }
  };

  const handleSendTestNotification = async () => {
    setTestNotificationStatus('Dispatching test notification to all 3 configured destinations...');
    try {
      // Simulate real test enquiry payload
      const testEnquiry = {
        id: 'test-rfq',
        enquiryNumber: `KNR-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: 'Test Sarpanch / Procurement Officer',
        mobileNumber: '+91 9440123890',
        email: 'sarpanch.test@telangana.gov.in',
        organisation: 'Test Gram Panchayat / Demonstration',
        designation: 'Sarpanch',
        mandal: 'Chevella',
        district: 'Ranga Reddy',
        state: 'Telangana',
        address: 'Main Panchayat Office, Chevella',
        city: 'Chevella',
        pincode: '501503',
        status: 'New' as any,
        subtotal: 25000,
        estimatedGst: 4500,
        totalAmount: 29500,
        source: 'admin_test_dispatch',
        createdAt: new Date().toISOString(),
      };

      const testItems = [
        {
          productName: 'Commercial Bleaching Powder Grade 1 (33% Chlorine)',
          quantity: 20,
          unit: 'bag',
          unitPrice: 850,
          hsnCode: '2828.10.10',
          totalPrice: 17000,
        },
        {
          productName: 'Heavy-Duty HDPE Wheeled Garbage Bin (240L SBM)',
          quantity: 4,
          unit: 'unit',
          unitPrice: 2850,
          hsnCode: '3923.10.90',
          totalPrice: 11400,
        },
      ];

      const res = await dispatchRfqNotifications(testEnquiry, testItems);

      setTestNotificationStatus(
        `Test Dispatched! Email: ${res.emailResult.success ? 'Delivered' : 'Failed'} &bull; WhatsApp 1: ${res.whatsapp1Result.success ? 'Delivered' : 'Failed'} &bull; WhatsApp 2: ${res.whatsapp2Result.success ? 'Delivered' : 'Failed'}`
      );
      loadData();
    } catch (err: any) {
      setTestNotificationStatus(`Test dispatch error: ${err?.message || err}`);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'sent') return l.status === 'sent' || l.status === 'delivered';
    if (statusFilter === 'failed') return l.status === 'failed' || l.status === 'pending_retry';
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight font-display flex items-center gap-2.5">
            <BellRing className="w-7 h-7 text-[#F57C00]" />
            <span>RFQ Notification Configuration</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Configure automated multi-channel notifications for new bulk RFQs and formal quotation dispatches
          </p>
        </div>

        <button
          type="button"
          onClick={handleSendTestNotification}
          className="px-4 py-2 bg-[#0D2B5B] hover:bg-[#071c3d] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5 text-[#F57C00]" />
          <span>Send Test RFQ Notification</span>
        </button>
      </div>

      {testNotificationStatus && (
        <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900 font-semibold flex items-center gap-2 animate-fadeIn">
          <Clock className="w-4 h-4 text-[#F57C00] shrink-0" />
          <span dangerouslySetInnerHTML={{ __html: testNotificationStatus }} />
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2. Integration Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Admin Notification Email
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="font-mono text-sm font-black text-[#111827] truncate">
            {adminEmail || 'knrenterprises679@gmail.com'}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>SMTP / Gateway Active</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              WhatsApp Recipient 1
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="font-mono text-sm font-black text-[#111827]">
            {whatsappRecipient1 || '+918886175855'}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>K. Narendar Reddy (Managing Partner)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              WhatsApp Recipient 2
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="font-mono text-sm font-black text-[#111827]">
            {whatsappRecipient2 || '+919666469679'}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>Chevella Depot Procurement Head</span>
          </div>
        </div>
      </div>

      {/* 3. Settings Form */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <span className="font-bold text-sm text-[#111827] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#F57C00]" />
            <span>Automated Dispatch Channels &amp; Recipients</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Independent Multi-Channel Delivery
          </span>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admin Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#F57C00]" />
                <span>Admin Notification Email *</span>
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] font-semibold focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
                placeholder="knrenterprises679@gmail.com"
              />
              <p className="text-[11px] text-slate-500">
                Receives full itemized order details, consignee address, and BOQ attachments.
              </p>
            </div>

            {/* WhatsApp Recipient 1 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>WhatsApp Recipient 1 *</span>
              </label>
              <input
                type="tel"
                required
                value={whatsappRecipient1}
                onChange={(e) => setWhatsappRecipient1(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] font-mono font-bold focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
                placeholder="+918886175855"
              />
              <p className="text-[11px] text-slate-500">
                Primary depot mobile hotline for instant wholesale notification.
              </p>
            </div>

            {/* WhatsApp Recipient 2 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>WhatsApp Recipient 2 *</span>
              </label>
              <input
                type="tel"
                required
                value={whatsappRecipient2}
                onChange={(e) => setWhatsappRecipient2(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] font-mono font-bold focus:outline-none focus:border-[#F57C00] focus:bg-white transition-colors"
                placeholder="+919666469679"
              />
              <p className="text-[11px] text-slate-500">
                Secondary procurement partner for independent fail-safe delivery.
              </p>
            </div>
          </div>

          {/* Trigger Toggles */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
              Notification Trigger Rules
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer hover:border-orange-200">
                <input
                  type="checkbox"
                  checked={notifyOnNewRfq}
                  onChange={(e) => setNotifyOnNewRfq(e.target.checked)}
                  className="rounded text-[#F57C00] focus:ring-[#F57C00] w-4 h-4"
                />
                <span className="text-xs font-bold text-[#111827]">
                  New Customer RFQ Submissions
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer hover:border-orange-200">
                <input
                  type="checkbox"
                  checked={notifyOnQuotationCreated}
                  onChange={(e) => setNotifyOnQuotationCreated(e.target.checked)}
                  className="rounded text-[#F57C00] focus:ring-[#F57C00] w-4 h-4"
                />
                <span className="text-xs font-bold text-[#111827]">
                  Formal Quotation Dispatched
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer hover:border-orange-200">
                <input
                  type="checkbox"
                  checked={notifyOnOrderConfirmed}
                  onChange={(e) => setNotifyOnOrderConfirmed(e.target.checked)}
                  className="rounded text-[#F57C00] focus:ring-[#F57C00] w-4 h-4"
                />
                <span className="text-xs font-bold text-[#111827]">
                  Order Converted &amp; Confirmed
                </span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-[#64748B]">
              Changes take effect immediately across all live website RFQ forms.
            </span>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#F57C00] hover:bg-[#E06D00] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Notification Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Notification Delivery Audit Log */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-[#111827] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F57C00]" />
              <span>Multi-Channel Delivery History &amp; Audit Trail</span>
            </h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Individual delivery verification status for Email, WhatsApp Recipient 1, and WhatsApp Recipient 2
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#F57C00]"
            >
              <option value="all">All Delivery Records ({logs.length})</option>
              <option value="sent">Delivered / Sent ({logs.filter((l) => l.status === 'sent' || l.status === 'delivered').length})</option>
              <option value="failed">Failed / Pending ({logs.filter((l) => l.status === 'failed' || l.status === 'pending_retry').length})</option>
            </select>

            <button
              onClick={loadData}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-3">Enquiry Ref</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-4">Recipient Destination</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No notification delivery records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isSuccess = log.status === 'sent' || log.status === 'delivered';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-[#F57C00] whitespace-nowrap">
                        {log.enquiryNumber}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.channel === 'email'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {log.channel === 'email' ? (
                            <Mail className="w-3 h-3" />
                          ) : (
                            <MessageCircle className="w-3 h-3" />
                          )}
                          <span>{log.channel}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-[#111827] truncate">
                          {log.recipient}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {log.recipientLabel}
                        </div>
                        {log.errorMessage && (
                          <div className="text-[10px] text-rose-500 font-mono mt-0.5 truncate" title={log.errorMessage}>
                            {log.errorMessage}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isSuccess ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>{log.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {log.channel === 'whatsapp' && (
                            <button
                              type="button"
                              onClick={() => openWhatsAppDirect(log.recipient, log.content)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Open WhatsApp Chat"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={retryingLogId === log.id}
                            onClick={() => handleRetry(log.id)}
                            className="p-1.5 text-[#F57C00] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Retry Delivery"
                          >
                            <RotateCw
                              className={`w-3.5 h-3.5 ${
                                retryingLogId === log.id ? 'animate-spin' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
