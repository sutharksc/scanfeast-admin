import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths
} from 'date-fns';
import { 
  TrendingUpIcon,
  TrendingDownIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  CalendarIcon,
  DownloadIcon,
  FilterIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowLeftIcon,
  PackageIcon,
  UsersIcon,
  ReceiptIcon
} from '../components/ui/Icons';
import Pagination from '../components/ui/Pagination';

type ReportView = 'overview' | 'sales' | 'orders' | 'items' | 'customers' | 'item-detail' | 'customer-detail';
type ReportType = 'sales' | 'orders' | 'items' | 'customers';

interface ItemDetail {
  id: string;
  name: string;
  category: string;
  price: number;
  sales: number;
  revenue: number;
  orders: any[];
}

interface CustomerDetail {
  email: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  firstOrderDate: Date;
  lastOrderDate: Date;
  orders: any[];
}

const Reports: React.FC = () => {
  const { orders } = useSelector((state: RootState) => state.orders);
  const { items: menuItems } = useSelector((state: RootState) => state.menuItems);
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [reportView, setReportView] = useState<ReportView>('overview');
  const [selectedItem, setSelectedItem] = useState<ItemDetail | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  
  // Pagination states
  const [itemsPage, setItemsPage] = useState(1);
  const [customersPage, setCustomersPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const itemsPerPage = 10;
  const customersPerPage = 10;
  const ordersPerPage = 10;

  // Calculate date ranges
  const today = new Date();
  let startDate: Date;
  let endDate: Date = today;

  switch (dateRange) {
    case 'week':
      startDate = startOfWeek(today);
      endDate = endOfWeek(today);
      break;
    case 'month':
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      break;
    case 'quarter':
      startDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
      endDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0);
      break;
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      break;
  }

  // Filter orders by date range
  const filteredOrders = (orders || []).filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });

  // Calculate metrics
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCustomers = new Set(filteredOrders.map(order => order.customerEmail)).size;

  // Customer calculations
  const uniqueCustomers = new Set(filteredOrders.map(order => order.customerEmail));
  const customerOrders = Array.from(uniqueCustomers).map(email => {
    const customerOrderList = filteredOrders.filter(order => order.customerEmail === email);
    const totalSpent = customerOrderList.reduce((sum, order) => sum + order.totalAmount, 0);
    const avgOrderValue = customerOrderList.length > 0 ? totalSpent / customerOrderList.length : 0;
    
    return {
      email,
      name: customerOrderList[0]?.customerName || email,
      totalOrders: customerOrderList.length,
      totalSpent,
      avgOrderValue,
      firstOrderDate: new Date(Math.min(...customerOrderList.map(order => new Date(order.createdAt).getTime()))),
      lastOrderDate: new Date(Math.max(...customerOrderList.map(order => new Date(order.createdAt).getTime()))),
      orders: customerOrderList
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  // Item calculations
  const itemSales = (menuItems || []).map(item => {
    const itemOrders = filteredOrders.filter(order =>
      order.items.some(orderItem => orderItem.menuItem.id === item.id)
    );
    const totalQuantity = itemOrders.reduce((sum, order) => {
      const orderItem = order.items.find(item => item.menuItem.id === item.id);
      return sum + (orderItem ? orderItem.quantity : 0);
    }, 0);
    const totalRevenue = itemOrders.reduce((sum, order) => {
      const orderItem = order.items.find(item => item.menuItem.id === item.id);
      return sum + (orderItem ? orderItem.subtotal : 0);
    }, 0);
    
    return {
      id: item.id,
      name: item.name,
      category: `Category ${item.categoryId}`,
      price: item.price,
      sales: totalQuantity,
      revenue: totalRevenue,
      orders: itemOrders
    };
  }).filter(item => item.sales > 0).sort((a, b) => b.revenue - a.revenue);

  // Previous period comparison
  let previousStartDate: Date;
  let previousEndDate: Date;
  
  switch (dateRange) {
    case 'week':
      previousStartDate = subDays(startDate, 7);
      previousEndDate = subDays(endDate, 7);
      break;
    case 'month':
      previousStartDate = subMonths(startDate, 1);
      previousEndDate = subMonths(endDate, 1);
      break;
    case 'quarter':
      previousStartDate = subMonths(startDate, 3);
      previousEndDate = subMonths(endDate, 3);
      break;
    case 'year':
      previousStartDate = subMonths(startDate, 12);
      previousEndDate = subMonths(endDate, 12);
      break;
  }

  const previousOrders = (orders || []).filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= previousStartDate && orderDate <= previousEndDate;
  });

  const previousRevenue = previousOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const previousOrdersCount = previousOrders.length;

  const revenueTrend = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const ordersTrend = previousOrdersCount > 0 ? ((totalOrders - previousOrdersCount) / previousOrdersCount) * 100 : 0;

  // Pagination
  const paginatedItems = itemSales.slice((itemsPage - 1) * itemsPerPage, itemsPage * itemsPerPage);
  const paginatedCustomers = customerOrders.slice((customersPage - 1) * customersPerPage, customersPage * customersPerPage);
  const paginatedOrders = filteredOrders.slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage);

  // Handle item detail view
  const handleItemClick = (item: ItemDetail) => {
    setSelectedItem(item);
    setReportView('item-detail');
  };

  // Handle customer detail view
  const handleCustomerClick = (customer: CustomerDetail) => {
    setSelectedCustomer(customer);
    setReportView('customer-detail');
  };

  // Handle back to overview
  const handleBackToOverview = () => {
    setReportView('overview');
    setSelectedItem(null);
    setSelectedCustomer(null);
  };

  // Export data
  const handleExport = () => {
    const csvContent = [
      ['Date', 'Order ID', 'Customer', 'Items', 'Total', 'Status'],
      ...filteredOrders.map(order => [
        format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm'),
        order.id,
        order.customerName,
        order.items.length,
        order.totalAmount.toFixed(2),
        order.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restaurant-report-${format(today, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Render item detail view
  const renderItemDetail = () => {
    if (!selectedItem) return null;

    const itemOrders = selectedItem.orders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToOverview}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Reports
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h1>
            <p className="text-gray-600">Item Sales Report</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600">Total Sales</div>
            <div className="text-2xl font-bold text-gray-900">{selectedItem.sales} units</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600">Total Revenue</div>
            <div className="text-2xl font-bold text-green-600">${selectedItem.revenue.toFixed(2)}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600">Average Price</div>
            <div className="text-2xl font-bold text-blue-600">${selectedItem.price.toFixed(2)}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600">Total Orders</div>
            <div className="text-2xl font-bold text-purple-600">{selectedItem.orders.length}</div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itemOrders.map((order) => {
                  const orderItem = order.items.find(item => item.menuItem.id === selectedItem.id);
                  return (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {orderItem?.quantity || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${(orderItem?.subtotal || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render customer detail view
  const renderCustomerDetail = () => {
    if (!selectedCustomer) return null;

    const customerOrders = selectedCustomer.orders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToOverview}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Reports
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h1>
            <p className="text-gray-600">Customer Activity Report</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600">Total Orders</div>
            <div className="text-2xl font-bold text-gray-900">{selectedCustomer.totalOrders}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600">Total Spent</div>
            <div className="text-2xl font-bold text-green-600">${selectedCustomer.totalSpent.toFixed(2)}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600">Average Order Value</div>
            <div className="text-2xl font-bold text-blue-600">${selectedCustomer.avgOrderValue.toFixed(2)}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600">Customer Since</div>
            <div className="text-lg font-bold text-purple-600">
              {format(selectedCustomer.firstOrderDate, 'MMM dd, yyyy')}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customerOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.items.length} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render main reports view
  const renderMainReports = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
              Analytics & Reports
            </h1>
            <p className="text-gray-600 mt-2">Comprehensive insights into your restaurant performance</p>
          </div>
          
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Date Range Filters */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <FilterIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Date Range:</span>
                </div>
                
                <div className="flex space-x-2">
                  {[
                    { value: 'week', label: 'This Week' },
                    { value: 'month', label: 'This Month' },
                    { value: 'quarter', label: 'This Quarter' },
                    { value: 'year', label: 'This Year' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setDateRange(option.value as any)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        dateRange === option.value
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center space-x-2 ml-auto">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Type Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setReportView('sales')}
              className={`inline-flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                reportView === 'sales'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CurrencyDollarIcon className="w-5 h-5 mr-2" />
              Sales Report
            </button>
            <button
              onClick={() => setReportView('orders')}
              className={`inline-flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                reportView === 'orders'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ShoppingCartIcon className="w-5 h-5 mr-2" />
              Orders Report
            </button>
            <button
              onClick={() => setReportView('items')}
              className={`inline-flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                reportView === 'items'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <PackageIcon className="w-5 h-5 mr-2" />
              Items Report
            </button>
            <button
              onClick={() => setReportView('customers')}
              className={`inline-flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                reportView === 'customers'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UsersIcon className="w-5 h-5 mr-2" />
              Customers Report
            </button>
          </div>
          
          {/* Advanced Reports */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Advanced Reports</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/analytics/item-wise')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 border border-orange-200"
              >
                <PackageIcon className="w-4 h-4 mr-2" />
                Item-wise Analysis
              </button>
              <button
                onClick={() => navigate('/analytics/customer-wise')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200"
              >
                <UsersIcon className="w-4 h-4 mr-2" />
                Customer-wise Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Total Revenue</p>
                <p className="text-2xl font-bold text-orange-900">${totalRevenue.toFixed(2)}</p>
                <div className={`flex items-center mt-2 text-sm ${
                  revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {revenueTrend >= 0 ? (
                    <TrendingUpIcon className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDownIcon className="w-4 h-4 mr-1" />
                  )}
                  <span>{Math.abs(revenueTrend).toFixed(1)}% vs last period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white">
                <CurrencyDollarIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-900">{totalOrders}</p>
                <div className={`flex items-center mt-2 text-sm ${
                  ordersTrend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {ordersTrend >= 0 ? (
                    <TrendingUpIcon className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDownIcon className="w-4 h-4 mr-1" />
                  )}
                  <span>{Math.abs(ordersTrend).toFixed(1)}% vs last period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white">
                <ShoppingCartIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-green-900">${averageOrderValue.toFixed(2)}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                  <span>Per order average</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white">
                <ChartBarIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Customers</p>
                <p className="text-2xl font-bold text-purple-900">{totalCustomers}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  <span>Unique customers</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white">
                <UserGroupIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Report Content */}
        {reportView === 'sales' && (
          <div className="space-y-6">
            {/* Sales Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', revenue: 12000, orders: 180 },
                    { month: 'Feb', revenue: 15000, orders: 220 },
                    { month: 'Mar', revenue: 18000, orders: 265 },
                    { month: 'Apr', revenue: 16000, orders: 240 },
                    { month: 'May', revenue: 22000, orders: 310 },
                    { month: 'Jun', revenue: 25000, orders: 350 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Orders Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { month: 'Jan', orders: 180, revenue: 12000 },
                    { month: 'Feb', orders: 220, revenue: 15000 },
                    { month: 'Mar', orders: 265, revenue: 18000 },
                    { month: 'Apr', orders: 240, revenue: 16000 },
                    { month: 'May', orders: 310, revenue: 22000 },
                    { month: 'Jun', orders: 350, revenue: 25000 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Additional Sales Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Sales by Category</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Pizza', value: 45, revenue: 28500 },
                        { name: 'Salads', value: 25, revenue: 15800 },
                        { name: 'Main Course', value: 20, revenue: 12600 },
                        { name: 'Desserts', value: 10, revenue: 6300 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#f97316" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Peak Sales Hours</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { hour: '11AM', sales: 1200 },
                    { hour: '12PM', sales: 2800 },
                    { hour: '1PM', sales: 3200 },
                    { hour: '2PM', sales: 1800 },
                    { hour: '6PM', sales: 2200 },
                    { hour: '7PM', sales: 3500 },
                    { hour: '8PM', sales: 2800 },
                    { hour: '9PM', sales: 1500 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">Credit Card</span>
                    </div>
                    <span className="text-sm font-bold">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Cash</span>
                    </div>
                    <span className="text-sm font-bold">30%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium">Digital Wallet</span>
                    </div>
                    <span className="text-sm font-bold">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium">Other</span>
                    </div>
                    <span className="text-sm font-bold">5%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Performance Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Monthly Performance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Order Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Growth
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      { month: 'January', revenue: 12000, orders: 180, avgOrder: 66.67, growth: 0 },
                      { month: 'February', revenue: 15000, orders: 220, avgOrder: 68.18, growth: 25.0 },
                      { month: 'March', revenue: 18000, orders: 265, avgOrder: 67.92, growth: 20.0 },
                      { month: 'April', revenue: 16000, orders: 240, avgOrder: 66.67, growth: -11.1 },
                      { month: 'May', revenue: 22000, orders: 310, avgOrder: 70.97, growth: 37.5 },
                      { month: 'June', revenue: 25000, orders: 350, avgOrder: 71.43, growth: 13.6 }
                    ].map((month) => (
                      <tr key={month.month}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {month.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${month.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {month.orders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${month.avgOrder.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className={`flex items-center ${
                            month.growth > 0 ? 'text-green-600' : month.growth < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {month.growth > 0 ? (
                              <TrendingUpIcon className="w-4 h-4 mr-1" />
                            ) : month.growth < 0 ? (
                              <TrendingDownIcon className="w-4 h-4 mr-1" />
                            ) : null}
                            {month.growth > 0 ? '+' : ''}{month.growth.toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {reportView === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${order.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={ordersPage}
                  totalPages={Math.ceil(filteredOrders.length / ordersPerPage)}
                  onPageChange={setOrdersPage}
                  totalItems={filteredOrders.length}
                  itemsPerPage={ordersPerPage}
                />
              </div>
            </div>
          </div>
        )}

        {reportView === 'items' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Item Sales</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Units Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.sales}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${item.revenue.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleItemClick(item)}
                            className="text-orange-600 hover:text-orange-900 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={itemsPage}
                  totalPages={Math.ceil(itemSales.length / itemsPerPage)}
                  onPageChange={setItemsPage}
                  totalItems={itemSales.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            </div>
          </div>
        )}

        {reportView === 'customers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Customer Analytics</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedCustomers.map((customer) => (
                      <tr key={customer.email as string}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.email as string}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.totalOrders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${customer.totalSpent.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleCustomerClick(customer as CustomerDetail)}
                            className="text-orange-600 hover:text-orange-900 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={customersPage}
                  totalPages={Math.ceil(customerOrders.length / customersPerPage)}
                  onPageChange={setCustomersPage}
                  totalItems={customerOrders.length}
                  itemsPerPage={customersPerPage}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {reportView === 'item-detail' && renderItemDetail()}
      {reportView === 'customer-detail' && renderCustomerDetail()}
      {(reportView === 'overview' || reportView === 'sales' || reportView === 'orders' || reportView === 'items' || reportView === 'customers') && renderMainReports()}
    </div>
  );
};

export default Reports;