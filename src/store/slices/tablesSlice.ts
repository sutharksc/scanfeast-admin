import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Table } from '../../types';

interface TablesState {
  tables: Table[];
  loading: boolean;
  error: string | null;
}

const initialState: TablesState = {
  tables: [
    { id: '1', number: 'T1', description: 'Window Table', type: 'Dining Table', capacity: 4, status: 'Available', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '2', number: 'T2', description: 'Corner Table', type: 'Dining Table', capacity: 2, status: 'Occupied', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '3', number: 'T3', description: 'Center Table', type: 'Dining Table', capacity: 6, status: 'Available', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '4', number: 'B1', description: 'Bar Seat 1', type: 'Bar Stool', capacity: 1, status: 'Available', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '5', number: 'B2', description: 'Bar Seat 2', type: 'Bar Stool', capacity: 1, status: 'Occupied', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '6', number: 'S1', description: 'Sofa Area 1', type: 'Sofa', capacity: 8, status: 'Available', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '7', number: 'S2', description: 'Sofa Area 2', type: 'Sofa', capacity: 8, status: 'Available', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '8', number: 'B1', description: 'Booth 1', type: 'Booth', capacity: 4, status: 'Occupied', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '9', number: 'B2', description: 'Booth 2', type: 'Booth', capacity: 4, status: 'Available', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '10', number: 'T4', description: 'Outdoor Table', type: 'Dining Table', capacity: 4, status: 'Available', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  loading: false,
  error: null,
};

const tablesSlice = createSlice({
  name: 'tables',
  initialState,
  reducers: {
    addTable: (state, action: PayloadAction<Omit<Table, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newTable: Table = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.tables.push(newTable);
    },
    updateTable: (state, action: PayloadAction<Table>) => {
      const index = state.tables.findIndex(table => table.id === action.payload.id);
      if (index !== -1) {
        state.tables[index] = {
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    deleteTable: (state, action: PayloadAction<string>) => {
      state.tables = state.tables.filter(table => table.id !== action.payload);
    },
    toggleTableStatus: (state, action: PayloadAction<string>) => {
      const table = state.tables.find(t => t.id === action.payload);
      if (table) {
        table.status = table.status === 'Available' ? 'Occupied' : 'Available';
        table.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const { addTable, updateTable, deleteTable, toggleTableStatus } = tablesSlice.actions;
export default tablesSlice.reducer;