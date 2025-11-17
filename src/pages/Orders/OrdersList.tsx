import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateOrderStatus } from '../../store/slices/ordersSlice';
import { Order } from '../../types';
import { Link } from 'react-router-dom';
import OrderStatusManager from '../../components/orders/OrderStatusManager';
import ExternalOrderDemo from '../../components/orders/ExternalOrderDemo';
import { 
  SearchIcon, 
  FilterIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TruckIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserCircleIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BellIcon
} from '../../components/ui/Icons';
import { format } from 'date-fns';

const OrdersList: React.FC = () => {
  const dispatch = useDispatch();
  const { orders } = useSelector((state: RootState) => state.orders);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalAmount' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Orders', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'accepted', label: 'Accepted', color: 'blue' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
    { value: 'in-kitchen', label: 'In Kitchen', color: 'orange' },
    { value: 'ready', label: 'Ready', color: 'green' },
    { value: 'delivered', label: 'Delivered', color: 'emerald' }
  ];

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          matchesDate = orderDate.toDateString() === yesterday.toDateString();
          break;
        case 'week':
          matchesDate = orderDate >= lastWeek;
          break;
        case 'month':
          matchesDate = orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'totalAmount':
        comparison = a.totalAmount - b.totalAmount;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Calculate stats
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
  const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;
  const completedOrders = filteredOrders.filter(order => order.status === 'delivered').length;

  // Handle status update
  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    dispatch(updateOrderStatus({ orderId, status: newStatus }));
  };

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  // Get status color
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in-kitchen':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />;
      case 'in-kitchen':
        return <PencilIcon className="w-4 h-4" />;
      case 'ready':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'delivered':
        return <TruckIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
              Orders Management
            </h1>
            <p className="text-gray-600 mt-2">Track and manage customer orders efficiently</p>
          </div>
          <Link
            to="/create-order"
            className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <ShoppingCartIcon className="w-5 h-5 mr-2" />
            Create Order
          </Link>
        </div>

        {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white">
              <ShoppingCartIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Total Orders</p>
              <p className="text-2xl font-bold text-orange-900">{filteredOrders.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white">
              <CurrencyDollarIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-900">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white">
              <ArrowTrendingUpIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-blue-900">${averageOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-white">
              <ClockIcon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Pending Orders</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Orders Section */}
      {pendingOrders > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6">
          <div className="flex items-center mb-4">
            <BellIcon className="w-6 h-6 text-yellow-600 mr-2" />
            <h2 className="text-xl font-bold text-yellow-800">
              Pending Orders ({pendingOrders})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders
              .filter(order => order.status === 'pending')
              .slice(0, 6)
              .map(order => (
                <OrderStatusManager
                  key={order.id}
                  order={order}
                  onViewDetails={(order) => {
                    // Handle view details - navigate to order details
                    console.log('View order details:', order);
                  }}
                />
              ))}
          </div>
          {pendingOrders > 6 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setStatusFilter('pending')}
                className="text-yellow-700 hover:text-yellow-800 font-medium"
              >
                View all {pendingOrders} pending orders →
              </button>
            </div>
          )}
        </div>
      )}

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
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
            />
          </div>

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

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
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
            <option value="totalAmount-desc">Highest Value</option>
            <option value="totalAmount-asc">Lowest Value</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="status-desc">Status (Z-A)</option>
          </select>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <FilterIcon className="h-4 w-4 mr-1" />
            {filteredOrders.length} of {orders.length} orders
          </div>
          
          {selectedOrders.length > 0 && (
            <div className="flex items-center text-sm text-orange-600">
              {selectedOrders.length} orders selected
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3">
                        {order.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-xs text-gray-500">{order.customerEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.items.length} items</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      View
                    </Link>
                    
                    {/* Status Actions */}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'preparing')}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        Start Preparing
                      </button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'ready')}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 hover:text-green-900 transition-colors"
                      >
                        Mark Ready
                      </button>
                    )}
                    
                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'delivered')}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-900 transition-colors"
                      >
                        Mark Delivered
                      </button>
                    )}
                    
                    {(order.status === 'pending' || order.status === 'preparing') && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-900 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
            <ShoppingCartIcon className="h-24 w-24" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
              ? 'Try adjusting your filters.' 
              : 'No orders have been placed yet.'}
          </p>
          {!searchTerm && statusFilter === 'all' && dateFilter === 'all' && (
            <Link
              to="/create-order"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ShoppingCartIcon className="w-5 h-5 mr-2" />
              Create First Order
            </Link>
          )}
        </div>
      )}
      </div>

      {/* Sidebar */}
      <div className="w-80 space-y-6">
        <ExternalOrderDemo />
      </div>
    </div>
  );
};

export default OrdersList;