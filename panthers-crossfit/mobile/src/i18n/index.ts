import { I18n } from 'i18n-js';
import en from './en';
import fr from './fr';

const i18n = new I18n({
  en,
  fr,
});

i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.enableFallback = true;

export default i18n;

// Translation helper
export const t = (key: string, options?: object): string => {
  return i18n.t(key, options);
};

// Language switcher
export const setLanguage = (locale: 'en' | 'fr') => {
  i18n.locale = locale;
};

export const getCurrentLanguage = (): string => {
  return i18n.locale;
};

