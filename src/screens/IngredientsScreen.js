import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useApp,
  generateId,
  getWeekOf,
  offsetWeek,
  formatWeekRange,
  getIngredientPricePerDishUnit,
  getIngredientDishUnit,
  getIngredientPrepCostPerDishUnit,
  calculateStockCostPerOz,
  calcGroupWeightedRate,
} from '../context/AppContext';
import {
  COLORS,
  GRADIENTS,
  FAB,
  Header,
  Card,
  Button,
  Input,
  SectionTitle,
  EmptyState,
  Divider,
} from '../components';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '../i18n';
import { useLicense } from '../context/LicenseContext';
import { TrialLimitModal } from './LicenseGate';

const CATEGORIES = ['Meat', 'Seafood', 'Produce', 'Starch', 'Spices', 'Dairy & Eggs', 'Beverages', 'Other'];

const CATEGORY_ICONS = {
  'Meat': '🥩',
  'Seafood': '🦐',
  'Produce': '🥦',
  'Starch': '🍚',
  'Spices': '🧂',
  'Dairy & Eggs': '🥚',
  'Beverages': '🥤',
  'Other': '📦',
};

export default function IngredientsScreen() {
  const { state, dispatch } = useApp();
  const { t, formatCurrency, config } = useI18n();
  const { ingredients, supplyOrders, stockRecipes = [], employees = [] } = state;
  const [activeTab, setActiveTab] = useState(0);

  const TABS = [t('ingredients.tabIngredients'), t('ingredients.tabStocks'), t('ingredients.tabOrders')];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Header
        title={t('ingredients.title')}
        subtitle={t('ingredients.subtitle')}
      />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.tabBtn, activeTab === idx && styles.tabBtnActive]}
            onPress={() => setActiveTab(idx)}
          >
            <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 0 && (
        <IngredientsTab ingredients={ingredients} employees={employees} dispatch={dispatch} t={t} formatCurrency={formatCurrency} config={config} />
      )}
      {activeTab === 1 && (
        <StocksTab stockRecipes={stockRecipes} ingredients={ingredients} employees={employees} dispatch={dispatch} t={t} formatCurrency={formatCurrency} config={config} />
      )}
      {activeTab === 2 && (
        <WeeklyOrdersTab ingredients={ingredients} supplyOrders={supplyOrders} dispatch={dispatch} t={t} formatCurrency={formatCurrency} config={config} />
      )}
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────
// INGREDIENTS TAB
// ────────────────────────────────────────────────────────────────
function IngredientsTab({ ingredients, employees, dispatch, t, formatCurrency, config }) {
  const UNITS     = config.units;
  const SUB_UNITS = config.subUnits;
  const BOX_UNITS = config.boxUnits;
  function isBoxUnit(unit) { return BOX_UNITS.includes((unit || '').toLowerCase()); }

  const prepRate = calcGroupWeightedRate(employees || [], 'prep');

  const catLabel = (cat) => {
    const map = {
      'Meat': t('ingredients.catMeat'), 'Seafood': t('ingredients.catSeafood'),
      'Produce': t('ingredients.catProduce'), 'Starch': t('ingredients.catStarch'),
      'Spices': t('ingredients.catSpices'), 'Dairy & Eggs': t('ingredients.catDairy'),
      'Beverages': t('ingredients.catBeverages'), 'Other': t('ingredients.catOther'),
    };
    return map[cat] || cat;
  };

  const { isPro } = useLicense();
  const [showLimit, setShowLimit] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [form, setForm] = useState({ name: '', unit: UNITS[0] || 'lb', pricePerUnit: '', category: 'Other', unitsPerBox: '', subUnit: SUB_UNITS[0] || 'lb', prepTimePerUnit: '' });
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubUnitPicker, setShowSubUnitPicker] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = ['All', ...CATEGORIES];

  const filtered = useMemo(() => {
    return ingredients.filter(i => {
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'All' || i.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [ingredients, search, selectedCategory]);

  function openAdd() {
    if (!isPro && ingredients.length >= 1) { setShowLimit(true); return; }
    setEditing(null);
    setForm({ name: '', unit: UNITS[0] || 'lb', pricePerUnit: '', category: 'Other', unitsPerBox: '', subUnit: SUB_UNITS[0] || 'lb', prepTimePerUnit: '' });
    setErrors({});
    setModalVisible(true);
  }

  function openEdit(ing) {
    setEditing(ing);
    setForm({
      name: ing.name,
      unit: ing.unit,
      pricePerUnit: String(ing.pricePerUnit),
      category: ing.category,
      unitsPerBox: ing.unitsPerBox ? String(ing.unitsPerBox) : '',
      subUnit: ing.subUnit || SUB_UNITS[0] || 'lb',
      prepTimePerUnit: ing.prepTimePerUnit ? String(ing.prepTimePerUnit) : '',
    });
    setErrors({});
    setModalVisible(true);
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = t('ingredients.errName');
    if (!form.pricePerUnit || isNaN(Number(form.pricePerUnit)) || Number(form.pricePerUnit) <= 0)
      errs.pricePerUnit = t('ingredients.errPrice');
    if (isBoxUnit(form.unit) && (!form.unitsPerBox || isNaN(Number(form.unitsPerBox)) || Number(form.unitsPerBox) <= 0))
      errs.unitsPerBox = t('ingredients.errUnitsPerBox');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const data = {
      id: editing?.id || generateId(),
      name: form.name.trim(),
      unit: form.unit,
      pricePerUnit: Number(form.pricePerUnit),
      category: form.category,
      prepTimePerUnit: form.prepTimePerUnit ? Number(form.prepTimePerUnit) : 0,
      ...(isBoxUnit(form.unit) ? {
        unitsPerBox: Number(form.unitsPerBox),
        subUnit: form.subUnit,
      } : { unitsPerBox: null, subUnit: null }),
    };
    dispatch({ type: editing ? 'UPDATE_INGREDIENT' : 'ADD_INGREDIENT', payload: data });
    setModalVisible(false);
  }

  function handleDelete(ing) {
    Alert.alert(t('ingredients.deleteIngTitle'), t('ingredients.deleteIngMsg', { ingName: ing.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_INGREDIENT', payload: ing.id }),
      },
    ]);
  }

  const groupedByCategory = useMemo(() => {
    if (selectedCategory !== 'All') return null;
    const groups = {};
    filtered.forEach(i => {
      if (!groups[i.category]) groups[i.category] = [];
      groups[i.category].push(i);
    });
    return groups;
  }, [filtered, selectedCategory]);

  function renderIngredient(ing) {
    const isBox = isBoxUnit(ing.unit);
    const dishUnit = getIngredientDishUnit(ing);
    const pricePerDishUnit = getIngredientPricePerDishUnit(ing);
    const prepCostPerDishUnit = getIngredientPrepCostPerDishUnit(ing, prepRate);
    const hasPrepCost = prepCostPerDishUnit > 0;
    return (
      <View key={ing.id} style={styles.ingRow}>
        <Text style={styles.ingIcon}>{CATEGORY_ICONS[ing.category] || '📦'}</Text>
        <View style={styles.ingInfo}>
          <Text style={styles.ingName}>{ing.name}</Text>
          <Text style={styles.ingPrice}>
            {formatCurrency(ing.pricePerUnit)} / {ing.unit}
            {isBox && ing.unitsPerBox ? ` · ${ing.unitsPerBox} ${ing.subUnit || SUB_UNITS[0] || 'lb'}` : ''}
          </Text>
          {(isBox && ing.unitsPerBox) || hasPrepCost ? (
            <View>
              {isBox && ing.unitsPerBox ? (
                <Text style={styles.ingSubPrice}>
                  {t('ingredients.price')}: {formatCurrency(pricePerDishUnit)}/{dishUnit}
                </Text>
              ) : null}
              {hasPrepCost ? (
                <Text style={[styles.ingSubPrice, { color: '#66BB6A' }]}>
                  🔪 {t('ingredients.prepCost')}: +{formatCurrency(prepCostPerDishUnit)}/{dishUnit}
                </Text>
              ) : null}
              {hasPrepCost ? (
                <Text style={[styles.ingSubPrice, { fontWeight: '700', color: COLORS.text }]}>
                  {t('ingredients.totalEffective')}: {formatCurrency(pricePerDishUnit + prepCostPerDishUnit)}/{dishUnit}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
        <View style={styles.ingActions}>
          <TouchableOpacity onPress={() => openEdit(ing)} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(ing)} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t('ingredients.searchPlaceholder')}
            placeholderTextColor={COLORS.textLight}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <FAB onPress={openAdd} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
          >
            <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>
              {cat === 'All' ? t('ingredients.allCategories') : `${CATEGORY_ICONS[cat]} ${catLabel(cat)}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {filtered.length === 0 ? (
          <EmptyState icon="🥕" message={t('ingredients.noIngredients')} />
        ) : selectedCategory === 'All' && groupedByCategory ? (
          Object.entries(groupedByCategory).map(([cat, items]) => (
            <Card key={cat}>
              <Text style={styles.groupTitle}>{CATEGORY_ICONS[cat]} {catLabel(cat)} ({items.length})</Text>
              <Divider />
              {items.map(renderIngredient)}
            </Card>
          ))
        ) : (
          <Card>{filtered.map(renderIngredient)}</Card>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <TrialLimitModal visible={showLimit} onClose={() => setShowLimit(false)} itemKey="Ingredient" />
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                {editing ? t('ingredients.updateTitle') : t('ingredients.addTitle')}
              </Text>
              <Input
                label={t('ingredients.nameLabel')}
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                placeholder={t('ingredients.namePlaceholder')}
                error={errors.name}
              />
              <Input
                label={t('ingredients.price')}
                value={form.pricePerUnit}
                onChangeText={v => setForm(f => ({ ...f, pricePerUnit: v }))}
                placeholder={t('ingredients.pricePlaceholder')}
                keyboardType="numeric"
                right="$"
                error={errors.pricePerUnit}
              />

              <Text style={styles.pickLabel}>{t('ingredients.unit')}</Text>
              <TouchableOpacity
                style={styles.pickBtn}
                onPress={() => setShowUnitPicker(!showUnitPicker)}
              >
                <Text style={styles.pickValue}>{form.unit}</Text>
                <Text style={styles.pickArrow}>▼</Text>
              </TouchableOpacity>
              {showUnitPicker && (
                <View style={styles.pickerList}>
                  {UNITS.map(u => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.pickerItem, form.unit === u && styles.pickerItemActive]}
                      onPress={() => { setForm(f => ({ ...f, unit: u })); setShowUnitPicker(false); }}
                    >
                      <Text style={[styles.pickerItemText, form.unit === u && styles.pickerItemTextActive]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Box / Bag breakdown fields */}
              {isBoxUnit(form.unit) && (
                <View style={styles.boxSection}>
                  <Text style={styles.boxSectionTitle}>{t('ingredients.boxBreakdown')}</Text>
                  <View style={styles.row2}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Input
                        label={t('ingredients.unitsPerBox', { subUnit: form.subUnit, unit: form.unit })}
                        value={form.unitsPerBox}
                        onChangeText={v => setForm(f => ({ ...f, unitsPerBox: v }))}
                        placeholder={t('ingredients.unitsPlaceholder')}
                        keyboardType="numeric"
                        error={errors.unitsPerBox}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickLabel}>{t('ingredients.subUnit')}</Text>
                      <TouchableOpacity
                        style={styles.pickBtn}
                        onPress={() => setShowSubUnitPicker(!showSubUnitPicker)}
                      >
                        <Text style={styles.pickValue}>{form.subUnit}</Text>
                        <Text style={styles.pickArrow}>▼</Text>
                      </TouchableOpacity>
                      {showSubUnitPicker && (
                        <View style={styles.pickerList}>
                          {SUB_UNITS.map(u => (
                            <TouchableOpacity
                              key={u}
                              style={[styles.pickerItem, form.subUnit === u && styles.pickerItemActive]}
                              onPress={() => { setForm(f => ({ ...f, subUnit: u })); setShowSubUnitPicker(false); }}
                            >
                              <Text style={[styles.pickerItemText, form.subUnit === u && styles.pickerItemTextActive]}>
                                {u}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                  {form.pricePerUnit && form.unitsPerBox && Number(form.unitsPerBox) > 0 && (
                    <View style={styles.boxPreview}>
                      <Text style={styles.boxPreviewText}>
                        1 {form.unit} = {form.unitsPerBox} {form.subUnit || SUB_UNITS[0] || 'lb'}
                      </Text>
                      <Text style={styles.boxPreviewText}>
                        → {formatCurrency(Number(form.pricePerUnit) / Number(form.unitsPerBox))} / {form.subUnit || SUB_UNITS[0] || 'lb'}
                        {(form.subUnit === 'lb') && (
                          `  ·  ${formatCurrency(Number(form.pricePerUnit) / Number(form.unitsPerBox) / 16)} / oz`
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Prep time section */}
              <View style={styles.boxSection}>
                <Text style={styles.boxSectionTitle}>{t('ingredients.prepSection')}</Text>
                <Input
                  label={t('ingredients.prepTime', { unit: form.unit })}
                  value={form.prepTimePerUnit}
                  onChangeText={v => setForm(f => ({ ...f, prepTimePerUnit: v }))}
                  placeholder={t('ingredients.prepTimePlaceholder')}
                  keyboardType="numeric"
                  right="min"
                />
                <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: -8, marginBottom: 8 }}>
                  {t('ingredients.prepTimeNote', { unit: form.unit })}
                </Text>
              </View>

              <Text style={[styles.pickLabel, { marginTop: 12 }]}>{t('ingredients.category')}</Text>
              <TouchableOpacity
                style={styles.pickBtn}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={styles.pickValue}>{CATEGORY_ICONS[form.category]} {catLabel(form.category)}</Text>
                <Text style={styles.pickArrow}>▼</Text>
              </TouchableOpacity>
              {showCategoryPicker && (
                <View style={styles.pickerList}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.pickerItem, form.category === c && styles.pickerItemActive]}
                      onPress={() => { setForm(f => ({ ...f, category: c })); setShowCategoryPicker(false); }}
                    >
                      <Text style={[styles.pickerItemText, form.category === c && styles.pickerItemTextActive]}>
                        {CATEGORY_ICONS[c]} {catLabel(c)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.modalActions}>
                <Button
                  label={t('common.cancel')}
                  variant="outline"
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  label={editing ? t('common.update') : t('common.add')}
                  onPress={handleSave}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────
// STOCKS & BASES TAB
// ────────────────────────────────────────────────────────────────
function StocksTab({ stockRecipes, ingredients, employees, dispatch, t, formatCurrency, config }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [ingSearch, setIngSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    stockIngredients: [],
    laborGroup: 'kitchen',
    laborMinutes: '',
    yieldOz: '',
  });

  // Fake state object for calculateStockCostPerOz
  const fakeState = { ingredients, employees };

  function openAdd() {
    setEditing(null);
    setForm({ name: '', stockIngredients: [], laborGroup: 'kitchen', laborMinutes: '', yieldOz: '' });
    setIngSearch('');
    setModalVisible(true);
  }

  function openEdit(stock) {
    setEditing(stock);
    setForm({
      name: stock.name,
      stockIngredients: stock.stockIngredients.map(i => ({ ...i, quantity: String(i.quantity) })),
      laborGroup: stock.laborGroup || 'kitchen',
      laborMinutes: stock.laborMinutes ? String(stock.laborMinutes) : '',
      yieldOz: String(stock.yieldOz),
    });
    setIngSearch('');
    setModalVisible(true);
  }

  function handleSave() {
    if (!form.name.trim()) { Alert.alert('Error', t('ingredients.errStockName')); return; }
    if (!form.yieldOz || Number(form.yieldOz) <= 0) { Alert.alert('Error', t('ingredients.errYield')); return; }
    const data = {
      id: editing?.id || generateId(),
      name: form.name.trim(),
      stockIngredients: form.stockIngredients
        .filter(i => parseFloat(i.quantity) > 0)
        .map(i => ({ ...i, quantity: parseFloat(i.quantity) || 0 })),
      laborGroup: form.laborGroup,
      laborMinutes: parseFloat(form.laborMinutes) || 0,
      yieldOz: parseFloat(form.yieldOz),
    };
    dispatch({ type: editing ? 'UPDATE_STOCK_RECIPE' : 'ADD_STOCK_RECIPE', payload: data });
    setModalVisible(false);
  }

  function handleDelete(stock) {
    Alert.alert(t('ingredients.deleteStockTitle'), `Delete "${stock.name}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => dispatch({ type: 'DELETE_STOCK_RECIPE', payload: stock.id }) },
    ]);
  }

  function addStockIng(ingredientId) {
    setForm(f => {
      if (f.stockIngredients.find(i => i.ingredientId === ingredientId)) return f;
      return { ...f, stockIngredients: [...f.stockIngredients, { ingredientId, quantity: '' }] };
    });
  }

  function removeStockIng(ingredientId) {
    setForm(f => ({ ...f, stockIngredients: f.stockIngredients.filter(i => i.ingredientId !== ingredientId) }));
  }

  function updateStockIngQty(ingredientId, qty) {
    setForm(f => ({
      ...f,
      stockIngredients: f.stockIngredients.map(i => i.ingredientId === ingredientId ? { ...i, quantity: qty } : i),
    }));
  }

  const previewCostPerOz = (() => {
    const tempStock = {
      stockIngredients: form.stockIngredients.map(i => ({ ...i, quantity: parseFloat(i.quantity) || 0 })),
      laborGroup: form.laborGroup,
      laborMinutes: parseFloat(form.laborMinutes) || 0,
      yieldOz: parseFloat(form.yieldOz) || 1,
    };
    return calculateStockCostPerOz(tempStock, fakeState);
  })();

  const availableIngs = ingredients.filter(
    ing => !form.stockIngredients.find(i => i.ingredientId === ing.id) &&
      ing.name.toLowerCase().includes(ingSearch.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {stockRecipes.length === 0 ? (
          <EmptyState icon="🍲" message={t('ingredients.noStocks')} />
        ) : (
          stockRecipes.map(stock => {
            const costPerOz = calculateStockCostPerOz(stock, fakeState);
            const totalCost = costPerOz * stock.yieldOz;
            return (
              <Card key={stock.id} style={{ marginBottom: 12 }}>
                <View style={styles.stockHeader}>
                  <Text style={styles.stockIcon}>🍲</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stockName}>{stock.name}</Text>
                    <Text style={styles.stockSub}>
                      {t('ingredients.yieldLabel', { yieldOz: stock.yieldOz, unit: config.yieldUnit, costPerOz: formatCurrency(costPerOz) })}
                    </Text>
                    <Text style={styles.stockSub}>
                      {t('ingredients.totalBatchCost', { totalCost: formatCurrency(totalCost) })}
                    </Text>
                  </View>
                  <View style={styles.ingActions}>
                    <TouchableOpacity onPress={() => openEdit(stock)} style={styles.iconBtn}>
                      <Text style={styles.iconBtnText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(stock)} style={styles.iconBtn}>
                      <Text style={styles.iconBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Divider />
                {stock.stockIngredients.map(item => {
                  const ing = ingredients.find(i => i.id === item.ingredientId);
                  if (!ing) return null;
                  const dishUnit = getIngredientDishUnit(ing);
                  return (
                    <View key={item.ingredientId} style={styles.stockIngRow}>
                      <Text style={styles.stockIngIcon}>{CATEGORY_ICONS[ing.category] || '📦'}</Text>
                      <Text style={styles.stockIngName}>{ing.name}</Text>
                      <Text style={styles.stockIngQty}>{item.quantity} {dishUnit}</Text>
                      <Text style={styles.stockIngCost}>
                        {formatCurrency(getIngredientPricePerDishUnit(ing) * item.quantity)}
                      </Text>
                    </View>
                  );
                })}
                {stock.laborMinutes > 0 && (
                  <View style={styles.stockIngRow}>
                    <Text style={styles.stockIngIcon}>👨‍🍳</Text>
                    <Text style={styles.stockIngName}>{t('ingredients.labor', { laborGroup: stock.laborGroup })}</Text>
                    <Text style={styles.stockIngQty}>{t('ingredients.laborTime', { laborMinutes: stock.laborMinutes })}</Text>
                    <Text style={styles.stockIngCost}>
                      {formatCurrency((calcGroupWeightedRate(employees, stock.laborGroup) / 60) * stock.laborMinutes)}
                    </Text>
                  </View>
                )}
              </Card>
            );
          })
        )}
        <TouchableOpacity onPress={openAdd} activeOpacity={0.85}>
          <LinearGradient colors={GRADIENTS.primary} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.addEntryBtn}>
            <Text style={styles.addEntryText}>{t('ingredients.addStockBtn')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{editing ? t('ingredients.editStockTitle') : t('ingredients.addStockTitle')}</Text>

              <Input
                label={t('ingredients.stockName')}
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                placeholder={t('ingredients.stockNamePlaceholder')}
              />

              {/* Selected ingredients */}
              {form.stockIngredients.length > 0 && (
                <View style={styles.selectedSection}>
                  <Text style={styles.sectionLabelSmall}>{t('ingredients.batchIngredients')}</Text>
                  {form.stockIngredients.map(item => {
                    const ing = ingredients.find(i => i.id === item.ingredientId);
                    if (!ing) return null;
                    const dishUnit = getIngredientDishUnit(ing);
                    const cost = (parseFloat(item.quantity) || 0) * getIngredientPricePerDishUnit(ing);
                    return (
                      <View key={item.ingredientId} style={styles.selectedIngCard}>
                        <Text style={styles.selectedIngIcon}>{CATEGORY_ICONS[ing.category] || '📦'}</Text>
                        <View style={styles.selectedIngInfo}>
                          <Text style={styles.selectedIngName}>{ing.name}</Text>
                          <Text style={styles.selectedIngPrice}>{formatCurrency(getIngredientPricePerDishUnit(ing))}/{dishUnit}</Text>
                        </View>
                        <View style={styles.selectedIngQtyRow}>
                          <TextInput
                            style={styles.selectedIngQtyInput}
                            value={item.quantity}
                            onChangeText={v => updateStockIngQty(item.ingredientId, v)}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={COLORS.textLight}
                          />
                          <Text style={styles.selectedIngUnit}>{dishUnit}</Text>
                        </View>
                        <Text style={styles.selectedIngCost}>{formatCurrency(cost)}</Text>
                        <TouchableOpacity onPress={() => removeStockIng(item.ingredientId)} style={styles.removeIngBtn}>
                          <Text style={styles.removeIngBtnText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Add ingredient search */}
              <Text style={styles.sectionLabelSmall}>{t('ingredients.addIngredients')}</Text>
              <View style={styles.ingSearchBox}>
                <Text style={{ fontSize: 14 }}>🔍</Text>
                <TextInput
                  style={styles.ingSearchInput}
                  value={ingSearch}
                  onChangeText={setIngSearch}
                  placeholder="Search..."
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
              {availableIngs.slice(0, 8).map(ing => (
                <TouchableOpacity key={ing.id} style={styles.availableIngRow} onPress={() => addStockIng(ing.id)}>
                  <Text style={styles.availableIngIcon}>{CATEGORY_ICONS[ing.category] || '📦'}</Text>
                  <View style={styles.availableIngInfo}>
                    <Text style={styles.availableIngName}>{ing.name}</Text>
                    <Text style={styles.availableIngPrice}>
                      {formatCurrency(getIngredientPricePerDishUnit(ing))}/{getIngredientDishUnit(ing)}
                    </Text>
                  </View>
                  <View style={styles.addIngBtn}>
                    <Text style={styles.addIngBtnText}>+</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Labor */}
              <Text style={[styles.pickLabel, { marginTop: 14 }]}>{t('ingredients.laborSection')}</Text>
              <View style={styles.row2}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input
                    label={t('ingredients.laborMinutes')}
                    value={form.laborMinutes}
                    onChangeText={v => setForm(f => ({ ...f, laborMinutes: v }))}
                    placeholder={t('ingredients.laborMinutesPlaceholder')}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickLabel}>{t('ingredients.laborGroup')}</Text>
                  <TouchableOpacity
                    style={styles.pickBtn}
                    onPress={() => setForm(f => ({ ...f, laborGroup: f.laborGroup === 'kitchen' ? 'waiter' : 'kitchen' }))}
                  >
                    <Text style={styles.pickValue}>{form.laborGroup === 'kitchen' ? '👨‍🍳 Kitchen' : '🍽️ Waiter'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Yield */}
              <Input
                label={t('ingredients.batchYield', { unit: config.yieldUnit })}
                value={form.yieldOz}
                onChangeText={v => setForm(f => ({ ...f, yieldOz: v }))}
                placeholder={t('ingredients.batchYieldPlaceholder')}
                keyboardType="numeric"
              />

              {/* Preview */}
              {form.yieldOz && Number(form.yieldOz) > 0 && (
                <View style={styles.boxPreview}>
                  <Text style={styles.boxPreviewText}>
                    {t('ingredients.costPerUnit', { unit: config.yieldUnit, cost: formatCurrency(previewCostPerOz) })}
                  </Text>
                  <Text style={styles.boxPreviewText}>
                    {t('ingredients.fullBatchCost', { yield: form.yieldOz, unit: config.yieldUnit, cost: formatCurrency(previewCostPerOz * Number(form.yieldOz)) })}
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <Button label={t('common.cancel')} variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
                <Button label={editing ? t('common.update') : t('common.save')} onPress={handleSave} style={{ flex: 1 }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────
// WEEKLY ORDERS TAB
// ────────────────────────────────────────────────────────────────
function WeeklyOrdersTab({ ingredients, supplyOrders, dispatch, t, formatCurrency, config }) {
  const [weekOf, setWeekOf] = useState(getWeekOf());
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    ingredientId: '',
    quantity: '',
    unitCost: '',
  });
  const [errors, setErrors] = useState({});

  const weekOrders = useMemo(
    () => supplyOrders.filter(o => o.weekOf === weekOf),
    [supplyOrders, weekOf]
  );

  const weekTotal = useMemo(
    () => weekOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0) * (Number(o.unitCost) || 0), 0),
    [weekOrders]
  );

  function openAdd() {
    setEditing(null);
    setForm({
      ingredientId: ingredients[0]?.id || '',
      quantity: '',
      unitCost: ingredients[0] ? String(ingredients[0].pricePerUnit) : '',
    });
    setErrors({});
    setModalVisible(true);
  }

  function openEdit(order) {
    setEditing(order);
    setForm({
      ingredientId: order.ingredientId,
      quantity: String(order.quantity),
      unitCost: String(order.unitCost),
    });
    setErrors({});
    setModalVisible(true);
  }

  function validate() {
    const errs = {};
    if (!form.ingredientId) errs.ingredientId = t('ingredients.errSelectIngredient');
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)
      errs.quantity = t('ingredients.errQuantity');
    if (!form.unitCost || isNaN(Number(form.unitCost)) || Number(form.unitCost) <= 0)
      errs.unitCost = t('ingredients.errUnitCost');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    // Prevent duplicate ingredient in same week unless editing same entry
    const duplicate = supplyOrders.find(
      o => o.weekOf === weekOf && o.ingredientId === form.ingredientId && o.id !== editing?.id
    );
    if (duplicate) {
      Alert.alert(t('ingredients.errDuplicate'), t('ingredients.errDuplicateOrder'));
      return;
    }
    const data = {
      id: editing?.id || generateId(),
      weekOf,
      ingredientId: form.ingredientId,
      quantity: Number(form.quantity),
      unitCost: Number(form.unitCost),
    };
    dispatch({ type: editing ? 'UPDATE_SUPPLY_ORDER' : 'ADD_SUPPLY_ORDER', payload: data });
    setModalVisible(false);
  }

  function handleDelete(order) {
    const ing = ingredients.find(i => i.id === order.ingredientId);
    Alert.alert(t('ingredients.deleteOrderTitle'), t('ingredients.deleteOrderMsg', { ingredientName: ing?.name || 'ingredient' }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_SUPPLY_ORDER', payload: order.id }),
      },
    ]);
  }

  function onPickIngredient(ingId) {
    const ing = ingredients.find(i => i.id === ingId);
    setForm(f => ({
      ...f,
      ingredientId: ingId,
      unitCost: ing ? String(ing.pricePerUnit) : f.unitCost,
    }));
  }

  const selectedIng = ingredients.find(i => i.id === form.ingredientId);
  const previewTotal = (Number(form.quantity) || 0) * (Number(form.unitCost) || 0);

  // Group orders by category for display
  const groupedOrders = useMemo(() => {
    const groups = {};
    weekOrders.forEach(o => {
      const ing = ingredients.find(i => i.id === o.ingredientId);
      const cat = ing?.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ order: o, ing });
    });
    return groups;
  }, [weekOrders, ingredients]);

  return (
    <View style={{ flex: 1 }}>
      {/* Week navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          onPress={() => setWeekOf(w => offsetWeek(w, -1))}
          style={styles.weekArrow}
        >
          <Text style={styles.weekArrowText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.weekLabel}>{t('ingredients.weekOf')}</Text>
          <Text style={styles.weekRange}>{formatWeekRange(weekOf)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setWeekOf(w => offsetWeek(w, 1))}
          style={styles.weekArrow}
        >
          <Text style={styles.weekArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      <View style={styles.orderSummary}>
        <View style={styles.oSumItem}>
          <Text style={styles.oSumVal}>{weekOrders.length}</Text>
          <Text style={styles.oSumLabel}>{t('ingredients.itemsOrdered')}</Text>
        </View>
        <View style={styles.oSumDivider} />
        <View style={styles.oSumItem}>
          <Text style={styles.oSumVal}>{formatCurrency(weekTotal)}</Text>
          <Text style={styles.oSumLabel}>{t('ingredients.totalSupplyCost')}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {weekOrders.length === 0 ? (
          <EmptyState icon="📦" message={t('ingredients.noOrders')} />
        ) : (
          Object.entries(groupedOrders).map(([cat, items]) => (
            <Card key={cat} style={{ marginBottom: 12 }}>
              <Text style={styles.groupTitle}>
                {CATEGORY_ICONS[cat] || '📦'} {cat} ({items.length})
              </Text>
              <Divider />
              {items.map(({ order, ing }) => {
                const total = (Number(order.quantity) || 0) * (Number(order.unitCost) || 0);
                return (
                  <View key={order.id} style={styles.orderRow}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderIngName}>{ing?.name || 'Unknown'}</Text>
                      <Text style={styles.orderDetail}>
                        {order.quantity} {ing?.unit} × {formatCurrency(order.unitCost)}/{ing?.unit}
                      </Text>
                    </View>
                    <Text style={styles.orderTotal}>{formatCurrency(total)}</Text>
                    <View style={styles.orderActions}>
                      <TouchableOpacity onPress={() => openEdit(order)} style={styles.iconBtn}>
                        <Text style={styles.iconBtnText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(order)} style={styles.iconBtn}>
                        <Text style={styles.iconBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </Card>
          ))
        )}

        <TouchableOpacity onPress={openAdd} activeOpacity={0.85}>
          <LinearGradient colors={GRADIENTS.primary} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.addEntryBtn}>
            <Text style={styles.addEntryText}>+ Log Order</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Add / Edit supply order modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                {editing ? t('ingredients.editOrderTitle') : t('ingredients.logOrderTitle')}
              </Text>
              <Text style={styles.modalWeek}>{t('ingredients.weekRange', { weekRange: formatWeekRange(weekOf) })}</Text>

              {/* Ingredient picker */}
              <Text style={styles.pickLabel}>{t('ingredients.ingredientLabel')}</Text>
              {ingredients.length === 0 ? (
                <Text style={styles.errText}>{t('ingredients.noIngredientsYet')}</Text>
              ) : (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.ingPickerRow}
                  >
                    {ingredients.map(ing => (
                      <TouchableOpacity
                        key={ing.id}
                        style={[
                          styles.ingChip,
                          form.ingredientId === ing.id && styles.ingChipActive,
                        ]}
                        onPress={() => onPickIngredient(ing.id)}
                      >
                        <Text style={styles.ingChipIcon}>
                          {CATEGORY_ICONS[ing.category] || '📦'}
                        </Text>
                        <Text
                          style={[
                            styles.ingChipText,
                            form.ingredientId === ing.id && styles.ingChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {ing.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {errors.ingredientId && (
                    <Text style={styles.errText}>{errors.ingredientId}</Text>
                  )}
                </>
              )}

              <View style={styles.row2}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input
                    label={`${t('ingredients.quantity')}${selectedIng ? ` (${selectedIng.unit})` : ''}`}
                    value={form.quantity}
                    onChangeText={v => setForm(f => ({ ...f, quantity: v }))}
                    placeholder={t('ingredients.quantityPlaceholder', { unit: selectedIng?.unit || '' })}
                    keyboardType="numeric"
                    right={selectedIng?.unit || ''}
                    error={errors.quantity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('ingredients.unitCost')}
                    value={form.unitCost}
                    onChangeText={v => setForm(f => ({ ...f, unitCost: v }))}
                    placeholder={t('ingredients.unitCostPlaceholder')}
                    keyboardType="numeric"
                    right="$"
                    error={errors.unitCost}
                  />
                </View>
              </View>

              {form.quantity && form.unitCost && (
                <View style={styles.orderPreview}>
                  <Text style={styles.orderPreviewLabel}>{t('ingredients.totalOrderCost')}</Text>
                  <Text style={styles.orderPreviewVal}>{formatCurrency(previewTotal)}</Text>
                  {selectedIng && (
                    <Text style={styles.orderPreviewNote}>
                      {form.quantity} {selectedIng.unit} of {selectedIng.name}
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.modalActions}>
                <Button
                  label={t('common.cancel')}
                  variant="outline"
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  label={editing ? t('ingredients.updateBtn') : t('ingredients.logBtn')}
                  onPress={handleSave}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Search row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  clearBtn: { fontSize: 16, color: COLORS.textSecondary, padding: 4 },
  addFab: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  addFabText: { fontSize: 24, color: '#FFF', lineHeight: 28 },

  // Category chips
  catScroll: { maxHeight: 50, backgroundColor: COLORS.surface },
  catContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 13, color: COLORS.text },
  catChipTextActive: { color: '#FFF', fontWeight: '600' },

  content: { padding: 16 },
  groupTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },

  // Ingredient row
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ingIcon: { fontSize: 24, marginRight: 12 },
  ingInfo: { flex: 1 },
  ingName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  ingPrice: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  ingSubPrice: { fontSize: 11, color: '#388E3C', marginTop: 1, fontWeight: '500' },
  ingActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, backgroundColor: COLORS.background,
  },
  iconBtnText: { fontSize: 16 },

  // Week navigation (shared)
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  weekArrow: { padding: 12 },
  weekArrowText: { fontSize: 24, color: '#FFF', fontWeight: '300' },
  weekInfo: { flex: 1, alignItems: 'center' },
  weekLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  weekRange: { fontSize: 15, fontWeight: '700', color: '#FFF', marginTop: 2 },

  // Order summary bar
  orderSummary: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  oSumItem: { flex: 1, alignItems: 'center' },
  oSumDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  oSumVal: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  oSumLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Order row in list
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderInfo: { flex: 1 },
  orderIngName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  orderDetail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  orderTotal: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginRight: 8 },
  orderActions: { flexDirection: 'row', gap: 4 },

  // Add entry button
  addEntryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  addEntryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    marginTop: 60,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  modalWeek: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 },
  row2: { flexDirection: 'row' },
  pickLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '500' },
  errText: { fontSize: 12, color: '#E53935', marginBottom: 8 },

  // Ingredient picker chips inside modal
  ingPickerRow: { marginBottom: 8 },
  ingChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  ingChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  ingChipIcon: { fontSize: 18, marginBottom: 2 },
  ingChipText: { fontSize: 11, color: COLORS.text, textAlign: 'center' },
  ingChipTextActive: { color: '#FFF', fontWeight: '600' },

  // Order preview
  orderPreview: {
    backgroundColor: COLORS.secondary || '#F0F4FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  orderPreviewLabel: { fontSize: 12, color: COLORS.textSecondary },
  orderPreviewVal: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  orderPreviewNote: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  // Ingredient add/edit modal pickers
  pickBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FAFAFA',
    marginBottom: 4,
  },
  pickValue: { fontSize: 15, color: COLORS.text },
  pickArrow: { fontSize: 12, color: COLORS.textSecondary },
  pickerList: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    marginBottom: 12, overflow: 'hidden',
  },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  pickerItemActive: { backgroundColor: COLORS.secondary },
  pickerItemText: { fontSize: 14, color: COLORS.text },
  pickerItemTextActive: { color: COLORS.primary, fontWeight: '600' },
  modalActions: { flexDirection: 'row', marginTop: 20 },

  // Stocks tab
  stockHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  stockIcon: { fontSize: 28, marginRight: 10 },
  stockName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  stockSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  stockIngRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 6 },
  stockIngIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  stockIngName: { flex: 1, fontSize: 13, color: COLORS.text },
  stockIngQty: { fontSize: 12, color: COLORS.textSecondary, width: 70, textAlign: 'right' },
  stockIngCost: { fontSize: 12, fontWeight: '600', color: COLORS.primary, width: 60, textAlign: 'right' },
  sectionLabelSmall: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Ingredient picker (shared with dish)
  selectedSection: { marginBottom: 8 },
  selectedIngCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0F9F0', borderRadius: 10, padding: 10, marginBottom: 6,
    borderWidth: 1, borderColor: '#C8E6C9', gap: 8,
  },
  selectedIngIcon: { fontSize: 20 },
  selectedIngInfo: { flex: 1 },
  selectedIngName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  selectedIngPrice: { fontSize: 11, color: COLORS.textSecondary },
  selectedIngQtyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 6, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 6, height: 34, width: 80,
  },
  selectedIngQtyInput: { flex: 1, fontSize: 14, color: COLORS.text, textAlign: 'right', paddingVertical: 0 },
  selectedIngUnit: { fontSize: 11, color: COLORS.textSecondary, marginLeft: 3 },
  selectedIngCost: { fontSize: 12, fontWeight: '700', color: '#388E3C', width: 56, textAlign: 'right' },
  removeIngBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },
  removeIngBtnText: { fontSize: 18, color: '#E53935', lineHeight: 22 },
  ingSearchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 10, height: 38, marginBottom: 8, gap: 6,
  },
  ingSearchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  availableIngRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 9, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10,
  },
  availableIngIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  availableIngInfo: { flex: 1 },
  availableIngName: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  availableIngPrice: { fontSize: 11, color: COLORS.textSecondary },
  addIngBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  addIngBtnText: { fontSize: 18, color: '#FFF', lineHeight: 22 },

  // Box/bag breakdown
  boxSection: {
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  boxSectionTitle: { fontSize: 13, fontWeight: '700', color: '#F57F17', marginBottom: 8 },
  boxPreview: {
    backgroundColor: '#FFFDE7',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  boxPreviewText: { fontSize: 12, color: '#F57F17', fontWeight: '600', lineHeight: 20 },
});
