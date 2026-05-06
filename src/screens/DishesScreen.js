import React, { useState } from 'react';
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
import { useApp, generateId, formatCurrency, calculateDishCost, calcGroupWeightedRate } from '../context/AppContext';
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

const DISH_CATEGORIES = ['Appetizer', 'Main Course', 'Side Dish', 'Pasta & Rice', 'Soup', 'Dessert', 'Beverage', 'Other'];
const ING_CATEGORY_ICONS = {
  'Meat': '🥩', 'Seafood': '🦐', 'Produce': '🥦', 'Starch': '🍚',
  'Spices': '🧂', 'Dairy & Eggs': '🥚', 'Beverages': '🥤', 'Other': '📦',
};
const CATEGORY_ICONS = {
  'Appetizer': '🥗',
  'Main Course': '🍖',
  'Side Dish': '🥘',
  'Pasta & Rice': '🍜',
  'Soup': '🍲',
  'Dessert': '🍮',
  'Beverage': '🥤',
  'Other': '🍽️',
};

export default function DishesScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const { dishes, ingredients, employees } = state;
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(1); // 1: basic info, 2: ingredients, 3: labor
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'Món chính',
    description: '',
    dishIngredients: [],
    laborTime: [],
  });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [ingSearch, setIngSearch] = useState('');
  const [ingCategory, setIngCategory] = useState('All');

  const filtered = dishes.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm({
      name: '',
      category: 'Main Course',
      description: '',
      dishIngredients: [],
      laborTime: [],
    });
    setStep(1);
    setIngSearch('');
    setIngCategory('All');
    setModalVisible(true);
  }

  function openEdit(dish) {
    setEditing(dish);
    setForm({
      name: dish.name,
      category: dish.category,
      description: dish.description || '',
      dishIngredients: (dish.ingredients || []).map(i => ({ ...i, quantity: String(i.quantity) })),
      laborTime: [...(dish.laborTime || [])],
    });
    setStep(1);
    setIngSearch('');
    setIngCategory('All');
    setModalVisible(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter a dish name');
      return;
    }
    const data = {
      id: editing?.id || generateId(),
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      ingredients: form.dishIngredients
        .filter(i => parseFloat(i.quantity) > 0)
        .map(i => ({ ...i, quantity: parseFloat(i.quantity) || 0 })),
      laborTime: form.laborTime,
    };
    if (editing) {
      dispatch({ type: 'UPDATE_DISH', payload: data });
    } else {
      dispatch({ type: 'ADD_DISH', payload: data });
    }
    setModalVisible(false);
  }

  function handleDelete(dish) {
    Alert.alert('Delete Dish', `Delete "${dish.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_DISH', payload: dish.id }),
      },
    ]);
  }

  // Ingredient list management
  function addIngredient(ingredientId) {
    setForm(f => {
      if (f.dishIngredients.find(i => i.ingredientId === ingredientId)) return f;
      return { ...f, dishIngredients: [...f.dishIngredients, { ingredientId, quantity: '' }] };
    });
  }

  function removeIngredient(ingredientId) {
    setForm(f => ({ ...f, dishIngredients: f.dishIngredients.filter(i => i.ingredientId !== ingredientId) }));
  }

  function updateIngredientQty(ingredientId, qty) {
    setForm(f => ({
      ...f,
      dishIngredients: f.dishIngredients.map(i =>
        i.ingredientId === ingredientId ? { ...i, quantity: qty } : i
      ),
    }));
  }

  // Labor time management — group-based ('kitchen' | 'waiter')
  function updateLaborTime(group, minutes) {
    setForm(f => {
      const existing = f.laborTime.find(l => l.group === group);
      if (minutes === '' || minutes === '0') {
        return { ...f, laborTime: f.laborTime.filter(l => l.group !== group) };
      }
      if (existing) {
        return { ...f, laborTime: f.laborTime.map(l => l.group === group ? { ...l, minutes: parseFloat(minutes) || 0 } : l) };
      }
      return { ...f, laborTime: [...f.laborTime, { group, minutes: parseFloat(minutes) || 0 }] };
    });
  }

  function getLaborTime(group) {
    const found = form.laborTime.find(l => l.group === group);
    return found ? String(found.minutes) : '';
  }

  // Preview cost calculation based on current form
  function getPreviewCost() {
    const tempDish = {
      ingredients: form.dishIngredients.map(i => ({ ...i, quantity: parseFloat(i.quantity) || 0 })),
      laborTime: form.laborTime,
    };
    return calculateDishCost(tempDish, state);
  }

  const previewCost = getPreviewCost();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Header
        title="Dishes"
        subtitle="Manage recipes and calculate food cost"
      />
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search dishes..."
            placeholderTextColor={COLORS.textLight}
          />
        </View>
        <TouchableOpacity onPress={openAdd} style={styles.addFab}>
          <Text style={styles.addFabText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="🍽️"
            message={
              dishes.length === 0
                ? "No dishes yet.\nTap + to add your first dish!"
                : "No dishes found"
            }
          />
        ) : (
          filtered.map(dish => {
            const cost = calculateDishCost(dish, state);
            return (
              <Card key={dish.id} style={styles.dishCard}>
                <View style={styles.dishHeader}>
                  <View style={styles.dishIconBox}>
                    <Text style={styles.dishIcon}>
                      {CATEGORY_ICONS[dish.category] || '🍽️'}
                    </Text>
                  </View>
                  <View style={styles.dishInfo}>
                    <Text style={styles.dishName}>{dish.name}</Text>
                    <Text style={styles.dishCategory}>{dish.category}</Text>
                    {dish.description ? (
                      <Text style={styles.dishDesc}>{dish.description}</Text>
                    ) : null}
                  </View>
                </View>
                <Divider />
                <View style={styles.costGrid}>
                  <View style={styles.costItem}>
                    <Text style={styles.costLabel}>🥕 Ingredients</Text>
                    <Text style={styles.costVal}>{formatCurrency(cost.ingredientCost)}</Text>
                  </View>
                  <View style={styles.costItem}>
                    <Text style={styles.costLabel}>👤 Labor</Text>
                    <Text style={styles.costVal}>{formatCurrency(cost.laborCost)}</Text>
                  </View>
                  <View style={styles.costItem}>
                    <Text style={styles.costLabel}>⚡ Overhead</Text>
                    <Text style={styles.costVal}>{formatCurrency(cost.overheadPerDish)}</Text>
                  </View>
                  <View style={[styles.costItem, styles.costTotal]}>
                    <Text style={styles.costTotalLabel}>Food Cost</Text>
                    <Text style={styles.costTotalVal}>{formatCurrency(cost.totalCost)}</Text>
                  </View>
                </View>
                <View style={styles.dishActions}>
                  <Button
                    label="Price Menu"
                    variant="success"
                    onPress={() =>
                      navigation.navigate('Calculator', { dishId: dish.id })
                    }
                    style={[styles.actionBtn, { flex: 2 }]}
                  />
                  <Button
                    label="Edit"
                    variant="outline"
                    onPress={() => openEdit(dish)}
                    style={styles.actionBtn}
                  />
                  <Button
                    label="Delete"
                    variant="danger"
                    onPress={() => handleDelete(dish)}
                    style={styles.actionBtn}
                  />
                </View>
              </Card>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Dish Form Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {/* Step indicator */}
            <View style={styles.stepRow}>
              {['Info', 'Ingredients', 'Labor'].map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.stepItem, step === i + 1 && styles.stepActive]}
                  onPress={() => setStep(i + 1)}
                >
                  <View style={[styles.stepDot, step === i + 1 && styles.stepDotActive]}>
                    <Text style={[styles.stepNum, step === i + 1 && styles.stepNumActive]}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stepLabel, step === i + 1 && styles.stepLabelActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {step === 1 && (
                <View>
                  <Input
                    label="Dish Name *"
                    value={form.name}
                    onChangeText={v => setForm(f => ({ ...f, name: v }))}
                    placeholder="e.g. NY Strip Steak, Caesar Salad..."
                  />
                  <Text style={styles.pickLabel}>Category</Text>
                  <TouchableOpacity
                    style={styles.pickBtn}
                    onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                  >
                    <Text style={styles.pickValue}>
                      {CATEGORY_ICONS[form.category]} {form.category}
                    </Text>
                    <Text style={styles.pickArrow}>▼</Text>
                  </TouchableOpacity>
                  {showCategoryPicker && (
                    <View style={styles.pickerList}>
                      {DISH_CATEGORIES.map(c => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.pickerItem, form.category === c && styles.pickerItemActive]}
                          onPress={() => {
                            setForm(f => ({ ...f, category: c }));
                            setShowCategoryPicker(false);
                          }}
                        >
                          <Text style={[styles.pickerItemText, form.category === c && styles.pickerItemTextActive]}>
                            {CATEGORY_ICONS[c]} {c}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <Input
                    label="Notes (optional)"
                    value={form.description}
                    onChangeText={v => setForm(f => ({ ...f, description: v }))}
                    placeholder="Short description..."
                    multiline
                  />
                </View>
              )}

              {step === 2 && (
                <View>
                  {/* ── Selected ingredients ── */}
                  {form.dishIngredients.length > 0 ? (
                    <View style={styles.selectedSection}>
                      <Text style={styles.sectionLabel}>
                        Selected ingredients ({form.dishIngredients.length})
                      </Text>
                      {form.dishIngredients.map(item => {
                        const ing = ingredients.find(i => i.id === item.ingredientId);
                        if (!ing) return null;
                        const itemCost = (parseFloat(item.quantity) || 0) * ing.pricePerUnit;
                        return (
                          <View key={item.ingredientId} style={styles.selectedIngCard}>
                            <Text style={styles.selectedIngIcon}>
                              {ING_CATEGORY_ICONS[ing.category] || '📦'}
                            </Text>
                            <View style={styles.selectedIngInfo}>
                              <Text style={styles.selectedIngName}>{ing.name}</Text>
                              <Text style={styles.selectedIngPrice}>
                                {formatCurrency(ing.pricePerUnit)}/{ing.unit}
                              </Text>
                            </View>
                            <View style={styles.selectedIngQtyRow}>
                              <TextInput
                                style={styles.selectedIngQtyInput}
                                value={item.quantity}
                                onChangeText={v => updateIngredientQty(item.ingredientId, v)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={COLORS.textLight}
                              />
                              <Text style={styles.selectedIngUnit}>{ing.unit}</Text>
                            </View>
                            <Text style={styles.selectedIngCost}>{formatCurrency(itemCost)}</Text>
                            <TouchableOpacity
                              onPress={() => removeIngredient(item.ingredientId)}
                              style={styles.removeIngBtn}
                            >
                              <Text style={styles.removeIngBtnText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                      <View style={styles.ingSubtotalRow}>
                        <Text style={styles.ingSubtotalLabel}>Ingredient subtotal</Text>
                        <Text style={styles.ingSubtotalVal}>
                          {formatCurrency(
                            form.dishIngredients.reduce((sum, item) => {
                              const ing = ingredients.find(i => i.id === item.ingredientId);
                              return sum + (ing ? (parseFloat(item.quantity) || 0) * ing.pricePerUnit : 0);
                            }, 0)
                          )}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.noIngYet}>
                      <Text style={styles.noIngYetText}>No ingredients added yet — tap + below to add</Text>
                    </View>
                  )}

                  {/* ── Available ingredients picker ── */}
                  <Text style={styles.sectionLabel}>Add ingredients</Text>
                  <View style={styles.ingSearchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                      style={styles.ingSearchInput}
                      value={ingSearch}
                      onChangeText={setIngSearch}
                      placeholder="Search ingredients..."
                      placeholderTextColor={COLORS.textLight}
                    />
                    {ingSearch ? (
                      <TouchableOpacity onPress={() => setIngSearch('')}>
                        <Text style={{ color: COLORS.textLight, fontSize: 16 }}>×</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Category chips */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryChipScroll}
                    contentContainerStyle={styles.categoryChipContent}
                  >
                    {['All', ...Array.from(new Set(ingredients.map(i => i.category)))].map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catChip, ingCategory === cat && styles.catChipActive]}
                        onPress={() => setIngCategory(cat)}
                      >
                        <Text style={[styles.catChipText, ingCategory === cat && styles.catChipTextActive]}>
                          {cat === 'All' ? 'All' : `${ING_CATEGORY_ICONS[cat] || '📦'} ${cat}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Available list */}
                  {ingredients.length === 0 ? (
                    <EmptyState icon="🥕" message="No ingredients yet. Go to Ingredients tab to add." />
                  ) : (
                    (() => {
                      const available = ingredients
                        .filter(ing => !form.dishIngredients.find(i => i.ingredientId === ing.id))
                        .filter(ing => ingCategory === 'All' || ing.category === ingCategory)
                        .filter(ing => ing.name.toLowerCase().includes(ingSearch.toLowerCase()));
                      if (available.length === 0) {
                        return (
                          <Text style={styles.allAddedNote}>
                            {form.dishIngredients.length === ingredients.length
                              ? '✓ All ingredients have been added'
                              : 'No ingredients match your search'}
                          </Text>
                        );
                      }
                      return available.map(ing => (
                        <TouchableOpacity
                          key={ing.id}
                          style={styles.availableIngRow}
                          onPress={() => addIngredient(ing.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.availableIngIcon}>
                            {ING_CATEGORY_ICONS[ing.category] || '📦'}
                          </Text>
                          <View style={styles.availableIngInfo}>
                            <Text style={styles.availableIngName}>{ing.name}</Text>
                            <Text style={styles.availableIngPrice}>
                              {formatCurrency(ing.pricePerUnit)}/{ing.unit} · {ing.category}
                            </Text>
                          </View>
                          <View style={styles.addIngBtn}>
                            <Text style={styles.addIngBtnText}>+</Text>
                          </View>
                        </TouchableOpacity>
                      ));
                    })()
                  )}
                </View>
              )}

              {step === 3 && (
                <View>
                  <Text style={styles.stepHint}>
                    Enter prep time per staff group. Rates auto-calculated from employee schedules.
                  </Text>
                  {['kitchen', 'waiter'].map(group => {
                    const rate     = calcGroupWeightedRate(employees, group);
                    const empCount = employees.filter(e => e.group === group).length;
                    if (empCount === 0) return null;
                    return (
                      <View key={group} style={styles.ingFormRow}>
                        <View style={styles.ingFormInfo}>
                          <Text style={styles.ingFormName}>
                            {group === 'kitchen' ? '👨‍🍳 Kitchen' : '🍽️ Waiters'}
                          </Text>
                          <Text style={styles.ingFormPrice}>
                            {formatCurrency(rate)}/hr · {empCount} staff
                          </Text>
                          <Text style={[styles.ingFormPrice, { color: COLORS.textLight }]}>
                            = {formatCurrency(rate / 60)}/min
                          </Text>
                        </View>
                        <View style={styles.ingFormInput}>
                          <TextInput
                            style={styles.qtyInput}
                            value={getLaborTime(group)}
                            onChangeText={v => updateLaborTime(group, v)}
                            placeholder="0"
                            keyboardType="numeric"
                            placeholderTextColor={COLORS.textLight}
                          />
                          <Text style={styles.qtyUnit}>min</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Cost preview */}
              <View style={styles.costPreview}>
                <Text style={styles.costPreviewTitle}>💰 Estimated Cost</Text>
                <View style={styles.costPreviewGrid}>
                  <View style={styles.cpItem}>
                    <Text style={styles.cpLabel}>Ingredients</Text>
                    <Text style={styles.cpVal}>{formatCurrency(previewCost.ingredientCost)}</Text>
                  </View>
                  <View style={styles.cpItem}>
                    <Text style={styles.cpLabel}>Labor</Text>
                    <Text style={styles.cpVal}>{formatCurrency(previewCost.laborCost)}</Text>
                  </View>
                  <View style={styles.cpItem}>
                    <Text style={styles.cpLabel}>Overhead</Text>
                    <Text style={styles.cpVal}>{formatCurrency(previewCost.overheadPerDish)}</Text>
                  </View>
                  <View style={[styles.cpItem, { borderTopWidth: 1, borderTopColor: COLORS.border }]}>
                    <Text style={[styles.cpLabel, { fontWeight: '700' }]}>TOTAL FOOD COST</Text>
                    <Text style={[styles.cpVal, { color: COLORS.primary, fontWeight: '700', fontSize: 16 }]}>
                      {formatCurrency(previewCost.totalCost)}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              {step < 3 ? (
                <Button
                  label="Next →"
                  onPress={() => setStep(s => s + 1)}
                  style={{ flex: 2 }}
                />
              ) : (
                <Button
                  label={editing ? '✓ Update' : '✓ Save Dish'}
                  onPress={handleSave}
                  style={{ flex: 2 }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
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
  addFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFabText: { fontSize: 24, color: '#FFF', lineHeight: 28 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  dishCard: { marginBottom: 16 },
  dishHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  dishIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dishIcon: { fontSize: 26 },
  dishInfo: { flex: 1 },
  dishName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  dishCategory: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  dishDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  costGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  costItem: { width: '47%', backgroundColor: COLORS.background, borderRadius: 8, padding: 10 },
  costLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  costVal: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  costTotal: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  costTotalLabel: { fontSize: 11, color: COLORS.primary, marginBottom: 4, fontWeight: '600' },
  costTotalVal: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  dishActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, paddingVertical: 9 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stepItem: { flex: 1, alignItems: 'center' },
  stepActive: {},
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepNum: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  stepNumActive: { color: '#FFF' },
  stepLabel: { fontSize: 11, color: COLORS.textSecondary },
  stepLabelActive: { color: COLORS.primary, fontWeight: '600' },
  stepHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  ingFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ingFormInfo: { flex: 1 },
  ingFormName: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  ingFormPrice: { fontSize: 12, color: COLORS.textSecondary },
  ingFormInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 8,
    width: 100,
  },
  qtyInput: {
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 8,
    flex: 1,
    textAlign: 'right',
  },
  qtyUnit: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 },
  costPreview: {
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFCCAA',
  },
  costPreviewTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 10 },
  costPreviewGrid: { gap: 6 },
  cpItem: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  cpLabel: { fontSize: 13, color: COLORS.textSecondary },
  cpVal: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  modalFooter: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
  },
  // Ingredient picker styles
  selectedSection: { marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  selectedIngCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 8,
  },
  selectedIngIcon: { fontSize: 22 },
  selectedIngInfo: { flex: 1 },
  selectedIngName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  selectedIngPrice: { fontSize: 11, color: COLORS.textSecondary },
  selectedIngQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 6,
    height: 34,
    width: 80,
  },
  selectedIngQtyInput: { flex: 1, fontSize: 14, color: COLORS.text, textAlign: 'right', paddingVertical: 0 },
  selectedIngUnit: { fontSize: 11, color: COLORS.textSecondary, marginLeft: 3 },
  selectedIngCost: { fontSize: 12, fontWeight: '700', color: '#388E3C', width: 56, textAlign: 'right' },
  removeIngBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIngBtnText: { fontSize: 18, color: '#E53935', lineHeight: 22 },
  ingSubtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 2,
    borderTopWidth: 1,
    borderTopColor: '#C8E6C9',
    marginTop: 4,
    marginBottom: 12,
  },
  ingSubtotalLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  ingSubtotalVal: { fontSize: 13, fontWeight: '800', color: '#388E3C' },
  noIngYet: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  noIngYetText: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },
  ingSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 8,
    gap: 6,
  },
  ingSearchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  categoryChipScroll: { marginBottom: 8 },
  categoryChipContent: { gap: 6, paddingRight: 4 },
  catChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: COLORS.background,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 12, color: COLORS.textSecondary },
  catChipTextActive: { color: '#FFF', fontWeight: '600' },
  availableIngRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  availableIngIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  availableIngInfo: { flex: 1 },
  availableIngName: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  availableIngPrice: { fontSize: 11, color: COLORS.textSecondary },
  addIngBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIngBtnText: { fontSize: 20, color: '#FFF', lineHeight: 24 },
  allAddedNote: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', padding: 16, fontStyle: 'italic' },
  // Category picker styles
  pickLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '500' },
  pickBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FAFAFA',
    marginBottom: 14,
  },
  pickValue: { fontSize: 15, color: COLORS.text },
  pickArrow: { fontSize: 12, color: COLORS.textSecondary },
  pickerList: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  pickerItemActive: { backgroundColor: COLORS.secondary },
  pickerItemText: { fontSize: 14, color: COLORS.text },
  pickerItemTextActive: { color: COLORS.primary, fontWeight: '600' },
});
