import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext(null);

const initialState = {
  departments: [
    { id: '1', name: 'Head Chef', hourlyWage: 25, hoursPerMonth: 173 },
    { id: '2', name: 'Sous Chef', hourlyWage: 18, hoursPerMonth: 173 },
    { id: '3', name: 'Server', hourlyWage: 12, hoursPerMonth: 173 },
    { id: '4', name: 'Cashier', hourlyWage: 14, hoursPerMonth: 173 },
  ],
  ingredients: [
    { id: '1', name: 'Beef', unit: 'lb', pricePerUnit: 8.99, category: 'Meat' },
    { id: '2', name: 'Mixed Greens', unit: 'lb', pricePerUnit: 3.49, category: 'Produce' },
    { id: '3', name: 'Rice', unit: 'lb', pricePerUnit: 1.29, category: 'Starch' },
  ],
  overheadCosts: [
    { id: '1', name: 'Electricity', type: 'electricity', monthlyCost: 800 },
    { id: '2', name: 'Water', type: 'water', monthlyCost: 200 },
    { id: '3', name: 'Gas', type: 'gas', monthlyCost: 350 },
    { id: '4', name: 'Rent', type: 'rent', monthlyCost: 5000 },
  ],
  dishes: [],
  // group: 'kitchen' | 'waiter'
  // tipEligible: kitchen staff who participate in tip pool; waiters are always tip-eligible
  employees: [
    { id: 'emp1', name: 'Huy T Pham',          hourlyRate: 13.50, group: 'kitchen', tipEligible: false },
    { id: 'emp2', name: 'Binh Van Pham',        hourlyRate: 14.50, group: 'kitchen', tipEligible: false },
    { id: 'emp3', name: 'Thi My Loi Nguyen',    hourlyRate: 13.50, group: 'kitchen', tipEligible: false },
    { id: 'emp4', name: 'Eban Linh H',          hourlyRate: 10.63, group: 'kitchen', tipEligible: false },
    { id: 'emp5', name: 'Eban Be Y',            hourlyRate: 10.50, group: 'kitchen', tipEligible: false },
    { id: 'emp6', name: 'Anh Quoc Nguyen',      hourlyRate:  5.25, group: 'waiter',  tipEligible: true  },
    { id: 'emp7', name: 'Anh Quoc Ky Nguyen',   hourlyRate:  5.25, group: 'waiter',  tipEligible: true  },
    { id: 'emp8', name: 'Vy T Pham',            hourlyRate:  5.25, group: 'waiter',  tipEligible: true  },
    { id: 'emp9', name: 'Khoa A Huynh',         hourlyRate:  5.25, group: 'waiter',  tipEligible: true  },
  ],
  // payrollEntry: { id, weekOf, employeeId, hours, rate, cashAdvance, extraCheck, tips }
  // mainPay = hours * rate + cashAdvance
  // grandTotal = mainPay + extraCheck + tips
  payrollEntries: [],
  // supplyOrder: { id, weekOf, ingredientId, quantity, unitCost }
  supplyOrders: [],
  // salesRecord: { id, weekOf, grossSales, taxRate, cardTips, cashTips }
  // netSales = grossSales / (1 + taxRate/100)
  // taxCollected = grossSales - netSales
  salesRecords: [],
  settings: {
    workingDaysPerMonth: 26,
    totalDishesPerDay: 100,
    salesTaxRate: 8,
  },
};

function reducer(state, action) {
  switch (action.type) {
    // Departments
    case 'ADD_DEPARTMENT':
      return { ...state, departments: [...state.departments, action.payload] };
    case 'UPDATE_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.map(d =>
          d.id === action.payload.id ? action.payload : d
        ),
      };
    case 'DELETE_DEPARTMENT':
      return { ...state, departments: state.departments.filter(d => d.id !== action.payload) };

    // Ingredients
    case 'ADD_INGREDIENT':
      return { ...state, ingredients: [...state.ingredients, action.payload] };
    case 'UPDATE_INGREDIENT':
      return {
        ...state,
        ingredients: state.ingredients.map(i =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case 'DELETE_INGREDIENT':
      return { ...state, ingredients: state.ingredients.filter(i => i.id !== action.payload) };

    // Overhead costs
    case 'ADD_OVERHEAD':
      return { ...state, overheadCosts: [...state.overheadCosts, action.payload] };
    case 'UPDATE_OVERHEAD':
      return {
        ...state,
        overheadCosts: state.overheadCosts.map(o =>
          o.id === action.payload.id ? action.payload : o
        ),
      };
    case 'DELETE_OVERHEAD':
      return { ...state, overheadCosts: state.overheadCosts.filter(o => o.id !== action.payload) };

    // Dishes
    case 'ADD_DISH':
      return { ...state, dishes: [...state.dishes, action.payload] };
    case 'UPDATE_DISH':
      return {
        ...state,
        dishes: state.dishes.map(d =>
          d.id === action.payload.id ? action.payload : d
        ),
      };
    case 'DELETE_DISH':
      return { ...state, dishes: state.dishes.filter(d => d.id !== action.payload) };

    // Employees
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map(e =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.filter(e => e.id !== action.payload),
        payrollEntries: state.payrollEntries.filter(p => p.employeeId !== action.payload),
      };

    // Payroll entries
    case 'ADD_PAYROLL_ENTRY':
      return { ...state, payrollEntries: [...state.payrollEntries, action.payload] };
    case 'UPDATE_PAYROLL_ENTRY':
      return {
        ...state,
        payrollEntries: state.payrollEntries.map(e =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_PAYROLL_ENTRY':
      return { ...state, payrollEntries: state.payrollEntries.filter(e => e.id !== action.payload) };

    // Supply orders
    case 'ADD_SUPPLY_ORDER':
      return { ...state, supplyOrders: [...state.supplyOrders, action.payload] };
    case 'UPDATE_SUPPLY_ORDER':
      return {
        ...state,
        supplyOrders: state.supplyOrders.map(o =>
          o.id === action.payload.id ? action.payload : o
        ),
      };
    case 'DELETE_SUPPLY_ORDER':
      return { ...state, supplyOrders: state.supplyOrders.filter(o => o.id !== action.payload) };

    // Sales records
    case 'ADD_SALES_RECORD':
      return { ...state, salesRecords: [...state.salesRecords, action.payload] };
    case 'UPDATE_SALES_RECORD':
      return {
        ...state,
        salesRecords: state.salesRecords.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case 'DELETE_SALES_RECORD':
      return { ...state, salesRecords: state.salesRecords.filter(r => r.id !== action.payload) };

    // Settings
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'LOAD_STATE': {
      const loaded = action.payload;
      return {
        ...initialState,
        ...loaded,
        // Migrate: add group/tipEligible to employees that don't have them
        employees: (loaded.employees || initialState.employees).map(e => ({
          group: 'kitchen',
          tipEligible: false,
          ...e,
        })),
        // Migrate: add tips field to payroll entries that don't have it
        payrollEntries: (loaded.payrollEntries || []).map(p => ({
          tips: 0,
          ...p,
        })),
        supplyOrders: loaded.supplyOrders || [],
        salesRecords: loaded.salesRecords || [],
        settings: {
          ...initialState.settings,
          ...(loaded.settings || {}),
        },
      };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    AsyncStorage.getItem('appState').then(stored => {
      if (stored) {
        try {
          dispatch({ type: 'LOAD_STATE', payload: JSON.parse(stored) });
        } catch (e) {}
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
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function offsetWeek(weekOf, delta) {
  const d = new Date(weekOf + 'T12:00:00');
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().split('T')[0];
}

export function formatWeekRange(weekOf) {
  const start = new Date(weekOf + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

// grossSales includes sales tax; taxRate is a percentage (e.g. 8)
export function calcSalesBreakdown(grossSales, taxRate = 8) {
  const net = grossSales / (1 + taxRate / 100);
  const tax = grossSales - net;
  return { netSales: net, taxCollected: tax };
}

export function calculateDishCost(dish, state) {
  const { ingredients, departments, overheadCosts, settings } = state;

  let ingredientCost = 0;
  for (const item of dish.ingredients || []) {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    if (ing) ingredientCost += ing.pricePerUnit * item.quantity;
  }

  let laborCost = 0;
  for (const item of dish.laborTime || []) {
    const dept = departments.find(d => d.id === item.departmentId);
    if (dept) laborCost += (dept.hourlyWage / 60) * item.minutes;
  }

  const totalMonthlyOverhead = overheadCosts.reduce((sum, o) => sum + o.monthlyCost, 0);
  const totalDishesPerMonth = settings.workingDaysPerMonth * settings.totalDishesPerDay;
  const overheadPerDish = totalDishesPerMonth > 0 ? totalMonthlyOverhead / totalDishesPerMonth : 0;

  const totalCost = ingredientCost + laborCost + overheadPerDish;
  return { ingredientCost, laborCost, overheadPerDish, totalCost };
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
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 7);
}
