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

export default function StaffScreen() {
  const { state, dispatch } = useApp();
  const { departments } = state;
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    hourlyWage: '',
    hoursPerMonth: '208',
  });
  const [errors, setErrors] = useState({});

  const totalMonthlyWages = departments.reduce(
    (sum, d) => sum + d.hourlyWage * d.hoursPerMonth,
    0
  );

  function openAdd() {
    setEditing(null);
    setForm({ name: '', hourlyWage: '', hoursPerMonth: '208' });
    setErrors({});
    setModalVisible(true);
  }

  function openEdit(dept) {
    setEditing(dept);
    setForm({
      name: dept.name,
      hourlyWage: String(dept.hourlyWage),
      hoursPerMonth: String(dept.hoursPerMonth),
    });
    setErrors({});
    setModalVisible(true);
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên bộ phận';
    if (!form.hourlyWage || isNaN(Number(form.hourlyWage)) || Number(form.hourlyWage) <= 0)
      errs.hourlyWage = 'Lương phải là số dương';
    if (!form.hoursPerMonth || isNaN(Number(form.hoursPerMonth)) || Number(form.hoursPerMonth) <= 0)
      errs.hoursPerMonth = 'Số giờ phải là số dương';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const data = {
      id: editing?.id || generateId(),
      name: form.name.trim(),
      hourlyWage: Number(form.hourlyWage),
      hoursPerMonth: Number(form.hoursPerMonth),
    };
    if (editing) {
      dispatch({ type: 'UPDATE_DEPARTMENT', payload: data });
    } else {
      dispatch({ type: 'ADD_DEPARTMENT', payload: data });
    }
    setModalVisible(false);
  }

  function handleDelete(dept) {
    Alert.alert(
      'Xóa bộ phận',
      `Bạn chắc chắn muốn xóa bộ phận "${dept.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => dispatch({ type: 'DELETE_DEPARTMENT', payload: dept.id }),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Header
        title="Nhân viên & Lương"
        subtitle="Quản lý lương theo giờ cho từng bộ phận"
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Tổng lương / tháng (ước tính)</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalMonthlyWages)}</Text>
          <Text style={styles.summaryNote}>
            {departments.length} bộ phận · Dùng để tính chi phí nhân công cho mỗi món
          </Text>
        </Card>

        <SectionTitle
          text="Danh sách bộ phận"
          action="+ Thêm"
          onAction={openAdd}
        />

        {departments.length === 0 ? (
          <EmptyState icon="👥" message="Chưa có bộ phận nào. Thêm bộ phận để tính lương." />
        ) : (
          departments.map(dept => (
            <Card key={dept.id} style={styles.deptCard}>
              <View style={styles.deptHeader}>
                <View style={styles.deptIcon}>
                  <Text style={styles.deptIconText}>👤</Text>
                </View>
                <View style={styles.deptInfo}>
                  <Text style={styles.deptName}>{dept.name}</Text>
                  <Text style={styles.deptWage}>
                    {formatCurrency(dept.hourlyWage)} / giờ
                  </Text>
                </View>
              </View>
              <Divider />
              <View style={styles.deptStats}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Giờ / tháng</Text>
                  <Text style={styles.statValue}>{dept.hoursPerMonth}h</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Lương / tháng</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(dept.hourlyWage * dept.hoursPerMonth)}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Lương / phút</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(dept.hourlyWage / 60)}
                  </Text>
                </View>
              </View>
              <View style={styles.deptActions}>
                <Button
                  label="Sửa"
                  variant="outline"
                  onPress={() => openEdit(dept)}
                  style={styles.actionBtn}
                />
                <Button
                  label="Xóa"
                  variant="danger"
                  onPress={() => handleDelete(dept)}
                  style={styles.actionBtn}
                />
              </View>
            </Card>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editing ? 'Cập nhật bộ phận' : 'Thêm bộ phận'}
            </Text>
            <Input
              label="Tên bộ phận"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="VD: Bếp chính, Phục vụ..."
              error={errors.name}
            />
            <Input
              label="Lương theo giờ"
              value={form.hourlyWage}
              onChangeText={v => setForm(f => ({ ...f, hourlyWage: v }))}
              placeholder="VD: 50000"
              keyboardType="numeric"
              right="$/hr"
              error={errors.hourlyWage}
            />
            <Input
              label="Số giờ làm / tháng"
              value={form.hoursPerMonth}
              onChangeText={v => setForm(f => ({ ...f, hoursPerMonth: v }))}
              placeholder="VD: 208"
              keyboardType="numeric"
              right="giờ"
              error={errors.hoursPerMonth}
            />
            {form.hourlyWage && form.hoursPerMonth &&
              !isNaN(Number(form.hourlyWage)) &&
              !isNaN(Number(form.hoursPerMonth)) && (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Lương / tháng dự kiến:</Text>
                <Text style={styles.previewValue}>
                  {formatCurrency(Number(form.hourlyWage) * Number(form.hoursPerMonth))}
                </Text>
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: 16 },
  summaryCard: {
    backgroundColor: COLORS.primary,
    marginBottom: 20,
  },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  summaryNote: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  deptCard: { marginBottom: 12 },
  deptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  deptIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deptIconText: { fontSize: 22 },
  deptInfo: { flex: 1 },
  deptName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  deptWage: { fontSize: 14, color: COLORS.primary, marginTop: 2 },
  deptStats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 },
  statValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  deptActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
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
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  preview: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  previewLabel: { fontSize: 12, color: COLORS.textSecondary },
  previewValue: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  modalActions: { flexDirection: 'row', marginTop: 8 },
});
