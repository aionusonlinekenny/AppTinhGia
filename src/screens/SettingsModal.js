import React from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../i18n';
import { COLORS } from '../components';

export default function SettingsModal({ visible, onClose }) {
  const { t, language, setLanguage, currency, setCurrency } = useI18n();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <SafeAreaView style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>{t('settings.title')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={s.closeBtn}>{t('settings.done')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

            {/* ── Language ──────────────────────────────────────── */}
            <Text style={s.sectionTitle}>{t('settings.language')}</Text>
            <Text style={s.sectionDesc}>{t('settings.languageDesc')}</Text>
            <View style={s.optionRow}>
              <OptionBtn
                label="🇺🇸  English"
                selected={language === 'en'}
                onPress={() => setLanguage('en')}
              />
              <OptionBtn
                label="🇻🇳  Tiếng Việt"
                selected={language === 'vi'}
                onPress={() => setLanguage('vi')}
              />
            </View>

            <View style={s.divider} />

            {/* ── Currency & Units ──────────────────────────────── */}
            <Text style={s.sectionTitle}>{t('settings.currencyUnits')}</Text>
            <Text style={s.sectionDesc}>{t('settings.currencyDesc')}</Text>
            <View style={s.optionCol}>
              <OptionBtn
                label={t('settings.us')}
                selected={currency === 'usd'}
                onPress={() => setCurrency('usd')}
                wide
              />
              <OptionBtn
                label={t('settings.vn')}
                selected={currency === 'vnd'}
                onPress={() => setCurrency('vnd')}
                wide
              />
            </View>

            {/* Preview */}
            <View style={s.previewBox}>
              <Text style={s.previewLabel}>Preview</Text>
              <Text style={s.previewValue}>
                {currency === 'usd'
                  ? '$8.99 / lb  ·  oz  ·  gal'
                  : '89.000₫ / kg  ·  gram  ·  lít'}
              </Text>
            </View>

          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function OptionBtn({ label, selected, onPress, wide }) {
  return (
    <TouchableOpacity
      style={[s.optBtn, selected && s.optBtnActive, wide && s.optBtnWide]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[s.optRadio, selected && s.optRadioActive]}>
        {selected && <View style={s.optRadioDot} />}
      </View>
      <Text style={[s.optLabel, selected && s.optLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: '#F5F5F5', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#EEE',
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  title:    { fontSize: 17, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 15, fontWeight: '600', color: COLORS.primary },

  scroll: { padding: 20, paddingBottom: 40 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  sectionDesc:  { fontSize: 13, color: '#888', marginBottom: 12 },

  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 20 },

  optionRow: { flexDirection: 'row', gap: 10 },
  optionCol: { gap: 10 },

  optBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 2, borderColor: '#E0E0E0', flex: 1,
  },
  optBtnWide: { flex: undefined },
  optBtnActive: { borderColor: COLORS.primary, backgroundColor: '#FFF3EE' },

  optRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#CCC',
    alignItems: 'center', justifyContent: 'center',
  },
  optRadioActive: { borderColor: COLORS.primary },
  optRadioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },

  optLabel:       { fontSize: 14, color: COLORS.text, fontWeight: '500', flex: 1 },
  optLabelActive: { color: COLORS.primary, fontWeight: '700' },

  previewBox: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: '#EEE',
  },
  previewLabel: { fontSize: 11, color: '#aaa', marginBottom: 4 },
  previewValue: { fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: 'monospace' },
});
