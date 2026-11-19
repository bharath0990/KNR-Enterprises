import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WebsiteSettings, HomepageContent } from '../types';
import {
  fetchWebsiteSettings,
  updateWebsiteSettings as updateSettingsService,
  fetchHomepageContent,
  updateHomepageContent as updateHomepageService,
  DEFAULT_WEBSITE_SETTINGS,
  DEFAULT_HOMEPAGE_CONTENT,
} from '../services/contentService';

interface WebsiteSettingsContextType {
  settings: WebsiteSettings;
  homepageContent: HomepageContent;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (updates: Partial<WebsiteSettings>) => Promise<WebsiteSettings>;
  updateHomepage: (updates: Partial<HomepageContent>) => Promise<HomepageContent>;
}

const WebsiteSettingsContext = createContext<WebsiteSettingsContextType | undefined>(undefined);

export const WebsiteSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WebsiteSettings>(DEFAULT_WEBSITE_SETTINGS);
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE_CONTENT);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSettings = async () => {
    try {
      const [s, h] = await Promise.all([
        fetchWebsiteSettings(),
        fetchHomepageContent(),
      ]);
      setSettings(s);
      setHomepageContent(h);
    } catch (err) {
      console.warn('Could not refresh website settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();

    const handleSettingsEvent = (e: Event) => {
      const customEvent = e as CustomEvent<WebsiteSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        refreshSettings();
      }
    };

    const handleHomepageEvent = (e: Event) => {
      const customEvent = e as CustomEvent<HomepageContent>;
      if (customEvent.detail) {
        setHomepageContent(customEvent.detail);
      } else {
        refreshSettings();
      }
    };

    window.addEventListener('knr_settings_updated', handleSettingsEvent);
    window.addEventListener('knr_homepage_updated', handleHomepageEvent);

    return () => {
      window.removeEventListener('knr_settings_updated', handleSettingsEvent);
      window.removeEventListener('knr_homepage_updated', handleHomepageEvent);
    };
  }, []);

  const updateSettings = async (updates: Partial<WebsiteSettings>): Promise<WebsiteSettings> => {
    const updated = await updateSettingsService(updates);
    setSettings(updated);
    return updated;
  };

  const updateHomepage = async (updates: Partial<HomepageContent>): Promise<HomepageContent> => {
    const updated = await updateHomepageService(updates);
    setHomepageContent(updated);
    return updated;
  };

  return (
    <WebsiteSettingsContext.Provider
      value={{
        settings,
        homepageContent,
        isLoading,
        refreshSettings,
        updateSettings,
        updateHomepage,
      }}
    >
      {children}
    </WebsiteSettingsContext.Provider>
  );
};

export const useWebsiteSettings = (): WebsiteSettingsContextType => {
  const context = useContext(WebsiteSettingsContext);
  if (!context) {
    throw new Error('useWebsiteSettings must be used within a WebsiteSettingsProvider');
  }
  return context;
};

