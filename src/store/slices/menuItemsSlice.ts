import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MenuItem } from '../../types';

interface MenuItemsState {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
}

const initialState: MenuItemsState = {
  items: [
    { id: '1', name: 'Caesar Salad', description: 'Fresh romaine lettuce with caesar dressing', price: 8.99, image: 'https://www.foodiesfeed.com/wp-content/uploads/2023/12/pizza-salami-on-a-wooden-table.jpg', isVegetarian: true, categoryId: '1', sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '2', name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 4.99, image: 'https://via.placeholder.com/150x150?text=Garlic+Bread', isVegetarian: true, categoryId: '1', sortOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '3', name: 'Chicken Wings', description: 'Crispy wings with your choice of sauce', price: 10.99, image: 'https://via.placeholder.com/150x150?text=Wings', isVegetarian: false, categoryId: '1', sortOrder: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '4', name: 'Grilled Salmon', description: 'Fresh Atlantic salmon with herbs', price: 18.99, image: 'https://via.placeholder.com/150x150?text=Salmon', isVegetarian: false, categoryId: '2', sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '5', name: 'Beef Steak', description: 'Premium cut beef steak with sides', price: 24.99, image: 'https://via.placeholder.com/150x150?text=Steak', isVegetarian: false, categoryId: '2', sortOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '6', name: 'Vegetable Pasta', description: 'Pasta with fresh seasonal vegetables', price: 14.99, image: 'https://via.placeholder.com/150x150?text=Pasta', isVegetarian: true, categoryId: '2', sortOrder: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '7', name: 'Chocolate Cake', description: 'Rich chocolate cake with frosting', price: 6.99, image: 'https://via.placeholder.com/150x150?text=Cake', isVegetarian: true, categoryId: '3', sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '8', name: 'Ice Cream', description: 'Three scoops of premium ice cream', price: 4.99, image: 'https://via.placeholder.com/150x150?text=Ice+Cream', isVegetarian: true, categoryId: '3', sortOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '9', name: 'Coffee', description: 'Freshly brewed coffee', price: 2.99, image: 'https://via.placeholder.com/150x150?text=Coffee', isVegetarian: true, categoryId: '4', sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10', name: 'Fresh Juice', description: 'Freshly squeezed orange juice', price: 3.99, image: 'https://via.placeholder.com/150x150?text=Juice', isVegetarian: true, categoryId: '4', sortOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '11', name: 'Tomato Soup', description: 'Creamy tomato soup with croutons', price: 5.99, image: 'https://via.placeholder.com/150x150?text=Soup', isVegetarian: true, categoryId: '5', sortOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '12', name: 'Chicken Noodle Soup', description: 'Hearty chicken noodle soup', price: 6.99, image: 'https://via.placeholder.com/150x150?text=Chicken+Soup', isVegetarian: false, categoryId: '5', sortOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  loading: false,
  error: null,
};

const menuItemsSlice = createSlice({
  name: 'menuItems',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newItem: MenuItem = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.items.push(newItem);
    },
    updateItem: (state, action: PayloadAction<MenuItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    deleteItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    updateItemCategory: (state, action: PayloadAction<{ itemId: string; categoryId: string }>) => {
      const item = state.items.find(i => i.id === action.payload.itemId);
      if (item) {
        item.categoryId = action.payload.categoryId;
        item.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const { addItem, updateItem, deleteItem, updateItemCategory } = menuItemsSlice.actions;
export default menuItemsSlice.reducer;