import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  useApp,
  generateId,
  formatCurrency,
  getWeekOf,
  offsetWeek,
  formatWeekRange,
  shiftHours,
  calcEmployeeWeeklyHours,
  calcGroupWeightedRate,
} from '../context/AppContext';
import { COLORS, Header, Card, Button, Input, SectionTitle, EmptyState, Divider } from '../components';

const TABS     = ['Payroll', 'Employees'];
const DAYS     = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEF_SCHED = Object.fromEntries(DAYS.map(d => [d, null]));

const GROUP_LABEL = { kitchen: '👨‍🍳 Kitchen', waiter: '🍽️ Waiter' };
const GROUP_COLOR = { kitchen: '#FF8A65', waiter: '#42A5F5' };

function calcMainPay(hours, rate, cash)    { return (Number(hours)||0) * (Number(rate)||0) + (Number(cash)||0); }
function calcGrandTotal(main, check, tips) { return main + (Number(check)||0) + (Number(tips)||0); }

const COL = { name:120, hours:60, rate:60, cash:75, main:85, check:70, tips:75, grand:88 };
const TABLE_W = Object.values(COL).reduce((a,b)=>a+b, 0);

// ── Schedule editor (shared by EmployeesTab) ─────────────────────
function ScheduleEditor({ schedule, onChange }) {
  const totalHrs  = Object.values(schedule).filter(Boolean).reduce((s,sh)=>s+shiftHours(sh.start,sh.end), 0);
  const workDays  = Object.values(schedule).filter(Boolean).length;
  return (
    <View style={sStyles.wrap}>
      <Text style={sStyles.title}>📅 Weekly Schedule</Text>
      {DAYS.map(day => {
        const shift = schedule[day];
        const hrs   = shift ? shiftHours(shift.start, shift.end) : 0;
        return (
          <View key={day} style={sStyles.row}>
            <TouchableOpacity
              style={[sStyles.dayBtn, shift && sStyles.dayBtnOn]}
              onPress={() => onChange(day, 'toggle')}
            >
              <Text style={[sStyles.dayText, shift && sStyles.dayTextOn]}>{day}</Text>
            </TouchableOpacity>
            {shift ? (
              <>
                <TextInput
                  style={sStyles.timeInput}
                  value={shift.start}
                  onChangeText={v => onChange(day, 'start', v)}
                  placeholder="09:00"
                  placeholderTextColor={COLORS.textLight}
                  maxLength={5}
                />
                <Text style={sStyles.sep}>→</Text>
                <TextInput
                  style={sStyles.timeInput}
                  value={shift.end}
                  onChangeText={v => onChange(day, 'end', v)}
                  placeholder="21:00"
                  placeholderTextColor={COLORS.textLight}
                  maxLength={5}
                />
                <Text style={sStyles.hrsLabel}>{hrs > 0 ? `${hrs.toFixed(1)}h` : '—'}</Text>
              </>
            ) : (
              <Text style={sStyles.offLabel}>OFF</Text>
            )}
          </View>
        );
      })}
      <View style={sStyles.totalRow}>
        <Text style={sStyles.totalText}>
          Total: <Text style={{ fontWeight:'700', color: COLORS.primary }}>{totalHrs.toFixed(1)} hrs</Text>
          /week · {workDays} days
        </Text>
      </View>
    </View>
  );
}

const sStyles = StyleSheet.create({
  wrap:      { borderTopWidth:1, borderTopColor: COLORS.border, marginTop:16, paddingTop:14 },
  title:     { fontSize:14, fontWeight:'700', color:COLORS.text, marginBottom:10 },
  row:       { flexDirection:'row', alignItems:'center', marginBottom:8, gap:6 },
  dayBtn:    { width:42, paddingVertical:6, borderRadius:8, borderWidth:1.5, borderColor:COLORS.border, alignItems:'center', backgroundColor:COLORS.background },
  dayBtnOn:  { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  dayText:   { fontSize:12, fontWeight:'600', color:COLORS.textSecondary },
  dayTextOn: { color:'#FFF' },
  timeInput: { width:58, borderWidth:1.5, borderColor:COLORS.border, borderRadius:8, paddingHorizontal:6, paddingVertical:5, fontSize:13, color:COLORS.text, textAlign:'center', backgroundColor:'#FAFAFA' },
  sep:       { fontSize:13, color:COLORS.textSecondary },
  hrsLabel:  { width:36, fontSize:12, color:COLORS.textSecondary, textAlign:'right' },
  offLabel:  { flex:1, fontSize:12, color:COLORS.textLight, fontStyle:'italic', marginLeft:8 },
  totalRow:  { borderTopWidth:1, borderTopColor:COLORS.border, paddingTop:10, marginTop:4 },
  totalText: { fontSize:13, color:COLORS.textSecondary, textAlign:'right' },
});

// ── Root ─────────────────────────────────────────────────────────
export default function StaffScreen() {
  const { state, dispatch } = useApp();
  const { employees, payrollEntries, salesRecords, settings } = state;
  const [activeTab, setActiveTab]     = useState('Payroll');
  const [locked, setLocked]           = useState(true);
  const [pinInput, setPinInput]       = useState('');
  const [lockError, setLockError]     = useState('');
  const [changePwVisible, setChangePwVisible] = useState(false);
  const [cpForm, setCpForm]           = useState({ current: '', next: '', confirm: '' });
  const [cpError, setCpError]         = useState('');

  // Re-lock every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLocked(true);
      setPinInput('');
      setLockError('');
    }, [])
  );

  const password = settings?.staffPassword || '1234';

  function handleUnlock() {
    if (pinInput === password) {
      setLocked(false);
      setPinInput('');
      setLockError('');
    } else {
      setLockError('Incorrect password. Try again.');
      setPinInput('');
    }
  }

  function handleChangePassword() {
    if (cpForm.current !== password) { setCpError('Current password is incorrect.'); return; }
    if (cpForm.next.length < 4)      { setCpError('New password must be at least 4 characters.'); return; }
    if (cpForm.next !== cpForm.confirm) { setCpError('New passwords do not match.'); return; }
    dispatch({ type: 'UPDATE_SETTINGS', payload: { staffPassword: cpForm.next } });
    setChangePwVisible(false);
    setCpForm({ current: '', next: '', confirm: '' });
    setCpError('');
    Alert.alert('Success', 'Password updated.');
  }

  if (locked) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.lockScreen}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>Staff & Payroll</Text>
          <Text style={styles.lockSub}>Enter password to access</Text>
          <TextInput
            style={styles.lockInput}
            value={pinInput}
            onChangeText={v => { setPinInput(v); setLockError(''); }}
            placeholder="Password"
            placeholderTextColor={COLORS.textLight}
            secureTextEntry
            autoFocus
            onSubmitEditing={handleUnlock}
            returnKeyType="done"
          />
          {lockError ? <Text style={styles.lockError}>{lockError}</Text> : null}
          <TouchableOpacity style={styles.unlockBtn} onPress={handleUnlock}>
            <Text style={styles.unlockBtnText}>Unlock</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Header title="Staff & Payroll" subtitle="Wages, schedules & weekly payroll" />

      {/* Change password button */}
      <TouchableOpacity
        style={styles.changePwRow}
        onPress={() => { setCpForm({ current: '', next: '', confirm: '' }); setCpError(''); setChangePwVisible(true); }}
      >
        <Text style={styles.changePwText}>🔑 Change password</Text>
      </TouchableOpacity>

      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, activeTab===t && styles.tabBtnActive]} onPress={()=>setActiveTab(t)}>
            <Text style={[styles.tabText, activeTab===t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === 'Payroll'    && <PayrollTab   employees={employees} payrollEntries={payrollEntries} salesRecords={salesRecords} dispatch={dispatch} />}
      {activeTab === 'Employees'  && <EmployeesTab employees={employees} dispatch={dispatch} />}

      {/* Change password modal */}
      <Modal visible={changePwVisible} animationType="fade" transparent>
        <View style={styles.cpOverlay}>
          <View style={styles.cpBox}>
            <Text style={styles.cpTitle}>🔑 Change Password</Text>
            <TextInput
              style={styles.cpInput}
              value={cpForm.current}
              onChangeText={v => { setCpForm(f => ({ ...f, current: v })); setCpError(''); }}
              placeholder="Current password"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry
            />
            <TextInput
              style={styles.cpInput}
              value={cpForm.next}
              onChangeText={v => { setCpForm(f => ({ ...f, next: v })); setCpError(''); }}
              placeholder="New password (min 4 chars)"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry
            />
            <TextInput
              style={styles.cpInput}
              value={cpForm.confirm}
              onChangeText={v => { setCpForm(f => ({ ...f, confirm: v })); setCpError(''); }}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry
            />
            {cpError ? <Text style={styles.lockError}>{cpError}</Text> : null}
            <View style={styles.cpActions}>
              <TouchableOpacity style={[styles.cpBtn, styles.cpBtnOutline]} onPress={() => setChangePwVisible(false)}>
                <Text style={styles.cpBtnOutlineText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cpBtn} onPress={handleChangePassword}>
                <Text style={styles.cpBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── PAYROLL TAB ──────────────────────────────────────────────────
function PayrollTab({ employees, payrollEntries, salesRecords, dispatch }) {
  const [weekOf, setWeekOf] = useState(getWeekOf());
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ employeeId:'', hours:'', rate:'', cashAdvance:'0', extraCheck:'0', tips:'0' });
  const [errors, setErrors] = useState({});

  const weekEntries = useMemo(()=>payrollEntries.filter(e=>e.weekOf===weekOf), [payrollEntries, weekOf]);
  const salesRec    = useMemo(()=>salesRecords.find(r=>r.weekOf===weekOf), [salesRecords, weekOf]);
  const totalSalesTips = salesRec ? (Number(salesRec.cardTips)||0)+(Number(salesRec.cashTips)||0) : null;
  const allocatedTips  = weekEntries.reduce((s,e)=>s+(Number(e.tips)||0), 0);

  const totals = useMemo(()=>weekEntries.reduce((acc,e)=>{
    const main  = calcMainPay(e.hours, e.rate, e.cashAdvance);
    const grand = calcGrandTotal(main, e.extraCheck, e.tips);
    return { hours: acc.hours+(Number(e.hours)||0), cash: acc.cash+(Number(e.cashAdvance)||0), main: acc.main+main, check: acc.check+(Number(e.extraCheck)||0), tips: acc.tips+(Number(e.tips)||0), grand: acc.grand+grand };
  }, { hours:0, cash:0, main:0, check:0, tips:0, grand:0 }), [weekEntries]);

  function openAdd() {
    const first = employees[0];
    setEditing(null);
    setForm({ employeeId:first?.id||'', hours:'', rate:first?String(first.hourlyRate):'', cashAdvance:'0', extraCheck:'0', tips:'0' });
    setErrors({});
    setModalVisible(true);
  }
  function openEdit(entry) {
    setEditing(entry);
    setForm({ employeeId:entry.employeeId, hours:String(entry.hours), rate:String(entry.rate), cashAdvance:String(entry.cashAdvance), extraCheck:String(entry.extraCheck), tips:String(entry.tips||0) });
    setErrors({});
    setModalVisible(true);
  }
  function validate() {
    const errs={};
    if (!form.employeeId) errs.employeeId='Select an employee';
    if (!form.hours||isNaN(Number(form.hours))||Number(form.hours)<0) errs.hours='Enter valid hours';
    if (!form.rate ||isNaN(Number(form.rate)) ||Number(form.rate)<=0)  errs.rate='Enter valid rate';
    setErrors(errs);
    return Object.keys(errs).length===0;
  }
  function handleSave() {
    if (!validate()) return;
    const dup = payrollEntries.find(e=>e.weekOf===weekOf && e.employeeId===form.employeeId && e.id!==editing?.id);
    if (dup) { Alert.alert('Duplicate','This employee already has an entry for this week.'); return; }
    const data = { id:editing?.id||generateId(), weekOf, employeeId:form.employeeId, hours:Number(form.hours), rate:Number(form.rate), cashAdvance:Number(form.cashAdvance)||0, extraCheck:Number(form.extraCheck)||0, tips:Number(form.tips)||0 };
    dispatch({ type: editing ? 'UPDATE_PAYROLL_ENTRY' : 'ADD_PAYROLL_ENTRY', payload:data });
    setModalVisible(false);
  }
  function handleDelete(entry) {
    const emp = employees.find(e=>e.id===entry.employeeId);
    Alert.alert('Delete Entry',`Delete entry for "${emp?.name||'employee'}"?`,[
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress:()=>dispatch({ type:'DELETE_PAYROLL_ENTRY', payload:entry.id }) },
    ]);
  }
  function pickEmployee(id) {
    const emp = employees.find(e=>e.id===id);
    setForm(f=>({ ...f, employeeId:id, rate:emp?String(emp.hourlyRate):f.rate }));
  }

  const selEmp     = employees.find(e=>e.id===form.employeeId);
  const previewMain = calcMainPay(form.hours, form.rate, form.cashAdvance);
  const previewGrand= calcGrandTotal(previewMain, form.extraCheck, form.tips);
  const kitchen     = employees.filter(e=>e.group==='kitchen');
  const waiters     = employees.filter(e=>e.group==='waiter');

  return (
    <View style={{flex:1}}>
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={()=>setWeekOf(w=>offsetWeek(w,-1))} style={styles.weekArrow}><Text style={styles.weekArrowTxt}>‹</Text></TouchableOpacity>
        <View style={styles.weekInfo}><Text style={styles.weekLbl}>Week of</Text><Text style={styles.weekRange}>{formatWeekRange(weekOf)}</Text></View>
        <TouchableOpacity onPress={()=>setWeekOf(w=>offsetWeek(w,+1))} style={styles.weekArrow}><Text style={styles.weekArrowTxt}>›</Text></TouchableOpacity>
      </View>
      <View style={styles.pSummary}>
        <View style={styles.pSumItem}><Text style={styles.pSumVal}>{weekEntries.length}</Text><Text style={styles.pSumLbl}>Employees</Text></View>
        <View style={styles.pSumDiv} />
        <View style={styles.pSumItem}><Text style={styles.pSumVal}>{totals.hours.toFixed(1)}h</Text><Text style={styles.pSumLbl}>Total Hours</Text></View>
        <View style={styles.pSumDiv} />
        <View style={styles.pSumItem}><Text style={[styles.pSumVal,{fontSize:14}]}>{formatCurrency(totals.grand)}</Text><Text style={styles.pSumLbl}>Grand Total</Text></View>
      </View>

      <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom:24}}>
        {totalSalesTips !== null && (
          <View style={[styles.tipBanner, Math.abs(allocatedTips-totalSalesTips)<0.01 ? styles.tipOk : styles.tipWarn]}>
            <Text style={styles.tipBannerTxt}>
              💰 Tips: {formatCurrency(totalSalesTips)} total · Allocated: {formatCurrency(allocatedTips)}
              {Math.abs(allocatedTips-totalSalesTips)>0.01 ? `  ⚠️ ${formatCurrency(Math.abs(totalSalesTips-allocatedTips))} remaining` : '  ✅'}
            </Text>
          </View>
        )}

        {weekEntries.length===0 ? (
          <EmptyState icon="📋" message="No entries for this week.&#10;Tap + Add Entry." />
        ) : (
          <View style={styles.tableWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={{width:TABLE_W}}>
                <View style={[styles.tRow, styles.tHead]}>
                  {[['Name',COL.name],['Hours',COL.hours],['Rate',COL.rate],['Cash Adv.',COL.cash],['Main Pay',COL.main],['+Check',COL.check],['Tips',COL.tips],['Grand Total',COL.grand]].map(([lbl,w],i)=>(
                    <Text key={i} style={[styles.thCell,{width:w},i>0&&styles.thRight]}>{lbl}</Text>
                  ))}
                </View>
                {weekEntries.map(entry=>{
                  const emp   = employees.find(e=>e.id===entry.employeeId);
                  const main  = calcMainPay(entry.hours, entry.rate, entry.cashAdvance);
                  const grand = calcGrandTotal(main, entry.extraCheck, entry.tips);
                  return (
                    <TouchableOpacity key={entry.id} style={[styles.tRow, emp?.group==='waiter'&&styles.tRowWaiter]} onPress={()=>openEdit(entry)} onLongPress={()=>handleDelete(entry)}>
                      <View style={[{width:COL.name},styles.nameCell]}>
                        <Text style={styles.tdName} numberOfLines={1}>{emp?.name||'—'}</Text>
                        <Text style={{fontSize:11}}>{emp?.group==='waiter'?'🍽️':'👨‍🍳'}</Text>
                      </View>
                      <Text style={[styles.td,styles.tdR,{width:COL.hours}]}>{Number(entry.hours).toFixed(2)}</Text>
                      <Text style={[styles.td,styles.tdR,{width:COL.rate}]}>${Number(entry.rate).toFixed(2)}</Text>
                      <Text style={[styles.td,styles.tdR,{width:COL.cash}]}>{entry.cashAdvance>0?formatCurrency(entry.cashAdvance):'—'}</Text>
                      <Text style={[styles.td,styles.tdR,styles.tdB,{width:COL.main}]}>{formatCurrency(main)}</Text>
                      <Text style={[styles.td,styles.tdR,{width:COL.check}]}>{entry.extraCheck>0?formatCurrency(entry.extraCheck):'—'}</Text>
                      <Text style={[styles.td,styles.tdR,styles.tdGreen,{width:COL.tips}]}>{(entry.tips||0)>0?formatCurrency(entry.tips):'—'}</Text>
                      <Text style={[styles.td,styles.tdR,styles.tdPrimary,styles.tdB,{width:COL.grand}]}>{formatCurrency(grand)}</Text>
                    </TouchableOpacity>
                  );
                })}
                <View style={[styles.tRow,styles.tTotal]}>
                  <Text style={[styles.td,styles.tdB,{width:COL.name}]}>TOTAL</Text>
                  <Text style={[styles.td,styles.tdR,styles.tdB,{width:COL.hours}]}>{totals.hours.toFixed(2)}</Text>
                  <Text style={[styles.td,{width:COL.rate}]}/>
                  <Text style={[styles.td,styles.tdR,styles.tdB,{width:COL.cash}]}>{totals.cash>0?formatCurrency(totals.cash):'—'}</Text>
                  <Text style={[styles.td,styles.tdR,styles.tdB,{width:COL.main}]}>{formatCurrency(totals.main)}</Text>
                  <Text style={[styles.td,styles.tdR,styles.tdB,{width:COL.check}]}>{totals.check>0?formatCurrency(totals.check):'—'}</Text>
                  <Text style={[styles.td,styles.tdR,styles.tdGreen,styles.tdB,{width:COL.tips}]}>{totals.tips>0?formatCurrency(totals.tips):'—'}</Text>
                  <Text style={[styles.td,styles.tdR,styles.tdPrimary,styles.tdB,{width:COL.grand}]}>{formatCurrency(totals.grand)}</Text>
                </View>
              </View>
            </ScrollView>
            <Text style={styles.tHint}>Tap to edit · Long-press to delete</Text>
          </View>
        )}
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}><Text style={styles.addBtnTxt}>+ Add Entry</Text></TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{editing?'Edit Payroll Entry':'Add Payroll Entry'}</Text>
              <Text style={styles.modalSub}>Week: {formatWeekRange(weekOf)}</Text>

              <Text style={styles.pickLbl}>👨‍🍳 Kitchen</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:6}}>
                {kitchen.map(emp=>(
                  <TouchableOpacity key={emp.id} style={[styles.empChip,{borderColor:'#FF8A65'},form.employeeId===emp.id&&styles.empChipOn]} onPress={()=>pickEmployee(emp.id)}>
                    <Text style={[styles.empChipTxt,form.employeeId===emp.id&&styles.empChipTxtOn]}>{emp.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={[styles.pickLbl,{marginTop:4}]}>🍽️ Waiters</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:8}}>
                {waiters.map(emp=>(
                  <TouchableOpacity key={emp.id} style={[styles.empChip,{borderColor:'#42A5F5'},form.employeeId===emp.id&&styles.empChipOn]} onPress={()=>pickEmployee(emp.id)}>
                    <Text style={[styles.empChipTxt,form.employeeId===emp.id&&styles.empChipTxtOn]}>{emp.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.employeeId&&<Text style={styles.errTxt}>{errors.employeeId}</Text>}

              <View style={styles.row2}>
                <View style={{flex:1,marginRight:8}}><Input label="Hours" value={form.hours} onChangeText={v=>setForm(f=>({...f,hours:v}))} placeholder="144.00" keyboardType="numeric" right="hrs" error={errors.hours}/></View>
                <View style={{flex:1}}><Input label="Rate" value={form.rate} onChangeText={v=>setForm(f=>({...f,rate:v}))} placeholder="13.50" keyboardType="numeric" right="$/hr" error={errors.rate}/></View>
              </View>
              <View style={styles.row2}>
                <View style={{flex:1,marginRight:8}}><Input label="Cash Advance" value={form.cashAdvance} onChangeText={v=>setForm(f=>({...f,cashAdvance:v}))} placeholder="0.00" keyboardType="numeric" right="$"/></View>
                <View style={{flex:1}}><Input label="+Check (2nd)" value={form.extraCheck} onChangeText={v=>setForm(f=>({...f,extraCheck:v}))} placeholder="0.00" keyboardType="numeric" right="$"/></View>
              </View>
              {selEmp&&(selEmp.group==='waiter'||selEmp.tipEligible)&&(
                <>
                  <Input label={`Tips 💰${selEmp.group==='kitchen'?' (share)':''}`} value={form.tips} onChangeText={v=>setForm(f=>({...f,tips:v}))} placeholder="0.00" keyboardType="numeric" right="$"/>
                  {totalSalesTips!==null&&<Text style={{fontSize:11,color:'#2E7D32',marginTop:-8,marginBottom:8}}>Week tips: {formatCurrency(totalSalesTips)} · {formatCurrency(allocatedTips)} allocated</Text>}
                </>
              )}

              {form.hours&&form.rate&&(
                <View style={styles.preview}>
                  <View style={styles.previewRow}><Text style={styles.prevLbl}>Hours × Rate</Text><Text style={styles.prevVal}>{formatCurrency((Number(form.hours)||0)*(Number(form.rate)||0))}</Text></View>
                  {Number(form.cashAdvance)>0&&<View style={styles.previewRow}><Text style={styles.prevLbl}>+ Cash Advance</Text><Text style={styles.prevVal}>{formatCurrency(Number(form.cashAdvance))}</Text></View>}
                  <View style={[styles.previewRow,styles.previewSep]}><Text style={[styles.prevLbl,{fontWeight:'700'}]}>Main Pay</Text><Text style={[styles.prevVal,{fontWeight:'700',color:COLORS.primary}]}>{formatCurrency(previewMain)}</Text></View>
                  {Number(form.extraCheck)>0&&<View style={styles.previewRow}><Text style={styles.prevLbl}>+ Check</Text><Text style={styles.prevVal}>{formatCurrency(Number(form.extraCheck))}</Text></View>}
                  {Number(form.tips)>0&&<View style={styles.previewRow}><Text style={styles.prevLbl}>+ Tips</Text><Text style={[styles.prevVal,{color:'#2E7D32'}]}>{formatCurrency(Number(form.tips))}</Text></View>}
                  {(Number(form.extraCheck)>0||Number(form.tips)>0)&&<View style={[styles.previewRow,styles.previewSep]}><Text style={[styles.prevLbl,{fontWeight:'800'}]}>Grand Total</Text><Text style={[styles.prevVal,{fontWeight:'800',color:'#1B5E20',fontSize:16}]}>{formatCurrency(previewGrand)}</Text></View>}
                </View>
              )}
              <View style={styles.modalFoot}>
                <Button label="Cancel" variant="outline" onPress={()=>setModalVisible(false)} style={{flex:1,marginRight:8}}/>
                <Button label={editing?'Update':'Add'} onPress={handleSave} style={{flex:1}}/>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ── EMPLOYEES TAB ─────────────────────────────────────────────────
function EmployeesTab({ employees, dispatch }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', hourlyRate:'', group:'kitchen', tipEligible:false, schedule:{...DEF_SCHED} });
  const [errors, setErrors] = useState({});

  const kitchen = employees.filter(e=>e.group==='kitchen');
  const waiters  = employees.filter(e=>e.group==='waiter');

  function openAdd() {
    setEditing(null);
    setForm({ name:'', hourlyRate:'', group:'kitchen', tipEligible:false, schedule:{...DEF_SCHED} });
    setErrors({});
    setModalVisible(true);
  }
  function openEdit(emp) {
    setEditing(emp);
    setForm({ name:emp.name, hourlyRate:String(emp.hourlyRate), group:emp.group||'kitchen', tipEligible:emp.tipEligible||false, schedule: emp.schedule ? {...DEF_SCHED,...emp.schedule} : {...DEF_SCHED} });
    setErrors({});
    setModalVisible(true);
  }
  function validate() {
    const errs={};
    if (!form.name.trim())  errs.name='Enter name';
    if (!form.hourlyRate||isNaN(Number(form.hourlyRate))||Number(form.hourlyRate)<=0) errs.hourlyRate='Enter valid rate';
    setErrors(errs);
    return Object.keys(errs).length===0;
  }
  function handleSave() {
    if (!validate()) return;
    const data = { id:editing?.id||generateId(), name:form.name.trim(), hourlyRate:Number(form.hourlyRate), group:form.group, tipEligible:form.group==='waiter'?true:form.tipEligible, schedule:form.schedule };
    dispatch({ type:editing?'UPDATE_EMPLOYEE':'ADD_EMPLOYEE', payload:data });
    setModalVisible(false);
  }
  function handleDelete(emp) {
    Alert.alert('Delete Employee',`Delete "${emp.name}"?\nAll payroll entries also removed.`,[
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress:()=>dispatch({ type:'DELETE_EMPLOYEE', payload:emp.id }) },
    ]);
  }
  function handleSchedule(day, action, value) {
    setForm(f=>{
      const sched = {...f.schedule};
      if (action==='toggle') { sched[day] = sched[day] ? null : { start:'09:00', end:'17:00' }; }
      else                   { sched[day] = {...sched[day], [action]:value}; }
      return {...f, schedule:sched};
    });
  }

  const formWeeklyHrs = Object.values(form.schedule).filter(Boolean).reduce((s,sh)=>s+shiftHours(sh.start,sh.end),0);

  function renderGroup(label, list, color) {
    return (
      <View key={label}>
        <Text style={styles.groupHdr}>{label}</Text>
        {list.length===0
          ? <Text style={styles.groupEmpty}>None yet</Text>
          : list.map(emp=>{
              const wkHrs = calcEmployeeWeeklyHours(emp);
              return (
                <Card key={emp.id} style={[styles.empCard,{borderLeftColor:color,borderLeftWidth:3}]}>
                  <View style={styles.empRow}>
                    <View style={[styles.empAvatar,{backgroundColor:color}]}>
                      <Text style={styles.empAvatarTxt}>{emp.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.empInfo}>
                      <Text style={styles.empName}>{emp.name}</Text>
                      <View style={styles.empMeta}>
                        <Text style={styles.empRate}>{formatCurrency(emp.hourlyRate)}/hr</Text>
                        {wkHrs>0&&<Text style={styles.empHrs}>· {wkHrs.toFixed(1)}h/wk</Text>}
                        {emp.tipEligible&&<View style={styles.tipBadge}><Text style={styles.tipBadgeTxt}>💰 Tips</Text></View>}
                      </View>
                    </View>
                    <View style={styles.empBtns}>
                      <Button label="Edit" variant="outline" onPress={()=>openEdit(emp)} style={styles.smBtn}/>
                      <Button label="Del"  variant="danger"  onPress={()=>handleDelete(emp)} style={styles.smBtn}/>
                    </View>
                  </View>
                  {/* Show schedule summary if set */}
                  {emp.schedule&&Object.values(emp.schedule).some(Boolean)&&(
                    <View style={styles.schedSummary}>
                      {DAYS.map(d=>{
                        const sh=emp.schedule[d];
                        return (
                          <View key={d} style={[styles.schedDot,{backgroundColor:sh?COLORS.primary:COLORS.border}]}>
                            <Text style={[styles.schedDotTxt,{color:sh?'#FFF':COLORS.textLight}]}>{d[0]}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </Card>
              );
            })
        }
      </View>
    );
  }

  return (
    <View style={{flex:1}}>
      <ScrollView contentContainerStyle={{padding:16,paddingBottom:24}}>
        <SectionTitle text="Employees" action="+ Add" onAction={openAdd}/>
        {/* Kitchen weighted rate info */}
        <View style={styles.rateInfoRow}>
          <View style={[styles.rateInfoCard,{borderColor:'#FF8A65'}]}>
            <Text style={styles.rateInfoLbl}>Kitchen rate/min</Text>
            <Text style={[styles.rateInfoVal,{color:'#E65100'}]}>
              {formatCurrency(calcGroupWeightedRate(employees,'kitchen')/60)}
            </Text>
            <Text style={styles.rateInfoSub}>weighted avg</Text>
          </View>
          <View style={[styles.rateInfoCard,{borderColor:'#42A5F5'}]}>
            <Text style={styles.rateInfoLbl}>Waiter rate/min</Text>
            <Text style={[styles.rateInfoVal,{color:'#1565C0'}]}>
              {formatCurrency(calcGroupWeightedRate(employees,'waiter')/60)}
            </Text>
            <Text style={styles.rateInfoSub}>weighted avg</Text>
          </View>
        </View>
        {renderGroup('👨‍🍳 Kitchen', kitchen, '#FF8A65')}
        <View style={{height:16}}/>
        {renderGroup('🍽️ Waiters', waiters, '#42A5F5')}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{editing?'Edit Employee':'Add Employee'}</Text>

              {/* Group toggle */}
              <Text style={styles.pickLbl}>Role</Text>
              <View style={styles.groupToggle}>
                {['kitchen','waiter'].map(g=>(
                  <TouchableOpacity key={g} style={[styles.groupBtn,form.group===g&&styles.groupBtnOn]} onPress={()=>setForm(f=>({...f,group:g}))}>
                    <Text style={[styles.groupBtnTxt,form.group===g&&styles.groupBtnTxtOn]}>{GROUP_LABEL[g]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input label="Full Name" value={form.name} onChangeText={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Huy T Pham" error={errors.name}/>
              <Input label="Hourly Rate" value={form.hourlyRate} onChangeText={v=>setForm(f=>({...f,hourlyRate:v}))} placeholder="13.50" keyboardType="numeric" right="$/hr" error={errors.hourlyRate}/>

              {form.group==='kitchen'?(
                <View style={styles.switchRow}>
                  <View style={{flex:1,marginRight:12}}>
                    <Text style={styles.switchLbl}>Tip Share Eligible</Text>
                    <Text style={styles.switchHint}>Can receive a portion of tips</Text>
                  </View>
                  <Switch value={form.tipEligible} onValueChange={v=>setForm(f=>({...f,tipEligible:v}))} trackColor={{false:COLORS.border,true:COLORS.primary}} thumbColor={form.tipEligible?'#FFF':'#DDD'}/>
                </View>
              ):(
                <View style={styles.switchRow}>
                  <View style={{flex:1,marginRight:12}}>
                    <Text style={styles.switchLbl}>Receives Tips</Text>
                    <Text style={styles.switchHint}>Waiters always receive tips</Text>
                  </View>
                  <Switch value={true} disabled trackColor={{true:'#42A5F5'}} thumbColor="#FFF"/>
                </View>
              )}

              <ScheduleEditor schedule={form.schedule} onChange={handleSchedule}/>
              {formWeeklyHrs>0&&<Text style={{fontSize:12,color:COLORS.primary,fontWeight:'600',textAlign:'right',marginTop:4}}>{formWeeklyHrs.toFixed(1)} hrs/week × {formatCurrency(Number(form.hourlyRate)||0)}/hr = {formatCurrency(formWeeklyHrs*(Number(form.hourlyRate)||0))}/week</Text>}

              <View style={[styles.modalFoot,{marginTop:20}]}>
                <Button label="Cancel" variant="outline" onPress={()=>setModalVisible(false)} style={{flex:1,marginRight:8}}/>
                <Button label={editing?'Update':'Add'} onPress={handleSave} style={{flex:1}}/>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.background },

  // Lock screen
  lockScreen:   { flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:40, backgroundColor:COLORS.background },
  lockIcon:     { fontSize:56, marginBottom:16 },
  lockTitle:    { fontSize:22, fontWeight:'800', color:COLORS.text, marginBottom:6 },
  lockSub:      { fontSize:14, color:COLORS.textSecondary, marginBottom:28 },
  lockInput:    {
    width:'100%', height:52, borderWidth:1.5, borderColor:COLORS.border,
    borderRadius:12, paddingHorizontal:16, fontSize:18, color:COLORS.text,
    backgroundColor:COLORS.surface, textAlign:'center', letterSpacing:4,
    marginBottom:12,
  },
  lockError:    { fontSize:13, color:'#E53935', marginBottom:12, textAlign:'center' },
  unlockBtn:    { width:'100%', backgroundColor:COLORS.primary, borderRadius:12, paddingVertical:14, alignItems:'center' },
  unlockBtnText:{ fontSize:16, fontWeight:'700', color:'#FFF' },

  // Change password row
  changePwRow:  { flexDirection:'row', justifyContent:'flex-end', paddingHorizontal:16, paddingVertical:8, backgroundColor:COLORS.surface, borderBottomWidth:1, borderBottomColor:COLORS.border },
  changePwText: { fontSize:12, color:COLORS.textSecondary },

  // Change password modal
  cpOverlay:    { flex:1, backgroundColor:'rgba(0,0,0,0.55)', justifyContent:'center', alignItems:'center', paddingHorizontal:32 },
  cpBox:        { backgroundColor:COLORS.surface, borderRadius:16, padding:24, width:'100%' },
  cpTitle:      { fontSize:17, fontWeight:'700', color:COLORS.text, marginBottom:16, textAlign:'center' },
  cpInput:      { height:48, borderWidth:1.5, borderColor:COLORS.border, borderRadius:10, paddingHorizontal:14, fontSize:15, color:COLORS.text, backgroundColor:'#FAFAFA', marginBottom:10 },
  cpActions:    { flexDirection:'row', gap:10, marginTop:8 },
  cpBtn:        { flex:1, backgroundColor:COLORS.primary, borderRadius:10, paddingVertical:12, alignItems:'center' },
  cpBtnText:    { fontSize:15, fontWeight:'700', color:'#FFF' },
  cpBtnOutline: { backgroundColor:'transparent', borderWidth:1.5, borderColor:COLORS.border },
  cpBtnOutlineText: { fontSize:15, fontWeight:'600', color:COLORS.textSecondary },

  tabBar:       { flexDirection:'row', backgroundColor:COLORS.surface, borderBottomWidth:1, borderBottomColor:COLORS.border },
  tabBtn:       { flex:1, paddingVertical:12, alignItems:'center' },
  tabBtnActive: { borderBottomWidth:2, borderBottomColor:COLORS.primary },
  tabText:      { fontSize:13, fontWeight:'500', color:COLORS.textSecondary },
  tabTextActive:{ color:COLORS.primary, fontWeight:'700' },

  weekNav:      { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.primary, paddingVertical:10, paddingHorizontal:4 },
  weekArrow:    { padding:12 },
  weekArrowTxt: { fontSize:24, color:'#FFF', fontWeight:'300' },
  weekInfo:     { flex:1, alignItems:'center' },
  weekLbl:      { fontSize:11, color:'rgba(255,255,255,0.7)' },
  weekRange:    { fontSize:15, fontWeight:'700', color:'#FFF', marginTop:2 },

  pSummary:     { flexDirection:'row', backgroundColor:COLORS.primary, paddingBottom:12, paddingHorizontal:16 },
  pSumItem:     { flex:1, alignItems:'center' },
  pSumDiv:      { width:1, backgroundColor:'rgba(255,255,255,0.3)', marginVertical:4 },
  pSumVal:      { fontSize:18, fontWeight:'800', color:'#FFF' },
  pSumLbl:      { fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:2 },

  tipBanner:    { marginHorizontal:12, marginTop:10, borderRadius:8, padding:10 },
  tipOk:        { backgroundColor:'#E8F5E9' },
  tipWarn:      { backgroundColor:'#FFF8E1' },
  tipBannerTxt: { fontSize:12, color:COLORS.text, lineHeight:18 },

  tableWrap:    { margin:12, borderRadius:12, overflow:'hidden', borderWidth:1, borderColor:COLORS.border, backgroundColor:COLORS.surface },
  tRow:         { flexDirection:'row', borderBottomWidth:1, borderBottomColor:COLORS.border },
  tHead:        { backgroundColor:'#F3F4F6' },
  tTotal:       { backgroundColor:'#FFF8E1' },
  tRowWaiter:   { backgroundColor:'#F8FBFF' },
  thCell:       { paddingVertical:10, paddingHorizontal:8, fontSize:10, fontWeight:'700', color:COLORS.textSecondary, textTransform:'uppercase' },
  thRight:      { textAlign:'right' },
  nameCell:     { flexDirection:'row', alignItems:'center', paddingVertical:11, paddingHorizontal:8 },
  tdName:       { flex:1, fontSize:12, color:COLORS.text, fontWeight:'500' },
  td:           { paddingVertical:11, paddingHorizontal:8, fontSize:12, color:COLORS.text },
  tdR:          { textAlign:'right' },
  tdB:          { fontWeight:'700' },
  tdGreen:      { color:'#2E7D32' },
  tdPrimary:    { color:COLORS.primary },
  tHint:        { fontSize:11, color:COLORS.textLight, textAlign:'center', paddingVertical:8 },

  addBtn:       { margin:16, backgroundColor:COLORS.primary, borderRadius:12, paddingVertical:14, alignItems:'center' },
  addBtnTxt:    { color:'#FFF', fontSize:15, fontWeight:'700' },

  // Employees
  groupHdr:     { fontSize:14, fontWeight:'700', color:COLORS.text, marginBottom:8, marginTop:4 },
  groupEmpty:   { fontSize:13, color:COLORS.textSecondary, marginBottom:8, fontStyle:'italic' },
  rateInfoRow:  { flexDirection:'row', gap:10, marginBottom:16 },
  rateInfoCard: { flex:1, borderWidth:1.5, borderRadius:12, padding:12, alignItems:'center', backgroundColor:COLORS.surface },
  rateInfoLbl:  { fontSize:11, color:COLORS.textSecondary },
  rateInfoVal:  { fontSize:18, fontWeight:'800', marginTop:2 },
  rateInfoSub:  { fontSize:10, color:COLORS.textLight, marginTop:2 },
  empCard:      { marginBottom:10 },
  empRow:       { flexDirection:'row', alignItems:'center' },
  empAvatar:    { width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center', marginRight:12 },
  empAvatarTxt: { fontSize:18, fontWeight:'700', color:'#FFF' },
  empInfo:      { flex:1 },
  empName:      { fontSize:15, fontWeight:'600', color:COLORS.text },
  empMeta:      { flexDirection:'row', alignItems:'center', gap:6, marginTop:2 },
  empRate:      { fontSize:13, color:COLORS.primary },
  empHrs:       { fontSize:12, color:COLORS.textSecondary },
  tipBadge:     { backgroundColor:'#E8F5E9', paddingHorizontal:8, paddingVertical:2, borderRadius:10 },
  tipBadgeTxt:  { fontSize:11, color:'#2E7D32', fontWeight:'600' },
  empBtns:      { flexDirection:'row', gap:6 },
  smBtn:        { paddingHorizontal:10, paddingVertical:7 },
  schedSummary: { flexDirection:'row', gap:4, marginTop:10 },
  schedDot:     { width:26, height:26, borderRadius:6, alignItems:'center', justifyContent:'center' },
  schedDotTxt:  { fontSize:10, fontWeight:'700' },

  // Modal shared
  overlay:      { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  modalBox:     { backgroundColor:COLORS.surface, borderTopLeftRadius:20, borderTopRightRadius:20, padding:24, paddingBottom:40, marginTop:60 },
  modalTitle:   { fontSize:18, fontWeight:'700', color:COLORS.text, marginBottom:4 },
  modalSub:     { fontSize:12, color:COLORS.textSecondary, marginBottom:16 },
  pickLbl:      { fontSize:13, color:COLORS.textSecondary, marginBottom:6, fontWeight:'500' },
  row2:         { flexDirection:'row' },
  empChip:      { paddingHorizontal:12, paddingVertical:7, borderRadius:20, backgroundColor:COLORS.background, borderWidth:1.5, marginRight:8 },
  empChipOn:    { backgroundColor:COLORS.primary, borderColor:COLORS.primary },
  empChipTxt:   { fontSize:13, color:COLORS.text },
  empChipTxtOn: { color:'#FFF', fontWeight:'600' },
  errTxt:       { fontSize:12, color:'#E53935', marginBottom:8 },
  groupToggle:  { flexDirection:'row', marginBottom:16, borderRadius:10, overflow:'hidden', borderWidth:1, borderColor:COLORS.border },
  groupBtn:     { flex:1, paddingVertical:12, alignItems:'center', backgroundColor:COLORS.background },
  groupBtnOn:   { backgroundColor:COLORS.primary },
  groupBtnTxt:  { fontSize:13, fontWeight:'600', color:COLORS.textSecondary },
  groupBtnTxtOn:{ color:'#FFF' },
  switchRow:    { flexDirection:'row', alignItems:'center', paddingVertical:12, borderTopWidth:1, borderTopColor:COLORS.border, marginBottom:4 },
  switchLbl:    { fontSize:14, fontWeight:'600', color:COLORS.text },
  switchHint:   { fontSize:12, color:COLORS.textSecondary, marginTop:2 },
  preview:      { backgroundColor:COLORS.secondary, borderRadius:10, padding:12, marginBottom:16 },
  previewRow:   { flexDirection:'row', justifyContent:'space-between', paddingVertical:3 },
  previewSep:   { borderTopWidth:1, borderTopColor:COLORS.border, marginTop:4, paddingTop:6 },
  prevLbl:      { fontSize:13, color:COLORS.textSecondary },
  prevVal:      { fontSize:13, color:COLORS.text },
  modalFoot:    { flexDirection:'row', marginTop:8 },
});
