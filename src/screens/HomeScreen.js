import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useApp,
  calculateDishCost,
  calcSalesBreakdown,
  generateId,
  getWeekOf,
  offsetWeek,
  formatWeekRange,
} from '../context/AppContext';
import { COLORS, Card, Divider, Button, Input } from '../components';
import { useI18n } from '../i18n';
import SettingsModal from './SettingsModal';

export default function HomeScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const { departments, ingredients, overheadCosts, dishes, settings, salesRecords } = state;
  const { t, formatCurrency } = useI18n();
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Sales week state
  const [salesWeekOf, setSalesWeekOf] = useState(getWeekOf());
  const [salesModalVisible, setSalesModalVisible] = useState(false);
  const [salesForm, setSalesForm] = useState({ grossSales: '', cardTips: '0', cashTips: '0' });
  const [salesErrors, setSalesErrors] = useState({});

  const currentSalesRec = useMemo(
    () => salesRecords.find(r => r.weekOf === salesWeekOf),
    [salesRecords, salesWeekOf]
  );

  // Monthly financial overview
  const totalMonthlyWages = departments.reduce((sum, d) => sum + d.hourlyWage * d.hoursPerMonth, 0);
  const totalMonthlyOverhead = overheadCosts.reduce((sum, o) => sum + o.monthlyCost, 0);
  const totalFixed = totalMonthlyWages + totalMonthlyOverhead;

  const dishCosts = dishes.map(d => ({ dish: d, cost: calculateDishCost(d, state) }));
  const avgCost = dishCosts.length > 0
    ? dishCosts.reduce((s, dc) => s + dc.cost.totalCost, 0) / dishCosts.length
    : 0;
  const mostExpensive = dishCosts.reduce((max, dc) => (!max || dc.cost.totalCost > max.cost.totalCost ? dc : max), null);
  const cheapest = dishCosts.reduce((min, dc) => (!min || dc.cost.totalCost < min.cost.totalCost ? dc : min), null);

  // Sales helpers
  function openSalesModal() {
    if (currentSalesRec) {
      setSalesForm({
        grossSales: String(currentSalesRec.grossSales),
        cardTips: String(currentSalesRec.cardTips || 0),
        cashTips: String(currentSalesRec.cashTips || 0),
      });
    } else {
      setSalesForm({ grossSales: '', cardTips: '0', cashTips: '0' });
    }
    setSalesErrors({});
    setSalesModalVisible(true);
  }

  function validateSales() {
    const errs = {};
    if (!salesForm.grossSales || isNaN(Number(salesForm.grossSales)) || Number(salesForm.grossSales) < 0)
      errs.grossSales = 'Enter a valid sales amount';
    setSalesErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSaveSales() {
    if (!validateSales()) return;
    const taxRate = settings.salesTaxRate || 8;
    const data = {
      id: currentSalesRec?.id || generateId(),
      weekOf: salesWeekOf,
      grossSales: Number(salesForm.grossSales),
      taxRate,
      cardTips: Number(salesForm.cardTips) || 0,
      cashTips: Number(salesForm.cashTips) || 0,
    };
    dispatch({ type: currentSalesRec ? 'UPDATE_SALES_RECORD' : 'ADD_SALES_RECORD', payload: data });
    setSalesModalVisible(false);
  }

  function handleDeleteSales() {
    if (!currentSalesRec) return;
    dispatch({ type: 'DELETE_SALES_RECORD', payload: currentSalesRec.id });
  }

  const taxRate = settings.salesTaxRate || 8;
  const salesBreakdown = currentSalesRec
    ? calcSalesBreakdown(currentSalesRec.grossSales, currentSalesRec.taxRate || taxRate)
    : null;
  const totalTips = currentSalesRec
    ? (Number(currentSalesRec.cardTips) || 0) + (Number(currentSalesRec.cashTips) || 0)
    : 0;

  // Sales form preview
  const previewGross = Number(salesForm.grossSales) || 0;
  const previewBreakdown = previewGross > 0 ? calcSalesBreakdown(previewGross, taxRate) : null;

  const QUICK_ACTIONS = [
    { icon: '👥', label: t('home.staff'), tab: 'Staff', color: '#E3F2FD' },
    { icon: '🥕', label: t('tabs.ingredients'), tab: 'Ingredients', color: '#E8F5E9' },
    { icon: '⚡', label: t('home.overhead'), tab: 'Overhead', color: '#FFF8E1' },
    { icon: '🍽️', label: t('tabs.dishes'), tab: 'Dishes', color: '#FCE4EC' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.headerBg}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome! 👋</Text>
            <Text style={styles.appName}>{t('home.title')}</Text>
            <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.settingsBtn}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>🍴</Text>
            </View>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          <View style={styles.chip}><Text style={styles.chipValue}>{dishes.length}</Text><Text style={styles.chipLabel}>{t('home.dishes')}</Text></View>
          <View style={styles.chip}><Text style={styles.chipValue}>{ingredients.length}</Text><Text style={styles.chipLabel}>{t('home.ingredients')}</Text></View>
          <View style={styles.chip}><Text style={styles.chipValue}>{departments.length}</Text><Text style={styles.chipLabel}>{t('home.departments')}</Text></View>
          <View style={styles.chip}><Text style={styles.chipValue}>{overheadCosts.length}</Text><Text style={styles.chipLabel}>{t('home.costs')}</Text></View>
          <View style={styles.chip}><Text style={styles.chipValue}>{salesRecords.length}</Text><Text style={styles.chipLabel}>{t('home.salesWeeks')}</Text></View>
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Quick actions */}
        <Text style={styles.sectionTitle}>{t('home.quickAccess')}</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.tab}
              style={[styles.quickCard, { backgroundColor: action.color }]}
              onPress={() => navigation.navigate(action.tab)}
              activeOpacity={0.85}
            >
              <Text style={styles.quickIcon}>{action.icon}</Text>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── WEEKLY SALES & INCOME ── */}
        <Text style={styles.sectionTitle}>{t('home.weeklyIncome')}</Text>
        {/* Week navigator */}
        <View style={styles.salesWeekNav}>
          <TouchableOpacity onPress={() => setSalesWeekOf(w => offsetWeek(w, -1))} style={styles.salesWeekArrow}>
            <Text style={styles.salesWeekArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.salesWeekRange}>{formatWeekRange(salesWeekOf)}</Text>
          <TouchableOpacity onPress={() => setSalesWeekOf(w => offsetWeek(w, 1))} style={styles.salesWeekArrow}>
            <Text style={styles.salesWeekArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {currentSalesRec ? (
          <Card style={styles.salesCard}>
            {/* Gross / Net / Tax */}
            <View style={styles.salesTopRow}>
              <View style={styles.salesMainItem}>
                <Text style={styles.salesMainLabel}>{t('home.grossSales')}</Text>
                <Text style={styles.salesMainValue}>{formatCurrency(currentSalesRec.grossSales)}</Text>
              </View>
            </View>
            <Divider />
            <View style={styles.salesBreakRow}>
              <View style={styles.salesBreakItem}>
                <Text style={styles.salesBreakLabel}>{t('home.netSales')}</Text>
                <Text style={styles.salesBreakValue}>{formatCurrency(salesBreakdown?.netSales || 0)}</Text>
                <Text style={styles.salesBreakSub}>÷ 1.{(currentSalesRec.taxRate || taxRate).toString().padStart(2, '0')}</Text>
              </View>
              <View style={styles.salesBreakDivider} />
              <View style={styles.salesBreakItem}>
                <Text style={styles.salesBreakLabel}>{t('home.salesTax', { rate: currentSalesRec.taxRate || taxRate })}</Text>
                <Text style={[styles.salesBreakValue, styles.taxValue]}>
                  {formatCurrency(salesBreakdown?.taxCollected || 0)}
                </Text>
                <Text style={styles.salesBreakSub}>{t('home.collected')}</Text>
              </View>
              <View style={styles.salesBreakDivider} />
              <View style={styles.salesBreakItem}>
                <Text style={styles.salesBreakLabel}>{t('home.totalTips')}</Text>
                <Text style={[styles.salesBreakValue, styles.tipsValue]}>{formatCurrency(totalTips)}</Text>
                <Text style={styles.salesBreakSub}>
                  💳 {formatCurrency(currentSalesRec.cardTips || 0)} · 💵 {formatCurrency(currentSalesRec.cashTips || 0)}
                </Text>
              </View>
            </View>
            <View style={styles.salesActions}>
              <TouchableOpacity onPress={openSalesModal} style={styles.salesEditBtn}>
                <Text style={styles.salesEditText}>{t('home.editBtn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteSales} style={styles.salesDeleteBtn}>
                <Text style={styles.salesDeleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <TouchableOpacity style={styles.salesEmptyCard} onPress={openSalesModal}>
            <Text style={styles.salesEmptyIcon}>📊</Text>
            <Text style={styles.salesEmptyTitle}>{t('home.logWeekSales')}</Text>
            <Text style={styles.salesEmptyDesc}>
              {t('home.logWeekDesc', { rate: settings.salesTaxRate })}
            </Text>
            <View style={styles.salesEmptyBtn}>
              <Text style={styles.salesEmptyBtnText}>{t('home.addSalesRecord')}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Monthly Financial Overview */}
        <Text style={styles.sectionTitle}>{t('home.monthlyOverview')}</Text>
        <Card>
          <View style={styles.finRow}>
            <View style={styles.finItem}>
              <Text style={styles.finIcon}>💼</Text>
              <Text style={styles.finLabel}>{t('home.totalWages')}</Text>
              <Text style={styles.finValue}>{formatCurrency(totalMonthlyWages)}</Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.finItem}>
              <Text style={styles.finIcon}>🏭</Text>
              <Text style={styles.finLabel}>{t('home.overheadCosts')}</Text>
              <Text style={styles.finValue}>{formatCurrency(totalMonthlyOverhead)}</Text>
            </View>
          </View>
          <Divider />
          <View style={styles.totalFixed}>
            <Text style={styles.totalFixedLabel}>{t('home.totalFixedCosts')}</Text>
            <Text style={styles.totalFixedValue}>{formatCurrency(totalFixed)}</Text>
          </View>
          <View style={styles.perDishRow}>
            <Text style={styles.perDishLabel}>
              📅 {settings.workingDaysPerMonth} days/mo · 🍽️ {settings.totalDishesPerDay} dishes/day
            </Text>
            <Text style={styles.perDishValue}>
              {t('home.overheadPerDish')}: {formatCurrency(
                (settings.workingDaysPerMonth * settings.totalDishesPerDay) > 0
                  ? totalFixed / (settings.workingDaysPerMonth * settings.totalDishesPerDay)
                  : 0
              )}
            </Text>
          </View>
        </Card>

        {/* Dish insights */}
        {dishes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('home.dishInsights')}</Text>
            <View style={styles.insightRow}>
              <Card style={styles.insightCard}>
                <Text style={styles.insightIcon}>📈</Text>
                <Text style={styles.insightLabel}>{t('home.avgCost')}</Text>
                <Text style={styles.insightValue}>{formatCurrency(avgCost)}</Text>
              </Card>
              <Card style={styles.insightCard}>
                <Text style={styles.insightIcon}>💸</Text>
                <Text style={styles.insightLabel}>{t('home.mostExpensive')}</Text>
                <Text style={styles.insightValue}>{mostExpensive ? formatCurrency(mostExpensive.cost.totalCost) : '-'}</Text>
                {mostExpensive && <Text style={styles.insightSub}>{mostExpensive.dish.name}</Text>}
              </Card>
              <Card style={styles.insightCard}>
                <Text style={styles.insightIcon}>🪙</Text>
                <Text style={styles.insightLabel}>{t('home.cheapest')}</Text>
                <Text style={styles.insightValue}>{cheapest ? formatCurrency(cheapest.cost.totalCost) : '-'}</Text>
                {cheapest && <Text style={styles.insightSub}>{cheapest.dish.name}</Text>}
              </Card>
            </View>
          </>
        )}

        {/* Dish list preview */}
        {dishes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('home.dishCostList')}</Text>
            <Card>
              {dishCosts.slice(0, 5).map((dc, i) => (
                <TouchableOpacity
                  key={dc.dish.id}
                  style={[styles.dishPreviewRow, i > 0 && styles.dishPreviewBorder]}
                  onPress={() => navigation.navigate('Calculator', { dishId: dc.dish.id })}
                >
                  <View style={styles.dishPreviewInfo}>
                    <Text style={styles.dishPreviewName}>{dc.dish.name}</Text>
                    <Text style={styles.dishPreviewCat}>{dc.dish.category}</Text>
                  </View>
                  <View style={styles.dishPreviewRight}>
                    <Text style={styles.dishPreviewCost}>{formatCurrency(dc.cost.totalCost)}</Text>
                    <Text style={styles.dishPreviewSuggest}>Menu: {formatCurrency(dc.cost.totalCost / 0.5)}+</Text>
                  </View>
                  <Text style={styles.dishPreviewArrow}>›</Text>
                </TouchableOpacity>
              ))}
              {dishes.length > 5 && (
                <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('Dishes')}>
                  <Text style={styles.viewAllText}>{t('home.viewAllDishes', { count: dishes.length })}</Text>
                </TouchableOpacity>
              )}
            </Card>
          </>
        )}

        {/* Getting started */}
        {dishes.length === 0 && (
          <Card style={styles.startCard}>
            <Text style={styles.startTitle}>{t('home.getStarted')}</Text>
            <Text style={styles.startDesc}>{t('home.getStartedDesc')}</Text>
            {[
              { done: departments.length > 0, text: t('home.step1') },
              { done: ingredients.length > 0, text: t('home.step2') },
              { done: overheadCosts.length > 0, text: t('home.step3') },
              { done: dishes.length > 0, text: t('home.step4') },
            ].map((step, i) => (
              <View key={i} style={styles.startStep}>
                <Text style={[styles.startStepIcon, step.done && styles.stepDone]}>
                  {step.done ? '✅' : `${i + 1}.`}
                </Text>
                <Text style={[styles.startStepText, step.done && styles.stepDoneText]}>{step.text}</Text>
              </View>
            ))}
          </Card>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Sales entry modal */}
      <Modal visible={salesModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {currentSalesRec ? t('home.editWeeklySales') : t('home.logWeeklySales')}
            </Text>
            <Text style={styles.modalWeek}>{formatWeekRange(salesWeekOf)}</Text>

            <Input
              label={t('home.grossSalesInput', { rate: settings.salesTaxRate })}
              value={salesForm.grossSales}
              onChangeText={v => setSalesForm(f => ({ ...f, grossSales: v }))}
              placeholder={t('home.grossPlaceholder')}
              keyboardType="numeric"
              right="$"
              error={salesErrors.grossSales}
            />

            {/* Live tax preview */}
            {previewBreakdown && (
              <View style={styles.taxPreview}>
                <View style={styles.taxPreviewRow}>
                  <Text style={styles.taxPreviewLabel}>{t('home.netSalesLabel')}</Text>
                  <Text style={styles.taxPreviewVal}>{formatCurrency(previewBreakdown.netSales)}</Text>
                </View>
                <View style={styles.taxPreviewRow}>
                  <Text style={styles.taxPreviewLabel}>{t('home.salesTax', { rate: taxRate })}</Text>
                  <Text style={[styles.taxPreviewVal, { color: '#C62828' }]}>
                    {formatCurrency(previewBreakdown.taxCollected)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.row2}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label={t('home.cardTips')}
                  value={salesForm.cardTips}
                  onChangeText={v => setSalesForm(f => ({ ...f, cardTips: v }))}
                  placeholder="0.00"
                  keyboardType="numeric"
                  right="$"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('home.cashTips')}
                  value={salesForm.cashTips}
                  onChangeText={v => setSalesForm(f => ({ ...f, cashTips: v }))}
                  placeholder="0.00"
                  keyboardType="numeric"
                  right="$"
                />
              </View>
            </View>

            {(Number(salesForm.cardTips) > 0 || Number(salesForm.cashTips) > 0) && (
              <View style={styles.tipsPreview}>
                <Text style={styles.tipsPreviewLabel}>{t('home.totalTipsWeek')}</Text>
                <Text style={styles.tipsPreviewVal}>
                  {formatCurrency((Number(salesForm.cardTips) || 0) + (Number(salesForm.cashTips) || 0))}
                </Text>
                <Text style={styles.tipsPreviewHint}>
                  {t('home.tipsNote')}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <Button label={t('common.cancel')} variant="outline" onPress={() => setSalesModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button label={currentSalesRec ? t('common.update') : t('common.save')} onPress={handleSaveSales} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  headerBg: { backgroundColor: COLORS.primary, paddingTop: 16, paddingBottom: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  appName: { fontSize: 26, fontWeight: '800', color: '#FFF', marginTop: 2 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 22 },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoIcon: { fontSize: 30 },
  chipsRow: { paddingHorizontal: 20 },
  chip: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, marginRight: 10, alignItems: 'center' },
  chipValue: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  chipLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  scroll: { flex: 1 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 8 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  quickCard: { width: '47%', borderRadius: 14, padding: 16, alignItems: 'center' },
  quickIcon: { fontSize: 32, marginBottom: 8 },
  quickLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },

  // Weekly sales
  salesWeekNav: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10, overflow: 'hidden' },
  salesWeekArrow: { padding: 14 },
  salesWeekArrowText: { fontSize: 20, color: COLORS.primary, fontWeight: '500' },
  salesWeekRange: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: COLORS.text },

  salesCard: { marginBottom: 8 },
  salesTopRow: { paddingBottom: 8 },
  salesMainItem: { alignItems: 'center' },
  salesMainLabel: { fontSize: 12, color: COLORS.textSecondary },
  salesMainValue: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginTop: 4 },

  salesBreakRow: { flexDirection: 'row', paddingTop: 8, paddingBottom: 4 },
  salesBreakItem: { flex: 1, alignItems: 'center' },
  salesBreakDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  salesBreakLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  salesBreakValue: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 4, textAlign: 'center' },
  salesBreakSub: { fontSize: 10, color: COLORS.textLight, marginTop: 2, textAlign: 'center' },
  taxValue: { color: '#C62828' },
  tipsValue: { color: '#2E7D32' },

  salesActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  salesEditBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.secondary },
  salesEditText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  salesDeleteBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FFEBEE' },
  salesDeleteText: { fontSize: 14 },

  salesEmptyCard: { borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 8, backgroundColor: COLORS.surface },
  salesEmptyIcon: { fontSize: 36, marginBottom: 8 },
  salesEmptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  salesEmptyDesc: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18 },
  salesEmptyBtn: { marginTop: 12, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  salesEmptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  // Financial overview
  finRow: { flexDirection: 'row', marginBottom: 4 },
  finItem: { flex: 1, alignItems: 'center', padding: 8 },
  finDivider: { width: 1, backgroundColor: COLORS.border },
  finIcon: { fontSize: 24, marginBottom: 6 },
  finLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  finValue: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  totalFixed: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  totalFixedLabel: { fontSize: 13, color: COLORS.textSecondary },
  totalFixedValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  perDishRow: { backgroundColor: COLORS.secondary, borderRadius: 8, padding: 10, marginTop: 4 },
  perDishLabel: { fontSize: 12, color: COLORS.textSecondary },
  perDishValue: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginTop: 4 },

  insightRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  insightCard: { flex: 1, padding: 12, alignItems: 'center' },
  insightIcon: { fontSize: 22, marginBottom: 6 },
  insightLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  insightValue: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 4, textAlign: 'center' },
  insightSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },

  dishPreviewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  dishPreviewBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  dishPreviewInfo: { flex: 1 },
  dishPreviewName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  dishPreviewCat: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  dishPreviewRight: { alignItems: 'flex-end', marginRight: 8 },
  dishPreviewCost: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  dishPreviewSuggest: { fontSize: 11, color: COLORS.success, marginTop: 2 },
  dishPreviewArrow: { fontSize: 20, color: COLORS.textLight },
  viewAllBtn: { paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center' },
  viewAllText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },

  startCard: { borderWidth: 1, borderColor: COLORS.primaryLight },
  startTitle: { fontSize: 17, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  startDesc: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 18 },
  startStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  startStepIcon: { fontSize: 16, width: 30, color: COLORS.textSecondary, fontWeight: '700' },
  stepDone: { color: COLORS.success },
  startStepText: { fontSize: 14, color: COLORS.text, flex: 1 },
  stepDoneText: { color: COLORS.textSecondary, textDecorationLine: 'line-through' },

  // Sales modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  modalWeek: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 },
  row2: { flexDirection: 'row' },
  modalActions: { flexDirection: 'row', marginTop: 16 },

  taxPreview: { backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, marginBottom: 12 },
  taxPreviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  taxPreviewLabel: { fontSize: 13, color: COLORS.textSecondary },
  taxPreviewVal: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  tipsPreview: { backgroundColor: '#E8F5E9', borderRadius: 10, padding: 12, marginBottom: 12 },
  tipsPreviewLabel: { fontSize: 12, color: COLORS.textSecondary },
  tipsPreviewVal: { fontSize: 20, fontWeight: '800', color: '#2E7D32', marginTop: 4 },
  tipsPreviewHint: { fontSize: 11, color: '#388E3C', marginTop: 4 },
});
