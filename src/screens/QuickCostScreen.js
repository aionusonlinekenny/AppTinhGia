import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../components';
import { useI18n } from '../i18n';

const MARGINS = [30, 40, 50, 60, 70];

function uid() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 5);
}
function emptyRow() {
  return { id: uid(), name: '', quantity: '', pricePerUnit: '', unit: '' };
}

// ── Ingredient row ────────────────────────────────────────────────
function IngredientRow({ row, units, onChange, onRemove, showRemove, t, formatCurrency }) {
  const [showPicker, setShowPicker] = useState(false);
  const lineCost = (parseFloat(row.quantity) || 0) * (parseFloat(row.pricePerUnit) || 0);

  return (
    <View style={s.ingWrap}>
      <View style={s.ingRow}>
        <TextInput
          style={[s.ingCell, { flex: 1 }]}
          value={row.name}
          onChangeText={v => onChange('name', v)}
          placeholder={t('quickCost.ingName')}
          placeholderTextColor={COLORS.textLight}
        />
        <TextInput
          style={[s.ingCell, s.ingCellNum, { width: 54 }]}
          value={row.quantity}
          onChangeText={v => onChange('quantity', v)}
          placeholder="0"
          placeholderTextColor={COLORS.textLight}
          keyboardType="numeric"
        />
        <TextInput
          style={[s.ingCell, s.ingCellNum, { width: 70 }]}
          value={row.pricePerUnit}
          onChangeText={v => onChange('pricePerUnit', v)}
          placeholder="0.00"
          placeholderTextColor={COLORS.textLight}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={[s.ingCell, s.unitCell, { width: 48 }]}
          onPress={() => setShowPicker(v => !v)}
        >
          <Text style={s.unitCellText}>{row.unit || t('quickCost.unit')}</Text>
        </TouchableOpacity>
        {showRemove ? (
          <TouchableOpacity onPress={onRemove} style={s.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.removeBtnText}>✕</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 24 }} />}
      </View>

      {showPicker && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.unitPicker} contentContainerStyle={{ padding: 6, gap: 6 }}>
          {units.map(u => (
            <TouchableOpacity
              key={u}
              style={[s.unitChip, row.unit === u && s.unitChipOn]}
              onPress={() => { onChange('unit', u); setShowPicker(false); }}
            >
              <Text style={[s.unitChipTxt, row.unit === u && s.unitChipTxtOn]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {lineCost > 0 ? (
        <Text style={s.lineCost}>= {formatCurrency(lineCost)}</Text>
      ) : null}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────
export default function QuickCostScreen() {
  const { t, formatCurrency, config } = useI18n();
  const units = config.units;

  const [rows, setRows] = useState(() => [emptyRow(), emptyRow(), emptyRow()]);
  const [laborRate, setLaborRate]         = useState('');
  const [cookMinutes, setCookMinutes]     = useState('');
  const [overheadAmt, setOverheadAmt]     = useState('');

  function addRow()             { setRows(r => [...r, emptyRow()]); }
  function removeRow(id)        { setRows(r => r.filter(x => x.id !== id)); }
  function updateRow(id, k, v)  { setRows(r => r.map(x => x.id === id ? { ...x, [k]: v } : x)); }
  function handleReset() {
    setRows([emptyRow(), emptyRow(), emptyRow()]);
    setLaborRate(''); setCookMinutes(''); setOverheadAmt('');
  }

  const { ingredientCost, laborCost, overhead, totalCost } = useMemo(() => {
    const ingredientCost = rows.reduce((sum, r) => {
      return sum + (parseFloat(r.quantity) || 0) * (parseFloat(r.pricePerUnit) || 0);
    }, 0);
    const laborCost = (parseFloat(laborRate) || 0) / 60 * (parseFloat(cookMinutes) || 0);
    const overhead  = parseFloat(overheadAmt) || 0;
    return { ingredientCost, laborCost, overhead, totalCost: ingredientCost + laborCost + overhead };
  }, [rows, laborRate, cookMinutes, overheadAmt]);

  const hasResult = totalCost > 0;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* ── INGREDIENTS ───────────────────────────────── */}
          <View style={s.section}>
            <View style={s.sectionHdr}>
              <Text style={s.sectionTitle}>🥕 {t('quickCost.ingredients')}</Text>
              <TouchableOpacity onPress={handleReset} style={s.resetBtn}>
                <Text style={s.resetBtnTxt}>{t('quickCost.reset')}</Text>
              </TouchableOpacity>
            </View>

            {/* Column labels */}
            <View style={s.colHdrs}>
              <Text style={[s.colHdr, { flex: 1 }]}>{t('quickCost.ingredient')}</Text>
              <Text style={[s.colHdr, { width: 54 }]}>{t('quickCost.qty')}</Text>
              <Text style={[s.colHdr, { width: 70 }]}>{t('quickCost.priceUnit')}</Text>
              <Text style={[s.colHdr, { width: 48 }]}>{t('quickCost.unit')}</Text>
              <View style={{ width: 24 }} />
            </View>

            {rows.map(row => (
              <IngredientRow
                key={row.id}
                row={row}
                units={units}
                onChange={(k, v) => updateRow(row.id, k, v)}
                onRemove={() => removeRow(row.id)}
                showRemove={rows.length > 1}
                t={t}
                formatCurrency={formatCurrency}
              />
            ))}

            <TouchableOpacity onPress={addRow} style={s.addRowBtn}>
              <Text style={s.addRowBtnTxt}>+ {t('quickCost.addIngredient')}</Text>
            </TouchableOpacity>
          </View>

          {/* ── LABOR ─────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>👨‍🍳 {t('quickCost.labor')}</Text>
            <View style={s.row2}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={s.fieldLabel}>{t('quickCost.laborRate')}</Text>
                <View style={s.fieldRow}>
                  <TextInput
                    style={s.fieldInput}
                    value={laborRate}
                    onChangeText={setLaborRate}
                    placeholder="14.00"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                  />
                  <Text style={s.fieldSuffix}>/hr</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>{t('quickCost.cookTime')}</Text>
                <View style={s.fieldRow}>
                  <TextInput
                    style={s.fieldInput}
                    value={cookMinutes}
                    onChangeText={setCookMinutes}
                    placeholder="12"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                  />
                  <Text style={s.fieldSuffix}>min</Text>
                </View>
              </View>
            </View>
            {laborRate && cookMinutes ? (
              <Text style={s.calcHint}>
                = {formatCurrency((parseFloat(laborRate) || 0) / 60 * (parseFloat(cookMinutes) || 0))}
              </Text>
            ) : null}
          </View>

          {/* ── OVERHEAD ──────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>⚡ {t('quickCost.overhead')}</Text>
            <Text style={s.hint}>{t('quickCost.overheadHint')}</Text>
            <View style={s.fieldRow}>
              <TextInput
                style={[s.fieldInput, { flex: 1 }]}
                value={overheadAmt}
                onChangeText={setOverheadAmt}
                placeholder="2.50"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
              />
              <Text style={s.fieldSuffix}>{t('quickCost.perDish')}</Text>
            </View>
          </View>

          {/* ── RESULTS ───────────────────────────────────── */}
          {hasResult ? (
            <LinearGradient colors={GRADIENTS.quickCost} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.resultsCard}>
              <Text style={s.resultsTitle}>💰 {t('quickCost.results')}</Text>

              <View style={s.breakdownRow}>
                <Text style={s.bdLabel}>🥕 {t('quickCost.ingredientCost')}</Text>
                <Text style={s.bdVal}>{formatCurrency(ingredientCost)}</Text>
              </View>
              {laborCost > 0 ? (
                <View style={s.breakdownRow}>
                  <Text style={s.bdLabel}>👨‍🍳 {t('quickCost.laborCost')}</Text>
                  <Text style={s.bdVal}>{formatCurrency(laborCost)}</Text>
                </View>
              ) : null}
              {overhead > 0 ? (
                <View style={s.breakdownRow}>
                  <Text style={s.bdLabel}>⚡ {t('quickCost.overheadCost')}</Text>
                  <Text style={s.bdVal}>{formatCurrency(overhead)}</Text>
                </View>
              ) : null}

              <View style={s.totalRow}>
                <Text style={s.totalLabel}>{t('quickCost.totalCost')}</Text>
                <Text style={s.totalVal}>{formatCurrency(totalCost)}</Text>
              </View>

              <View style={s.divider} />
              <Text style={s.suggestTitle}>{t('quickCost.suggestedPrices')}</Text>
              <View style={s.priceGrid}>
                {MARGINS.map(m => (
                  <View key={m} style={s.priceChip}>
                    <Text style={s.priceChipPct}>{m}%</Text>
                    <Text style={s.priceChipVal}>{formatCurrency(totalCost / (1 - m / 100))}</Text>
                  </View>
                ))}
              </View>

              <Text style={s.disclaimer}>{t('quickCost.disclaimer')}</Text>
            </LinearGradient>
          ) : (
            <View style={s.emptyResult}>
              <Text style={s.emptyResultText}>{t('quickCost.emptyHint')}</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F7F8FA' },
  scroll:  { padding: 16 },

  section: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  sectionHdr:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  resetBtn:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F0F0F0' },
  resetBtnTxt:  { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },

  colHdrs: { flexDirection: 'row', marginBottom: 4, paddingHorizontal: 2 },
  colHdr:  { fontSize: 10, color: COLORS.textLight, fontWeight: '600', textTransform: 'uppercase' },

  ingWrap: { marginBottom: 4 },
  ingRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  ingCell: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 8, fontSize: 13, color: COLORS.text,
    backgroundColor: '#FAFAFA',
  },
  ingCellNum: { textAlign: 'center' },
  unitCell:   { alignItems: 'center', justifyContent: 'center' },
  unitCellText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  removeBtn:  { width: 24, alignItems: 'center' },
  removeBtnText: { fontSize: 14, color: '#CCC', fontWeight: '700' },

  unitPicker: { backgroundColor: '#F5F5F5', borderRadius: 8, marginBottom: 4 },
  unitChip:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD' },
  unitChipOn:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  unitChipTxt: { fontSize: 12, color: COLORS.text },
  unitChipTxtOn: { color: '#FFF', fontWeight: '700' },

  lineCost: { fontSize: 11, color: COLORS.primary, fontWeight: '600', textAlign: 'right', marginBottom: 2, paddingRight: 28 },

  addRowBtn:    { marginTop: 6, paddingVertical: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed' },
  addRowBtnTxt: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  row2:       { flexDirection: 'row' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  fieldRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, backgroundColor: '#FAFAFA', paddingHorizontal: 12, paddingVertical: 8 },
  fieldInput: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.text },
  fieldSuffix: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 },
  calcHint:   { fontSize: 11, color: COLORS.primary, fontWeight: '600', textAlign: 'right', marginTop: 6 },
  hint:       { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, lineHeight: 17 },

  resultsCard: {
    borderRadius: 20, padding: 20, marginBottom: 12,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  resultsTitle: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.85)', marginBottom: 14 },

  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bdLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  bdVal:   { fontSize: 13, color: '#FFF', fontWeight: '600' },

  totalRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)' },
  totalLabel: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  totalVal:   { fontSize: 26, fontWeight: '900', color: '#FFF' },

  divider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 16 },
  suggestTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginBottom: 10 },

  priceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priceChip: {
    flex: 1, minWidth: '28%', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, padding: 10, alignItems: 'center',
  },
  priceChipPct: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 2 },
  priceChipVal: { fontSize: 15, color: '#FFF', fontWeight: '800' },

  disclaimer: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 14, lineHeight: 14 },

  emptyResult: {
    backgroundColor: '#F0F0F0', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 12,
  },
  emptyResultText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});
