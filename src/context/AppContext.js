import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext(null);

const initialState = {
  departments: [
    { id: '1', name: 'Bếp chính', hourlyWage: 50000, hoursPerMonth: 208 },
    { id: '2', name: 'Phụ bếp', hourlyWage: 35000, hoursPerMonth: 208 },
    { id: '3', name: 'Phục vụ', hourlyWage: 30000, hoursPerMonth: 208 },
    { id: '4', name: 'Thu ngân', hourlyWage: 35000, hoursPerMonth: 208 },
  ],
  ingredients: [
    { id: '1', name: 'Thịt bò', unit: 'kg', pricePerUnit: 280000, category: 'Thịt' },
    { id: '2', name: 'Rau cải', unit: 'kg', pricePerUnit: 15000, category: 'Rau củ' },
    { id: '3', name: 'Gạo tẻ', unit: 'kg', pricePerUnit: 18000, category: 'Tinh bột' },
  ],
  overheadCosts: [
    { id: '1', name: 'Tiền điện', type: 'electricity', monthlyCost: 5000000 },
    { id: '2', name: 'Tiền nước', type: 'water', monthlyCost: 800000 },
    { id: '3', name: 'Tiền gas', type: 'gas', monthlyCost: 1200000 },
    { id: '4', name: 'Tiền thuê mặt bằng', type: 'rent', monthlyCost: 15000000 },
  ],
  dishes: [],
  settings: {
    workingDaysPerMonth: 26,
    totalDishesPerDay: 100,
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
      return {
        ...state,
        departments: state.departments.filter(d => d.id !== action.payload),
      };

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
      return {
        ...state,
        ingredients: state.ingredients.filter(i => i.id !== action.payload),
      };

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
      return {
        ...state,
        overheadCosts: state.overheadCosts.filter(o => o.id !== action.payload),
      };

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
      return {
        ...state,
        dishes: state.dishes.filter(d => d.id !== action.payload),
      };

    // Settings
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'LOAD_STATE':
      return action.payload;

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

// Calculate total cost for a dish
export function calculateDishCost(dish, state) {
  const { ingredients, departments, overheadCosts, settings } = state;

  // Ingredient cost
  let ingredientCost = 0;
  for (const item of dish.ingredients || []) {
    const ing = ingredients.find(i => i.id === item.ingredientId);
    if (ing) ingredientCost += ing.pricePerUnit * item.quantity;
  }

  // Labor cost
  let laborCost = 0;
  for (const item of dish.laborTime || []) {
    const dept = departments.find(d => d.id === item.departmentId);
    if (dept) laborCost += (dept.hourlyWage / 60) * item.minutes;
  }

  // Overhead cost per dish
  const totalMonthlyOverhead = overheadCosts.reduce(
    (sum, o) => sum + o.monthlyCost, 0
  );
  const totalDishesPerMonth =
    settings.workingDaysPerMonth * settings.totalDishesPerDay;
  const overheadPerDish =
    totalDishesPerMonth > 0 ? totalMonthlyOverhead / totalDishesPerMonth : 0;

  const totalCost = ingredientCost + laborCost + overheadPerDish;

  return {
    ingredientCost,
    laborCost,
    overheadPerDish,
    totalCost,
  };
}

export function suggestPrices(totalCost) {
  return [
    { label: 'Lãi 30%', percentage: 30, price: totalCost / 0.7 },
    { label: 'Lãi 40%', percentage: 40, price: totalCost / 0.6 },
    { label: 'Lãi 50%', percentage: 50, price: totalCost / 0.5 },
    { label: 'Lãi 60%', percentage: 60, price: totalCost / 0.4 },
    { label: 'Lãi 70%', percentage: 70, price: totalCost / 0.3 },
  ];
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 7);
}
