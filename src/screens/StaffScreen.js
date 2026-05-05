import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Switch,
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
const GROUP_LABELS = { kitchen: '👨‍🍳 Kitchen', waiter: '🍽️ Waiter' };
const GROUP_COLORS = { kitchen: '#FFF3E0', waiter: '#E3F2FD' };
const GROUP_TEXT   = { kitchen: '#E65100', waiter: '#1565C0' };

// payroll formulas
function calcMainPay(hours, rate, cashAdvance) {
  return (Number(hours) || 0) * (Number(rate) || 0) + (Number(cashAdvance) || 0);
}
function calcGrandTotal(mainPay, extraCheck, tips) {
  return mainPay + (Number(extraCheck) || 0) + (Number(tips) || 0);
}

// column widths for the scrollable table
const COL = { name: 120, hours: 60, rate: 60, cash: 75, main: 85, check: 70, tips: 75, grand: 88 };
const TABLE_WIDTH = Object.values(COL).reduce((a, b) => a + b, 0);

export default function StaffScreen() {
  const { state, dispatch } = useApp();
  const { departments, employees, payrollEntries, salesRecords } = state;
  const [activeTab, setActiveTab] = useState('Payroll');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Header title="Staff & Payroll" subtitle="Wages, time tracking & departments" />
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
          salesRecords={salesRecords}
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
function PayrollTab({ employees, payrollEntries, salesRecords, dispatch }) {
  const [weekOf, setWeekOf] = useState(getWeekOf());
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    employeeId: '',
    hours: '',
    rate: '',
    cashAdvance: '0',
    extraCheck: '0',
    tips: '0',
  });
  const [errors, setErrors] = useState({});

  const weekEntries = useMemo(
    () => payrollEntries.filter(e => e.weekOf === weekOf),
    [payrollEntries, weekOf]
  );

  // Sales record for this week (tips reference)
  const salesRec = useMemo(
    () => salesRecords.find(r => r.weekOf === weekOf),
    [salesRecords, weekOf]
  );
  const totalSalesTips = salesRec
    ? (Number(salesRec.cardTips) || 0) + (Number(salesRec.cashTips) || 0)
    : null;
  const allocatedTips = weekEntries.reduce((s, e) => s + (Number(e.tips) || 0), 0);

  const totals = useMemo(() =>
    weekEntries.reduce(
      (acc, e) => {
        const main = calcMainPay(e.hours, e.rate, e.cashAdvance);
        const grand = calcGrandTotal(main, e.extraCheck, e.tips);
        return {
          hours: acc.hours + (Number(e.hours) || 0),
          cash: acc.cash + (Number(e.cashAdvance) || 0),
          main: acc.main + main,
          check: acc.check + (Number(e.extraCheck) || 0),
          tips: acc.tips + (Number(e.tips) || 0),
          grand: acc.grand + grand,
        };
      },
      { hours: 0, cash: 0, main: 0, check: 0, tips: 0, grand: 0 }
    ),
    [weekEntries]
  );

  function openAdd() {
    const first = employees[0];
    setEditing(null);
    setForm({
      employeeId: first?.id || '',
      hours: '',
      rate: first ? String(first.hourlyRate) : '',
      cashAdvance: '0',
      extraCheck: '0',
      tips: '0',
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
      tips: String(entry.tips || 0),
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
    const duplicate = payrollEntries.find(
      e => e.weekOf === weekOf && e.employeeId === form.employeeId && e.id !== editing?.id
    );
    if (duplicate) {
      Alert.alert('Duplicate', 'This employee already has an entry for this week.');
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
      tips: Number(form.tips) || 0,
    };
    dispatch({ type: editing ? 'UPDATE_PAYROLL_ENTRY' : 'ADD_PAYROLL_ENTRY', payload: data });
    setModalVisible(false);
  }

  function handleDelete(entry) {
    const emp = employees.find(e => e.id === entry.employeeId);
    Alert.alert('Delete Entry', `Delete entry for "${emp?.name || 'employee'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_PAYROLL_ENTRY', payload: entry.id }),
      },
    ]);
  }

  function onPickEmployee(empId) {
    const emp = employees.find(e => e.id === empId);
    setForm(f => ({
      ...f,
      employeeId: empId,
      rate: emp ? String(emp.hourlyRate) : f.rate,
    }));
  }

  const selectedEmp = employees.find(e => e.id === form.employeeId);
  const previewMain = calcMainPay(form.hours, form.rate, form.cashAdvance);
  const previewGrand = calcGrandTotal(previewMain, form.extraCheck, form.tips);

  // Group employees for the picker display
  const kitchen = employees.filter(e => e.group === 'kitchen');
  const waiters = employees.filter(e => e.group === 'waiter');

  return (
    <View style={{ flex: 1 }}>
      {/* Week navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setWeekOf(w => offsetWeek(w, -1))} style={styles.weekArrow}>
          <Text style={styles.weekArrowText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.weekLabel}>Week of</Text>
          <Text style={styles.weekRange}>{formatWeekRange(weekOf)}</Text>
        </View>
        <TouchableOpacity onPress={() => setWeekOf(w => offsetWeek(w, 1))} style={styles.weekArrow}>
          <Text style={styles.weekArrowText}>›</Text>
        </TouchableOpacity>
      </View>

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
          <Text style={[styles.pSumVal, { fontSize: 14 }]}>{formatCurrency(totals.grand)}</Text>
          <Text style={styles.pSumLabel}>Grand Total</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Tip pool banner (when sales record exists for this week) */}
        {totalSalesTips !== null && (
          <View style={[
            styles.tipBanner,
            Math.abs(allocatedTips - totalSalesTips) < 0.01
              ? styles.tipBannerOk
              : styles.tipBannerWarn,
          ]}>
            <Text style={styles.tipBannerText}>
              💰 Tips this week: {formatCurrency(totalSalesTips)}
              {'  '}·{'  '}
              Allocated: {formatCurrency(allocatedTips)}
              {Math.abs(allocatedTips - totalSalesTips) > 0.01
                ? `  ⚠️ ${formatCurrency(Math.abs(totalSalesTips - allocatedTips))} remaining`
                : '  ✅ balanced'}
            </Text>
          </View>
        )}

        {/* Table */}
        {weekEntries.length === 0 ? (
          <EmptyState icon="📋" message="No payroll entries for this week.&#10;Tap + Add Entry to begin." />
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
                  <Text style={[styles.thCell, styles.thRight, { width: COL.tips }]}>Tips</Text>
                  <Text style={[styles.thCell, styles.thRight, { width: COL.grand }]}>Grand Total</Text>
                </View>

                {/* Rows */}
                {weekEntries.map(entry => {
                  const emp = employees.find(e => e.id === entry.employeeId);
                  const main = calcMainPay(entry.hours, entry.rate, entry.cashAdvance);
                  const grand = calcGrandTotal(main, entry.extraCheck, entry.tips);
                  const isWaiter = emp?.group === 'waiter';
                  return (
                    <TouchableOpacity
                      key={entry.id}
                      style={[styles.tableRow, isWaiter && styles.tableRowWaiter]}
                      onPress={() => openEdit(entry)}
                      onLongPress={() => handleDelete(entry)}
                    >
                      <View style={[{ width: COL.name }, styles.nameCell]}>
                        <Text style={styles.tdName} numberOfLines={1}>{emp?.name || '—'}</Text>
                        <Text style={[styles.tdGroup, { color: GROUP_TEXT[emp?.group] || COLORS.textSecondary }]}>
                          {emp?.group === 'waiter' ? '🍽️' : '👨‍🍳'}
                        </Text>
                      </View>
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
                      <Text style={[styles.tdCell, styles.tdRight, styles.tdTips, { width: COL.tips }]}>
                        {(entry.tips || 0) > 0 ? formatCurrency(entry.tips) : '—'}
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
                  <Text style={[styles.tdCell, styles.tdRight, styles.tdBold, styles.tdTips, { width: COL.tips }]}>
                    {totals.tips > 0 ? formatCurrency(totals.tips) : '—'}
                  </Text>
                  <Text style={[styles.tdCell, styles.tdRight, styles.tdGrand, styles.tdBold, { width: COL.grand }]}>
                    {formatCurrency(totals.grand)}
                  </Text>
                </View>
              </View>
            </ScrollView>
            <Text style={styles.tableHint}>Tap to edit · Long-press to delete</Text>
          </View>
        )}

        <TouchableOpacity style={styles.addEntryBtn} onPress={openAdd}>
          <Text style={styles.addEntryText}>+ Add Entry</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add / Edit modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                {editing ? 'Edit Payroll Entry' : 'Add Payroll Entry'}
              </Text>
              <Text style={styles.modalWeek}>Week: {formatWeekRange(weekOf)}</Text>

              {/* Employee picker grouped by Kitchen / Waiter */}
              <Text style={styles.pickLabel}>Kitchen 👨‍🍳</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.empPickerRow}>
                {kitchen.map(emp => (
                  <TouchableOpacity
                    key={emp.id}
                    style={[styles.empChip, form.employeeId === emp.id && styles.empChipActive, styles.empChipKitchen]}
                    onPress={() => onPickEmployee(emp.id)}
                  >
                    <Text style={[styles.empChipText, form.employeeId === emp.id && styles.empChipTextActive]}>
                      {emp.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.pickLabel, { marginTop: 8 }]}>Waiters 🍽️</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.empPickerRow}>
                {waiters.map(emp => (
                  <TouchableOpacity
                    key={emp.id}
                    style={[styles.empChip, form.employeeId === emp.id && styles.empChipActive, styles.empChipWaiter]}
                    onPress={() => onPickEmployee(emp.id)}
                  >
                    <Text style={[styles.empChipText, form.employeeId === emp.id && styles.empChipTextActive]}>
                      {emp.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.employeeId && <Text style={styles.errText}>{errors.employeeId}</Text>}

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

              {/* Tips — shown for waiters or tip-eligible kitchen */}
              {selectedEmp && (selectedEmp.group === 'waiter' || selectedEmp.tipEligible) && (
                <Input
                  label={`Tips${selectedEmp.group === 'waiter' ? ' 💰' : ' 💰 (tip share)'}`}
                  value={form.tips}
                  onChangeText={v => setForm(f => ({ ...f, tips: v }))}
                  placeholder="0.00"
                  keyboardType="numeric"
                  right="$"
                />
              )}
              {totalSalesTips !== null && selectedEmp && (selectedEmp.group === 'waiter' || selectedEmp.tipEligible) && (
                <Text style={styles.tipHint}>
                  Week tips: {formatCurrency(totalSalesTips)} total · {formatCurrency(allocatedTips)} allocated
                </Text>
              )}

              {/* Live pay preview */}
              {form.hours && form.rate && (
                <View style={styles.payPreview}>
                  <View style={styles.payPreviewRow}>
                    <Text style={styles.payPreviewLabel}>Hours × Rate</Text>
                    <Text style={styles.payPreviewVal}>
                      {formatCurrency((Number(form.hours) || 0) * (Number(form.rate) || 0))}
                    </Text>
                  </View>
                  {Number(form.cashAdvance) > 0 && (
                    <View style={styles.payPreviewRow}>
                      <Text style={styles.payPreviewLabel}>+ Cash Advance</Text>
                      <Text style={styles.payPreviewVal}>{formatCurrency(Number(form.cashAdvance))}</Text>
                    </View>
                  )}
                  <View style={[styles.payPreviewRow, styles.payPreviewTotal]}>
                    <Text style={[styles.payPreviewLabel, { fontWeight: '700' }]}>Main Pay</Text>
                    <Text style={[styles.payPreviewVal, { fontWeight: '700', color: COLORS.primary }]}>
                      {formatCurrency(previewMain)}
                    </Text>
                  </View>
                  {Number(form.extraCheck) > 0 && (
                    <View style={styles.payPreviewRow}>
                      <Text style={styles.payPreviewLabel}>+ Check</Text>
                      <Text style={styles.payPreviewVal}>{formatCurrency(Number(form.extraCheck))}</Text>
                    </View>
                  )}
                  {Number(form.tips) > 0 && (
                    <View style={styles.payPreviewRow}>
                      <Text style={styles.payPreviewLabel}>+ Tips</Text>
                      <Text style={[styles.payPreviewVal, { color: '#1B5E20' }]}>
                        {formatCurrency(Number(form.tips))}
                      </Text>
                    </View>
                  )}
                  {(Number(form.extraCheck) > 0 || Number(form.tips) > 0) && (
                    <View style={[styles.payPreviewRow, styles.payPreviewGrand]}>
                      <Text style={[styles.payPreviewLabel, { fontWeight: '800' }]}>Grand Total</Text>
                      <Text style={[styles.payPreviewVal, { fontWeight: '800', color: '#1B5E20', fontSize: 16 }]}>
                        {formatCurrency(previewGrand)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.modalActions}>
                <Button label="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
                <Button label={editing ? 'Update' : 'Add'} onPress={handleSave} style={{ flex: 1 }} />
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
  const [form, setForm] = useState({ name: '', hourlyRate: '', group: 'kitchen', tipEligible: false });
  const [errors, setErrors] = useState({});

  const kitchen = employees.filter(e => e.group === 'kitchen');
  const waiters  = employees.filter(e => e.group === 'waiter');

  function openAdd() {
    setEditing(null);
    setForm({ name: '', hourlyRate: '', group: 'kitchen', tipEligible: false });
    setErrors({});
    setModalVisible(true);
  }

  function openEdit(emp) {
    setEditing(emp);
    setForm({
      name: emp.name,
      hourlyRate: String(emp.hourlyRate),
      group: emp.group || 'kitchen',
      tipEligible: emp.tipEligible || false,
    });
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
    const tipElig = form.group === 'waiter' ? true : form.tipEligible;
    const data = {
      id: editing?.id || generateId(),
      name: form.name.trim(),
      hourlyRate: Number(form.hourlyRate),
      group: form.group,
      tipEligible: tipElig,
    };
    dispatch({ type: editing ? 'UPDATE_EMPLOYEE' : 'ADD_EMPLOYEE', payload: data });
    setModalVisible(false);
  }

  function handleDelete(emp) {
    Alert.alert('Delete Employee', `Delete "${emp.name}"?\nAll payroll entries will also be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_EMPLOYEE', payload: emp.id }),
      },
    ]);
  }

  function renderGroup(title, list, color) {
    return (
      <View key={title}>
        <Text style={styles.groupHeader}>{title}</Text>
        {list.length === 0 ? (
          <Text style={styles.groupEmpty}>None yet</Text>
        ) : (
          list.map(emp => (
            <Card key={emp.id} style={[styles.empCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
              <View style={styles.empRow}>
                <View style={[styles.empAvatar, { backgroundColor: color }]}>
                  <Text style={styles.empAvatarText}>{emp.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.empInfo}>
                  <Text style={styles.empName}>{emp.name}</Text>
                  <View style={styles.empMetaRow}>
                    <Text style={styles.empRate}>{formatCurrency(emp.hourlyRate)}/hr</Text>
                    {emp.tipEligible && (
                      <View style={styles.tipBadge}>
                        <Text style={styles.tipBadgeText}>💰 Tip share</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.empCardActions}>
                  <Button label="Edit" variant="outline" onPress={() => openEdit(emp)} style={styles.smallBtn} />
                  <Button label="Del" variant="danger" onPress={() => handleDelete(emp)} style={styles.smallBtn} />
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <SectionTitle text="Employees" action="+ Add" onAction={openAdd} />
        {renderGroup('👨‍🍳 Kitchen', kitchen, '#FF8A65')}
        <View style={{ height: 16 }} />
        {renderGroup('🍽️ Waiters', waiters, '#42A5F5')}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Employee' : 'Add Employee'}</Text>

            {/* Group toggle */}
            <Text style={styles.pickLabel}>Role Group</Text>
            <View style={styles.groupToggle}>
              {['kitchen', 'waiter'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.groupToggleBtn, form.group === g && styles.groupToggleBtnActive]}
                  onPress={() => setForm(f => ({ ...f, group: g, tipEligible: g === 'waiter' ? true : f.tipEligible }))}
                >
                  <Text style={[styles.groupToggleText, form.group === g && styles.groupToggleTextActive]}>
                    {GROUP_LABELS[g]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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

            {/* Tip share toggle — only for kitchen staff */}
            {form.group === 'kitchen' && (
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Tip Share Eligible</Text>
                  <Text style={styles.switchHint}>Can receive a portion of the tip pool</Text>
                </View>
                <Switch
                  value={form.tipEligible}
                  onValueChange={v => setForm(f => ({ ...f, tipEligible: v }))}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={form.tipEligible ? '#FFF' : '#DDD'}
                />
              </View>
            )}
            {form.group === 'waiter' && (
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Receives Tips</Text>
                  <Text style={styles.switchHint}>Waiters always receive tips</Text>
                </View>
                <Switch value={true} disabled trackColor={{ true: '#42A5F5' }} thumbColor="#FFF" />
              </View>
            )}

            <View style={styles.modalActions}>
              <Button label="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button label={editing ? 'Update' : 'Add'} onPress={handleSave} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────
// DEPARTMENTS TAB  (unchanged — used for dish cost calculation)
// ────────────────────────────────────────────────────────────────
function DepartmentsTab({ departments, dispatch }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', hourlyWage: '', hoursPerMonth: '208' });
  const [errors, setErrors] = useState({});

  const totalMonthlyWages = departments.reduce((sum, d) => sum + d.hourlyWage * d.hoursPerMonth, 0);

  function openAdd() {
    setEditing(null);
    setForm({ name: '', hourlyWage: '', hoursPerMonth: '208' });
    setErrors({});
    setModalVisible(true);
  }
  function openEdit(dept) {
    setEditing(dept);
    setForm({ name: dept.name, hourlyWage: String(dept.hourlyWage), hoursPerMonth: String(dept.hoursPerMonth) });
    setErrors({});
    setModalVisible(true);
  }
  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Enter department name';
    if (!form.hourlyWage || isNaN(Number(form.hourlyWage)) || Number(form.hourlyWage) <= 0) errs.hourlyWage = 'Wage must be positive';
    if (!form.hoursPerMonth || isNaN(Number(form.hoursPerMonth)) || Number(form.hoursPerMonth) <= 0) errs.hoursPerMonth = 'Hours must be positive';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }
  function handleSave() {
    if (!validate()) return;
    const data = { id: editing?.id || generateId(), name: form.name.trim(), hourlyWage: Number(form.hourlyWage), hoursPerMonth: Number(form.hoursPerMonth) };
    dispatch({ type: editing ? 'UPDATE_DEPARTMENT' : 'ADD_DEPARTMENT', payload: data });
    setModalVisible(false);
  }
  function handleDelete(dept) {
    Alert.alert('Delete Department', `Delete "${dept.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_DEPARTMENT', payload: dept.id }) },
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Monthly Wages (estimated)</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalMonthlyWages)}</Text>
          <Text style={styles.summaryNote}>{departments.length} departments · Used for dish cost calculation</Text>
        </Card>
        <SectionTitle text="Departments" action="+ Add" onAction={openAdd} />
        {departments.length === 0 ? (
          <EmptyState icon="👥" message="No departments yet." />
        ) : (
          departments.map(dept => (
            <Card key={dept.id} style={styles.deptCard}>
              <View style={styles.deptHeader}>
                <View style={styles.deptIcon}><Text style={styles.deptIconText}>👤</Text></View>
                <View style={styles.deptInfo}>
                  <Text style={styles.deptName}>{dept.name}</Text>
                  <Text style={styles.deptWage}>{formatCurrency(dept.hourlyWage)} / hr</Text>
                </View>
              </View>
              <Divider />
              <View style={styles.deptStats}>
                <View style={styles.stat}><Text style={styles.statLabel}>Hours/mo</Text><Text style={styles.statValue}>{dept.hoursPerMonth}h</Text></View>
                <View style={styles.stat}><Text style={styles.statLabel}>Wages/mo</Text><Text style={styles.statValue}>{formatCurrency(dept.hourlyWage * dept.hoursPerMonth)}</Text></View>
                <View style={styles.stat}><Text style={styles.statLabel}>Cost/min</Text><Text style={styles.statValue}>{formatCurrency(dept.hourlyWage / 60)}</Text></View>
              </View>
              <View style={styles.deptActions}>
                <Button label="Edit" variant="outline" onPress={() => openEdit(dept)} style={styles.actionBtn} />
                <Button label="Delete" variant="danger" onPress={() => handleDelete(dept)} style={styles.actionBtn} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editing ? 'Update Department' : 'Add Department'}</Text>
            <Input label="Department Name" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Head Chef..." error={errors.name} />
            <Input label="Hourly Wage" value={form.hourlyWage} onChangeText={v => setForm(f => ({ ...f, hourlyWage: v }))} placeholder="18.00" keyboardType="numeric" right="$/hr" error={errors.hourlyWage} />
            <Input label="Hours / Month" value={form.hoursPerMonth} onChangeText={v => setForm(f => ({ ...f, hoursPerMonth: v }))} placeholder="173" keyboardType="numeric" right="hrs" error={errors.hoursPerMonth} />
            {form.hourlyWage && form.hoursPerMonth && !isNaN(Number(form.hourlyWage)) && !isNaN(Number(form.hoursPerMonth)) && (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Estimated monthly wages:</Text>
                <Text style={styles.previewValue}>{formatCurrency(Number(form.hourlyWage) * Number(form.hoursPerMonth))}</Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <Button label="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button label={editing ? 'Update' : 'Add'} onPress={handleSave} style={{ flex: 1 }} />
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
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },

  weekNav: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 4 },
  weekArrow: { padding: 12 },
  weekArrowText: { fontSize: 24, color: '#FFF', fontWeight: '300' },
  weekInfo: { flex: 1, alignItems: 'center' },
  weekLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  weekRange: { fontSize: 15, fontWeight: '700', color: '#FFF', marginTop: 2 },

  payrollSummary: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingBottom: 12, paddingHorizontal: 16 },
  pSumItem: { flex: 1, alignItems: 'center' },
  pSumDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  pSumVal: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  pSumLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  tipBanner: { marginHorizontal: 12, marginTop: 10, borderRadius: 8, padding: 10 },
  tipBannerOk: { backgroundColor: '#E8F5E9' },
  tipBannerWarn: { backgroundColor: '#FFF8E1' },
  tipBannerText: { fontSize: 12, color: COLORS.text, lineHeight: 18 },

  tableWrapper: { margin: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableRowWaiter: { backgroundColor: '#F8FBFF' },
  tableHead: { backgroundColor: '#F3F4F6' },
  tableTotal: { backgroundColor: '#FFF8E1' },
  thCell: { paddingVertical: 10, paddingHorizontal: 8, fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  thRight: { textAlign: 'right' },
  nameCell: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 8 },
  tdName: { flex: 1, fontSize: 12, color: COLORS.text, fontWeight: '500' },
  tdGroup: { fontSize: 12 },
  tdCell: { paddingVertical: 11, paddingHorizontal: 8, fontSize: 12, color: COLORS.text },
  tdRight: { textAlign: 'right' },
  tdBold: { fontWeight: '700' },
  tdTips: { color: '#2E7D32' },
  tdGrand: { color: COLORS.primary, fontWeight: '700' },
  tableHint: { fontSize: 11, color: COLORS.textLight, textAlign: 'center', paddingVertical: 8 },

  addEntryBtn: { margin: 16, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addEntryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // Employee tab
  groupHeader: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8, marginTop: 4 },
  groupEmpty: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, fontStyle: 'italic' },
  empCard: { marginBottom: 10 },
  empRow: { flexDirection: 'row', alignItems: 'center' },
  empAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  empAvatarText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  empInfo: { flex: 1 },
  empName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  empMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  empRate: { fontSize: 13, color: COLORS.primary },
  tipBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tipBadgeText: { fontSize: 11, color: '#2E7D32', fontWeight: '600' },
  empCardActions: { flexDirection: 'row', gap: 6 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 7 },

  // Group toggle in modal
  groupToggle: { flexDirection: 'row', marginBottom: 16, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  groupToggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: COLORS.background },
  groupToggleBtnActive: { backgroundColor: COLORS.primary },
  groupToggleText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  groupToggleTextActive: { color: '#FFF' },

  // Switch row
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border, marginBottom: 16 },
  switchInfo: { flex: 1, marginRight: 12 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  switchHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // Department tab
  summaryCard: { backgroundColor: COLORS.primary, marginBottom: 20 },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  summaryNote: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  deptCard: { marginBottom: 12 },
  deptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  deptIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
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

  // Shared modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, marginTop: 60 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  modalWeek: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 },
  pickLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '500' },
  row2: { flexDirection: 'row' },
  empPickerRow: { marginBottom: 6 },
  empChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  empChipKitchen: { borderColor: '#FF8A65' },
  empChipWaiter:  { borderColor: '#42A5F5' },
  empChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  empChipText: { fontSize: 13, color: COLORS.text },
  empChipTextActive: { color: '#FFF', fontWeight: '600' },
  errText: { fontSize: 12, color: '#E53935', marginBottom: 8 },
  tipHint: { fontSize: 11, color: '#2E7D32', marginBottom: 8, marginTop: -4 },

  payPreview: { backgroundColor: COLORS.secondary, borderRadius: 10, padding: 12, marginBottom: 16 },
  payPreviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  payPreviewTotal: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 4, paddingTop: 6 },
  payPreviewGrand: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 4, paddingTop: 6 },
  payPreviewLabel: { fontSize: 13, color: COLORS.textSecondary },
  payPreviewVal: { fontSize: 13, color: COLORS.text },

  preview: { backgroundColor: COLORS.secondary, borderRadius: 10, padding: 12, marginBottom: 16 },
  previewLabel: { fontSize: 12, color: COLORS.textSecondary },
  previewValue: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  modalActions: { flexDirection: 'row', marginTop: 8 },
});
