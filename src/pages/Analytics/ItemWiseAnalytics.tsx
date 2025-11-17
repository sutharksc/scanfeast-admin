'use client'

import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { TrendingUpIcon as TrendingUp, TrendingDownIcon as TrendingDown, DollarSign, PackageIcon as Package, ChartBarIcon as BarChart3, FilterIcon as Filter, DownloadIcon as Download, SearchIcon as Search } from '../../components/ui/Icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { format, subMonths } from 'date-fns'

interface ItemAnalytics {
  id: string
  name: string
  category: string
  totalOrders: number
  totalQuantity: number
  totalRevenue: number
  averagePrice: number
  growthRate: number
  topCustomers: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  monthlyData: Array<{
    month: string
    quantity: number
    revenue: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function ItemWiseAnalyzer() {
  const { orders } = useSelector((state: RootState) => state.orders);
  const { items: menuItems } = useSelector((state: RootState) => state.menuItems);
  const { categories } = useSelector((state: RootState) => state.menuCategories);
  
  const [items, setItems] = useState<ItemAnalytics[]>([])
  const [filteredItems, setFilteredItems] = useState<ItemAnalytics[]>([])
  const [selectedItem, setSelectedItem] = useState<ItemAnalytics | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('revenue')
  const [isLoading, setIsLoading] = useState(true)

  // Generate analytics from real order data
  useEffect(() => {
    setIsLoading(true)
    
    if (!orders || !orders.length) {
      setItems([])
      setFilteredItems([])
      setSelectedItem(null)
      setIsLoading(false)
      return
    }
    
    try {
      const generateItemAnalytics = (): ItemAnalytics[] => {
        const itemMap = new Map<string, any>();
      
      // Process all orders to gather item data
      orders.forEach(order => {
        if (!order.items || !Array.isArray(order.items)) {
          console.warn('Order missing items array:', order)
          return
        }
        
        order.items.forEach(orderItem => {
          const itemId = orderItem.menuItem.id;
          const itemName = orderItem.menuItem.name;
          const categoryId = orderItem.menuItem.categoryId;
          const category = categories.find(cat => cat.id === categoryId)?.name || 'Unknown';
          
          if (!itemMap.has(itemId)) {
            itemMap.set(itemId, {
              id: itemId,
              name: itemName,
              category,
              totalOrders: 0,
              totalQuantity: 0,
              totalRevenue: 0,
              customers: new Map<string, { name: string; quantity: number; revenue: number }>(),
              monthlyData: new Map<string, { quantity: number; revenue: number }>()
            });
          }
          
          const itemData = itemMap.get(itemId);
          itemData.totalOrders += 1;
          itemData.totalQuantity += orderItem.quantity;
          itemData.totalRevenue += orderItem.subtotal;
          
          // Track customer data
          const customerKey = order.customerName;
          if (!itemData.customers.has(customerKey)) {
            itemData.customers.set(customerKey, {
              name: order.customerName,
              quantity: 0,
              revenue: 0
            });
          }
          const customerData = itemData.customers.get(customerKey);
          customerData.quantity += orderItem.quantity;
          customerData.revenue += orderItem.subtotal;
          
          // Track monthly data
          const orderDate = new Date(order.createdAt);
          const monthKey = format(orderDate, 'MMM');
          if (!itemData.monthlyData.has(monthKey)) {
            itemData.monthlyData.set(monthKey, { quantity: 0, revenue: 0 });
          }
          const monthData = itemData.monthlyData.get(monthKey);
          monthData.quantity += orderItem.quantity;
          monthData.revenue += orderItem.subtotal;
        });
      });
      
      // Convert to analytics format
      const analytics: ItemAnalytics[] = Array.from(itemMap.values()).map(itemData => {
        // Get top customers
        const topCustomers = (Array.from(itemData.customers.values()) as Array<{ name: string; quantity: number; revenue: number }>)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3);
        
        // Generate monthly data for last 6 months
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const month = format(subMonths(new Date(), i), 'MMM');
          const data = itemData.monthlyData.get(month) || { quantity: 0, revenue: 0 };
          monthlyData.push({ month, ...data });
        }
        
        // Calculate growth rate (compare last month with previous month)
        const currentMonth = monthlyData[monthlyData.length - 1];
        const previousMonth = monthlyData[monthlyData.length - 2];
        const growthRate = previousMonth.revenue > 0 
          ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
          : 0;
        
        return {
          id: itemData.id,
          name: itemData.name,
          category: itemData.category,
          totalOrders: itemData.totalOrders,
          totalQuantity: itemData.totalQuantity,
          totalRevenue: itemData.totalRevenue,
          averagePrice: itemData.totalQuantity > 0 ? itemData.totalRevenue / itemData.totalQuantity : 0,
          growthRate,
          topCustomers,
          monthlyData
        };
      });
        
        return analytics.sort((a, b) => b.totalRevenue - a.totalRevenue);
      };

      const analyticsData = generateItemAnalytics();
    setItems(analyticsData);
    setFilteredItems(analyticsData);
    if (analyticsData.length > 0 && !selectedItem) {
      setSelectedItem(analyticsData[0]);
    }
    } catch (error) {
      console.error('Error generating item analytics:', error)
      setItems([])
      setFilteredItems([])
      setSelectedItem(null)
    } finally {
      setIsLoading(false)
    }
  }, [orders, menuItems, categories]);

  // Generate category data from real analytics
  const categoryData = items.reduce((acc: any[], item) => {
    const existingCategory = acc.find(cat => cat.name === item.category);
    if (existingCategory) {
      existingCategory.value += item.totalOrders;
      existingCategory.revenue += item.totalRevenue;
    } else {
      acc.push({
        name: item.category,
        value: item.totalOrders,
        revenue: item.totalRevenue
      });
    }
    return acc;
  }, []);

  useEffect(() => {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.totalRevenue - a.totalRevenue
        case 'orders':
          return b.totalOrders - a.totalOrders
        case 'growth':
          return b.growthRate - a.growthRate
        default:
          return 0
      }
    })

    setFilteredItems(filtered)
  }, [items, searchTerm, categoryFilter, sortBy])

  const totalRevenue = items.reduce((sum, item) => sum + item.totalRevenue, 0)
  const totalOrders = items.reduce((sum, item) => sum + item.totalOrders, 0)
  const averageGrowth = items.length > 0 ? items.reduce((sum, item) => sum + item.growthRate, 0) / items.length : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Item Wise Analytics</h1>
            <p className="text-gray-600 mt-1">Detailed analysis of item performance and trends</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <BarChart3 className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-500">From {totalOrders} orders</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
              <Package className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalOrders.toLocaleString()}</div>
              <p className="text-xs text-gray-500">Across {items.length} items</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg Growth Rate</h3>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{averageGrowth.toFixed(1)}%</div>
              <p className="text-xs text-gray-500">Month over month</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-600">Top Category</h3>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {categoryData.length > 0 ? categoryData[0].name : 'N/A'}
              </div>
              <p className="text-xs text-gray-500">
                {categoryData.length > 0 ? `${categoryData[0].value} orders` : 'No data'}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Revenue by Category</h2>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Category Performance</h2>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h2>
          </div>
          <div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Categories</option>
                  {Array.from(new Set(items.map(item => item.category))).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="revenue">Revenue</option>
                  <option value="orders">Orders</option>
                  <option value="growth">Growth Rate</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Item Performance</h2>
            <p className="text-sm text-gray-600">Click on an item to view detailed analytics</p>
          </div>
          <div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Item Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Orders</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Growth Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Trend</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{item.category}</span>
                    </td>
                    <td className="py-3 px-4">{item.totalOrders}</td>
                    <td className="py-3 px-4">${item.totalRevenue.toLocaleString()}</td>
                    <td className="py-3 px-4">${item.averagePrice.toFixed(2)}</td>
                    <td className="py-3 px-4">{item.growthRate.toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      {item.growthRate > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No items found matching your criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Item Details */}
        {selectedItem && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{selectedItem.name} - Sales Trend</h2>
                <p className="text-sm text-gray-600">Monthly performance over last 6 months</p>
              </div>
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedItem.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="quantity" stroke="#8884d8" strokeWidth={2} name="Quantity" />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Top Customers</h2>
                <p className="text-sm text-gray-600">Customers who order this item most</p>
              </div>
              <div className="space-y-3">
                {selectedItem.topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.quantity} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${customer.revenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Revenue</p>
                    </div>
                  </div>
                ))}
                {selectedItem.topCustomers.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No customer data available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
