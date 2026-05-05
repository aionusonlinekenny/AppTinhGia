import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
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
} from '../components';

const COST_TYPES = [
  { key: 'electricity', label: 'Điện', icon: '⚡', color: '#FFF9C4', border: '#F9A825' },
  { key: 'water', label: 'Nước', icon: '💧', color: '#E1F5FE', border: '#0288D1' },
  { key: 'gas', label: 'Gas', icon: '🔥', color: '#FBE9E7', border: '#E64A19' },
  { key: 'rent', label: 'Thuê mặt bằng', icon: '🏢', color: '#EDE7F6', border: '#512DA8' },
  { key: 'internet', label: 'Internet', icon: '📡', color: '#E8F5E9', border: '#388E3C' },
  { key: 'insurance', label: 'Bảo hiểm', icon: '🛡️', color: '#F3E5F5', border: '#7B1FA2' },
  { key: 'maintenance', label: 'Bảo trì thiết bị', icon: '🔧', color: '#FFF3E0', border: '#E65100' },
  { key: 'other', label: 'Chi phí khác', icon: '📋', color: '#FAFAFA', border: '#9E9E9E' },
];

function getTypeInfo(key) {
  return COST_TYPES.find(t => t.key === key) || COST_TYPES[COST_TYPES.length - 1];
}

export default function OverheadScreen() {
  const { state, dispatch } = useApp();
  const { overheadCosts, settings } = state;
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: 'other',
    monthlyCost: '',
  });
  const [settingsForm, setSettingsForm] = useState({
    workingDaysPerMonth: String(settings.workingDaysPerMonth),
    totalDishesPerDay: String(settings.totalDishesPerDay),
  });
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [errors, setErrors] = useState({});

  const totalMonthlyOverhead = overheadCosts.reduce((sum, o) => sum + o.monthlyCost, 0);
  const totalDishesPerMonth = settings.workingDaysPerMonth * settings.totalDishesPerDay;
  const overheadPerDish = totalDishesPerMonth > 0 ? totalMonthlyOverhead / totalDishesPerMonth : 0;

  const grouped = COST_TYPES.reduce((acc, type) => {
    const items = overheadCosts.filter(o => o.type === type.key);
    if (items.length > 0) acc[type.key] = items;
    return acc;
  }, {});

  function openAdd() {
    setEditing(null);
    setForm({ name: '', type: 'other', monthlyCost: '' });
    setErrors({});
    setModalVisible(true);
  }

  function openEdit(cost) {
    setEditing(cost);
    setForm({
      name: cost.name,
      type: cost.type,
      monthlyCost: String(cost.monthlyCost),
    });
    setErrors({});
    setModalVisible(true);
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nhập tên chi phí';
    if (!form.monthlyCost || isNaN(Number(form.monthlyCost)) || Number(form.monthlyCost) < 0)
      errs.monthlyCost = 'Số tiền phải là số không âm';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const data = {
      id: editing?.id || generateId(),
      name: form.name.trim(),
      type: form.type,
      monthlyCost: Number(form.monthlyCost),
    };
    if (editing) {
      dispatch({ type: 'UPDATE_OVERHEAD', payload: data });
    } else {
      dispatch({ type: 'ADD_OVERHEAD', payload: data });
    }
    setModalVisible(false);
  }

  function handleDelete(cost) {
    Alert.alert('Xóa chi phí', `Xóa "${cost.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_OVERHEAD', payload: cost.id }),
      },
    ]);
  }

  function saveSettings() {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        workingDaysPerMonth: Number(settingsForm.workingDaysPerMonth) || 26,
        totalDishesPerDay: Number(settingsForm.totalDishesPerDay) || 100,
      },
    });
    setSettingsModalVisible(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Header
        title="Chi phí vận hành"
        subtitle="Điện, nước, gas và các chi phí cố định hàng tháng"
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tổng / tháng</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalMonthlyOverhead)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Chi phí / món</Text>
              <Text style={[styles.summaryValue, { color: COLORS.accent }]}>
                {formatCurrency(overheadPerDish)}
              </Text>
            </View>
          </View>
          <Divider />
          <View style={styles.settingsInfo}>
            <Text style={styles.settingsText}>
              📅 {settings.workingDaysPerMonth} ngày/tháng · 🍽️ {settings.totalDishesPerDay} món/ngày
            </Text>
            <TouchableOpacity onPress={() => setSettingsModalVisible(true)}>
              <Text style={styles.settingsEditBtn}>Chỉnh sửa</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Cost type breakdown */}
        <View style={styles.typeGrid}>
          {COST_TYPES.map(type => {
            const items = overheadCosts.filter(o => o.type === type.key);
            const total = items.reduce((s, i) => s + i.monthlyCost, 0);
            if (total === 0) return null;
            return (
              <View
                key={type.key}
                style={[styles.typeCard, { backgroundColor: type.color, borderColor: type.border }]}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={styles.typeLabel}>{type.label}</Text>
                <Text style={[styles.typeAmount, { color: type.border }]}>
                  {formatCurrency(total)}
                </Text>
              </View>
            );
          })}
        </View>

        <SectionTitle
          text="Danh sách chi phí"
          action="+ Thêm"
          onAction={openAdd}
        />

        {overheadCosts.length === 0 ? (
          <EmptyState icon="💡" message="Chưa có chi phí nào. Thêm chi phí điện, nước, gas..." />
        ) : (
          Object.entries(grouped).map(([typeKey, items]) => {
            const typeInfo = getTypeInfo(typeKey);
            return (
              <Card key={typeKey} style={[styles.groupCard, { borderTopColor: typeInfo.border }]}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupIcon}>{typeInfo.icon}</Text>
                  <Text style={styles.groupLabel}>{typeInfo.label}</Text>
                  <Text style={[styles.groupTotal, { color: typeInfo.border }]}>
                    {formatCurrency(items.reduce((s, i) => s + i.monthlyCost, 0))}
                  </Text>
                </View>
                <Divider />
                {items.map(cost => (
                  <View key={cost.id} style={styles.costRow}>
                    <View style={styles.costInfo}>
                      <Text style={styles.costName}>{cost.name}</Text>
                      <Text style={styles.costAmount}>{formatCurrency(cost.monthlyCost)} / tháng</Text>
                    </View>
                    <View style={styles.costActions}>
                      <TouchableOpacity onPress={() => openEdit(cost)} style={styles.iconBtn}>
                        <Text>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(cost)} style={styles.iconBtn}>
                        <Text>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </Card>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editing ? 'Cập nhật chi phí' : 'Thêm chi phí'}
            </Text>

            <Text style={styles.pickLabel}>Loại chi phí</Text>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={() => setShowTypePicker(!showTypePicker)}
            >
              <Text style={styles.pickValue}>
                {getTypeInfo(form.type).icon} {getTypeInfo(form.type).label}
              </Text>
              <Text style={styles.pickArrow}>▼</Text>
            </TouchableOpacity>
            {showTypePicker && (
              <View style={styles.pickerList}>
                {COST_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.pickerItem, form.type === t.key && styles.pickerItemActive]}
                    onPress={() => {
                      setForm(f => ({ ...f, type: t.key }));
                      setShowTypePicker(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, form.type === t.key && styles.pickerItemTextActive]}>
                      {t.icon} {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Input
              label="Tên chi phí"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="VD: Tiền điện tháng 5..."
              error={errors.name}
            />
            <Input
              label="Số tiền / tháng"
              value={form.monthlyCost}
              onChangeText={v => setForm(f => ({ ...f, monthlyCost: v }))}
              placeholder="VD: 5000000"
              keyboardType="numeric"
              right="₫/tháng"
              error={errors.monthlyCost}
            />

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
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={settingsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cài đặt phân bổ chi phí</Text>
            <Text style={styles.settingsHint}>
              Dùng để tính chi phí vận hành phân bổ cho mỗi món ăn
            </Text>
            <Input
              label="Số ngày mở cửa / tháng"
              value={settingsForm.workingDaysPerMonth}
              onChangeText={v => setSettingsForm(f => ({ ...f, workingDaysPerMonth: v }))}
              placeholder="26"
              keyboardType="numeric"
              right="ngày"
            />
            <Input
              label="Tổng số món bán / ngày"
              value={settingsForm.totalDishesPerDay}
              onChangeText={v => setSettingsForm(f => ({ ...f, totalDishesPerDay: v }))}
              placeholder="100"
              keyboardType="numeric"
              right="món"
            />
            {settingsForm.workingDaysPerMonth && settingsForm.totalDishesPerDay && (
              <View style={styles.calcPreview}>
                <Text style={styles.calcLabel}>Chi phí vận hành / món:</Text>
                <Text style={styles.calcValue}>
                  {formatCurrency(
                    totalMonthlyOverhead /
                      (Number(settingsForm.workingDaysPerMonth) *
                        Number(settingsForm.totalDishesPerDay))
                  )}
                </Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <Button
                label="Hủy"
                variant="outline"
                onPress={() => setSettingsModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button label="Lưu" onPress={saveSettings} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: 16 },
  summaryCard: { backgroundColor: COLORS.primary, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', marginBottom: 4 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  settingsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  settingsText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  settingsEditBtn: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeCard: {
    width: '47%',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    alignItems: 'flex-start',
  },
  typeIcon: { fontSize: 22, marginBottom: 4 },
  typeLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  typeAmount: { fontSize: 14, fontWeight: '700' },
  groupCard: { borderTopWidth: 3, marginBottom: 12 },
  groupHeader: { flexDirection: 'row', alignItems: 'center' },
  groupIcon: { fontSize: 20, marginRight: 8 },
  groupLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text },
  groupTotal: { fontSize: 15, fontWeight: '700' },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  costInfo: { flex: 1 },
  costName: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  costAmount: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  costActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
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
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  settingsHint: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  calcPreview: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  calcLabel: { fontSize: 12, color: COLORS.textSecondary },
  calcValue: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
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
  modalActions: { flexDirection: 'row', marginTop: 8 },
});
