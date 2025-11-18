import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchExpenses, createExpense, updateExpense, deleteExpense, clearError, setFilters, setPagination } from '../store/slices/expensesSlice';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import {
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  DownloadIcon,
  XIcon,
  CheckCircleIcon,
  PhotographIcon,
  ReceiptIcon
} from '../components/ui/Icons';
import { Expense, ExpenseType, CreateExpenseRequest, UpdateExpenseRequest, ExpenseFilters } from '../types';
import expenseService from '../services/expenseService';

const EXPENSE_TYPES: { value: ExpenseType; label: string; color: string }[] = [
  { value: 'purchases', label: 'Purchases', color: 'bg-blue-100 text-blue-800' },
  { value: 'staff_salary', label: 'Staff Salary', color: 'bg-green-100 text-green-800' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'utilities', label: 'Utilities', color: 'bg-purple-100 text-purple-800' },
  { value: 'rent', label: 'Rent', color: 'bg-red-100 text-red-800' },
  { value: 'marketing', label: 'Marketing', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'insurance', label: 'Insurance', color: 'bg-pink-100 text-pink-800' },
  { value: 'taxes', label: 'Taxes', color: 'bg-gray-100 text-gray-800' },
  { value: 'supplies', label: 'Supplies', color: 'bg-orange-100 text-orange-800' },
  { value: 'equipment', label: 'Equipment', color: 'bg-teal-100 text-teal-800' },
  { value: 'delivery', label: 'Delivery', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'other', label: 'Other', color: 'bg-slate-100 text-slate-800' }
];

const Expenses: React.FC = () => {
  const dispatch = useDispatch();
  const { expenses, loading, error, pagination, filters } = useSelector((state: RootState) => state.expenses);
  const { hasPermission } = useAuth();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    type: 'other',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    notes: '',
    attachment: ''
  });

  const [tempFilters, setTempFilters] = useState<ExpenseFilters>({
    type: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    startDate: undefined,
    endDate: undefined
  });

  useEffect(() => {
    dispatch(fetchExpenses({ filters, pagination: { page: pagination.page, limit: pagination.limit } }) as any);
  }, [dispatch, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearError()), 5000);
    }
  }, [error, dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setFilters({ ...filters, search: searchTerm }));
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(createExpense(formData) as any);
      setIsCreateModalOpen(false);
      resetForm();
      dispatch(fetchExpenses({ filters, pagination: { page: 1, limit: pagination.limit } }) as any);
    } catch (error) {
      console.error('Failed to create expense:', error);
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    
    try {
      const updateData: UpdateExpenseRequest = {
        id: selectedExpense.id,
        ...formData
      };
      await dispatch(updateExpense(updateData) as any);
      setIsEditModalOpen(false);
      resetForm();
      setSelectedExpense(null);
    } catch (error) {
      console.error('Failed to update expense:', error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await dispatch(deleteExpense(id) as any);
        dispatch(fetchExpenses({ filters, pagination: { page: pagination.page, limit: pagination.limit } }) as any);
      } catch (error) {
        console.error('Failed to delete expense:', error);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const response = await expenseService.uploadExpenseAttachment(file);
      setFormData({ ...formData, attachment: response.data.url });
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleApplyFilters = () => {
    dispatch(setFilters(tempFilters));
    setIsFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    setTempFilters({
      type: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      startDate: undefined,
      endDate: undefined
    });
    dispatch(setFilters({}));
  };

  const resetForm = () => {
    setFormData({
      type: 'other',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      notes: '',
      attachment: ''
    });
  };

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      type: expense.type,
      amount: expense.amount,
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
      description: expense.description,
      notes: expense.notes || '',
      attachment: expense.attachment || ''
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsViewModalOpen(true);
  };

  const exportExpenses = async () => {
    try {
      const blob = await expenseService.exportExpenses(filters, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export expenses:', error);
    }
  };

  const getExpenseTypeInfo = (type: ExpenseType) => {
    return EXPENSE_TYPES.find(t => t.value === type) || EXPENSE_TYPES[11];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Manage and track your business expenses</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={exportExpenses}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </button>
          {hasPermission('expenses', 'create') && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </form>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <FilterIcon className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attachment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                  </td>
                </tr>
              ) : expenses == null || expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => {
                  const typeInfo = getExpenseTypeInfo(expense.type);
                  return (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          {expense.notes && (
                            <div className="text-gray-500 text-xs mt-1">{expense.notes}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${expense.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.attachment ? (
                          <a
                            href={expense.attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-900"
                          >
                            <PhotographIcon className="w-5 h-5" />
                          </a>
                        ) : (
                          <span className="text-gray-300">
                            <PhotographIcon className="w-5 h-5" />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openViewModal(expense)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {hasPermission('expenses', 'edit') && (
                            <button
                              onClick={() => openEditModal(expense)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('expenses', 'delete') && (
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditModalOpen ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  resetForm();
                  setSelectedExpense(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleUpdateExpense : handleCreateExpense}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expense Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ExpenseType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    {EXPENSE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attachment (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={uploadingFile}
                  />
                  {uploadingFile && (
                    <p className="text-sm text-gray-500 mt-1">Uploading...</p>
                  )}
                  {formData.attachment && (
                    <div className="mt-2">
                      <a
                        href={formData.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-600 hover:text-orange-900"
                      >
                        View attachment
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    resetForm();
                    setSelectedExpense(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (isEditModalOpen ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Expense Details</h3>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedExpense(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getExpenseTypeInfo(selectedExpense.type).color}`}>
                  {getExpenseTypeInfo(selectedExpense.type).label}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <p className="text-lg font-semibold text-gray-900">${selectedExpense.amount.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="text-gray-900">{format(new Date(selectedExpense.date), 'MMMM dd, yyyy')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900">{selectedExpense.description}</p>
              </div>

              {selectedExpense.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-gray-900">{selectedExpense.notes}</p>
                </div>
              )}

              {selectedExpense.attachment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attachment</label>
                  <a
                    href={selectedExpense.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-900 inline-flex items-center"
                  >
                    <PhotographIcon className="w-4 h-4 mr-1" />
                    View Attachment
                  </a>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="text-gray-500 text-sm">
                  {format(new Date(selectedExpense.createdAt), 'MMMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedExpense(null);
                }}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filter Expenses</h3>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Type
                </label>
                <select
                  value={tempFilters.type || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, type: e.target.value as ExpenseType || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {EXPENSE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tempFilters.minAmount || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, minAmount: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tempFilters.maxAmount || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, maxAmount: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={tempFilters.startDate || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, startDate: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={tempFilters.endDate || ''}
                  onChange={(e) => setTempFilters({ ...tempFilters, endDate: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Filters
              </button>
              <div className="space-x-3">
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;