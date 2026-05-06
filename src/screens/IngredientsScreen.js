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
  formatCurrency,
  getWeekOf,
  offsetWeek,
  formatWeekRange,
  getIngredientPricePerDishUnit,
  getIngredientDishUnit,
  calculateStockCostPerOz,
  calcGroupWeightedRate,
} from '../context/AppContext';
import {
  COLORS,
  Header,
  Card,
  Button,
  Input,
  SectionTitle,
  EmptyState,
  Divider,
} from '../components';

const CATEGORIES = ['Meat', 'Seafood', 'Produce', 'Starch', 'Spices', 'Dairy & Eggs', 'Beverages', 'Other'];
const UNITS = ['lb', 'oz', 'fl oz', 'gal', 'qt', 'pt', 'cup', 'tbsp', 'tsp', 'each', 'pack', 'box', 'bag', 'bunch', 'slice', 'count'];
const SUB_UNITS = ['lb', 'oz', 'piece', 'each'];
const BOX_UNITS = ['box', 'bag', 'pack'];
function isBoxUnit(unit) { return BOX_UNITS.includes((unit || '').toLowerCase()); }

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

const TABS = ['Ingredients', 'Stocks & Bases', 'Weekly Orders'];

export default function IngredientsScreen() {
  const { state, dispatch } = useApp();
  const { ingredients, supplyOrders, stockRecipes = [], employees = [] } = state;
  const [activeTab, setActiveTab] = useState('Ingredients');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Header
        title="Ingredients & Supplies"
        subtitle="Manage ingredient prices and weekly orders"
      />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Ingredients' && (
        <IngredientsTab ingredients={ingredients} dispatch={dispatch} />
      )}
      {activeTab === 'Stocks & Bases' && (
        <StocksTab stockRecipes={stockRecipes} ingredients={ingredients} employees={employees} dispatch={dispatch} />
      )}
      {activeTab === 'Weekly Orders' && (
        <WeeklyOrdersTab ingredients={ingredients} supplyOrders={supplyOrders} dispatch={dispatch} />
      )}
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────
// INGREDIENTS TAB
// ────────────────────────────────────────────────────────────────
function IngredientsTab({ ingredients, dispatch }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [form, setForm] = useState({ name: '', unit: 'lb', pricePerUnit: '', category: 'Other', unitsPerBox: '', subUnit: 'lb' });
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
    setEditing(null);
    setForm({ name: '', unit: 'lb', pricePerUnit: '', category: 'Other', unitsPerBox: '', subUnit: 'lb' });
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
      subUnit: ing.subUnit || 'lb',
    });
    setErrors({});
    setModalVisible(true);
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Enter ingredient name';
    if (!form.pricePerUnit || isNaN(Number(form.pricePerUnit)) || Number(form.pricePerUnit) <= 0)
      errs.pricePerUnit = 'Price must be a positive number';
    if (isBoxUnit(form.unit) && (!form.unitsPerBox || isNaN(Number(form.unitsPerBox)) || Number(form.unitsPerBox) <= 0))
      errs.unitsPerBox = 'Enter how many units per box/bag';
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
      ...(isBoxUnit(form.unit) ? {
        unitsPerBox: Number(form.unitsPerBox),
        subUnit: form.subUnit,
      } : { unitsPerBox: null, subUnit: null }),
    };
    dispatch({ type: editing ? 'UPDATE_INGREDIENT' : 'ADD_INGREDIENT', payload: data });
    setModalVisible(false);
  }

  function handleDelete(ing) {
    Alert.alert('Delete Ingredient', `Delete "${ing.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
    return (
      <View key={ing.id} style={styles.ingRow}>
        <Text style={styles.ingIcon}>{CATEGORY_ICONS[ing.category] || '📦'}</Text>
        <View style={styles.ingInfo}>
          <Text style={styles.ingName}>{ing.name}</Text>
          <Text style={styles.ingPrice}>
            {formatCurrency(ing.pricePerUnit)} / {ing.unit}
            {isBox && ing.unitsPerBox ? ` · ${ing.unitsPerBox} ${ing.subUnit || 'lb'}` : ''}
          </Text>
          {isBox && ing.unitsPerBox ? (
            <Text style={styles.ingSubPrice}>
              → {formatCurrency(pricePerDishUnit)}/{dishUnit}
            </Text>
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
            placeholder="Search ingredients..."
            placeholderTextColor={COLORS.textLight}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity onPress={openAdd} style={styles.addFab}>
          <Text style={styles.addFabText}>+</Text>
        </TouchableOpacity>
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
              {cat === 'All' ? '🗂️ All' : `${CATEGORY_ICONS[cat]} ${cat}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {filtered.length === 0 ? (
          <EmptyState icon="🥕" message="No ingredients found" />
        ) : selectedCategory === 'All' && groupedByCategory ? (
          Object.entries(groupedByCategory).map(([cat, items]) => (
            <Card key={cat}>
              <Text style={styles.groupTitle}>{CATEGORY_ICONS[cat]} {cat} ({items.length})</Text>
              <Divider />
              {items.map(renderIngredient)}
            </Card>
          ))
        ) : (
          <Card>{filtered.map(renderIngredient)}</Card>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                {editing ? 'Update Ingredient' : 'Add Ingredient'}
              </Text>
              <Input
                label="Ingredient Name"
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                placeholder="e.g. Beef, Tomato, Butter..."
                error={errors.name}
              />
              <Input
                label="Price / unit"
                value={form.pricePerUnit}
                onChangeText={v => setForm(f => ({ ...f, pricePerUnit: v }))}
                placeholder="e.g. 8.99"
                keyboardType="numeric"
                right="$"
                error={errors.pricePerUnit}
              />

              <Text style={styles.pickLabel}>Unit</Text>
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
                  <Text style={styles.boxSectionTitle}>📦 Box / Bag Breakdown</Text>
                  <View style={styles.row2}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Input
                        label={`How many ${form.subUnit || 'lb'} per ${form.unit}?`}
                        value={form.unitsPerBox}
                        onChangeText={v => setForm(f => ({ ...f, unitsPerBox: v }))}
                        placeholder="e.g. 40"
                        keyboardType="numeric"
                        error={errors.unitsPerBox}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickLabel}>Sub-unit</Text>
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
                        1 {form.unit} = {form.unitsPerBox} {form.subUnit || 'lb'}
                      </Text>
                      <Text style={styles.boxPreviewText}>
                        → {formatCurrency(Number(form.pricePerUnit) / Number(form.unitsPerBox))} / {form.subUnit || 'lb'}
                        {(form.subUnit === 'lb') && (
                          `  ·  ${formatCurrency(Number(form.pricePerUnit) / Number(form.unitsPerBox) / 16)} / oz`
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <Text style={[styles.pickLabel, { marginTop: 12 }]}>Category</Text>
              <TouchableOpacity
                style={styles.pickBtn}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={styles.pickValue}>{CATEGORY_ICONS[form.category]} {form.category}</Text>
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
                        {CATEGORY_ICONS[c]} {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.modalActions}>
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  label={editing ? 'Update' : 'Add'}
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
function StocksTab({ stockRecipes, ingredients, employees, dispatch }) {
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
    if (!form.name.trim()) { Alert.alert('Error', 'Enter a name for this stock/broth'); return; }
    if (!form.yieldOz || Number(form.yieldOz) <= 0) { Alert.alert('Error', 'Enter the batch yield in oz'); return; }
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
    Alert.alert('Delete', `Delete "${stock.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_STOCK_RECIPE', payload: stock.id }) },
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
          <EmptyState icon="🍲" message="No stocks or broths yet.\nTap + to define a batch recipe." />
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
                      Yield: {stock.yieldOz} oz · {formatCurrency(costPerOz)}/oz
                    </Text>
                    <Text style={styles.stockSub}>
                      Total batch cost: {formatCurrency(totalCost)}
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
                    <Text style={styles.stockIngName}>Labor ({stock.laborGroup})</Text>
                    <Text style={styles.stockIngQty}>{stock.laborMinutes} min</Text>
                    <Text style={styles.stockIngCost}>
                      {formatCurrency((calcGroupWeightedRate(employees, stock.laborGroup) / 60) * stock.laborMinutes)}
                    </Text>
                  </View>
                )}
              </Card>
            );
          })
        )}
        <TouchableOpacity style={styles.addEntryBtn} onPress={openAdd}>
          <Text style={styles.addEntryText}>+ Add Stock / Broth</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{editing ? 'Edit Stock Recipe' : 'New Stock / Broth'}</Text>

              <Input
                label="Name"
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                placeholder="e.g. Pho Broth, Chicken Stock..."
              />

              {/* Selected ingredients */}
              {form.stockIngredients.length > 0 && (
                <View style={styles.selectedSection}>
                  <Text style={styles.sectionLabelSmall}>Ingredients in batch</Text>
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
              <Text style={styles.sectionLabelSmall}>Add ingredients</Text>
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
              <Text style={[styles.pickLabel, { marginTop: 14 }]}>Kitchen labor (cooking time)</Text>
              <View style={styles.row2}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input
                    label="Minutes"
                    value={form.laborMinutes}
                    onChangeText={v => setForm(f => ({ ...f, laborMinutes: v }))}
                    placeholder="e.g. 240 (4hr)"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickLabel}>Group</Text>
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
                label="Batch yield (oz) — e.g. 120 liters = 4057 oz"
                value={form.yieldOz}
                onChangeText={v => setForm(f => ({ ...f, yieldOz: v }))}
                placeholder="e.g. 4057"
                keyboardType="numeric"
              />

              {/* Preview */}
              {form.yieldOz && Number(form.yieldOz) > 0 && (
                <View style={styles.boxPreview}>
                  <Text style={styles.boxPreviewText}>
                    Cost per oz: {formatCurrency(previewCostPerOz)}
                  </Text>
                  <Text style={styles.boxPreviewText}>
                    Full batch ({form.yieldOz} oz): {formatCurrency(previewCostPerOz * Number(form.yieldOz))}
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <Button label="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
                <Button label={editing ? 'Update' : 'Save'} onPress={handleSave} style={{ flex: 1 }} />
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
function WeeklyOrdersTab({ ingredients, supplyOrders, dispatch }) {
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
    if (!form.ingredientId) errs.ingredientId = 'Select an ingredient';
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)
      errs.quantity = 'Enter a valid quantity';
    if (!form.unitCost || isNaN(Number(form.unitCost)) || Number(form.unitCost) <= 0)
      errs.unitCost = 'Enter a valid unit cost';
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
      Alert.alert('Duplicate', 'This ingredient already has an order this week. Edit the existing entry to update the quantity.');
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
    Alert.alert('Delete Order', `Remove "${ing?.name || 'ingredient'}" order for this week?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
          <Text style={styles.weekLabel}>Week of</Text>
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
          <Text style={styles.oSumLabel}>Items Ordered</Text>
        </View>
        <View style={styles.oSumDivider} />
        <View style={styles.oSumItem}>
          <Text style={styles.oSumVal}>{formatCurrency(weekTotal)}</Text>
          <Text style={styles.oSumLabel}>Total Supply Cost</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {weekOrders.length === 0 ? (
          <EmptyState icon="📦" message="No supply orders for this week.\nTap + Log Order to record what you bought." />
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

        <TouchableOpacity style={styles.addEntryBtn} onPress={openAdd}>
          <Text style={styles.addEntryText}>+ Log Order</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add / Edit supply order modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                {editing ? 'Edit Supply Order' : 'Log Supply Order'}
              </Text>
              <Text style={styles.modalWeek}>Week: {formatWeekRange(weekOf)}</Text>

              {/* Ingredient picker */}
              <Text style={styles.pickLabel}>Ingredient</Text>
              {ingredients.length === 0 ? (
                <Text style={styles.errText}>No ingredients yet. Add some in the Ingredients tab first.</Text>
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
                    label={`Quantity${selectedIng ? ` (${selectedIng.unit})` : ''}`}
                    value={form.quantity}
                    onChangeText={v => setForm(f => ({ ...f, quantity: v }))}
                    placeholder={selectedIng ? `e.g. 50 ${selectedIng.unit}` : 'e.g. 50'}
                    keyboardType="numeric"
                    right={selectedIng?.unit || ''}
                    error={errors.quantity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Unit Cost"
                    value={form.unitCost}
                    onChangeText={v => setForm(f => ({ ...f, unitCost: v }))}
                    placeholder="e.g. 8.99"
                    keyboardType="numeric"
                    right="$"
                    error={errors.unitCost}
                  />
                </View>
              </View>

              {form.quantity && form.unitCost && (
                <View style={styles.orderPreview}>
                  <Text style={styles.orderPreviewLabel}>Total supply cost this order:</Text>
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
                  label="Cancel"
                  variant="outline"
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  label={editing ? 'Update' : 'Log'}
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
    backgroundColor: COLORS.primary,
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
