import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, formatCurrency, calculateDishCost } from '../context/AppContext';
import { COLORS, Card, Divider } from '../components';

const QUICK_ACTIONS = [
  { icon: '👥', label: 'Staff', tab: 'Staff', color: '#E3F2FD' },
  { icon: '🥕', label: 'Ingredients', tab: 'Ingredients', color: '#E8F5E9' },
  { icon: '⚡', label: 'Overhead', tab: 'Overhead', color: '#FFF8E1' },
  { icon: '🍽️', label: 'Dishes', tab: 'Dishes', color: '#FCE4EC' },
];

export default function HomeScreen({ navigation }) {
  const { state } = useApp();
  const { departments, ingredients, overheadCosts, dishes, settings } = state;

  const totalMonthlyWages = departments.reduce(
    (sum, d) => sum + d.hourlyWage * d.hoursPerMonth, 0
  );
  const totalMonthlyOverhead = overheadCosts.reduce(
    (sum, o) => sum + o.monthlyCost, 0
  );
  const totalFixed = totalMonthlyWages + totalMonthlyOverhead;

  const dishCosts = dishes.map(d => ({
    dish: d,
    cost: calculateDishCost(d, state),
  }));
  const avgCost = dishCosts.length > 0
    ? dishCosts.reduce((s, dc) => s + dc.cost.totalCost, 0) / dishCosts.length
    : 0;

  const mostExpensive = dishCosts.reduce(
    (max, dc) => (!max || dc.cost.totalCost > max.cost.totalCost ? dc : max),
    null
  );
  const cheapest = dishCosts.reduce(
    (min, dc) => (!min || dc.cost.totalCost < min.cost.totalCost ? dc : min),
    null
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.headerBg}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome! 👋</Text>
            <Text style={styles.appName}>Menu Cost Pro</Text>
            <Text style={styles.subtitle}>Calculate food cost & maximize restaurant profit</Text>
          </View>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🍴</Text>
          </View>
        </View>

        {/* Summary chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipValue}>{dishes.length}</Text>
            <Text style={styles.chipLabel}>Dishes</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipValue}>{ingredients.length}</Text>
            <Text style={styles.chipLabel}>Ingredients</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipValue}>{departments.length}</Text>
            <Text style={styles.chipLabel}>Departments</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipValue}>{overheadCosts.length}</Text>
            <Text style={styles.chipLabel}>Costs</Text>
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Quick actions */}
        <Text style={styles.sectionTitle}>⚡ Quick Access</Text>
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

        {/* Financial overview */}
        <Text style={styles.sectionTitle}>📊 Monthly Financial Overview</Text>
        <Card>
          <View style={styles.finRow}>
            <View style={styles.finItem}>
              <Text style={styles.finIcon}>💼</Text>
              <Text style={styles.finLabel}>Total Wages</Text>
              <Text style={styles.finValue}>{formatCurrency(totalMonthlyWages)}</Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.finItem}>
              <Text style={styles.finIcon}>🏭</Text>
              <Text style={styles.finLabel}>Overhead Costs</Text>
              <Text style={styles.finValue}>{formatCurrency(totalMonthlyOverhead)}</Text>
            </View>
          </View>
          <Divider />
          <View style={styles.totalFixed}>
            <Text style={styles.totalFixedLabel}>
              Total Fixed Costs / month
            </Text>
            <Text style={styles.totalFixedValue}>{formatCurrency(totalFixed)}</Text>
          </View>
          <View style={styles.perDishRow}>
            <Text style={styles.perDishLabel}>
              📅 {settings.workingDaysPerMonth} days/mo ·
              🍽️ {settings.totalDishesPerDay} dishes/day
            </Text>
            <Text style={styles.perDishValue}>
              Overhead / dish: {formatCurrency(
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
            <Text style={styles.sectionTitle}>🔍 Dish Insights</Text>
            <View style={styles.insightRow}>
              <Card style={styles.insightCard}>
                <Text style={styles.insightIcon}>📈</Text>
                <Text style={styles.insightLabel}>Avg Cost</Text>
                <Text style={styles.insightValue}>{formatCurrency(avgCost)}</Text>
              </Card>
              <Card style={styles.insightCard}>
                <Text style={styles.insightIcon}>💸</Text>
                <Text style={styles.insightLabel}>Most Expensive</Text>
                <Text style={styles.insightValue}>
                  {mostExpensive ? formatCurrency(mostExpensive.cost.totalCost) : '-'}
                </Text>
                {mostExpensive && (
                  <Text style={styles.insightSub}>{mostExpensive.dish.name}</Text>
                )}
              </Card>
              <Card style={styles.insightCard}>
                <Text style={styles.insightIcon}>🪙</Text>
                <Text style={styles.insightLabel}>Cheapest</Text>
                <Text style={styles.insightValue}>
                  {cheapest ? formatCurrency(cheapest.cost.totalCost) : '-'}
                </Text>
                {cheapest && (
                  <Text style={styles.insightSub}>{cheapest.dish.name}</Text>
                )}
              </Card>
            </View>
          </>
        )}

        {/* Dish list preview */}
        {dishes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🍽️ Dish Cost List</Text>
            <Card>
              {dishCosts.slice(0, 5).map((dc, i) => (
                <TouchableOpacity
                  key={dc.dish.id}
                  style={[styles.dishPreviewRow, i > 0 && styles.dishPreviewBorder]}
                  onPress={() =>
                    navigation.navigate('Calculator', { dishId: dc.dish.id })
                  }
                >
                  <View style={styles.dishPreviewInfo}>
                    <Text style={styles.dishPreviewName}>{dc.dish.name}</Text>
                    <Text style={styles.dishPreviewCat}>{dc.dish.category}</Text>
                  </View>
                  <View style={styles.dishPreviewRight}>
                    <Text style={styles.dishPreviewCost}>
                      {formatCurrency(dc.cost.totalCost)}
                    </Text>
                    <Text style={styles.dishPreviewSuggest}>
                      Menu: {formatCurrency(dc.cost.totalCost / 0.5)}+
                    </Text>
                  </View>
                  <Text style={styles.dishPreviewArrow}>›</Text>
                </TouchableOpacity>
              ))}
              {dishes.length > 5 && (
                <TouchableOpacity
                  style={styles.viewAllBtn}
                  onPress={() => navigation.navigate('Dishes')}
                >
                  <Text style={styles.viewAllText}>
                    View all {dishes.length} dishes →
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          </>
        )}

        {/* Getting started */}
        {dishes.length === 0 && (
          <Card style={styles.startCard}>
            <Text style={styles.startTitle}>🚀 Get Started</Text>
            <Text style={styles.startDesc}>
              Complete these steps to accurately calculate food cost per dish:
            </Text>
            {[
              { done: departments.length > 0, text: 'Enter staff wages by department' },
              { done: ingredients.length > 0, text: 'Add ingredients and prices' },
              { done: overheadCosts.length > 0, text: 'Enter overhead costs (electricity, rent...)' },
              { done: dishes.length > 0, text: 'Create recipes for each dish' },
            ].map((step, i) => (
              <View key={i} style={styles.startStep}>
                <Text style={[styles.startStepIcon, step.done && styles.stepDone]}>
                  {step.done ? '✅' : `${i + 1}.`}
                </Text>
                <Text style={[styles.startStepText, step.done && styles.stepDoneText]}>
                  {step.text}
                </Text>
              </View>
            ))}
          </Card>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  headerBg: {
    backgroundColor: COLORS.primary,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  appName: { fontSize: 26, fontWeight: '800', color: '#FFF', marginTop: 2 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: { fontSize: 30 },
  chipsRow: { paddingHorizontal: 20 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  chipValue: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  chipLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  quickCard: {
    width: '47%',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  quickIcon: { fontSize: 32, marginBottom: 8 },
  quickLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  finRow: { flexDirection: 'row', marginBottom: 4 },
  finItem: { flex: 1, alignItems: 'center', padding: 8 },
  finDivider: { width: 1, backgroundColor: COLORS.border },
  finIcon: { fontSize: 24, marginBottom: 6 },
  finLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  finValue: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  totalFixed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalFixedLabel: { fontSize: 13, color: COLORS.textSecondary },
  totalFixedValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  perDishRow: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  perDishLabel: { fontSize: 12, color: COLORS.textSecondary },
  perDishValue: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginTop: 4 },
  insightRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  insightCard: { flex: 1, padding: 12, alignItems: 'center' },
  insightIcon: { fontSize: 22, marginBottom: 6 },
  insightLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  insightValue: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 4, textAlign: 'center' },
  insightSub: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  dishPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dishPreviewBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  dishPreviewInfo: { flex: 1 },
  dishPreviewName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  dishPreviewCat: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  dishPreviewRight: { alignItems: 'flex-end', marginRight: 8 },
  dishPreviewCost: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  dishPreviewSuggest: { fontSize: 11, color: COLORS.success, marginTop: 2 },
  dishPreviewArrow: { fontSize: 20, color: COLORS.textLight },
  viewAllBtn: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  viewAllText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  startCard: { borderWidth: 1, borderColor: COLORS.primaryLight },
  startTitle: { fontSize: 17, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  startDesc: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 18 },
  startStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  startStepIcon: { fontSize: 16, width: 30, color: COLORS.textSecondary, fontWeight: '700' },
  stepDone: { color: COLORS.success },
  startStepText: { fontSize: 14, color: COLORS.text, flex: 1 },
  stepDoneText: { color: COLORS.textSecondary, textDecorationLine: 'line-through' },
});
