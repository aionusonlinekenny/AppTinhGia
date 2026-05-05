import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, formatCurrency, calculateDishCost, suggestPrices } from '../context/AppContext';
import {
  COLORS,
  Header,
  Card,
  Button,
  Divider,
  EmptyState,
} from '../components';

const PROFIT_COLORS = [
  { bg: '#E8F5E9', text: '#2E7D32', border: '#4CAF50' }, // 30%
  { bg: '#E3F2FD', text: '#1565C0', border: '#2196F3' }, // 40%
  { bg: '#FFF8E1', text: '#E65100', border: '#FF9800' }, // 50%
  { bg: '#FCE4EC', text: '#880E4F', border: '#E91E63' }, // 60%
  { bg: '#EDE7F6', text: '#4527A0', border: '#9C27B0' }, // 70%
];

export default function CalculatorScreen({ route }) {
  const { state } = useApp();
  const { dishes } = state;
  const preSelectedId = route?.params?.dishId;

  const [selectedDishId, setSelectedDishId] = useState(preSelectedId || null);
  const [customProfitInput, setCustomProfitInput] = useState('');
  const [showAllDishes, setShowAllDishes] = useState(!preSelectedId);

  const selectedDish = dishes.find(d => d.id === selectedDishId);
  const cost = selectedDish ? calculateDishCost(selectedDish, state) : null;
  const suggestions = cost ? suggestPrices(cost.totalCost) : [];

  const customPrice = useMemo(() => {
    const pct = parseFloat(customProfitInput);
    if (isNaN(pct) || pct <= 0 || pct >= 100) return null;
    return cost ? cost.totalCost / (1 - pct / 100) : null;
  }, [customProfitInput, cost]);

  async function handleShare() {
    if (!selectedDish || !cost) return;
    const lines = [
      `📊 BÁO GIÁ: ${selectedDish.name}`,
      '',
      '─── CHI PHÍ ───',
      `🥕 Nguyên liệu:  ${formatCurrency(cost.ingredientCost)}`,
      `👤 Nhân công:    ${formatCurrency(cost.laborCost)}`,
      `⚡ Vận hành:     ${formatCurrency(cost.overheadPerDish)}`,
      `💰 Giá thành:    ${formatCurrency(cost.totalCost)}`,
      '',
      '─── GỢI Ý GIÁ MENU ───',
      ...suggestions.map(s => `${s.label}: ${formatCurrency(s.price)}`),
    ];
    await Share.share({ message: lines.join('\n') });
  }

  function roundPrice(price) {
    if (price < 10000) return Math.ceil(price / 500) * 500;
    if (price < 100000) return Math.ceil(price / 1000) * 1000;
    if (price < 500000) return Math.ceil(price / 5000) * 5000;
    return Math.ceil(price / 10000) * 10000;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Header
        title="Tính giá menu"
        subtitle="Phân tích giá thành và gợi ý giá bán"
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Dish selector */}
        <Card>
          <Text style={styles.sectionTitle}>📌 Chọn món ăn</Text>
          {dishes.length === 0 ? (
            <EmptyState icon="🍽️" message="Chưa có món ăn. Vào tab Món ăn để thêm." />
          ) : (
            <>
              {selectedDish && (
                <View style={styles.selectedDish}>
                  <Text style={styles.selectedIcon}>✅</Text>
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedName}>{selectedDish.name}</Text>
                    <Text style={styles.selectedCat}>{selectedDish.category}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => { setSelectedDishId(null); setShowAllDishes(true); }}
                    style={styles.changeBtn}
                  >
                    <Text style={styles.changeBtnText}>Đổi</Text>
                  </TouchableOpacity>
                </View>
              )}
              {(showAllDishes || !selectedDish) && (
                <View style={styles.dishList}>
                  {dishes.map(d => (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        styles.dishChip,
                        selectedDishId === d.id && styles.dishChipActive,
                      ]}
                      onPress={() => {
                        setSelectedDishId(d.id);
                        setShowAllDishes(false);
                      }}
                    >
                      <Text style={[
                        styles.dishChipText,
                        selectedDishId === d.id && styles.dishChipTextActive,
                      ]}>
                        {d.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </Card>

        {/* Cost breakdown */}
        {cost && (
          <>
            <Card style={styles.costCard}>
              <Text style={styles.sectionTitle}>💰 Phân tích chi phí</Text>
              <Divider />

              <View style={styles.costRow}>
                <View style={[styles.costBar, { backgroundColor: '#FF8A80' }]}>
                  <Text style={styles.costBarLabel}>🥕 Nguyên liệu</Text>
                  <Text style={styles.costBarValue}>{formatCurrency(cost.ingredientCost)}</Text>
                  <Text style={styles.costBarPct}>
                    {cost.totalCost > 0
                      ? ((cost.ingredientCost / cost.totalCost) * 100).toFixed(0)
                      : 0}%
                  </Text>
                </View>
              </View>

              <View style={styles.costRow}>
                <View style={[styles.costBar, { backgroundColor: '#82B1FF' }]}>
                  <Text style={styles.costBarLabel}>👤 Nhân công</Text>
                  <Text style={styles.costBarValue}>{formatCurrency(cost.laborCost)}</Text>
                  <Text style={styles.costBarPct}>
                    {cost.totalCost > 0
                      ? ((cost.laborCost / cost.totalCost) * 100).toFixed(0)
                      : 0}%
                  </Text>
                </View>
              </View>

              <View style={styles.costRow}>
                <View style={[styles.costBar, { backgroundColor: '#FFFF8D' }]}>
                  <Text style={styles.costBarLabel}>⚡ Vận hành</Text>
                  <Text style={styles.costBarValue}>{formatCurrency(cost.overheadPerDish)}</Text>
                  <Text style={styles.costBarPct}>
                    {cost.totalCost > 0
                      ? ((cost.overheadPerDish / cost.totalCost) * 100).toFixed(0)
                      : 0}%
                  </Text>
                </View>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TỔNG GIÁ THÀNH (COST)</Text>
                <Text style={styles.totalValue}>{formatCurrency(cost.totalCost)}</Text>
              </View>
            </Card>

            {/* Price suggestions */}
            <Text style={styles.suggestTitle}>🏷️ Gợi ý giá trên menu</Text>
            {suggestions.map((s, i) => {
              const col = PROFIT_COLORS[i];
              const rounded = roundPrice(s.price);
              return (
                <View
                  key={i}
                  style={[styles.priceCard, { backgroundColor: col.bg, borderColor: col.border }]}
                >
                  <View style={styles.priceLeft}>
                    <View style={[styles.pctBadge, { backgroundColor: col.border }]}>
                      <Text style={styles.pctText}>{s.percentage}%</Text>
                    </View>
                    <View>
                      <Text style={[styles.priceLabel, { color: col.text }]}>{s.label}</Text>
                      <Text style={styles.priceNote}>
                        Lãi: {formatCurrency(s.price - cost.totalCost)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.priceRight}>
                    <Text style={[styles.priceExact, { color: col.text }]}>
                      {formatCurrency(s.price)}
                    </Text>
                    {rounded !== Math.round(s.price) && (
                      <Text style={[styles.priceRounded, { color: col.border }]}>
                        ≈ {formatCurrency(rounded)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Custom profit */}
            <Card>
              <Text style={styles.sectionTitle}>🎯 Tính giá theo % tùy chỉnh</Text>
              <View style={styles.customRow}>
                <View style={styles.customInputBox}>
                  <Text style={styles.customPrefix}>Lãi</Text>
                  <View style={styles.customInput}>
                    <Text
                      style={styles.customInputText}
                      onPress={() => {}}
                    >
                    </Text>
                  </View>
                  {[10, 20, 25, 35, 45, 55, 65, 75].map(pct => (
                    <TouchableOpacity
                      key={pct}
                      onPress={() => setCustomProfitInput(String(pct))}
                      style={[
                        styles.customPctBtn,
                        customProfitInput === String(pct) && styles.customPctBtnActive,
                      ]}
                    >
                      <Text style={[
                        styles.customPctText,
                        customProfitInput === String(pct) && styles.customPctTextActive,
                      ]}>
                        {pct}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {customPrice !== null && (
                <View style={styles.customResult}>
                  <Text style={styles.customResultLabel}>
                    Giá bán với lãi {customProfitInput}%:
                  </Text>
                  <Text style={styles.customResultValue}>{formatCurrency(customPrice)}</Text>
                  <Text style={styles.customResultRounded}>
                    Làm tròn: {formatCurrency(roundPrice(customPrice))}
                  </Text>
                  <Text style={styles.customResultProfit}>
                    Lợi nhuận: {formatCurrency(customPrice - cost.totalCost)} / món
                  </Text>
                </View>
              )}
            </Card>

            {/* Ingredient detail */}
            {selectedDish?.ingredients?.length > 0 && (
              <Card>
                <Text style={styles.sectionTitle}>📋 Chi tiết nguyên liệu</Text>
                <Divider />
                {selectedDish.ingredients.map(item => {
                  const ing = state.ingredients.find(i => i.id === item.ingredientId);
                  if (!ing) return null;
                  const itemCost = ing.pricePerUnit * item.quantity;
                  return (
                    <View key={item.ingredientId} style={styles.detailRow}>
                      <View style={styles.detailInfo}>
                        <Text style={styles.detailName}>{ing.name}</Text>
                        <Text style={styles.detailQty}>
                          {item.quantity} {ing.unit} × {formatCurrency(ing.pricePerUnit)}
                        </Text>
                      </View>
                      <Text style={styles.detailCost}>{formatCurrency(itemCost)}</Text>
                    </View>
                  );
                })}
              </Card>
            )}

            {/* Labor detail */}
            {selectedDish?.laborTime?.length > 0 && (
              <Card>
                <Text style={styles.sectionTitle}>⏱️ Chi tiết nhân công</Text>
                <Divider />
                {selectedDish.laborTime.map(item => {
                  const dept = state.departments.find(d => d.id === item.departmentId);
                  if (!dept) return null;
                  const itemCost = (dept.hourlyWage / 60) * item.minutes;
                  return (
                    <View key={item.departmentId} style={styles.detailRow}>
                      <View style={styles.detailInfo}>
                        <Text style={styles.detailName}>{dept.name}</Text>
                        <Text style={styles.detailQty}>
                          {item.minutes} phút × {formatCurrency(dept.hourlyWage)}/h
                        </Text>
                      </View>
                      <Text style={styles.detailCost}>{formatCurrency(itemCost)}</Text>
                    </View>
                  );
                })}
              </Card>
            )}

            <Button
              label="📤 Chia sẻ báo giá"
              onPress={handleShare}
              style={styles.shareBtn}
            />
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  selectedDish: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  selectedIcon: { fontSize: 22, marginRight: 10 },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  selectedCat: { fontSize: 12, color: COLORS.primary },
  changeBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  dishList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dishChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dishChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dishChipText: { fontSize: 14, color: COLORS.text },
  dishChipTextActive: { color: '#FFF', fontWeight: '600' },
  costCard: { marginBottom: 8 },
  costRow: { marginBottom: 8 },
  costBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  costBarLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: '#333' },
  costBarValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  costBarPct: { fontSize: 12, color: '#555', width: 32, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
  },
  totalLabel: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  totalValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  suggestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 4,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  priceLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pctBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  priceLabel: { fontSize: 14, fontWeight: '700' },
  priceNote: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  priceRight: { alignItems: 'flex-end' },
  priceExact: { fontSize: 18, fontWeight: '700' },
  priceRounded: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  customRow: { gap: 8 },
  customInputBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  customPrefix: { fontSize: 14, color: COLORS.textSecondary },
  customInput: {},
  customInputText: { fontSize: 15, color: COLORS.text },
  customPctBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  customPctBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  customPctText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  customPctTextActive: { color: '#FFF', fontWeight: '700' },
  customResult: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFCC80',
  },
  customResultLabel: { fontSize: 12, color: COLORS.textSecondary },
  customResultValue: { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  customResultRounded: { fontSize: 14, color: COLORS.primaryDark, marginTop: 2 },
  customResultProfit: { fontSize: 12, color: COLORS.success, marginTop: 4 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailInfo: { flex: 1 },
  detailName: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  detailQty: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  detailCost: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  shareBtn: { marginTop: 8, marginBottom: 8 },
});
