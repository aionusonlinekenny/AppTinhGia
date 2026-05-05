import React, { useState, useMemo } from 'react';
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
import {
  useApp,
  generateId,
  formatCurrency,
  getWeekOf,
  offsetWeek,
  formatWeekRange,
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

const TABS = ['Payroll', 'Employees', 'Departments'];

// ── Payroll helpers ──────────────────────────────────────────────
function calcMainPay(hours, rate, cashAdvance) {
  return (Number(hours) || 0) * (Number(rate) || 0) + (Number(cashAdvance) || 0);
}
function calcGrandTotal(mainPay, extraCheck) {
  return mainPay + (Number(extraCheck) || 0);
}

// ── Column widths for the payroll table ─────────────────────────
const COL = { name: 130, hours: 65, rate: 65, cash: 80, main: 92, check: 80, grand: 92 };
const TABLE_WIDTH = Object.values(COL).reduce((a, b) => a + b, 0);

export default function StaffScreen() {
  const { state, dispatch } = useApp();
  const { departments, employees, payrollEntries } = state;
  const [activeTab, setActiveTab] = useState('Payroll');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Header title="Staff & Payroll" subtitle="Wages, time tracking & departments" />

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

      {activeTab === 'Payroll' && (
        <PayrollTab
          employees={employees}
          payrollEntries={payrollEntries}
          dispatch={dispatch}
        />
      )}
      {activeTab === 'Employees' && (
        <EmployeesTab employees={employees} dispatch={dispatch} />
      )}
      {activeTab === 'Departments' && (
        <DepartmentsTab departments={departments} dispatch={dispatch} />
      )}
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────
// PAYROLL TAB
// ────────────────────────────────────────────────────────────────
function PayrollTab({ employees, payrollEntries, dispatch }) {
  const [weekOf, setWeekOf] = useState(getWeekOf());
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    employeeId: '',
    hours: '',
    rate: '',
    cashAdvance: '0',
    extraCheck: '0',
  });
  const [errors, setErrors] = useState({});

  const weekEntries = useMemo(
    () => payrollEntries.filter(e => e.weekOf === weekOf),
    [payrollEntries, weekOf]
  );

  // Totals row
  const totals = useMemo(() => {
    return weekEntries.reduce(
      (acc, e) => {
        const main = calcMainPay(e.hours, e.rate, e.cashAdvance);
        const grand = calcGrandTotal(main, e.extraCheck);
        return {
          hours: acc.hours + (Number(e.hours) || 0),
          cash: acc.cash + (Number(e.cashAdvance) || 0),
          main: acc.main + main,
          check: acc.check + (Number(e.extraCheck) || 0),
          grand: acc.grand + grand,
        };
      },
      { hours: 0, cash: 0, main: 0, check: 0, grand: 0 }
    );
  }, [weekEntries]);

  function openAdd() {
    setEditing(null);
    setForm({
      employeeId: employees[0]?.id || '',
      hours: '',
      rate: employees[0] ? String(employees[0].hourlyRate) : '',
      cashAdvance: '0',
      extraCheck: '0',
    });
    setErrors({});
    setModalVisible(true);
  }

  function openEdit(entry) {
    setEditing(entry);
    setForm({
      employeeId: entry.employeeId,
      hours: String(entry.hours),
      rate: String(entry.rate),
      cashAdvance: String(entry.cashAdvance),
      extraCheck: String(entry.extraCheck),
    });
    setErrors({});
    setModalVisible(true);
  }

  function validate() {
    const errs = {};
    if (!form.employeeId) errs.employeeId = 'Select an employee';
    if (!form.hours || isNaN(Number(form.hours)) || Number(form.hours) < 0)
      errs.hours = 'Enter valid hours';
    if (!form.rate || isNaN(Number(form.rate)) || Number(form.rate) <= 0)
      errs.rate = 'Enter valid rate';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    // Prevent duplicate employee in same week (unless editing same entry)
    const duplicate = payrollEntries.find(
      e => e.weekOf === weekOf && e.employeeId === form.employeeId && e.id !== editing?.id
    );
    if (duplicate) {
      Alert.alert('Duplicate', 'This employee already has an entry for this week. Edit the existing one.');
      return;
    }
    const data = {
      id: editing?.id || generateId(),
      weekOf,
      employeeId: form.employeeId,
      hours: Number(form.hours),
      rate: Number(form.rate),
      cashAdvance: Number(form.cashAdvance) || 0,
      extraCheck: Number(form.extraCheck) || 0,
    };
    dispatch({
      type: editing ? 'UPDATE_PAYROLL_ENTRY' : 'ADD_PAYROLL_ENTRY',
      payload: data,
    });
    setModalVisible(false);
  }

  function handleDelete(entry) {
    const emp = employees.find(e => e.id === entry.employeeId);
    Alert.alert('Delete Entry', `Delete payroll entry for "${emp?.name || 'employee'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_PAYROLL_ENTRY', payload: entry.id }),
      },
    ]);
  }

  // When employee picker changes, auto-fill their default rate
  function onPickEmployee(empId) {
    const emp = employees.find(e => e.id === empId);
    setForm(f => ({
      ...f,
      employeeId: empId,
      rate: emp ? String(emp.hourlyRate) : f.rate,
    }));
  }

  const previewMain = calcMainPay(form.hours, form.rate, form.cashAdvance);
  const previewGrand = calcGrandTotal(previewMain, form.extraCheck);

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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Summary chips */}
        <View style={styles.payrollSummary}>
          <View style={styles.pSumItem}>
            <Text style={styles.pSumVal}>{weekEntries.length}</Text>
            <Text style={styles.pSumLabel}>Employees</Text>
          </View>
          <View style={styles.pSumDivider} />
          <View style={styles.pSumItem}>
            <Text style={styles.pSumVal}>{totals.hours.toFixed(1)}h</Text>
            <Text style={styles.pSumLabel}>Total Hours</Text>
          </View>
          <View style={styles.pSumDivider} />
          <View style={styles.pSumItem}>
            <Text style={[styles.pSumVal, { color: '#FFF' }]}>{formatCurrency(totals.grand)}</Text>
            <Text style={styles.pSumLabel}>Grand Total</Text>
          </View>
        </View>

        {/* Payroll table */}
        {weekEntries.length === 0 ? (
          <EmptyState icon="📋" message="No payroll entries for this week.\nTap + Add Entry to begin." />
        ) : (
          <View style={styles.tableWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={{ width: TABLE_WIDTH }}>
                {/* Header */}
                <View style={[styles.tableRow, styles.tableHead]}>
                  <Text style={[styles.thCell, { width: COL.name }]}>Name</Text>
                  <Text style={[styles.thCell, styles.thRight, { width: COL.hours }]}>Hours</Text>
                  <Text style={[styles.thCell, styles.thRight, { width: COL.rate }]}>Rate</Text>
                  <Text style={[styles.thCell, styles.thRight, { width: COL.cash }]}>Cash Adv.</Text>
                  <Text style={[styles.thCell, styles.thRight, { width: COL.main }]}>Main Pay</Text>
                  <Text style={[styles.thCell, styles.thRight, { width: COL.check }]}>+Check</Text>
                  <Text style={[styles.thCell, styles.thRight, { width: COL.grand }]}>Grand Total</Text>
                </View>

                {/* Data rows */}
                {weekEntries.map(entry => {
                  const emp = employees.find(e => e.id === entry.employeeId);
                  const main = calcMainPay(entry.hours, entry.rate, entry.cashAdvance);
                  const grand = calcGrandTotal(main, entry.extraCheck);
                  return (
                    <TouchableOpacity
                      key={entry.id}
                      style={styles.tableRow}
                      onPress={() => openEdit(entry)}
                      onLongPress={() => handleDelete(entry)}
                    >
                      <Text style={[styles.tdCell, { width: COL.name }]} numberOfLines={1}>
                        {emp?.name || '—'}
                      </Text>
                      <Text style={[styles.tdCell, styles.tdRight, { width: COL.hours }]}>
                        {Number(entry.hours).toFixed(2)}
                      </Text>
                      <Text style={[styles.tdCell, styles.tdRight, { width: COL.rate }]}>
                        ${Number(entry.rate).toFixed(2)}
                      </Text>
                      <Text style={[styles.tdCell, styles.tdRight, { width: COL.cash }]}>
                        {entry.cashAdvance > 0 ? formatCurrency(entry.cashAdvance) : '—'}
                      </Text>
                      <Text style={[styles.tdCell, styles.tdRight, styles.tdBold, { width: COL.main }]}>
                        {formatCurrency(main)}
                      </Text>
                      <Text style={[styles.tdCell, styles.tdRight, { width: COL.check }]}>
                        {entry.extraCheck > 0 ? formatCurrency(entry.extraCheck) : '—'}
                      </Text>
                      <Text style={[styles.tdCell, styles.tdRight, styles.tdGrand, { width: COL.grand }]}>
                        {formatCurrency(grand)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Totals row */}
                <View style={[styles.tableRow, styles.tableTotal]}>
                  <Text style={[styles.tdCell, styles.tdBold, { width: COL.name }]}>TOTAL</Text>
                  <Text style={[styles.tdCell, styles.tdRight, styles.tdBold, { width: COL.hours }]}>
                    {totals.hours.toFixed(2)}
                  </Text>
                  <Text style={[styles.tdCell, { width: COL.rate }]} />
                  <Text style={[styles.tdCell, styles.tdRight, styles.tdBold, { width: COL.cash }]}>
                    {totals.cash > 0 ? formatCurrency(totals.cash) : '—'}
                  </Text>
                  <Text style={[styles.tdCell, styles.tdRight, styles.tdBold, { width: COL.main }]}>
                    {formatCurrency(totals.main)}
                  </Text>
                  <Text style={[styles.tdCell, styles.tdRight, styles.tdBold, { width: COL.check }]}>
                    {totals.check > 0 ? formatCurrency(totals.check) : '—'}
                  </Text>
                  <Text style={[styles.tdCell, styles.tdRight, styles.tdGrand, styles.tdBold, { width: COL.grand }]}>
                    {formatCurrency(totals.grand)}
                  </Text>
                </View>
              </View>
            </ScrollView>
            <Text style={styles.tableHint}>Tap row to edit · Long-press to delete</Text>
          </View>
        )}

        <TouchableOpacity style={styles.addEntryBtn} onPress={openAdd}>
          <Text style={styles.addEntryText}>+ Add Entry</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add / Edit payroll modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                {editing ? 'Edit Payroll Entry' : 'Add Payroll Entry'}
              </Text>
              <Text style={styles.modalWeek}>Week: {formatWeekRange(weekOf)}</Text>

              {/* Employee picker */}
              <Text style={styles.pickLabel}>Employee</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.empPickerRow}
              >
                {employees.map(emp => (
                  <TouchableOpacity
                    key={emp.id}
                    style={[
                      styles.empChip,
                      form.employeeId === emp.id && styles.empChipActive,
                    ]}
                    onPress={() => onPickEmployee(emp.id)}
                  >
                    <Text
                      style={[
                        styles.empChipText,
                        form.employeeId === emp.id && styles.empChipTextActive,
                      ]}
                    >
                      {emp.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.employeeId && (
                <Text style={styles.errText}>{errors.employeeId}</Text>
              )}

              <View style={styles.row2}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input
                    label="Hours Worked"
                    value={form.hours}
                    onChangeText={v => setForm(f => ({ ...f, hours: v }))}
                    placeholder="e.g. 144.00"
                    keyboardType="numeric"
                    right="hrs"
                    error={errors.hours}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Hourly Rate"
                    value={form.rate}
                    onChangeText={v => setForm(f => ({ ...f, rate: v }))}
                    placeholder="e.g. 13.50"
                    keyboardType="numeric"
                    right="$/hr"
                    error={errors.rate}
                  />
                </View>
              </View>

              <View style={styles.row2}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input
                    label="Cash Advance"
                    value={form.cashAdvance}
                    onChangeText={v => setForm(f => ({ ...f, cashAdvance: v }))}
                    placeholder="0.00"
                    keyboardType="numeric"
                    right="$"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="+Check (2nd source)"
                    value={form.extraCheck}
                    onChangeText={v => setForm(f => ({ ...f, extraCheck: v }))}
                    placeholder="0.00"
                    keyboardType="numeric"
                    right="$"
                  />
                </View>
              </View>

              {/* Live preview */}
              {form.hours && form.rate && (
                <View style={styles.payPreview}>
                  <View style={styles.payPreviewRow}>
                    <Text style={styles.payPreviewLabel}>Hours × Rate</Text>
                    <Text style={styles.payPreviewVal}>
                      {formatCurrency((Number(form.hours) || 0) * (Number(form.rate) || 0))}
                    </Text>
                  </View>
                  <View style={styles.payPreviewRow}>
                    <Text style={styles.payPreviewLabel}>+ Cash Advance</Text>
                    <Text style={styles.payPreviewVal}>
                      {formatCurrency(Number(form.cashAdvance) || 0)}
                    </Text>
                  </View>
                  <Divider />
                  <View style={styles.payPreviewRow}>
                    <Text style={[styles.payPreviewLabel, { fontWeight: '700' }]}>Main Pay</Text>
                    <Text style={[styles.payPreviewVal, { fontWeight: '700', color: COLORS.primary }]}>
                      {formatCurrency(previewMain)}
                    </Text>
                  </View>
                  {Number(form.extraCheck) > 0 && (
                    <>
                      <View style={styles.payPreviewRow}>
                        <Text style={styles.payPreviewLabel}>+ Check (2nd source)</Text>
                        <Text style={styles.payPreviewVal}>
                          {formatCurrency(Number(form.extraCheck))}
                        </Text>
                      </View>
                      <Divider />
                      <View style={styles.payPreviewRow}>
                        <Text style={[styles.payPreviewLabel, { fontWeight: '700' }]}>Grand Total</Text>
                        <Text style={[styles.payPreviewVal, { fontWeight: '800', color: COLORS.success || '#2E7D32', fontSize: 16 }]}>
                          {formatCurrency(previewGrand)}
                        </Text>
                      </View>
                    </>
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
// EMPLOYEES TAB
// ────────────────────────────────────────────────────────────────
function EmployeesTab({ employees, dispatch }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', hourlyRate: '' });
  const [errors, setErrors] = useState({});

  function openAdd() {
    setEditing(null);
    setForm({ name: '', hourlyRate: '' });
    setErrors({});
    setModalVisible(true);
  }

  function openEdit(emp) {
    setEditing(emp);
    setForm({ name: emp.name, hourlyRate: String(emp.hourlyRate) });
    setErrors({});
    setModalVisible(true);
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Enter employee name';
    if (!form.hourlyRate || isNaN(Number(form.hourlyRate)) || Number(form.hourlyRate) <= 0)
      errs.hourlyRate = 'Enter a valid hourly rate';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const data = {
      id: editing?.id || generateId(),
      name: form.name.trim(),
      hourlyRate: Number(form.hourlyRate),
    };
    dispatch({ type: editing ? 'UPDATE_EMPLOYEE' : 'ADD_EMPLOYEE', payload: data });
    setModalVisible(false);
  }

  function handleDelete(emp) {
    Alert.alert('Delete Employee', `Delete "${emp.name}"? All payroll entries for this employee will also be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_EMPLOYEE', payload: emp.id }),
      },
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <SectionTitle text="Employees" action="+ Add" onAction={openAdd} />
        {employees.length === 0 ? (
          <EmptyState icon="👤" message="No employees yet." />
        ) : (
          employees.map(emp => (
            <Card key={emp.id} style={styles.empCard}>
              <View style={styles.empRow}>
                <View style={styles.empAvatar}>
                  <Text style={styles.empAvatarText}>
                    {emp.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.empInfo}>
                  <Text style={styles.empName}>{emp.name}</Text>
                  <Text style={styles.empRate}>
                    {formatCurrency(emp.hourlyRate)} / hr
                  </Text>
                </View>
                <View style={styles.empCardActions}>
                  <Button
                    label="Edit"
                    variant="outline"
                    onPress={() => openEdit(emp)}
                    style={styles.smallBtn}
                  />
                  <Button
                    label="Del"
                    variant="danger"
                    onPress={() => handleDelete(emp)}
                    style={styles.smallBtn}
                  />
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editing ? 'Edit Employee' : 'Add Employee'}
            </Text>
            <Input
              label="Full Name"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="e.g. Huy T Pham"
              error={errors.name}
            />
            <Input
              label="Default Hourly Rate"
              value={form.hourlyRate}
              onChangeText={v => setForm(f => ({ ...f, hourlyRate: v }))}
              placeholder="e.g. 13.50"
              keyboardType="numeric"
              right="$/hr"
              error={errors.hourlyRate}
            />
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
    </View>
  );
}

// ────────────────────────────────────────────────────────────────
// DEPARTMENTS TAB  (unchanged functionality, used for dish cost calc)
// ────────────────────────────────────────────────────────────────
function DepartmentsTab({ departments, dispatch }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', hourlyWage: '', hoursPerMonth: '208' });
  const [errors, setErrors] = useState({});

  const totalMonthlyWages = departments.reduce(
    (sum, d) => sum + d.hourlyWage * d.hoursPerMonth, 0
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
    dispatch({ type: editing ? 'UPDATE_DEPARTMENT' : 'ADD_DEPARTMENT', payload: data });
    setModalVisible(false);
  }

  function handleDelete(dept) {
    Alert.alert('Delete Department', `Delete "${dept.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_DEPARTMENT', payload: dept.id }),
      },
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Monthly Wages (estimated)</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalMonthlyWages)}</Text>
          <Text style={styles.summaryNote}>
            {departments.length} departments · Used to calculate labor cost per dish
          </Text>
        </Card>

        <SectionTitle text="Departments" action="+ Add" onAction={openAdd} />

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
              !isNaN(Number(form.hourlyWage)) && !isNaN(Number(form.hoursPerMonth)) && (
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
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Week navigation
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

  // Payroll summary chips
  payrollSummary: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  pSumItem: { flex: 1, alignItems: 'center' },
  pSumDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  pSumVal: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  pSumLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Table
  tableWrapper: {
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableHead: { backgroundColor: COLORS.secondary || '#F3F4F6' },
  tableTotal: { backgroundColor: '#FFF8E1' },
  thCell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  thRight: { textAlign: 'right' },
  tdCell: {
    paddingVertical: 11,
    paddingHorizontal: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  tdRight: { textAlign: 'right' },
  tdBold: { fontWeight: '700' },
  tdGrand: { color: COLORS.primary, fontWeight: '700' },
  tableHint: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Add entry button
  addEntryBtn: {
    margin: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addEntryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // Employee cards
  empCard: { marginBottom: 10 },
  empRow: { flexDirection: 'row', alignItems: 'center' },
  empAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  empAvatarText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  empInfo: { flex: 1 },
  empName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  empRate: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  empCardActions: { flexDirection: 'row', gap: 6 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 7 },

  // Department styles (unchanged)
  summaryCard: { backgroundColor: COLORS.primary, marginBottom: 20 },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  summaryNote: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  deptCard: { marginBottom: 12 },
  deptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  deptIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.secondary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  deptIconText: { fontSize: 22 },
  deptInfo: { flex: 1 },
  deptName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  deptWage: { fontSize: 14, color: COLORS.primary, marginTop: 2 },
  deptStats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 },
  statValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  deptActions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 9 },

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

  // Employee picker inside modal
  pickLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '500' },
  empPickerRow: { marginBottom: 8 },
  empChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  empChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  empChipText: { fontSize: 13, color: COLORS.text },
  empChipTextActive: { color: '#FFF', fontWeight: '600' },
  errText: { fontSize: 12, color: '#E53935', marginBottom: 8 },

  // Pay preview box
  payPreview: {
    backgroundColor: COLORS.secondary || '#F0F4FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  payPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  payPreviewLabel: { fontSize: 13, color: COLORS.textSecondary },
  payPreviewVal: { fontSize: 13, color: COLORS.text },

  // Dept modal
  preview: { backgroundColor: COLORS.secondary, borderRadius: 10, padding: 12, marginBottom: 16 },
  previewLabel: { fontSize: 12, color: COLORS.textSecondary },
  previewValue: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  modalActions: { flexDirection: 'row', marginTop: 8 },
});
