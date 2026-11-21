import React, { useState, useEffect, useMemo } from 'react';
import { CustomerEnquiry } from '../../types';
import { fetchEnquiries } from '../../services/enquiryService';
import { formatISTDate, formatRelativeTime } from '../../utils/date';
import {
  Users,
  Search,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface AggregatedCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  organisation: string;
  designation?: string;
  mandal?: string;
  district?: string;
  totalEnquiries: number;
  totalEstimatedValue: number;
  lastEnquiryDate: string;
  enquiries: CustomerEnquiry[];
}

interface CustomersPageProps {
  onViewEnquiry?: (enquiry: CustomerEnquiry) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ onViewEnquiry }) => {
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchEnquiries();
      setEnquiries(data);
    } catch (err) {
      console.error('Failed to load enquiries for customer directory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('knr_enquiries_updated', loadData);
    return () => window.removeEventListener('knr_enquiries_updated', loadData);
  }, []);

  // Aggregate enquiries by normalized phone number or customer name
  const customers = useMemo(() => {
    const map = new Map<string, AggregatedCustomer>();

    enquiries.forEach((enq) => {
      const rawPhone = (enq.mobileNumber || '').replace(/[^0-9]/g, '');
      const key = rawPhone.length >= 10 ? rawPhone.slice(-10) : enq.customerName.toLowerCase().trim();

      const existing = map.get(key);
      const enqValue = enq.totalAmount || 0;

      if (!existing) {
        map.set(key, {
          id: key,
          name: enq.customerName,
          phone: enq.mobileNumber,
          email: enq.email,
          organisation: enq.organisation || 'Gram Panchayat / Institutional',
          designation: enq.designation,
          mandal: enq.mandal,
          district: enq.district,
          totalEnquiries: 1,
          totalEstimatedValue: enqValue,
          lastEnquiryDate: enq.createdAt,
          enquiries: [enq],
        });
      } else {
        existing.totalEnquiries += 1;
        existing.totalEstimatedValue += enqValue;
        existing.enquiries.push(enq);
        if (new Date(enq.createdAt) > new Date(existing.lastEnquiryDate)) {
          existing.lastEnquiryDate = enq.createdAt;
          if (enq.email) existing.email = enq.email;
          if (enq.organisation) existing.organisation = enq.organisation;
        }
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastEnquiryDate).getTime() - new Date(a.lastEnquiryDate).getTime()
    );
  }, [enquiries]);

  // Unique districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.district) set.add(c.district);
    });
    return Array.from(set).sort();
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.organisation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.mandal && c.mandal.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.district && c.district.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDistrict = selectedDistrict === 'all' || c.district === selectedDistrict;

      return matchSearch && matchDistrict;
    });
  }, [customers, searchQuery, selectedDistrict]);

  const totalClients = customers.length;
  const totalValue = customers.reduce((sum, c) => sum + c.totalEstimatedValue, 0);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#F57C00] bg-[#FFF3E0] mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Institutional Procurement Directory</span>
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Verified Gram Panchayat Sarpanches, Municipal Commissioners, and EPC contractors across Telangana
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-[#111827] border border-[#E2E8F0] rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#F57C00]' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* 2. Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B]">Total Registered Clients</span>
            <div className="text-2xl font-black text-[#111827] mt-1">{totalClients}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FFF3E0] text-[#F57C00] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B]">Total Enquiries Logged</span>
            <div className="text-2xl font-black text-[#111827] mt-1">{enquiries.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B]">Cumulative Estimated Value</span>
            <div className="text-2xl font-black text-[#16A34A] mt-1 font-mono">
              ₹{totalValue.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, organisation..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-[#E2E8F0] rounded-xl text-[#111827] focus:outline-none focus:border-[#F57C00]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-[#E2E8F0] rounded-xl text-[#111827] focus:outline-none focus:border-[#F57C00]"
          >
            <option value="all">All Telangana Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Customer Data Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Client Name & Role</th>
                <th className="py-3.5 px-4">Organisation / Entity</th>
                <th className="py-3.5 px-4">Mandal & District</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4 text-center">Total RFQs</th>
                <th className="py-3.5 px-4 text-right">Est. Value</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#F57C00] mb-2" />
                    <span>Loading customer directory from Supabase...</span>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No records available yet.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Customer records are generated automatically when RFQ enquiries are received.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
                  return (
                    <tr key={customer.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#111827]">
                        <div className="font-bold text-sm">{customer.name}</div>
                        {customer.designation && (
                          <div className="text-[10px] text-[#F57C00] font-medium">
                            {customer.designation}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#111827]">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{customer.organisation}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#64748B]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {customer.mandal ? `${customer.mandal}, ` : ''}
                            {customer.district || 'Telangana'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#111827]">
                        <div className="space-y-0.5">
                          <div className="font-mono text-xs">{customer.phone}</div>
                          {customer.email && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 bg-[#FFF3E0] text-[#F57C00] font-bold rounded-md text-xs">
                          {customer.totalEnquiries}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#111827]">
                        ₹{customer.totalEstimatedValue.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-[#64748B] whitespace-nowrap">
                        <div className="flex items-center gap-1" title={formatISTDate(customer.lastEnquiryDate)}>
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatRelativeTime(customer.lastEnquiryDate)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${encodeURIComponent(`Hello ${customer.name}, this is KNR Enterprises regarding your municipal wholesale enquiry.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          {cleanPhone && (
                            <a
                              href={`tel:${cleanPhone}`}
                              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                              title="Call customer"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                          {onViewEnquiry && customer.enquiries.length > 0 && (
                            <button
                              onClick={() => onViewEnquiry(customer.enquiries[0])}
                              className="p-1.5 bg-[#FFF3E0] text-[#F57C00] hover:bg-orange-100 rounded-lg transition-colors cursor-pointer"
                              title="View latest RFQ enquiry"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
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

