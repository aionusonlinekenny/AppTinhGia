import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext(null);

// ── Schedule helpers ────────────────────────────────────────────
// Parse "HH:MM" → minutes since midnight
function parseMinutes(t) {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function shiftHours(start, end) {
  const diff = parseMinutes(end) - parseMinutes(start);
  return diff > 0 ? diff / 60 : 0;
}

export function calcEmployeeWeeklyHours(employee) {
  if (!employee?.schedule) return 0;
  return Object.values(employee.schedule)
    .filter(Boolean)
    .reduce((sum, s) => sum + shiftHours(s.start, s.end), 0);
}

// Weighted average hourly rate for a group, weighted by each employee's actual weekly hours.
// Falls back to simple average when no schedules are set.
export function calcGroupWeightedRate(employees, group) {
  const grouped = (employees || []).filter(e => e.group === group);
  if (grouped.length === 0) return 0;
  let totalWageHours = 0;
  let totalHours = 0;
  grouped.forEach(e => {
    const hrs = calcEmployeeWeeklyHours(e);
    totalWageHours += e.hourlyRate * hrs;
    totalHours += hrs;
  });
  if (totalHours === 0) {
    return grouped.reduce((s, e) => s + e.hourlyRate, 0) / grouped.length;
  }
  return totalWageHours / totalHours;
}

// ── Initial state ───────────────────────────────────────────────
const initialState = {
  departments: [
    { id: '1', name: 'Head Chef',  hourlyWage: 25, hoursPerMonth: 173 },
    { id: '2', name: 'Sous Chef',  hourlyWage: 18, hoursPerMonth: 173 },
    { id: '3', name: 'Server',     hourlyWage: 12, hoursPerMonth: 173 },
    { id: '4', name: 'Cashier',    hourlyWage: 14, hoursPerMonth: 173 },
  ],
  ingredients: [
    { id: '1', name: 'Beef',        unit: 'lb', pricePerUnit: 8.99, category: 'Meat'    },
    { id: '2', name: 'Mixed Greens',unit: 'lb', pricePerUnit: 3.49, category: 'Produce' },
    { id: '3', name: 'Rice',        unit: 'lb', pricePerUnit: 1.29, category: 'Starch'  },
  ],
  overheadCosts: [
    { id: '1', name: 'Electricity', type: 'electricity', monthlyCost: 800  },
    { id: '2', name: 'Water',       type: 'water',       monthlyCost: 200  },
    { id: '3', name: 'Gas',         type: 'gas',         monthlyCost: 350  },
    { id: '4', name: 'Rent',        type: 'rent',        monthlyCost: 5000 },
  ],
  dishes: [],
  // stockRecipes: batch broths/stocks/bases used across dishes
  // { id, name, stockIngredients:[{ingredientId,quantity}], laborGroup, laborMinutes, yieldOz }
  stockRecipes: [],
  // group: 'kitchen' | 'waiter'
  // schedule: { Mon|Tue|Wed|Thu|Fri|Sat|Sun: { start:'HH:MM', end:'HH:MM' } | null }
  employees: [
    {
      id: 'emp1', name: 'Huy T Pham', hourlyRate: 13.50, group: 'kitchen', tipEligible: false,
      schedule: {
        Mon: { start: '09:30', end: '20:00' },
        Tue: null,
        Wed: { start: '09:30', end: '21:00' },
        Thu: { start: '09:30', end: '21:00' },
        Fri: { start: '09:30', end: '21:00' },
        Sat: { start: '09:30', end: '21:00' },
        Sun: { start: '10:00', end: '19:00' },
      },
    },
    {
      id: 'emp2', name: 'Binh Van Pham', hourlyRate: 14.50, group: 'kitchen', tipEligible: false,
      schedule: {
        Mon: { start: '09:30', end: '19:30' },
        Tue: null,
        Wed: { start: '10:30', end: '20:30' },
        Thu: { start: '10:30', end: '20:30' },
        Fri: { start: '10:30', end: '20:30' },
        Sat: { start: '10:30', end: '20:30' },
        Sun: { start: '10:30', end: '18:30' },
      },
    },
    {
      id: 'emp3', name: 'Thi My Loi Nguyen', hourlyRate: 13.50, group: 'kitchen', tipEligible: false,
      schedule: {
        Mon: { start: '09:30', end: '20:00' },
        Tue: null,
        Wed: { start: '09:30', end: '21:00' },
        Thu: { start: '09:30', end: '21:00' },
        Fri: { start: '09:30', end: '21:00' },
        Sat: { start: '09:30', end: '21:00' },
        Sun: { start: '10:00', end: '19:00' },
      },
    },
    { id: 'emp4', name: 'Eban Linh H',        hourlyRate: 10.63, group: 'kitchen', tipEligible: false, schedule: null },
    { id: 'emp5', name: 'Eban Be Y',           hourlyRate: 10.50, group: 'kitchen', tipEligible: false, schedule: null },
    { id: 'emp6', name: 'Anh Quoc Nguyen',     hourlyRate:  5.25, group: 'waiter',  tipEligible: true,  schedule: null },
    { id: 'emp7', name: 'Anh Quoc Ky Nguyen',  hourlyRate:  5.25, group: 'waiter',  tipEligible: true,  schedule: null },
    { id: 'emp8', name: 'Vy T Pham',           hourlyRate:  5.25, group: 'waiter',  tipEligible: true,  schedule: null },
    { id: 'emp9', name: 'Khoa A Huynh',        hourlyRate:  5.25, group: 'waiter',  tipEligible: true,  schedule: null },
  ],
  // payrollEntry: { id, weekOf, employeeId, hours, rate, cashAdvance, extraCheck, tips }
  payrollEntries: [],
  // supplyOrder: { id, weekOf, ingredientId, quantity, unitCost }
  supplyOrders: [],
  // salesRecord: { id, weekOf, grossSales, taxRate, cardTips, cashTips }
  salesRecords: [],
  settings: {
    workingDaysPerMonth: 26,
    totalDishesPerDay: 100,
    salesTaxRate: 8,
    staffPassword: '1234',
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_DEPARTMENT':    return { ...state, departments: [...state.departments, action.payload] };
    case 'UPDATE_DEPARTMENT': return { ...state, departments: state.departments.map(d => d.id === action.payload.id ? action.payload : d) };
    case 'DELETE_DEPARTMENT': return { ...state, departments: state.departments.filter(d => d.id !== action.payload) };

    case 'ADD_INGREDIENT':    return { ...state, ingredients: [...state.ingredients, action.payload] };
    case 'UPDATE_INGREDIENT': return { ...state, ingredients: state.ingredients.map(i => i.id === action.payload.id ? action.payload : i) };
    case 'DELETE_INGREDIENT': return { ...state, ingredients: state.ingredients.filter(i => i.id !== action.payload) };

    case 'ADD_OVERHEAD':      return { ...state, overheadCosts: [...state.overheadCosts, action.payload] };
    case 'UPDATE_OVERHEAD':   return { ...state, overheadCosts: state.overheadCosts.map(o => o.id === action.payload.id ? action.payload : o) };
    case 'DELETE_OVERHEAD':   return { ...state, overheadCosts: state.overheadCosts.filter(o => o.id !== action.payload) };

    case 'ADD_STOCK_RECIPE':    return { ...state, stockRecipes: [...(state.stockRecipes||[]), action.payload] };
    case 'UPDATE_STOCK_RECIPE': return { ...state, stockRecipes: (state.stockRecipes||[]).map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_STOCK_RECIPE': return { ...state, stockRecipes: (state.stockRecipes||[]).filter(s => s.id !== action.payload) };

    case 'ADD_DISH':          return { ...state, dishes: [...state.dishes, action.payload] };
    case 'UPDATE_DISH':       return { ...state, dishes: state.dishes.map(d => d.id === action.payload.id ? action.payload : d) };
    case 'DELETE_DISH':       return { ...state, dishes: state.dishes.filter(d => d.id !== action.payload) };

    case 'ADD_EMPLOYEE':      return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':   return { ...state, employees: state.employees.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_EMPLOYEE':   return {
      ...state,
      employees: state.employees.filter(e => e.id !== action.payload),
      payrollEntries: state.payrollEntries.filter(p => p.employeeId !== action.payload),
    };

    case 'ADD_PAYROLL_ENTRY':    return { ...state, payrollEntries: [...state.payrollEntries, action.payload] };
    case 'UPDATE_PAYROLL_ENTRY': return { ...state, payrollEntries: state.payrollEntries.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_PAYROLL_ENTRY': return { ...state, payrollEntries: state.payrollEntries.filter(e => e.id !== action.payload) };

    case 'ADD_SUPPLY_ORDER':    return { ...state, supplyOrders: [...state.supplyOrders, action.payload] };
    case 'UPDATE_SUPPLY_ORDER': return { ...state, supplyOrders: state.supplyOrders.map(o => o.id === action.payload.id ? action.payload : o) };
    case 'DELETE_SUPPLY_ORDER': return { ...state, supplyOrders: state.supplyOrders.filter(o => o.id !== action.payload) };

    case 'ADD_SALES_RECORD':    return { ...state, salesRecords: [...state.salesRecords, action.payload] };
    case 'UPDATE_SALES_RECORD': return { ...state, salesRecords: state.salesRecords.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_SALES_RECORD': return { ...state, salesRecords: state.salesRecords.filter(r => r.id !== action.payload) };

    case 'UPDATE_SETTINGS': return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'LOAD_STATE': {
      const loaded = action.payload;
      return {
        ...initialState,
        ...loaded,
        employees: (loaded.employees || initialState.employees).map(e => ({
          group: 'kitchen', tipEligible: false, schedule: null,
          ...e,
        })),
        payrollEntries: (loaded.payrollEntries || []).map(p => ({ tips: 0, ...p })),
        supplyOrders:   loaded.supplyOrders   || [],
        salesRecords:   loaded.salesRecords   || [],
        stockRecipes:   loaded.stockRecipes   || [],
        settings: { ...initialState.settings, ...(loaded.settings || {}) },
      };
    }

    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    AsyncStorage.getItem('appState').then(stored => {
      if (stored) {
        try { dispatch({ type: 'LOAD_STATE', payload: JSON.parse(stored) }); }
        catch (e) {}
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('appState', JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function getWeekOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d.toISOString().split('T')[0];
}

export function offsetWeek(weekOf, delta) {
  const d = new Date(weekOf + 'T12:00:00');
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().split('T')[0];
}

export function formatWeekRange(weekOf) {
  const start = new Date(weekOf + 'T12:00:00');
  const end   = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function calcSalesBreakdown(grossSales, taxRate = 8) {
  const net = grossSales / (1 + taxRate / 100);
  return { netSales: net, taxCollected: grossSales - net };
}

// Unit used when adding this ingredient to a dish
// Supports both imperial (lb/oz) and metric (kg/gram/lạng) units
export function getIngredientDishUnit(ing) {
  if (!ing) return 'oz';
  const unit = (ing.unit || '').toLowerCase();
  // Metric weight
  if (unit === 'kg' || unit === 'gram' || unit === 'lạng') return 'gram';
  // Metric liquid
  if (unit === 'lít' || unit === 'ml') return 'ml';
  // Imperial weight
  if (unit === 'lb' || unit === 'oz') return 'oz';
  // Imperial box/bag/pack
  if (unit === 'box' || unit === 'bag' || unit === 'pack') {
    const sub = (ing.subUnit || 'lb').toLowerCase();
    if (sub === 'piece' || sub === 'each') return 'piece';
    if (sub === 'gram' || sub === 'kg')   return 'gram';
    return 'oz';
  }
  // VND container units (hộp/túi/gói)
  if (unit === 'hộp' || unit === 'túi' || unit === 'gói') {
    const sub = (ing.subUnit || 'gram').toLowerCase();
    if (sub === 'gram' || sub === 'kg')  return 'gram';
    if (sub === 'ml'   || sub === 'lít') return 'ml';
    return 'cái';
  }
  return unit;
}

// Effective price per dish unit ($/oz, $/gram, $/piece, etc.)
export function getIngredientPricePerDishUnit(ing) {
  if (!ing) return 0;
  const price = ing.pricePerUnit || 0;
  const unit  = (ing.unit || '').toLowerCase();
  // Imperial
  if (unit === 'lb')  return price / 16;
  if (unit === 'oz')  return price;
  // Metric weight
  if (unit === 'kg')    return price / 1000;
  if (unit === 'gram')  return price;
  if (unit === 'lạng')  return price / 100; // 1 lạng = 100g
  // Metric liquid
  if (unit === 'lít') return price / 1000;
  if (unit === 'ml')  return price;
  // Imperial box/bag/pack
  if (unit === 'box' || unit === 'bag' || unit === 'pack') {
    const perBox     = ing.unitsPerBox || 1;
    const sub        = (ing.subUnit || 'lb').toLowerCase();
    const pricePerSub = price / perBox;
    if (sub === 'lb')   return pricePerSub / 16;
    if (sub === 'oz')   return pricePerSub;
    if (sub === 'kg')   return pricePerSub / 1000;
    if (sub === 'gram') return pricePerSub;
    return pricePerSub; // piece / each
  }
  // VND containers
  if (unit === 'hộp' || unit === 'túi' || unit === 'gói') {
    const perBox      = ing.unitsPerBox || 1;
    const sub         = (ing.subUnit || 'gram').toLowerCase();
    const pricePerSub = price / perBox;
    if (sub === 'kg')   return pricePerSub / 1000;
    if (sub === 'gram') return pricePerSub;
    if (sub === 'lít')  return pricePerSub / 1000;
    if (sub === 'ml')   return pricePerSub;
    return pricePerSub; // cái
  }
  return price;
}

// Cost per oz for a batch stock/broth recipe
export function calculateStockCostPerOz(stock, state) {
  if (!stock || !(stock.yieldOz > 0)) return 0;
  const { ingredients = [], employees = [] } = state;
  let ingCost = 0;
  for (const item of stock.stockIngredients || []) {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    if (ing) ingCost += getIngredientPricePerDishUnit(ing) * (parseFloat(item.quantity) || 0);
  }
  let laborCost = 0;
  if (stock.laborMinutes && stock.laborGroup) {
    const rate = calcGroupWeightedRate(employees, stock.laborGroup);
    laborCost = (rate / 60) * stock.laborMinutes;
  }
  return (ingCost + laborCost) / stock.yieldOz;
}

// laborTime can be:
//   new format: { group: 'kitchen'|'waiter', minutes }  ← rate from employees
//   old format: { departmentId, minutes }               ← rate from departments (backward compat)
export function calculateDishCost(dish, state) {
  const { ingredients, employees = [], departments = [], overheadCosts, settings, stockRecipes = [] } = state;

  let ingredientCost = 0;
  for (const item of dish.ingredients || []) {
    if (item.type === 'stock') {
      const stock = stockRecipes.find(s => s.id === item.ingredientId);
      if (stock) ingredientCost += calculateStockCostPerOz(stock, state) * (parseFloat(item.quantity) || 0);
    } else {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (ing) ingredientCost += getIngredientPricePerDishUnit(ing) * (parseFloat(item.quantity) || 0);
    }
  }

  let laborCost = 0;
  for (const item of dish.laborTime || []) {
    if (item.group) {
      const rate = calcGroupWeightedRate(employees, item.group);
      laborCost += (rate / 60) * item.minutes;
    } else if (item.departmentId) {
      const dept = departments.find(d => d.id === item.departmentId);
      if (dept) laborCost += (dept.hourlyWage / 60) * item.minutes;
    }
  }

  const totalMonthlyOverhead = overheadCosts.reduce((sum, o) => sum + o.monthlyCost, 0);
  const totalDishesPerMonth  = settings.workingDaysPerMonth * settings.totalDishesPerDay;
  const overheadPerDish      = totalDishesPerMonth > 0 ? totalMonthlyOverhead / totalDishesPerMonth : 0;

  return { ingredientCost, laborCost, overheadPerDish, totalCost: ingredientCost + laborCost + overheadPerDish };
}

export function suggestPrices(totalCost) {
  return [
    { label: '30% Profit', percentage: 30, price: totalCost / 0.7 },
    { label: '40% Profit', percentage: 40, price: totalCost / 0.6 },
    { label: '50% Profit', percentage: 50, price: totalCost / 0.5 },
    { label: '60% Profit', percentage: 60, price: totalCost / 0.4 },
    { label: '70% Profit', percentage: 70, price: totalCost / 0.3 },
  ];
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);
}

export function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 7);
}
