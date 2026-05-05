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
    if (!form.name.trim()) errs.name = 'Enter department name';
    if (!form.hourlyWage || isNaN(Number(form.hourlyWage)) || Number(form.hourlyWage) <= 0)
      errs.hourlyWage = 'Wage must be a positive number';
    if (!form.hoursPerMonth || isNaN(Number(form.hoursPerMonth)) || Number(form.hoursPerMonth) <= 0)
      errs.hoursPerMonth = 'Hours must be a positive number';
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
      'Delete Department',
      `Delete "${dept.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch({ type: 'DELETE_DEPARTMENT', payload: dept.id }),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Header
        title="Staff & Wages"
        subtitle="Manage hourly wages by department"
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Monthly Wages (estimated)</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalMonthlyWages)}</Text>
          <Text style={styles.summaryNote}>
            {departments.length} departments · Used to calculate labor cost per dish
          </Text>
        </Card>

        <SectionTitle
          text="Departments"
          action="+ Add"
          onAction={openAdd}
        />

        {departments.length === 0 ? (
          <EmptyState icon="👥" message="No departments yet. Add one to calculate labor costs." />
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
                    {formatCurrency(dept.hourlyWage)} / hr
                  </Text>
                </View>
              </View>
              <Divider />
              <View style={styles.deptStats}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Hours / month</Text>
                  <Text style={styles.statValue}>{dept.hoursPerMonth}h</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Wages / month</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(dept.hourlyWage * dept.hoursPerMonth)}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Cost / min</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(dept.hourlyWage / 60)}
                  </Text>
                </View>
              </View>
              <View style={styles.deptActions}>
                <Button
                  label="Edit"
                  variant="outline"
                  onPress={() => openEdit(dept)}
                  style={styles.actionBtn}
                />
                <Button
                  label="Delete"
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
              {editing ? 'Update Department' : 'Add Department'}
            </Text>
            <Input
              label="Department Name"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="e.g. Head Chef, Server, Cashier..."
              error={errors.name}
            />
            <Input
              label="Hourly Wage"
              value={form.hourlyWage}
              onChangeText={v => setForm(f => ({ ...f, hourlyWage: v }))}
              placeholder="e.g. 18.00"
              keyboardType="numeric"
              right="$/hr"
              error={errors.hourlyWage}
            />
            <Input
              label="Hours / Month"
              value={form.hoursPerMonth}
              onChangeText={v => setForm(f => ({ ...f, hoursPerMonth: v }))}
              placeholder="e.g. 173"
              keyboardType="numeric"
              right="hrs"
              error={errors.hoursPerMonth}
            />
            {form.hourlyWage && form.hoursPerMonth &&
              !isNaN(Number(form.hourlyWage)) &&
              !isNaN(Number(form.hoursPerMonth)) && (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Estimated monthly wages:</Text>
                <Text style={styles.previewValue}>
                  {formatCurrency(Number(form.hourlyWage) * Number(form.hoursPerMonth))}
                </Text>
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
