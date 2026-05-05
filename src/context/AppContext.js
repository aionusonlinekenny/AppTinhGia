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
    { id: '1', name: 'Beef', unit: 'lb', pricePerUnit: 8.99, category: 'Thịt' },
    { id: '2', name: 'Mixed Greens', unit: 'lb', pricePerUnit: 3.49, category: 'Rau củ' },
    { id: '3', name: 'Rice', unit: 'lb', pricePerUnit: 1.29, category: 'Tinh bột' },
  ],
  overheadCosts: [
    { id: '1', name: 'Electricity', type: 'electricity', monthlyCost: 800 },
    { id: '2', name: 'Water', type: 'water', monthlyCost: 200 },
    { id: '3', name: 'Gas', type: 'gas', monthlyCost: 350 },
    { id: '4', name: 'Rent', type: 'rent', monthlyCost: 5000 },
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
