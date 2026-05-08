import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLicense } from '../context/LicenseContext';
import { COLORS } from '../components';

// ── Trial banner shown at top of app ─────────────────────────────
export function TrialBanner() {
  const { daysLeft } = useLicense();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>
        ⏳ Trial — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
      </Text>
      <TouchableOpacity onPress={() => setDismissed(true)} style={styles.bannerClose}>
        <Text style={styles.bannerCloseText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Full-screen lock shown when trial expired ─────────────────────
export function LicenseGate({ children }) {
  const { status } = useLicense();

  if (status === 'loading') {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (status === 'expired') {
    return <ActivationScreen />;
  }

  return (
    <>
      {status === 'trial' && <TrialBanner />}
      {children}
    </>
  );
}

// ── Activation screen ─────────────────────────────────────────────
function ActivationScreen() {
  const { activate, activating, error, deviceId } = useLicense();
  const [key, setKey] = useState('');

  function formatKey(raw) {
    // Auto-format as XXXX-XXXX-XXXX-XXXX
    const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16);
    return clean.match(/.{1,4}/g)?.join('-') || clean;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.lockIcon}>🔐</Text>
        <Text style={styles.title}>Menu Cost Pro</Text>
        <Text style={styles.subtitle}>Your free trial has ended</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activate License</Text>
          <Text style={styles.cardSub}>
            Enter the license key provided to unlock full access.
          </Text>

          <TextInput
            style={styles.keyInput}
            value={key}
            onChangeText={v => setKey(formatKey(v))}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            placeholderTextColor={COLORS.textLight}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={19}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.activateBtn, activating && styles.activateBtnDisabled]}
            onPress={() => activate(key)}
            disabled={activating || key.replace(/-/g, '').length < 16}
          >
            {activating
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.activateBtnText}>Activate</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need a license key?</Text>
          <Text style={styles.contactText}>
            Contact the app provider to purchase a license.
          </Text>
        </View>

        <Text style={styles.deviceId}>Device ID: {deviceId}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText:   { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },

  // Trial banner
  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FF8F00', paddingHorizontal: 16, paddingVertical: 8,
  },
  bannerText:      { flex: 1, fontSize: 13, color: '#FFF', fontWeight: '600' },
  bannerClose:     { padding: 4 },
  bannerCloseText: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },

  // Activation screen
  screen:    { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  lockIcon:  { fontSize: 64, marginBottom: 12 },
  title:     { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle:  { fontSize: 15, color: COLORS.textSecondary, marginBottom: 32 },

  card: {
    width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  cardSub:   { fontSize: 13, color: COLORS.textSecondary, marginBottom: 20, lineHeight: 18 },

  keyInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 20, fontWeight: '700', color: COLORS.text,
    textAlign: 'center', letterSpacing: 3, backgroundColor: '#FAFAFA',
    marginBottom: 12,
  },
  errorText: { fontSize: 13, color: '#E53935', textAlign: 'center', marginBottom: 12 },

  activateBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  activateBtnDisabled: { opacity: 0.5 },
  activateBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  contactCard: {
    width: '100%', backgroundColor: '#E8F5E9', borderRadius: 12,
    padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#C8E6C9',
  },
  contactTitle: { fontSize: 14, fontWeight: '700', color: '#2E7D32', marginBottom: 4 },
  contactText:  { fontSize: 13, color: '#388E3C', lineHeight: 18 },

  deviceId: { fontSize: 10, color: COLORS.textLight, textAlign: 'center' },
});
