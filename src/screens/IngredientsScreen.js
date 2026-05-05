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
import { useApp, generateId, formatCurrency } from '../context/AppContext';
import {
  COLORS,
  Header,
  Card,
  Button,
  Input,
  SectionTitle,
  EmptyState,
  Divider,
  Badge,
} from '../components';

const CATEGORIES = ['Thịt', 'Hải sản', 'Rau củ', 'Tinh bột', 'Gia vị', 'Sữa & Trứng', 'Đồ uống', 'Khác'];
const UNITS = ['kg', 'g', 'lít', 'ml', 'cái', 'hộp', 'gói', 'bó', 'miếng', 'con'];

const CATEGORY_ICONS = {
  'Thịt': '🥩',
  'Hải sản': '🦐',
  'Rau củ': '🥦',
  'Tinh bột': '🍚',
  'Gia vị': '🧂',
  'Sữa & Trứng': '🥚',
  'Đồ uống': '🥤',
  'Khác': '📦',
};

export default function IngredientsScreen() {
  const { state, dispatch } = useApp();
  const { ingredients } = state;
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [form, setForm] = useState({
    name: '',
    unit: 'kg',
    pricePerUnit: '',
    category: 'Khác',
  });
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = ['Tất cả', ...CATEGORIES];

  const filtered = useMemo(() => {
    return ingredients.filter(i => {
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'Tất cả' || i.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [ingredients, search, selectedCategory]);

  function openAdd() {
    setEditing(null);
    setForm({ name: '', unit: 'kg', pricePerUnit: '', category: 'Khác' });
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
    });
    setErrors({});
    setModalVisible(true);
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nhập tên nguyên liệu';
    if (!form.pricePerUnit || isNaN(Number(form.pricePerUnit)) || Number(form.pricePerUnit) <= 0)
      errs.pricePerUnit = 'Giá phải là số dương';
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
    };
    if (editing) {
      dispatch({ type: 'UPDATE_INGREDIENT', payload: data });
    } else {
      dispatch({ type: 'ADD_INGREDIENT', payload: data });
    }
    setModalVisible(false);
  }

  function handleDelete(ing) {
    Alert.alert('Xóa nguyên liệu', `Xóa "${ing.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_INGREDIENT', payload: ing.id }),
      },
    ]);
  }

  const groupedByCategory = useMemo(() => {
    if (selectedCategory !== 'Tất cả') return null;
    const groups = {};
    filtered.forEach(i => {
      if (!groups[i.category]) groups[i.category] = [];
      groups[i.category].push(i);
    });
    return groups;
  }, [filtered, selectedCategory]);

  function renderIngredient(ing) {
    return (
      <View key={ing.id} style={styles.ingRow}>
        <Text style={styles.ingIcon}>{CATEGORY_ICONS[ing.category] || '📦'}</Text>
        <View style={styles.ingInfo}>
          <Text style={styles.ingName}>{ing.name}</Text>
          <Text style={styles.ingPrice}>
            {formatCurrency(ing.pricePerUnit)} / {ing.unit}
          </Text>
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Header
        title="Nguyên liệu & Supplies"
        subtitle="Quản lý giá nguyên liệu theo đơn vị"
      />
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm nguyên liệu..."
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
            style={[
              styles.catChip,
              selectedCategory === cat && styles.catChipActive,
            ]}
          >
            <Text
              style={[
                styles.catChipText,
                selectedCategory === cat && styles.catChipTextActive,
              ]}
            >
              {cat === 'Tất cả' ? '🗂️ Tất cả' : `${CATEGORY_ICONS[cat]} ${cat}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {filtered.length === 0 ? (
          <EmptyState icon="🥕" message="Không tìm thấy nguyên liệu nào" />
        ) : selectedCategory === 'Tất cả' && groupedByCategory ? (
          Object.entries(groupedByCategory).map(([cat, items]) => (
            <Card key={cat}>
              <Text style={styles.groupTitle}>
                {CATEGORY_ICONS[cat]} {cat} ({items.length})
              </Text>
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
                {editing ? 'Cập nhật nguyên liệu' : 'Thêm nguyên liệu'}
              </Text>
              <Input
                label="Tên nguyên liệu"
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                placeholder="VD: Thịt bò, Cà chua..."
                error={errors.name}
              />
              <Input
                label="Giá / đơn vị"
                value={form.pricePerUnit}
                onChangeText={v => setForm(f => ({ ...f, pricePerUnit: v }))}
                placeholder="VD: 280000"
                keyboardType="numeric"
                right="$"
                error={errors.pricePerUnit}
              />

              <Text style={styles.pickLabel}>Đơn vị tính</Text>
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
                      onPress={() => {
                        setForm(f => ({ ...f, unit: u }));
                        setShowUnitPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerItemText, form.unit === u && styles.pickerItemTextActive]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[styles.pickLabel, { marginTop: 12 }]}>Danh mục</Text>
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
                  {CATEGORIES.map(c => (
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

              <View style={styles.modalActions}>
                <Button
                  label="Hủy"
                  variant="outline"
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  label={editing ? 'Cập nhật' : 'Thêm'}
                  onPress={handleSave}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </ScrollView>
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
  clearBtn: { fontSize: 16, color: COLORS.textSecondary, padding: 4 },
  addFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFabText: { fontSize: 24, color: '#FFF', lineHeight: 28 },
  catScroll: { maxHeight: 50, backgroundColor: COLORS.surface },
  catContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 13, color: COLORS.text },
  catChipTextActive: { color: '#FFF', fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  groupTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
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
  ingActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  iconBtnText: { fontSize: 16 },
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
    paddingBottom: 40,
    marginTop: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
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
    marginBottom: 4,
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
  modalActions: { flexDirection: 'row', marginTop: 20 },
});
