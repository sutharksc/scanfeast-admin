import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ORDER_STATUS } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import { 
  HomeIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  EyeIcon,
  TableIcon,
  SmartphoneIcon,
  ZapIcon,
  ChartBarIcon,
  DownloadIcon
} from '../components/ui/Icons';
import { 
  pdfExportService, 
  ReportData, 
  createBarChartData, 
  createDoughnutChartData, 
  createLineChartData 
} from '../services/pdfExportService';

const Dashboard: React.FC = () => {
  const { tables, menuItems, orders } = useSelector((state: RootState) => state);
  const categories = menuItems.items.reduce((acc, item) => {
    if (!acc.find(cat => cat.id === item.categoryId)) {
      const category = {
        id: item.categoryId,
        name: `Category ${item.categoryId}`,
        description: '',
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      acc.push(category);
    }
    return acc;
  }, [] as any[]);
  const [animatedStats, setAnimatedStats] = useState({
    totalTables: 0,
    totalMenuItems: 0,
    todayOrders: 0,
    weeklySales: 0,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Calculate today's orders
  const today = new Date();
  const todayOrders = orders.orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate.toDateString() === today.toDateString();
  });

  // Calculate weekly sales
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const weeklyOrders = orders.orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= weekStart && orderDate <= weekEnd;
  });
  const weeklySales = weeklyOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Calculate previous week for comparison
  const prevWeekStart = subDays(weekStart, 7);
  const prevWeekEnd = subDays(weekEnd, 7);
  const prevWeekOrders = orders.orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= prevWeekStart && orderDate <= prevWeekEnd;
  });
  const prevWeekSales = prevWeekOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Prepare chart data
  const last7Days = eachDayOfInterval({
    start: subDays(today, 6),
    end: today,
  });

  const dailySalesData = last7Days.map(day => {
    const dayOrders = orders.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.toDateString() === day.toDateString();
    });
    
    return {
      date: format(day, 'MMM dd'),
      sales: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      orders: dayOrders.length,
    };
  });

  // Category breakdown for pie chart
  const categoryBreakdown = menuItems.items.reduce((acc, item) => {
    const category = categories.find(cat => cat.id === item.categoryId);
    if (category) {
      const categoryOrders = orders.orders.filter(order =>
        order.items.some(orderItem => orderItem.menuItem.categoryId === category.id)
      );
      const categorySales = categoryOrders.reduce((sum, order) => {
        const categoryItems = order.items.filter(orderItem => orderItem.menuItem.categoryId === category.id);
        return sum + categoryItems.reduce((itemSum, item) => itemSum + item.subtotal, 0);
      }, 0);
      
      acc[category.name] = (acc[category.name] || 0) + categorySales;
    }
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryBreakdown).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#fb923c', '#f97316', '#ea580c', '#dc2626', '#b91c1c'];

  // Recent orders
  const recentOrders = orders.orders.slice(0, 5);

  // Calculate trends
  const salesTrend = prevWeekSales > 0 ? ((weeklySales - prevWeekSales) / prevWeekSales) * 100 : 0;
  const ordersTrend = prevWeekOrders.length > 0 ? ((todayOrders.length - prevWeekOrders.length) / prevWeekOrders.length) * 100 : 0;

  // Animate stats on mount
  useEffect(() => {
    const targetStats = {
      totalTables: tables.tables.length,
      totalMenuItems: menuItems.items.length,
      todayOrders: todayOrders.length,
      weeklySales: weeklySales,
    };

    const duration = 1000;
    const steps = 20;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedStats({
        totalTables: Math.floor(targetStats.totalTables * progress),
        totalMenuItems: Math.floor(targetStats.totalMenuItems * progress),
        todayOrders: Math.floor(targetStats.todayOrders * progress),
        weeklySales: Math.floor(targetStats.weeklySales * progress),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats(targetStats);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [tables.tables.length, menuItems.items.length, todayOrders.length, weeklySales]);

  // PDF Export function
  const handleExportDashboardPDF = async () => {
    setIsExporting(true);
    try {
      // Prepare data for charts
      const dailySalesChart = createBarChartData(
        dailySalesData.map(d => d.date),
        dailySalesData.map(d => d.sales),
        'Daily Sales',
        '#FF6B6B'
      );

      const dailyOrdersChart = createLineChartData(
        dailySalesData.map(d => d.date),
        [
          { label: 'Daily Orders', data: dailySalesData.map(d => d.orders), color: '#4ECDC4' }
        ]
      );

      const categoryChart = createDoughnutChartData(
        pieData.map(d => d.name as string),
        pieData.map(d => d.value as number),
        COLORS
      );

      const reportData: ReportData = {
        title: 'Restaurant Dashboard Report',
        subtitle: 'Comprehensive Business Performance Overview',
        dateRange: `Last 7 days (${format(subDays(today, 6), 'MMM dd')} - ${format(today, 'MMM dd')})`,
        stats: [
          {
            label: 'Total Tables',
            value: tables.tables.length,
            description: 'Available in restaurant'
          },
          {
            label: 'Menu Items',
            value: menuItems.items.length,
            description: 'Items in menu'
          },
          {
            label: "Today's Orders",
            value: todayOrders.length,
            description: 'Orders placed today'
          },
          {
            label: 'Weekly Sales',
            value: `$${weeklySales.toFixed(2)}`,
            description: 'Total revenue this week'
          },
          {
            label: 'Sales Trend',
            value: `${salesTrend >= 0 ? '+' : ''}${salesTrend.toFixed(1)}%`,
            description: 'vs previous week'
          },
          {
            label: 'Orders Trend',
            value: `${ordersTrend >= 0 ? '+' : ''}${ordersTrend.toFixed(1)}%`,
            description: 'vs previous week'
          }
        ],
        charts: [
          {
            ...dailySalesChart,
            title: 'Daily Sales Trend (Last 7 Days)'
          },
          {
            ...dailyOrdersChart,
            title: 'Daily Orders Trend (Last 7 Days)'
          },
          {
            ...categoryChart,
            title: 'Sales by Category'
          }
        ],
        tables: [
          {
            title: 'Recent Orders',
            headers: ['Order ID', 'Customer', 'Date', 'Total', 'Status'],
            rows: recentOrders.map(order => [
              `#${order.id}`,
              order.customerName,
              format(new Date(order.createdAt), 'MMM dd, yyyy'),
              `$${order.totalAmount.toFixed(2)}`,
              order.status
            ])
          },
          {
            title: 'Category Performance',
            headers: ['Category', 'Revenue', 'Percentage'],
            rows: pieData.map(item => [
              item.name as string,
              `$${(item.value as number).toFixed(2)}`,
              `${(((item.value as number) / (Object.values(categoryBreakdown).reduce((a: number, b: any) => a + (b as number), 0) as number)) * 100).toFixed(1)}%`
            ])
          }
        ],
        summary: `The restaurant has shown ${salesTrend >= 0 ? 'positive' : 'negative'} sales performance this week with $${weeklySales.toFixed(2)} in total revenue, representing a ${Math.abs(salesTrend).toFixed(1)}% ${salesTrend >= 0 ? 'increase' : 'decrease'} compared to the previous week. Today's activity includes ${todayOrders.length} orders. The top performing category is ${pieData.length > 0 ? pieData.reduce((max, item) => item.value > max.value ? item : max).name : 'N/A'}, contributing significantly to overall revenue.`
      };

      await pdfExportService.generatePDF(reportData);
    } catch (error) {
      console.error('Error exporting dashboard PDF:', error);
      alert('Failed to export dashboard PDF. Please try again.');
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
    trendLabel?: string;
  }> = ({ title, value, icon, color, trend, trendLabel }) => (
    <div className={`${color} rounded-xl p-6 text-white relative overflow-hidden group hover:shadow-lg transition-all duration-300`}>
      {/* Background Pattern */}
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
              <span>{Math.abs(trend).toFixed(1)}% {trendLabel}</span>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening at your restaurant today.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <button
            onClick={handleExportDashboardPDF}
            disabled={isExporting}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <div className="flex items-center text-sm text-gray-500">
            <ClockIcon className="w-4 h-4 mr-1" />
            Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tables"
          value={animatedStats.totalTables}
          icon={<div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">🪑</div>}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Menu Items"
          value={animatedStats.totalMenuItems}
          icon={<div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">🍽️</div>}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="Today's Orders"
          value={animatedStats.todayOrders}
          icon={<div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">📋</div>}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          trend={ordersTrend}
          trendLabel="vs last week"
        />
        <StatCard
          title="Weekly Sales"
          value={`$${animatedStats.weeklySales.toFixed(2)}`}
          icon={<div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">💰</div>}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          trend={salesTrend}
          trendLabel="vs last week"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center mr-3">
                <ZapIcon className="w-5 h-5 text-white" />
              </div>
              Quick Actions
            </h2>
            <p className="text-gray-600 mt-2 ml-11">Get started with your daily tasks</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Link
            to="/create-order"
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            <div className="relative flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-200 hover:border-orange-300 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-4 group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300">
                <PlusIcon className="w-8 h-8 text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800 group-hover:text-orange-700 transition-colors">Create Order</span>
              <span className="text-xs text-gray-500 mt-1">Start new order</span>
            </div>
          </Link>

          <Link
            to="/tables"
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            <div className="relative flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4 group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                <TableIcon className="w-8 h-8 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">View Tables</span>
              <span className="text-xs text-gray-500 mt-1">Manage tables</span>
            </div>
          </Link>

          <Link
            to="/qr-codes"
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            <div className="relative flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-200 hover:border-green-300 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-4 group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300">
                <SmartphoneIcon className="w-8 h-8 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition-colors">Generate QR</span>
              <span className="text-xs text-gray-500 mt-1">Create QR codes</span>
            </div>
          </Link>

          <Link
            to="/orders"
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            <div className="relative flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-200 hover:border-purple-300 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4 group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300">
                <EyeIcon className="w-8 h-8 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">All Orders</span>
              <span className="text-xs text-gray-500 mt-1">View history</span>
            </div>
          </Link>
        </div>

        {/* Additional Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <Link
            to="/menu-items"
            className="group flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center mr-3">
              <ShoppingCartIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-800 group-hover:text-orange-700">Menu Items</span>
              <p className="text-xs text-gray-500">Manage menu</p>
            </div>
          </Link>

          <Link
            to="/reports"
            className="group flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mr-3">
              <ChartBarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">Reports</span>
              <p className="text-xs text-gray-500">View analytics</p>
            </div>
          </Link>

          <Link
            to="/users"
            className="group flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-300"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mr-3">
              <UserGroupIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-800 group-hover:text-green-700">Users</span>
              <p className="text-xs text-gray-500">Manage team</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CurrencyDollarIcon className="w-5 h-5 mr-2 text-green-500" />
            Daily Sales (Last 7 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailySalesData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb923c" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                formatter={(value) => [`$${value}`, 'Sales']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#fb923c" 
                fillOpacity={1} 
                fill="url(#colorSales)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ShoppingCartIcon className="w-5 h-5 mr-2 text-orange-500" />
            Sales by Category
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`$${value}`, 'Sales']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2 text-blue-500" />
            Recent Orders
          </h2>
          <Link
            to="/orders"
            className="text-sm text-orange-600 hover:text-orange-500 font-medium flex items-center"
          >
            View All
            <EyeIcon className="w-4 h-4 ml-1" />
          </Link>
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
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === ORDER_STATUS.PENDING ? 'bg-yellow-100 text-yellow-800' :
                      order.status === ORDER_STATUS.ACCEPTED ? 'bg-blue-100 text-blue-800' :
                      order.status === ORDER_STATUS.PREPARING ? 'bg-orange-100 text-orange-800' :
                      order.status === ORDER_STATUS.READY ? 'bg-green-100 text-green-800' :
                      order.status === ORDER_STATUS.DELIVERED ? 'bg-emerald-100 text-emerald-800' :
                      order.status === ORDER_STATUS.CANCELLED ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(order.createdAt), 'MMM dd, yyyy')}
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

export default Dashboard;