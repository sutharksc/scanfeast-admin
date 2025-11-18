import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchProfitLossData } from '../store/slices/expensesSlice';
import { useAuth } from '../hooks/useAuth';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  DownloadIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ReceiptIcon,
  BanknotesIcon
} from '../components/ui/Icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { ProfitLossData, ProfitLossFilters } from '../types';
import expenseService from '../services/expenseService';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];

const ProfitLoss: React.FC = () => {
  const dispatch = useDispatch();
  const { profitLossData, loading, error } = useSelector((state: RootState) => state.expenses);
  const { orders } = useSelector((state: RootState) => state.orders);
  const { hasPermission } = useAuth();
  
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    const filters = getDateFilters();
    dispatch(fetchProfitLossData(filters) as any);
  }, [dispatch, dateRange, groupBy, customStartDate, customEndDate]);

  const getDateFilters = (): ProfitLossFilters => {
    let startDate: string;
    let endDate: string;
    const today = new Date();

    switch (dateRange) {
      case 'week':
        startDate = format(subDays(today, 7), 'yyyy-MM-dd');
        endDate = format(today, 'yyyy-MM-dd');
        break;
      case 'month':
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        endDate = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        startDate = format(new Date(today.getFullYear(), currentQuarter * 3, 1), 'yyyy-MM-dd');
        endDate = format(new Date(today.getFullYear(), currentQuarter * 3 + 3, 0), 'yyyy-MM-dd');
        break;
      case 'year':
        startDate = format(startOfYear(today), 'yyyy-MM-dd');
        endDate = format(endOfYear(today), 'yyyy-MM-dd');
        break;
      case 'custom':
        startDate = customStartDate || format(startOfMonth(today), 'yyyy-MM-dd');
        endDate = customEndDate || format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      default:
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        endDate = format(endOfMonth(today), 'yyyy-MM-dd');
    }

    return { startDate, endDate, groupBy };
  };

  const calculateLocalProfitLoss = (): ProfitLossData => {
    const filters = getDateFilters();
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);

    // Filter orders by date range
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // For demo purposes, we'll use mock expense data
    // In real implementation, this would come from the expenses API
    const mockExpensesByType = [
      { type: 'purchases' as const, amount: 2500, percentage: 35 },
      { type: 'staff_salary' as const, amount: 2000, percentage: 28 },
      { type: 'utilities' as const, amount: 800, percentage: 11 },
      { type: 'rent' as const, amount: 1000, percentage: 14 },
      { type: 'maintenance' as const, amount: 500, percentage: 7 },
      { type: 'other' as const, amount: 300, percentage: 5 }
    ];

    const totalExpenses = mockExpensesByType.reduce((sum, expense) => sum + expense.amount, 0);
    const profitOrLoss = totalSales - totalExpenses;
    const profitMargin = totalSales > 0 ? (profitOrLoss / totalSales) * 100 : 0;

    const monthlyData = [
      { month: 'Jan', sales: 12000, expenses: 8000, profitOrLoss: 4000 },
      { month: 'Feb', sales: 15000, expenses: 9000, profitOrLoss: 6000 },
      { month: 'Mar', sales: 18000, expenses: 10000, profitOrLoss: 8000 },
      { month: 'Apr', sales: 14000, expenses: 8500, profitOrLoss: 5500 },
      { month: 'May', sales: 20000, expenses: 11000, profitOrLoss: 9000 },
      { month: 'Jun', sales: 22000, expenses: 12000, profitOrLoss: 10000 }
    ];

    return {
      totalSales,
      totalExpenses,
      profitOrLoss,
      profitMargin,
      expensesByType: mockExpensesByType,
      monthlyData
    };
  };

  const currentData = profitLossData || calculateLocalProfitLoss();

  const exportReport = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      const filters = getDateFilters();
      const blob = await expenseService.exportProfitLoss(filters, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profit-loss-${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getExpenseTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      purchases: 'Purchases',
      staff_salary: 'Staff Salary',
      maintenance: 'Maintenance',
      utilities: 'Utilities',
      rent: 'Rent',
      marketing: 'Marketing',
      insurance: 'Insurance',
      taxes: 'Taxes',
      supplies: 'Supplies',
      equipment: 'Equipment',
      delivery: 'Delivery',
      other: 'Other'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profit & Loss Report</h1>
          <p className="text-gray-600">Analyze your business profitability and expense breakdown</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                viewMode === 'chart'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              <ChartBarIcon className="w-4 h-4 inline mr-1" />
              Charts
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                viewMode === 'table'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              <ReceiptIcon className="w-4 h-4 inline mr-1" />
              Table
            </button>
          </div>
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-orange-500"
            >
              <option value="week">Last Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <button
            onClick={() => exportReport('csv')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Custom Date Range */}
      {dateRange === 'custom' && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentData.totalSales)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentData.totalExpenses)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <BanknotesIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit/Loss</p>
              <p className={`text-2xl font-bold ${currentData.profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(currentData.profitOrLoss)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${currentData.profitOrLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {currentData.profitOrLoss >= 0 ? (
                <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className={`text-2xl font-bold ${currentData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(currentData.profitMargin)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${currentData.profitMargin >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={currentData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="sales" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Breakdown Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={currentData.expensesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percentage }) => `${getExpenseTypeLabel(type)}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {currentData.expensesByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Profit/Loss Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit & Loss Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={currentData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="sales" fill="#10b981" />
                <Bar dataKey="expenses" fill="#ef4444" />
                <Bar dataKey="profitOrLoss" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Total Sales
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    {formatCurrency(currentData.totalSales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    100%
                  </td>
                </tr>
                {currentData.expensesByType.map((expense, index) => (
                  <tr key={expense.type}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getExpenseTypeLabel(expense.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.percentage}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Total Expenses
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">
                    {formatCurrency(currentData.totalExpenses)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {((currentData.totalExpenses / currentData.totalSales) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Profit/Loss
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                    currentData.profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(currentData.profitOrLoss)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPercentage(currentData.profitMargin)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLoss;