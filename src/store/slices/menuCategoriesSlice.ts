import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MenuCategory } from '../../types';

interface MenuCategoriesState {
  categories: MenuCategory[];
  loading: boolean;
  error: string | null;
}

const initialState: MenuCategoriesState = {
  categories: [
    { id: '1', name: 'Appetizers', description: 'Starters and small bites', color: '#FF6B6B', icon: '🥗', sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '2', name: 'Main Course', description: 'Main dishes and entrees', color: '#4ECDC4', icon: '🍽️', sortOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '3', name: 'Desserts', description: 'Sweet treats and desserts', color: '#45B7D1', icon: '🍰', sortOrder: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '4', name: 'Beverages', description: 'Drinks and refreshments', color: '#96CEB4', icon: '🥤', sortOrder: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '5', name: 'Soups', description: 'Hot and cold soups', color: '#FFEAA7', icon: '🍲', sortOrder: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  loading: false,
  error: null,
};

const menuCategoriesSlice = createSlice({
  name: 'menuCategories',
  initialState,
  reducers: {
    addCategory: (state, action: PayloadAction<Omit<MenuCategory, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newCategory: MenuCategory = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.categories.push(newCategory);
      state.categories.sort((a, b) => a.sortOrder - b.sortOrder);
    },
    updateCategory: (state, action: PayloadAction<MenuCategory>) => {
      const index = state.categories.findIndex(category => category.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = {
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
        state.categories.sort((a, b) => a.sortOrder - b.sortOrder);
      }
    },
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(category => category.id !== action.payload);
    },
    reorderCategories: (state, action: PayloadAction<MenuCategory[]>) => {
      state.categories = action.payload.map((category, index) => ({
        ...category,
        sortOrder: index + 1,
        updatedAt: new Date().toISOString(),
      }));
    },
  },
});

export const { addCategory, updateCategory, deleteCategory, reorderCategories } = menuCategoriesSlice.actions;
export default menuCategoriesSlice.reducer;