import React, { useState, useEffect } from 'react';
import { AdminProfile } from '../../types';
import {
  Settings,
  BellRing,
  ShieldCheck,
} from 'lucide-react';
import { WebsiteSettingsPage } from './WebsiteSettingsPage';
import { RfqNotificationSettingsPage } from './RfqNotificationSettingsPage';
import { AdminProfilePage } from './AdminProfilePage';

export type SettingsSubtab = 'website' | 'rfq-notifications' | 'profile';

interface SettingsPageProps {
  user: AdminProfile | null;
  initialSubtab?: SettingsSubtab;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  initialSubtab = 'website',
}) => {
  const [activeSubtab, setActiveSubtab] = useState<SettingsSubtab>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('rfq-notifications') || hash.includes('notifications')) return 'rfq-notifications';
    if (hash.includes('profile')) return 'profile';
    return initialSubtab;
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('rfq-notifications') || hash.includes('notifications')) setActiveSubtab('rfq-notifications');
      else if (hash.includes('profile')) setActiveSubtab('profile');
      else if (hash.includes('website')) setActiveSubtab('website');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const subtabs = [
    { id: 'website' as const, label: 'Company & Contacts', icon: Settings },
    { id: 'rfq-notifications' as const, label: 'RFQ Notifications', icon: BellRing },
    { id: 'profile' as const, label: 'Admin Profile & Security', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Sub-navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Platform &amp; System Settings
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure business contact numbers, official RFQ notification recipients, and admin security credentials.
            </p>
          </div>
        </div>

        {/* Subtab Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          {subtabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubtab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubtab(tab.id);
                  window.location.hash = `admin/settings#${tab.id}`;
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#F57C00] text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active View */}
      <div>
        {activeSubtab === 'website' && <WebsiteSettingsPage />}
        {activeSubtab === 'rfq-notifications' && <RfqNotificationSettingsPage />}
        {activeSubtab === 'profile' && <AdminProfilePage user={user} />}
      </div>
    </div>
  );
};
