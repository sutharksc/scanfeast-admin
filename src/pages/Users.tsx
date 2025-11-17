import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addUser, updateUser, deleteUser, toggleUserStatus } from '../store/slices/usersSlice';
import { User } from '../types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  SearchIcon, 
  FilterIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '../components/ui/Icons';
import { format } from 'date-fns';

// Helper function to get default permissions based on role
const getDefaultPermissions = (role: User['role']) => {
  switch (role) {
    case 'admin':
      return [
        { page: 'dashboard', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'tables', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'menu-categories', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'menu-items', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'orders', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'reports', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'users', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'restaurant', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'qr-codes', canView: true, canCreate: true, canEdit: true, canDelete: true },
      ];
    case 'manager':
      return [
        { page: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { page: 'tables', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'menu-categories', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'menu-items', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'orders', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { page: 'reports', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { page: 'users', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { page: 'restaurant', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { page: 'qr-codes', canView: true, canCreate: true, canEdit: true, canDelete: true },
      ];
    case 'staff':
      return [
        { page: 'dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { page: 'orders', canView: true, canCreate: true, canEdit: true, canDelete: false },
      ];
    default:
      return [];
  }
};

const Users: React.FC = () => {
  const dispatch = useDispatch();
  const { users } = useSelector((state: RootState) => state.users);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as User['role'],
    phone: '',
    avatar: ''
  });

  // Role options
  const roleOptions = [
    { value: 'all', label: 'All Roles', color: 'gray' },
    { value: 'admin', label: 'Admin', color: 'red' },
    { value: 'manager', label: 'Manager', color: 'blue' },
    { value: 'staff', label: 'Staff', color: 'green' }
  ];

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'gray' },
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'inactive', label: 'Inactive', color: 'red' }
  ];

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'role':
        comparison = a.role.localeCompare(b.role);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Calculate stats
  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter(user => user.status === 'active').length;
  const adminUsers = filteredUsers.filter(user => user.role === 'admin').length;
  const newUsersThisMonth = filteredUsers.filter(user => {
    const userDate = new Date(user.createdAt);
    const thisMonth = new Date();
    return userDate.getMonth() === thisMonth.getMonth() && userDate.getFullYear() === thisMonth.getFullYear();
  }).length;

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone: formData.phone,
      avatar: formData.avatar || `https://picsum.photos/seed/${formData.name}/100/100.jpg`,
      status: 'active' as const,
      permissions: getDefaultPermissions(formData.role)
    };

    if (isEditModalOpen && selectedUser) {
      dispatch(updateUser({ 
        ...userData, 
        id: selectedUser.id, 
        createdAt: selectedUser.createdAt, 
        updatedAt: new Date().toISOString(),
        status: selectedUser.status,
        permissions: selectedUser.permissions // Keep existing permissions for edits
      }));
    } else {
      dispatch(addUser(userData));
    }

    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      phone: '',
      avatar: ''
    });
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedUser(null);
    setShowPassword(false);
  };

  // Handle edit
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      avatar: user.avatar || ''
    });
    setIsEditModalOpen(true);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      dispatch(deleteUser(id));
    }
  };

  // Handle status toggle
  const handleStatusToggle = (id: string) => {
    dispatch(toggleUserStatus(id));
  };

  // Get role color
  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'staff':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get role icon
  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return <ShieldIcon className="w-4 h-4" />;
      case 'manager':
        return <UserGroupIcon className="w-4 h-4" />;
      case 'staff':
        return <UserCircleIcon className="w-4 h-4" />;
      default:
        return <UserCircleIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-gray-600 mt-2">Manage user accounts, roles, and permissions</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white">
              <UserGroupIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Total Users</p>
              <p className="text-2xl font-bold text-orange-900">{totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Active Users</p>
              <p className="text-2xl font-bold text-green-900">{activeUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white">
              <ShieldIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Admin Users</p>
              <p className="text-2xl font-bold text-blue-900">{adminUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <ArrowTrendingUpIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">New This Month</p>
              <p className="text-2xl font-bold text-purple-900">{newUsersThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="email-asc">Email (A-Z)</option>
            <option value="email-desc">Email (Z-A)</option>
          </select>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <FilterIcon className="h-4 w-4 mr-1" />
            {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
            {/* User Header */}
            <div className="h-24 bg-gradient-to-br from-orange-400 to-orange-600 relative">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="absolute -bottom-10 left-6">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://picsum.photos/seed/${user.name}/100/100.jpg`;
                  }}
                />
              </div>
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => handleStatusToggle(user.id)}
                  className={`p-2 rounded-full transition-colors ${
                    user.status === 'active'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {user.status === 'active' ? (
                    <CheckCircleIcon className="w-4 h-4 text-white" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* User Content */}
            <div className="p-6 pt-12">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h3>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    <span className="ml-1">{user.role}</span>
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </div>
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <MailIcon className="w-4 h-4 mr-1" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center justify-center text-sm text-gray-500 mt-1">
                    <PhoneIcon className="w-4 h-4 mr-1" />
                    {user.phone}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center text-xs text-gray-500 mb-4">
                <CalendarIcon className="w-3 h-3 mr-1" />
                Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 transition-all duration-200 hover:shadow-md"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
            <UserGroupIcon className="h-24 w-24" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
              ? 'Try adjusting your filters.' 
              : 'Get started by creating your first user.'}
          </p>
          {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create First User
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {isEditModalOpen ? 'Edit User' : 'Create New User'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="john@example.com"
                />
              </div>

              {!isEditModalOpen && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isEditModalOpen ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;