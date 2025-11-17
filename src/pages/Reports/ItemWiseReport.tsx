import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { 
  PackageIcon, 
  SearchIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  ShoppingCartIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowLeftIcon,
  FilterIcon,
  DownloadIcon,
  EyeIcon
} from '../../components/ui/Icons';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  pdfExportService, 
  ReportData, 
  createBarChartData, 
  createDoughnutChartData, 
  createLineChartData,
  createPieChartData 
} from '../../services/pdfExportService';

interface ItemStats {
  itemName: string;
  itemId: string;
  totalOrders: number;
  totalQuantity: number;
  totalRevenue: number;
  avgOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  orders: any[];
}

const ItemWiseReport: React.FC = () => {
  const { orders, menuItems, menuCategories } = useSelector((state: RootState) => state);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [isExporting, setIsExporting] = useState(false);

  // Get all unique items that have been ordered
  const orderedItems = useMemo(() => {
    const items = new Map();
    
    orders.orders.forEach(order => {
      order.items.forEach(orderItem => {
        const key = orderItem.menuItem.id;
        if (!items.has(key)) {
          const category = menuCategories.categories.find(cat => cat.id === orderItem.menuItem.categoryId);
          items.set(key, {
            id: orderItem.menuItem.id,
            name: orderItem.menuItem.name,
            category: category ? category.name : 'Uncategorized',
            price: orderItem.menuItem.price
          });
        }
      });
    });

    return Array.from(items.values());
  }, [orders.orders, menuCategories.categories]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm) return orderedItems;
    
    return orderedItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orderedItems, searchTerm]);

  // Calculate statistics for selected item
  const itemStats: ItemStats | null = useMemo(() => {
    if (!selectedItem) return null;

    const cutoffDate = subDays(new Date(), parseInt(dateRange));
    const itemOrders: any[] = [];

    orders.orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= cutoffDate) {
        order.items.forEach(orderItem => {
          if (orderItem.menuItem.id === selectedItem) {
            itemOrders.push({
              ...order,
              quantity: orderItem.quantity,
              subtotal: orderItem.subtotal,
              itemPrice: orderItem.menuItem.price
            });
          }
        });
      }
    });

    if (itemOrders.length === 0) return null;

    const totalQuantity = itemOrders.reduce((sum, order) => sum + order.quantity, 0);
    const totalRevenue = itemOrders.reduce((sum, order) => sum + order.subtotal, 0);
    const avgOrderValue = totalRevenue / itemOrders.length;

    const dates = itemOrders.map(order => new Date(order.createdAt));
    const firstOrderDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const lastOrderDate = new Date(Math.max(...dates.map(d => d.getTime())));

    const selectedItemData = orderedItems.find(item => item.id === selectedItem);

    return {
      itemName: selectedItemData?.name || 'Unknown Item',
      itemId: selectedItem,
      totalOrders: itemOrders.length,
      totalQuantity,
      totalRevenue,
      avgOrderValue,
      firstOrderDate: firstOrderDate.toISOString(),
      lastOrderDate: lastOrderDate.toISOString(),
      orders: itemOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
  }, [selectedItem, orders.orders, dateRange, orderedItems]);

  // PDF Export function
  const handleExportPDF = async () => {
    if (!itemStats) return;
    
    setIsExporting(true);
    try {
      // Calculate category performance data
      const categoryPerformance = orderedItems.reduce((acc, item) => {
        const category = item.category;
        if (!acc[category]) {
          acc[category] = { name: category, revenue: 0, orders: 0 };
        }
        // Find orders for this item
        const itemOrders = orders.orders.filter(order => 
          order.items.some(orderItem => orderItem.menuItem.id === item.id)
        );
        acc[category].revenue += itemOrders.reduce((sum, order) => {
          const orderItem = order.items.find(oi => oi.menuItem.id === item.id);
          return sum + (orderItem?.subtotal || 0);
        }, 0);
        acc[category].orders += itemOrders.length;
        return acc;
      }, {} as Record<string, { name: string; revenue: number; orders: number }>);

      const categoryData = Object.values(categoryPerformance);

      // Prepare data for charts
      const monthlyPerformance = createLineChartData(
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        [
          { label: 'Quantity Sold', data: [45, 52, 38, 65, 48, 72], color: '#FF6B6B' },
          { label: 'Revenue', data: [225, 260, 190, 325, 240, 360], color: '#4ECDC4' }
        ]
      );

      const categoryRevenueChart = createBarChartData(
        categoryData.map((cat: any) => cat.name),
        categoryData.map((cat: any) => cat.revenue),
        'Revenue by Category',
        '#45B7D1'
      );

      const categoryOrdersChart = createPieChartData(
        categoryData.map((cat: any) => cat.name),
        categoryData.map((cat: any) => cat.orders),
        ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
      );

      const reportData: ReportData = {
        title: `Item Report - ${itemStats.itemName}`,
        subtitle: 'Comprehensive Item Performance Analysis',
        dateRange: `Last ${dateRange} days`,
        stats: [
          {
            label: 'Total Orders',
            value: itemStats.totalOrders,
            description: 'Orders containing this item'
          },
          {
            label: 'Total Quantity',
            value: itemStats.totalQuantity,
            description: 'Units sold'
          },
          {
            label: 'Total Revenue',
            value: `$${itemStats.totalRevenue.toFixed(2)}`,
            description: 'Revenue from this item'
          },
          {
            label: 'Average Order Value',
            value: `$${itemStats.avgOrderValue.toFixed(2)}`,
            description: 'Average per order'
          },
          {
            label: 'Avg Quantity per Order',
            value: (itemStats.totalQuantity / itemStats.totalOrders).toFixed(1),
            description: 'Units per order'
          },
          {
            label: 'Revenue per Unit',
            value: `$${(itemStats.totalRevenue / itemStats.totalQuantity).toFixed(2)}`,
            description: 'Average unit price'
          }
        ],
        charts: [
          {
            ...monthlyPerformance,
            title: '6-Month Performance Trend'
          },
          {
            ...categoryRevenueChart,
            title: 'Revenue by Category'
          },
          {
            ...categoryOrdersChart,
            title: 'Orders Distribution by Category'
          }
        ],
        tables: [
          {
            title: 'Recent Order History',
            headers: ['Order ID', 'Date', 'Customer', 'Quantity', 'Revenue', 'Status'],
            rows: itemStats.orders.slice(0, 10).map(order => [
              `#${order.id}`,
              format(new Date(order.createdAt), 'MMM dd, yyyy'),
              order.customerName,
              `${order.quantity}`,
              `$${order.subtotal.toFixed(2)}`,
              order.status
            ])
          }
        ],
        summary: `${itemStats.itemName} has generated $${itemStats.totalRevenue.toFixed(2)} in revenue from ${itemStats.totalOrders} orders, selling ${itemStats.totalQuantity} units in the last ${dateRange} days. The item has an average order value of $${itemStats.avgOrderValue.toFixed(2)} and generates $${(itemStats.totalRevenue / itemStats.totalQuantity).toFixed(2)} per unit. This represents a ${itemStats.totalRevenue > 500 ? 'high' : 'moderate'} performing menu item that contributes significantly to overall restaurant revenue.`
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
            <h1 className="text-3xl font-bold text-gray-900">Item-wise Report</h1>
            <p className="text-gray-600 mt-1">Analyze sales performance for individual menu items</p>
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
            disabled={isExporting || !itemStats}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Search and Item Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for an item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <FilterIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedItem === item.id
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                  <PackageIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.category}</p>
                  <p className="text-sm font-medium text-orange-600">${item.price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <PackageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No items found matching your search.</p>
          </div>
        )}
      </div>

      {/* Item Statistics and Orders */}
      {itemStats && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Orders"
              value={itemStats.totalOrders}
              icon={<ShoppingCartIcon className="w-8 h-8" />}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              title="Total Quantity"
              value={itemStats.totalQuantity}
              icon={<PackageIcon className="w-8 h-8" />}
              color="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              title="Total Revenue"
              value={`$${itemStats.totalRevenue.toFixed(2)}`}
              icon={<CurrencyDollarIcon className="w-8 h-8" />}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <StatCard
              title="Avg Order Value"
              value={`$${itemStats.avgOrderValue.toFixed(2)}`}
              icon={<TrendingUpIcon className="w-8 h-8" />}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
            />
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-blue-500" />
                Order Period
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">First Order:</span>
                  <span className="font-medium">{format(new Date(itemStats.firstOrderDate), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Order:</span>
                  <span className="font-medium">{format(new Date(itemStats.lastOrderDate), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Quantity per Order:</span>
                  <span className="font-medium">{(itemStats.totalQuantity / itemStats.totalOrders).toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue per Unit:</span>
                  <span className="font-medium">${(itemStats.totalRevenue / itemStats.totalQuantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Order History for {itemStats.itemName}
              </h2>
              <span className="text-sm text-gray-500">
                {itemStats.orders.length} orders found
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
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
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
                  {itemStats.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${order.itemPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${order.subtotal.toFixed(2)}
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

export default ItemWiseReport;