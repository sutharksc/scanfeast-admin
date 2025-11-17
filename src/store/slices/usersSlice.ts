import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [
    {
      id: '1',
      name: 'Super Admin',
      email: 'super@admin.com',
      role: 'admin',
      status: 'active',
      phone: '+1 234-567-8900',
      avatar: 'https://picsum.photos/seed/admin/100/100.jpg',
      permissions: [
        { page: 'dashboard', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'tables', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'menu-categories', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'menu-items', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'orders', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'reports', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'users', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'restaurant', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'qr-codes', canView: true, canCreate: true, canEdit: true, canDelete: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Manager User',
      email: 'manager@admin.com',
      role: 'manager',
      status: 'active',
      phone: '+1 234-567-8901',
      avatar: 'https://picsum.photos/seed/manager/100/100.jpg',
      permissions: [
        { page: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { page: 'tables', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'menu-categories', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'menu-items', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'orders', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'reports', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { page: 'users', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { page: 'restaurant', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { page: 'qr-codes', canView: true, canCreate: true, canEdit: true, canDelete: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Staff User',
      email: 'staff@admin.com',
      role: 'staff',
      status: 'active',
      phone: '+1 234-567-8902',
      avatar: 'https://picsum.photos/seed/staff/100/100.jpg',
      permissions: [
        { page: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { page: 'orders', canView: true, canCreate: true, canEdit: true, canDelete: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  loading: false,
  error: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newUser: User = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.users.push(newUser);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = {
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload);
    },
    updateUserPermissions: (state, action: PayloadAction<{ userId: string; permissions: User['permissions'] }>) => {
      const user = state.users.find(u => u.id === action.payload.userId);
      if (user) {
        user.permissions = action.payload.permissions;
        user.updatedAt = new Date().toISOString();
      }
    },
    toggleUserStatus: (state, action: PayloadAction<string>) => {
      const user = state.users.find(u => u.id === action.payload);
      if (user) {
        user.status = user.status === 'active' ? 'inactive' : 'active';
        user.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const { addUser, updateUser, deleteUser, updateUserPermissions, toggleUserStatus } = usersSlice.actions;
export default usersSlice.reducer;