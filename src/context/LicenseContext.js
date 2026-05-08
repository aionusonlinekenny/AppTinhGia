import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_DAYS      = 7;
const RECHECK_DAYS    = 30;   // re-validate online every 30 days
const GRACE_DAYS      = 60;   // offline grace period before hard-lock

// ── Replace this with your deployed server URL ───────────────────
export const API_BASE = 'https://YOUR_SERVER_URL_HERE';

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
      const storedKey  = await AsyncStorage.getItem(K.LICENSE_KEY);
      const validatedAt = await AsyncStorage.getItem(K.VALIDATED_AT);

      if (storedKey && validatedAt) {
        const daysSince = (Date.now() - new Date(validatedAt).getTime()) / 86_400_000;
        if (daysSince < RECHECK_DAYS) {
          setStatus('active'); return;
        }
        // Time to re-check online
        const ok = await callValidateAPI(storedKey, did);
        if (ok) {
          setStatus('active'); return;
        }
        // Offline / server unreachable → grace period
        if (daysSince < GRACE_DAYS) {
          setStatus('active'); return;
        }
        setStatus('expired'); return;
      }

      // No license → trial countdown
      const daysPassed  = (Date.now() - new Date(installDate).getTime()) / 86_400_000;
      const remaining   = Math.ceil(TRIAL_DAYS - daysPassed);
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

  async function callValidateAPI(key, did) {
    try {
      const res = await fetch(`${API_BASE}/api/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, deviceId: did }),
        signal: AbortSignal.timeout(8000),
      });
      const json = await res.json();
      if (json.valid) {
        await AsyncStorage.setItem(K.VALIDATED_AT, new Date().toISOString());
        return true;
      }
      return false;
    } catch {
      return false; // network error → handled by caller
    }
  }

  async function activate(key) {
    setActivating(true);
    setError('');
    try {
      const clean = key.trim().toUpperCase();
      const ok = await callValidateAPI(clean, deviceId);
      if (ok) {
        await AsyncStorage.setItem(K.LICENSE_KEY, clean);
        setStatus('active');
      } else {
        setError('Invalid key or already activated on another device.');
      }
    } catch {
      setError('Cannot connect to server. Check your internet.');
    }
    setActivating(false);
  }

  return (
    <LicenseCtx.Provider value={{ status, daysLeft, activate, activating, error, deviceId }}>
      {children}
    </LicenseCtx.Provider>
  );
}

export function useLicense() {
  const ctx = useContext(LicenseCtx);
  if (!ctx) throw new Error('useLicense must be inside LicenseProvider');
  return ctx;
}
