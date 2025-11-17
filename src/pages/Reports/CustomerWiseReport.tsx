import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  UsersIcon, 
  SearchIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  ShoppingCartIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowLeftIcon,
  FilterIcon,
  DownloadIcon,
  EyeIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon
} from '../../components/ui/Icons';
import { format, subDays } from 'date-fns';
import { 
  pdfExportService, 
  ReportData, 
  createBarChartData, 
  createDoughnutChartData, 
  createLineChartData 
} from '../../services/pdfExportService';

interface CustomerStats {
  customerName: string;
  customerEmail?: string;
  customerMobile?: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  favoriteItems: { name: string; count: number }[];
  orders: any[];
}

const CustomerWiseReport: React.FC = () => {
  const { orders } = useSelector((state: RootState) => state);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [isExporting, setIsExporting] = useState(false);

  // Get all unique customers
  const customers = useMemo(() => {
    const customerMap = new Map();
    
    orders.orders.forEach(order => {
      const key = order.customerName.toLowerCase();
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerMobile,
          address: order.customerAddress
        });
      }
    });

    return Array.from(customerMap.values());
  }, [orders.orders]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);

  // Calculate statistics for selected customer
  const customerStats: CustomerStats | null = useMemo(() => {
    if (!selectedCustomer) return null;

    const cutoffDate = subDays(new Date(), parseInt(dateRange));
    const customerOrders: any[] = [];

    orders.orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= cutoffDate && order.customerName.toLowerCase() === selectedCustomer.toLowerCase()) {
        customerOrders.push(order);
      }
    });

    if (customerOrders.length === 0) return null;

    const totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const avgOrderValue = totalSpent / customerOrders.length;

    // Calculate favorite items
    const itemFrequency = new Map<string, { name: string; count: number }>();
    customerOrders.forEach(order => {
      order.items.forEach(orderItem => {
        const itemName = orderItem.menuItem.name;
        if (itemFrequency.has(itemName)) {
          itemFrequency.get(itemName)!.count += orderItem.quantity;
        } else {
          itemFrequency.set(itemName, { name: itemName, count: orderItem.quantity });
        }
      });
    });

    const favoriteItems = Array.from(itemFrequency.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const dates = customerOrders.map(order => new Date(order.createdAt));
    const firstOrderDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const lastOrderDate = new Date(Math.max(...dates.map(d => d.getTime())));

    const selectedCustomerData = customers.find(c => c.name.toLowerCase() === selectedCustomer.toLowerCase());

    return {
      customerName: selectedCustomerData?.name || 'Unknown Customer',
      customerEmail: selectedCustomerData?.email,
      customerMobile: selectedCustomerData?.phone,
      totalOrders: customerOrders.length,
      totalSpent,
      avgOrderValue,
      firstOrderDate: firstOrderDate.toISOString(),
      lastOrderDate: lastOrderDate.toISOString(),
      favoriteItems,
      orders: customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
  }, [selectedCustomer, orders.orders, dateRange, customers]);

  // PDF Export function
  const handleExportPDF = async () => {
    if (!customerStats) return;
    
    setIsExporting(true);
    try {
      // Prepare data for charts
      const favoriteItemsChart = createBarChartData(
        customerStats.favoriteItems.map(item => item.name),
        customerStats.favoriteItems.map(item => item.count),
        'Order Count',
        '#FF6B6B'
      );

      // Monthly spending trend (mock data for demonstration)
      const monthlyTrend = createLineChartData(
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        [
          { label: 'Monthly Spending', data: [120, 150, 180, 140, 200, 160], color: '#4ECDC4' },
          { label: 'Order Count', data: [4, 5, 6, 4, 7, 5], color: '#FF6B6B' }
        ]
      );

      // Customer level distribution
      const levelData = customerStats.totalSpent > 500 ? 
        [customerStats.totalSpent, 500, 300, 200] : 
        [customerStats.totalSpent, 300, 200, 100];
      const levelChart = createDoughnutChartData(
        ['Current', 'VIP Threshold', 'Regular Threshold', 'New Threshold'],
        levelData,
        ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
      );

      const reportData: ReportData = {
        title: `Customer Report - ${customerStats.customerName}`,
        subtitle: 'Detailed Customer Analysis and Purchase History',
        dateRange: `Last ${dateRange} days`,
        stats: [
          {
            label: 'Total Orders',
            value: customerStats.totalOrders,
            description: 'Orders in selected period'
          },
          {
            label: 'Total Spent',
            value: `$${customerStats.totalSpent.toFixed(2)}`,
            description: 'Total revenue from customer'
          },
          {
            label: 'Average Order Value',
            value: `$${customerStats.avgOrderValue.toFixed(2)}`,
            description: 'Average per order'
          },
          {
            label: 'Customer Level',
            value: customerStats.totalSpent > 500 ? 'VIP' : customerStats.totalSpent > 200 ? 'Regular' : 'New',
            description: 'Based on spending'
          },
          {
            label: 'Favorite Items',
            value: customerStats.favoriteItems.length,
            description: 'Unique items ordered'
          },
          {
            label: 'Customer Since',
            value: format(new Date(customerStats.firstOrderDate), 'MMM yyyy'),
            description: 'First order date'
          }
        ],
        charts: [
          {
            ...favoriteItemsChart,
            title: 'Favorite Items Order Frequency'
          },
          {
            ...monthlyTrend,
            title: '6-Month Spending Trend'
          },
          {
            ...levelChart,
            title: 'Customer Level Analysis'
          }
        ],
        tables: [
          {
            title: 'Recent Order History',
            headers: ['Order ID', 'Date', 'Items', 'Total', 'Status'],
            rows: customerStats.orders.slice(0, 10).map(order => [
              `#${order.id}`,
              format(new Date(order.createdAt), 'MMM dd, yyyy'),
              `${order.items.length} items`,
              `$${order.totalAmount.toFixed(2)}`,
              order.status
            ])
          },
          {
            title: 'Top Favorite Items',
            headers: ['Item Name', 'Order Count', 'Percentage'],
            rows: customerStats.favoriteItems.map(item => [
              item.name,
              `${item.count}x`,
              `${((item.count / customerStats.totalOrders) * 100).toFixed(1)}%`
            ])
          }
        ],
        summary: `${customerStats.customerName} is a ${customerStats.totalSpent > 500 ? 'VIP' : customerStats.totalSpent > 200 ? 'Regular' : 'New'} customer who has placed ${customerStats.totalOrders} orders totaling $${customerStats.totalSpent.toFixed(2)} in the last ${dateRange} days. Their average order value is $${customerStats.avgOrderValue.toFixed(2)} and they have ${customerStats.favoriteItems.length} favorite items. The customer shows ${customerStats.totalSpent > 300 ? 'high' : 'moderate'} engagement and loyalty to the restaurant.`
      };

      await pdfExportService.generatePDF(reportData);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: number;
  }> = ({ title, value, icon, color, trend }) => (
    <div className={`${color} rounded-xl p-6 text-white relative overflow-hidden group hover:shadow-lg transition-all duration-300`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-2 -right-2 w-20 h-20 bg-white rounded-full"></div>
        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-full"></div>
      </div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              trend >= 0 ? 'text-green-100' : 'text-red-100'
            }`}>
              {trend >= 0 ? (
                <TrendingUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDownIcon className="w-4 h-4 mr-1" />
              )}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="text-white/60 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer-wise Report</h1>
            <p className="text-gray-600 mt-1">Analyze customer behavior and purchase patterns</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting || !customerStats}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Search and Customer Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for a customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <FilterIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.name}
              onClick={() => setSelectedCustomer(customer.name)}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedCustomer === customer.name
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  {customer.email && (
                    <p className="text-sm text-gray-500 flex items-center">
                      <MailIcon className="w-3 h-3 mr-1" />
                      {customer.email}
                    </p>
                  )}
                  {customer.phone && (
                    <p className="text-sm text-gray-500 flex items-center">
                      <PhoneIcon className="w-3 h-3 mr-1" />
                      {customer.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No customers found matching your search.</p>
          </div>
        )}
      </div>

      {/* Customer Statistics and Orders */}
      {customerStats && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Orders"
              value={customerStats.totalOrders}
              icon={<ShoppingCartIcon className="w-8 h-8" />}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              title="Total Spent"
              value={`$${customerStats.totalSpent.toFixed(2)}`}
              icon={<CurrencyDollarIcon className="w-8 h-8" />}
              color="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              title="Avg Order Value"
              value={`$${customerStats.avgOrderValue.toFixed(2)}`}
              icon={<TrendingUpIcon className="w-8 h-8" />}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <StatCard
              title="Customer Level"
              value={customerStats.totalSpent > 500 ? 'VIP' : customerStats.totalSpent > 200 ? 'Regular' : 'New'}
              icon={<UsersIcon className="w-8 h-8" />}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
            />
          </div>

          {/* Customer Info and Favorite Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UsersIcon className="w-5 h-5 mr-2 text-blue-500" />
                Customer Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{customerStats.customerName}</span>
                </div>
                {customerStats.customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{customerStats.customerEmail}</span>
                  </div>
                )}
                {customerStats.customerMobile && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{customerStats.customerMobile}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">First Order:</span>
                  <span className="font-medium">{format(new Date(customerStats.firstOrderDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Order:</span>
                  <span className="font-medium">{format(new Date(customerStats.lastOrderDate), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite Items</h3>
              <div className="space-y-3">
                {customerStats.favoriteItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                        {item.count}x
                      </span>
                    </div>
                    <div className="flex items-center">
                      {index === 0 && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full mr-2">👑 Most Loved</span>}
                    </div>
                  </div>
                ))}
                {customerStats.favoriteItems.length === 0 && (
                  <p className="text-gray-500 text-sm">No favorite items yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Order History for {customerStats.customerName}
              </h2>
              <span className="text-sm text-gray-500">
                {customerStats.orders.length} orders found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerStats.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs">
                          {order.items.map((item: any, index: number) => (
                            <div key={index} className="text-xs">
                              {item.quantity}x {item.menuItem.name}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-orange-600 hover:text-orange-900">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerWiseReport;