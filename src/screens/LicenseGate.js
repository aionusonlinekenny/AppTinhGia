import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  StyleSheet, ActivityIndicator, ScrollView, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLicense } from '../context/LicenseContext';
import { COLORS } from '../components';

const STORE_URL = 'https://stonephovaldosta.com/license-api/store.html';

const FEATURES = [
  '✅ Unlimited menu items & recipes',
  '✅ Ingredient & supply cost tracking',
  '✅ Broth / stock batch costing',
  '✅ Staff payroll & labor costing',
  '✅ Dish profitability reports',
  '✅ Offline — works without internet',
];

// ── Purchase modal ────────────────────────────────────────────────
function PurchaseModal({ visible, onClose }) {
  const { activate, activating, error, deviceId } = useLicense();
  const [key, setKey] = useState('');
  const [tab, setTab] = useState('buy'); // 'buy' | 'activate'

  function formatKey(raw) {
    const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16);
    return clean.match(/.{1,4}/g)?.join('-') || clean;
  }

  function handleBuyNow() {
    Linking.openURL(STORE_URL).catch(() => {});
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pm.overlay}>
        <SafeAreaView style={pm.sheet}>
          <ScrollView contentContainerStyle={pm.scroll} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={pm.header}>
              <Text style={pm.headerTitle}>Menu Cost Pro</Text>
              <TouchableOpacity onPress={onClose} style={pm.closeBtn}>
                <Text style={pm.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Price badge */}
            <View style={pm.priceBadge}>
              <Text style={pm.priceAmount}>$5</Text>
              <Text style={pm.pricePer}>/month</Text>
            </View>
            <Text style={pm.priceNote}>per restaurant · cancel anytime</Text>

            {/* Features */}
            <View style={pm.featureBox}>
              {FEATURES.map((f, i) => (
                <Text key={i} style={pm.featureRow}>{f}</Text>
              ))}
            </View>

            {/* Tabs */}
            <View style={pm.tabRow}>
              <TouchableOpacity
                style={[pm.tabBtn, tab === 'buy' && pm.tabActive]}
                onPress={() => setTab('buy')}
              >
                <Text style={[pm.tabText, tab === 'buy' && pm.tabTextActive]}>Buy License</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[pm.tabBtn, tab === 'activate' && pm.tabActive]}
                onPress={() => setTab('activate')}
              >
                <Text style={[pm.tabText, tab === 'activate' && pm.tabTextActive]}>Enter Key</Text>
              </TouchableOpacity>
            </View>

            {tab === 'buy' ? (
              <View style={pm.tabContent}>
                <Text style={pm.buyInfo}>
                  Place your order on our website. You will receive a license key
                  by email within 24 hours.
                </Text>
                <TouchableOpacity style={pm.buyBtn} onPress={handleBuyNow}>
                  <Text style={pm.buyBtnText}>🛒 Buy Now — $5/month</Text>
                </TouchableOpacity>
                <Text style={pm.deviceIdLabel}>Your Device ID (include in order):</Text>
                <Text style={pm.deviceIdValue} selectable>{deviceId}</Text>
              </View>
            ) : (
              <View style={pm.tabContent}>
                <Text style={pm.buyInfo}>
                  Already purchased? Enter your license key below.
                </Text>
                <TextInput
                  style={pm.keyInput}
                  value={key}
                  onChangeText={v => setKey(formatKey(v))}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  placeholderTextColor={COLORS.textLight}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={19}
                />
                {error ? <Text style={pm.errorText}>{error}</Text> : null}
                <TouchableOpacity
                  style={[pm.activateBtn, (activating || key.replace(/-/g, '').length < 16) && pm.activateBtnDisabled]}
                  onPress={() => activate(key)}
                  disabled={activating || key.replace(/-/g, '').length < 16}
                >
                  {activating
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={pm.activateBtnText}>Activate</Text>
                  }
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ── Trial banner shown at top of app ─────────────────────────────
export function TrialBanner() {
  const { daysLeft } = useLicense();
  const [dismissed, setDismissed] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  if (dismissed) return null;
  return (
    <>
      <TouchableOpacity style={styles.banner} onPress={() => setShowPurchase(true)} activeOpacity={0.85}>
        <Text style={styles.bannerText}>
          ⏳ Trial — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining · Tap to upgrade $5/mo
        </Text>
        <TouchableOpacity onPress={() => setDismissed(true)} style={styles.bannerClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.bannerCloseText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      <PurchaseModal visible={showPurchase} onClose={() => setShowPurchase(false)} />
    </>
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

// ── Full-screen activation / expired screen ───────────────────────
function ActivationScreen() {
  const { activate, activating, error, deviceId } = useLicense();
  const [key, setKey] = useState('');
  const [showBuy, setShowBuy] = useState(false);

  function formatKey(raw) {
    const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16);
    return clean.match(/.{1,4}/g)?.join('-') || clean;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.lockIcon}>🔐</Text>
        <Text style={styles.title}>Menu Cost Pro</Text>
        <Text style={styles.subtitle}>Your free trial has ended</Text>

        {/* Pricing card */}
        <TouchableOpacity style={styles.pricingCard} onPress={() => setShowBuy(true)} activeOpacity={0.9}>
          <View style={styles.pricingTop}>
            <View>
              <Text style={styles.pricingAmount}>$5<Text style={styles.pricingPer}>/mo</Text></Text>
              <Text style={styles.pricingNote}>per restaurant · cancel anytime</Text>
            </View>
            <Text style={styles.pricingArrow}>›</Text>
          </View>
          <View style={styles.pricingFeatures}>
            {FEATURES.slice(0, 3).map((f, i) => (
              <Text key={i} style={styles.pricingFeatureText}>{f}</Text>
            ))}
            <Text style={styles.pricingMore}>+ more →</Text>
          </View>
        </TouchableOpacity>

        {/* Activation card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Already have a key?</Text>
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
            style={[styles.activateBtn, (activating || key.replace(/-/g, '').length < 16) && styles.activateBtnDisabled]}
            onPress={() => activate(key)}
            disabled={activating || key.replace(/-/g, '').length < 16}
          >
            {activating
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.activateBtnText}>Activate</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.deviceId}>Device ID: {deviceId}</Text>
      </ScrollView>

      <PurchaseModal visible={showBuy} onClose={() => setShowBuy(false)} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText:   { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },

  banner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FF8F00', paddingHorizontal: 16, paddingVertical: 9,
  },
  bannerText:      { flex: 1, fontSize: 12, color: '#FFF', fontWeight: '600' },
  bannerClose:     { padding: 4 },
  bannerCloseText: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },

  screen:    { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  lockIcon:  { fontSize: 64, marginBottom: 12 },
  title:     { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle:  { fontSize: 15, color: COLORS.textSecondary, marginBottom: 24 },

  pricingCard: {
    width: '100%', backgroundColor: COLORS.primary, borderRadius: 16, padding: 20,
    marginBottom: 16,
  },
  pricingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pricingAmount: { fontSize: 36, fontWeight: '900', color: '#FFF' },
  pricingPer:    { fontSize: 16, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
  pricingNote:   { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  pricingArrow:  { fontSize: 32, color: 'rgba(255,255,255,0.6)' },
  pricingFeatures: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 10 },
  pricingFeatureText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 3 },
  pricingMore:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  card: {
    width: '100%', backgroundColor: '#FFF', borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 14 },

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
  activateBtnDisabled: { opacity: 0.45 },
  activateBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  deviceId: { fontSize: 10, color: COLORS.textLight, textAlign: 'center', marginTop: 8 },
});

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  scroll:  { padding: 24 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: COLORS.text },
  closeBtn:    { padding: 4 },
  closeText:   { fontSize: 20, color: COLORS.textSecondary },

  priceBadge: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 4 },
  priceAmount: { fontSize: 56, fontWeight: '900', color: COLORS.primary, lineHeight: 60 },
  pricePer:    { fontSize: 20, color: COLORS.textSecondary, marginBottom: 6, marginLeft: 2 },
  priceNote:   { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },

  featureBox: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  featureRow: { fontSize: 14, color: COLORS.text, marginBottom: 6, lineHeight: 20 },

  tabRow:   { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 10, padding: 3, marginBottom: 16 },
  tabBtn:   { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText:      { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.text },

  tabContent: { paddingTop: 4 },
  buyInfo: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 16 },

  buyBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginBottom: 20,
  },
  buyBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  deviceIdLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  deviceIdValue: { fontSize: 11, color: COLORS.text, fontFamily: 'monospace', backgroundColor: '#F5F5F5', padding: 8, borderRadius: 6 },

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
  activateBtnDisabled: { opacity: 0.45 },
  activateBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
