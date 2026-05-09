import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_DAYS  = 7;
const GRACE_DAYS  = 60;   // offline grace period before hard-lock (when server unreachable)

// ── Your hosting URL — update the domain to match yours ──────────
// Files should be uploaded to: public_html/license-api/
export const API_BASE = 'https://stonephovaldosta.com/license-api';

const K = {
  INSTALL:      '@lic_install',
  DEVICE_ID:    '@lic_device',
  LICENSE_KEY:  '@lic_key',
  VALIDATED_AT: '@lic_validated_at',
};

function makeDeviceId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// status: 'loading' | 'trial' | 'active' | 'expired'
const LicenseCtx = createContext(null);

export function LicenseProvider({ children }) {
  const [status,     setStatus]     = useState('loading');
  const [daysLeft,   setDaysLeft]   = useState(TRIAL_DAYS);
  const [deviceId,   setDeviceId]   = useState('');
  const [error,      setError]      = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => { initLicense(); }, []);

  async function initLicense() {
    try {
      // Device ID (generated once, stored forever)
      let did = await AsyncStorage.getItem(K.DEVICE_ID);
      if (!did) {
        did = makeDeviceId();
        await AsyncStorage.setItem(K.DEVICE_ID, did);
      }
      setDeviceId(did);

      // Install date (first launch)
      let installDate = await AsyncStorage.getItem(K.INSTALL);
      if (!installDate) {
        installDate = new Date().toISOString();
        await AsyncStorage.setItem(K.INSTALL, installDate);
      }

      // Check existing license
      const storedKey   = await AsyncStorage.getItem(K.LICENSE_KEY);
      const validatedAt = await AsyncStorage.getItem(K.VALIDATED_AT);

      if (storedKey && validatedAt) {
        const daysSince = (Date.now() - new Date(validatedAt).getTime()) / 86_400_000;

        // Always try to validate online on every launch
        const result = await callValidateAPI(storedKey, did);

        if (result.ok) {
          setStatus('active'); return;
        }

        if (!result.offline) {
          // Server responded and explicitly rejected the key (deactivated / deleted)
          // Clear stored key so re-activation is required
          await AsyncStorage.removeItem(K.LICENSE_KEY);
          await AsyncStorage.removeItem(K.VALIDATED_AT);
          setStatus('expired'); return;
        }

        // Server unreachable (offline) → grace period based on last successful validation
        if (daysSince < GRACE_DAYS) {
          setStatus('active'); return;
        }
        setStatus('expired'); return;
      }

      // No license → trial countdown
      const daysPassed = (Date.now() - new Date(installDate).getTime()) / 86_400_000;
      const remaining  = Math.ceil(TRIAL_DAYS - daysPassed);
      if (remaining > 0) {
        setDaysLeft(remaining);
        setStatus('trial');
      } else {
        setStatus('expired');
      }
    } catch {
      setStatus('trial'); // safe fallback
    }
  }

  // Returns { ok, offline, msg }
  // ok=true              → server confirmed valid
  // ok=false, offline=false → server explicitly rejected (deactivated/deleted/invalid)
  // ok=false, offline=true  → couldn't reach server (network error / timeout)
  async function callValidateAPI(key, did) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(`${API_BASE}/validate.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, deviceId: did }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch {
        return { ok: false, offline: false, msg: `Server error (${res.status})` };
      }
      if (json.valid) {
        await AsyncStorage.setItem(K.VALIDATED_AT, new Date().toISOString());
        return { ok: true, offline: false };
      }
      return { ok: false, offline: false, msg: json.message || 'Invalid key' };
    } catch (e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') return { ok: false, offline: true, msg: 'Request timed out. Check your internet.' };
      return { ok: false, offline: true, msg: 'Cannot connect to server. Check your internet.' };
    }
  }

  async function activate(key) {
    setActivating(true);
    setError('');
    const clean = key.trim().toUpperCase();
    const result = await callValidateAPI(clean, deviceId);
    if (result.ok) {
      await AsyncStorage.setItem(K.LICENSE_KEY, clean);
      setStatus('active');
    } else {
      setError(result.msg || 'Activation failed.');
    }
    setActivating(false);
  }

  return (
    <LicenseCtx.Provider value={{ status, daysLeft, activate, activating, error, deviceId, isPro: status === 'active' }}>
      {children}
    </LicenseCtx.Provider>
  );
}

export function useLicense() {
  const ctx = useContext(LicenseCtx);
  if (!ctx) throw new Error('useLicense must be inside LicenseProvider');
  return ctx;
}
