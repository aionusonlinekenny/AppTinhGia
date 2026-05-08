import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { strings } from './strings';

const LANG_KEY     = '@app_language';
const CURRENCY_KEY = '@app_currency';

// ── Unit / currency config per mode ──────────────────────────────
export const UNIT_CONFIG = {
  usd: {
    symbol: '$', symbolBefore: true, decimals: 2,
    units: ['lb', 'oz', 'fl oz', 'gal', 'qt', 'pt', 'cup', 'tbsp', 'tsp',
            'each', 'pack', 'box', 'bag', 'bunch', 'slice', 'count'],
    boxUnits: ['box', 'bag', 'pack'],
    subUnits: ['lb', 'oz', 'piece', 'each'],
    yieldUnit: 'oz',
  },
  vnd: {
    symbol: '₫', symbolBefore: false, decimals: 0,
    units: ['kg', 'gram', 'lạng', 'lít', 'ml', 'chai', 'lon',
            'cái', 'hộp', 'túi', 'gói', 'bó', 'miếng', 'ổ', 'con'],
    boxUnits: ['hộp', 'túi', 'gói'],
    subUnits: ['gram', 'kg', 'cái', 'ml'],
    yieldUnit: 'gram',
  },
};

// ── Context ───────────────────────────────────────────────────────
const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLang]  = useState('en');
  const [currency, setCurr]  = useState('usd');
  const [ready,    setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(LANG_KEY),
      AsyncStorage.getItem(CURRENCY_KEY),
    ]).then(([lang, curr]) => {
      if (lang && strings[lang]) setLang(lang);
      if (curr && UNIT_CONFIG[curr]) setCurr(curr);
      setReady(true);
    });
  }, []);

  const setLanguage = useCallback(async (lang) => {
    setLang(lang);
    await AsyncStorage.setItem(LANG_KEY, lang);
  }, []);

  const setCurrency = useCallback(async (curr) => {
    setCurr(curr);
    await AsyncStorage.setItem(CURRENCY_KEY, curr);
  }, []);

  // Translation function: t('section.key', { param: value })
  const t = useCallback((key, params = {}) => {
    const parts = key.split('.');
    let val = strings[language];
    for (const p of parts) { val = val?.[p]; if (val === undefined) break; }
    // Fallback to English
    if (val === undefined) {
      val = strings.en;
      for (const p of parts) { val = val?.[p]; if (val === undefined) break; }
    }
    if (typeof val !== 'string') return key;
    return val.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? `{${k}}`));
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, currency, setCurrency, t, ready }}>
      {children}
    </I18nContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────
export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be inside I18nProvider');
  return { t: ctx.t, language: ctx.language, setLanguage: ctx.setLanguage };
}

export function useCurrency() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useCurrency must be inside I18nProvider');
  const { currency, setCurrency } = ctx;
  const config = UNIT_CONFIG[currency] || UNIT_CONFIG.usd;

  function formatCurrency(amount) {
    const n = amount || 0;
    if (currency === 'vnd') {
      return `${Math.round(n).toLocaleString('vi-VN')}₫`;
    }
    return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  function formatCurrencyShort(amount) {
    const n = amount || 0;
    if (currency === 'vnd') {
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr₫`;
      if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k₫`;
      return `${Math.round(n)}₫`;
    }
    return `$${n.toFixed(2)}`;
  }

  return { currency, setCurrency, formatCurrency, formatCurrencyShort, config };
}

// Convenience: access both at once
export function useI18n() {
  const { t, language, setLanguage } = useTranslation();
  const { currency, setCurrency, formatCurrency, formatCurrencyShort, config } = useCurrency();
  return { t, language, setLanguage, currency, setCurrency, formatCurrency, formatCurrencyShort, config };
}
