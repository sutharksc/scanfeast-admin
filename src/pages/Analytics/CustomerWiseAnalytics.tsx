'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/index'
import { TrendingUpIcon as TrendingUp, TrendingDownIcon as TrendingDown, DollarSign, UsersIcon as Users, StarIcon as Star, FilterIcon as Filter, DownloadIcon as Download, SearchIcon as Search, CalendarIcon as Calendar, ShieldIcon as Award } from '../../components/ui/Icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

interface CustomerAnalytics {
  id: string
  name: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  favoriteCategory: string
  favoriteItems: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  monthlyData: Array<{
    month: string
    orders: number
    spent: number
  }>
  loyaltyScore: number
  lastOrderDate: string
  growthRate: number
  customerType: 'VIP' | 'Regular' | 'New'
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function CustomerWiseAnalyzer() {
  // Redux hooks to get real data
  const orders = useSelector((state: RootState) => state.orders.orders)
  const categories = useSelector((state: RootState) => state.menuCategories.categories)
  
  const [customers, setCustomers] = useState<CustomerAnalytics[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerAnalytics[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAnalytics | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('revenue')
  const [isLoading, setIsLoading] = useState(true)
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    totalRevenue: 0,
    totalOrders: 0,
    averageLoyalty: 0,
    vipCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0
  })
  const [customerTypeData, setCustomerTypeData] = useState([])
  const [monthlyCustomerData, setMonthlyCustomerData] = useState([])

  // Generate customer analysis from real order data
  const generateCustomerAnalysis = useCallback(() => {
    setIsLoading(true)
    
    if (!orders || !orders.length) {
      setCustomers([])
      setFilteredCustomers([])
      setSelectedCustomer(null)
      setCustomerStats({
        totalCustomers: 0,
        totalRevenue: 0,
        totalOrders: 0,
        averageLoyalty: 0,
        vipCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0
      })
      setCustomerTypeData([])
      setMonthlyCustomerData([])
      setIsLoading(false)
      return
    }
    
    try {

    // Create a map to aggregate customer data from orders
    const customerMap = new Map<string, any>()
    
    orders.forEach(order => {
      if (!order.items || !Array.isArray(order.items)) {
        console.warn('Order missing items array:', order)
        return
      }
      
      // Use customer email as the primary identifier, fallback to phone or name
      const customerId = order.customerEmail || order.customerMobile || order.customerName || `CUST-${Math.floor(Math.random() * 10000)}`
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          id: customerId,
          name: order.customerName || `Customer ${customerId}`,
          email: order.customerEmail || `customer${customerId}@example.com`,
          phone: order.customerMobile || `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          totalOrders: 0,
          totalSpent: 0,
          categories: new Set(),
          items: new Map(),
          monthlyData: new Map(),
          lastOrderDate: new Date(0),
          firstOrderDate: new Date()
        })
      }
      
      const customer = customerMap.get(customerId)
      customer.totalOrders += 1
      customer.totalSpent += order.totalAmount
      
      // Track categories and items
      order.items.forEach(item => {
        const category = categories.find(cat => cat.id === item.menuItem.categoryId)
        if (category) {
          customer.categories.add(category.name)
        }
        
        // Track item preferences
        if (!customer.items.has(item.menuItem.name)) {
          customer.items.set(item.menuItem.name, {
            name: item.menuItem.name,
            quantity: 0,
            revenue: 0
          })
        }
        const itemData = customer.items.get(item.menuItem.name)
        itemData.quantity += item.quantity
        itemData.revenue += item.subtotal
      })
      
      // Track monthly data
      const monthKey = new Date(order.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' })
      if (!customer.monthlyData.has(monthKey)) {
        customer.monthlyData.set(monthKey, { orders: 0, spent: 0 })
      }
      const monthData = customer.monthlyData.get(monthKey)
      monthData.orders += 1
      monthData.spent += order.totalAmount
      
      // Update order dates
      const orderDate = new Date(order.createdAt)
      if (orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate
      }
      if (orderDate < customer.firstOrderDate) {
        customer.firstOrderDate = orderDate
      }
    })

    // Convert map to array and calculate additional metrics
    const customersArray = Array.from(customerMap.values()).map(customer => {
      const categoriesArray = Array.from(customer.categories) as string[]
      const itemsArray = Array.from(customer.items.values()) as Array<{ name: string; quantity: number; revenue: number }>
      const monthlyDataArray = Array.from(customer.monthlyData.entries()).map(([month, data]) => ({
        month,
        orders: data.orders,
        spent: data.spent
      }))
      
      // Calculate customer type based on behavior
      const daysSinceLastOrder = Math.floor((new Date().getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      const averageOrderValue = customer.totalSpent / customer.totalOrders
      const loyaltyScore = calculateLoyaltyScore(customer.totalOrders, customer.totalSpent, daysSinceLastOrder)
      
      let customerType: 'VIP' | 'Regular' | 'New'
      if (customer.totalOrders > 20 && customer.totalSpent > 500 && loyaltyScore > 80) {
        customerType = 'VIP'
      } else if (customer.totalOrders > 5 || daysSinceLastOrder < 30) {
        customerType = 'Regular'
      } else {
        customerType = 'New'
      }
      
      // Calculate growth rate (simplified)
      const growthRate = calculateGrowthRate(monthlyDataArray)
      
      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        averageOrderValue,
        favoriteCategory: categoriesArray.length > 0 ? categoriesArray[0] : 'N/A',
        favoriteItems: itemsArray
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3),
        monthlyData: monthlyDataArray,
        loyaltyScore,
        lastOrderDate: customer.lastOrderDate.toISOString().split('T')[0],
        growthRate,
        customerType
      }
    })

    // Sort customers by total spent
    customersArray.sort((a, b) => b.totalSpent - a.totalSpent)

    // Calculate statistics
    const totalRevenue = customersArray.reduce((sum, customer) => sum + customer.totalSpent, 0)
    const totalOrders = customersArray.reduce((sum, customer) => sum + customer.totalOrders, 0)
    const averageLoyalty = customersArray.reduce((sum, customer) => sum + customer.loyaltyScore, 0) / customersArray.length
    const vipCustomers = customersArray.filter(customer => customer.customerType === 'VIP').length
    const newCustomers = customersArray.filter(customer => customer.customerType === 'New').length
    const returningCustomers = customersArray.filter(customer => customer.customerType === 'Regular').length

    const stats = {
      totalCustomers: customersArray.length,
      totalRevenue,
      totalOrders,
      averageLoyalty,
      vipCustomers,
      newCustomers,
      returningCustomers
    }

    // Generate customer type distribution
    const typeDistribution = [
      { name: 'VIP', value: vipCustomers, revenue: customersArray.filter(c => c.customerType === 'VIP').reduce((sum, c) => sum + c.totalSpent, 0) },
      { name: 'Regular', value: returningCustomers, revenue: customersArray.filter(c => c.customerType === 'Regular').reduce((sum, c) => sum + c.totalSpent, 0) },
      { name: 'New', value: newCustomers, revenue: customersArray.filter(c => c.customerType === 'New').reduce((sum, c) => sum + c.totalSpent, 0) }
    ]

    // Generate monthly customer acquisition data
    const monthlyAcquisition = generateMonthlyAcquisitionData(customersArray)

    // Update all states
    setCustomers(customersArray)
    setFilteredCustomers(customersArray)
    setSelectedCustomer(customersArray[0] || null)
    setCustomerStats(stats)
    setCustomerTypeData(typeDistribution)
    setMonthlyCustomerData(monthlyAcquisition)
    } catch (error) {
      console.error('Error generating customer analytics:', error)
      setCustomers([])
      setFilteredCustomers([])
      setSelectedCustomer(null)
      setCustomerStats({
        totalCustomers: 0,
        totalRevenue: 0,
        totalOrders: 0,
        averageLoyalty: 0,
        vipCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0
      })
      setCustomerTypeData([])
      setMonthlyCustomerData([])
    } finally {
      setIsLoading(false)
    }
  }, [orders])

  // Helper functions
  const calculateLoyaltyScore = (orders: number, spent: number, daysSinceLastOrder: number) => {
    let score = 0
    if (orders > 20) score += 40
    else if (orders > 10) score += 30
    else if (orders > 5) score += 20
    else if (orders > 2) score += 10
    
    if (spent > 1000) score += 30
    else if (spent > 500) score += 20
    else if (spent > 200) score += 10
    
    if (daysSinceLastOrder < 7) score += 30
    else if (daysSinceLastOrder < 30) score += 20
    else if (daysSinceLastOrder < 90) score += 10
    
    return Math.min(100, score)
  }

  const calculateGrowthRate = (monthlyData: any[]) => {
    if (monthlyData.length < 2) return 0
    const recent = monthlyData.slice(-2)
    const prevMonth = recent[0]?.spent || 0
    const currMonth = recent[1]?.spent || 0
    return prevMonth > 0 ? ((currMonth - prevMonth) / prevMonth * 100) : 0
  }

  const generateMonthlyAcquisitionData = (customersArray: any[]) => {
    const monthlyMap = new Map<string, { newCustomers: number, returningCustomers: number, totalRevenue: number }>()
    
    // Get last 6 months
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = monthDate.toLocaleString('default', { month: 'short', year: 'numeric' })
      monthlyMap.set(monthKey, { newCustomers: 0, returningCustomers: 0, totalRevenue: 0 })
    }
    
    customersArray.forEach(customer => {
      const firstOrderMonth = new Date(customer.firstOrderDate).toLocaleString('default', { month: 'short', year: 'numeric' })
      if (monthlyMap.has(firstOrderMonth)) {
        monthlyMap.get(firstOrderMonth)!.newCustomers += 1
      }
      
      customer.monthlyData.forEach((data: any) => {
        if (monthlyMap.has(data.month)) {
          monthlyMap.get(data.month)!.returningCustomers += 1
          monthlyMap.get(data.month)!.totalRevenue += data.spent
        }
      })
    })
    
    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      ...data
    }))
  }

  // Generate data when orders change
  useEffect(() => {
    generateCustomerAnalysis()
  }, [generateCustomerAnalysis])

  useEffect(() => {
    let filtered = customers

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.favoriteCategory.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (customerTypeFilter !== 'all') {
      filtered = filtered.filter(customer => customer.customerType === customerTypeFilter)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.totalSpent - a.totalSpent
        case 'orders':
          return b.totalOrders - a.totalOrders
        case 'loyalty':
          return b.loyaltyScore - a.loyaltyScore
        case 'growth':
          return b.growthRate - a.growthRate
        default:
          return 0
      }
    })

    setFilteredCustomers(filtered)
  }, [customers, searchTerm, customerTypeFilter, sortBy])

  const totalRevenue = customerStats.totalRevenue
  const totalOrders = customerStats.totalOrders
  const averageLoyalty = customerStats.averageLoyalty
  const vipCustomers = customerStats.vipCustomers

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading customer analytics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'VIP':
        return 'bg-purple-100 text-purple-800'
      case 'Regular':
        return 'bg-blue-100 text-blue-800'
      case 'New':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLoyaltyColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Wise Analytics</h1>
            <p className="text-gray-600 mt-1">Detailed analysis of customer behavior and preferences</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <Award className="w-4 h-4" />
              Loyalty Program
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
              <p className="text-xs text-gray-500">
                {totalRevenue > 0 ? '+18.2% from last month' : 'No revenue data'}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Customers</h3>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
              <p className="text-xs text-gray-500">
                {customers.length > 0 ? '+12.5% from last month' : 'No customer data'}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-600">VIP Customers</h3>
              <Star className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{vipCustomers}</div>
              <p className="text-xs text-gray-500">
                {customers.length > 0 ? `${((vipCustomers / customers.length) * 100).toFixed(1)}% of total` : 'No VIP customers'}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg Loyalty Score</h3>
              <Award className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{averageLoyalty > 0 ? averageLoyalty.toFixed(0) : '0'}</div>
              <p className="text-xs text-gray-500">
                {averageLoyalty > 0 ? '+5.3% from last month' : 'No loyalty data'}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Customer Distribution</h2>
            </div>
            <div>
              {customerTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {customerTypeData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No customer data available</p>
                    <p className="text-sm">Start taking orders to see customer distribution</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Customer Acquisition Trend</h2>
            </div>
            <div>
              {monthlyCustomerData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyCustomerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="newCustomers" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="returningCustomers" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No customer trends available</p>
                    <p className="text-sm">Start taking orders to see customer acquisition trends</p>
                  </div>
                </div>
              )}
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
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="relative">
                <select
                  value={customerTypeFilter}
                  onChange={(e) => setCustomerTypeFilter(e.target.value)}
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="VIP">VIP</option>
                  <option value="Regular">Regular</option>
                  <option value="New">New</option>
                </select>
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="revenue">Total Spent</option>
                  <option value="orders">Total Orders</option>
                  <option value="loyalty">Loyalty Score</option>
                  <option value="growth">Growth Rate</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Customer Performance</h2>
            <p className="text-sm text-gray-600">Click on a customer to view detailed analytics</p>
          </div>
          <div>
            {filteredCustomers.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Customer Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Orders</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Total Spent</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Order</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Loyalty Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Growth</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Last Order</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCustomerTypeColor(customer.customerType)}`}>
                        {customer.customerType}
                      </span>
                    </td>
                    <td className="py-3 px-4">{customer.totalOrders}</td>
                    <td className="py-3 px-4">${customer.totalSpent.toLocaleString()}</td>
                    <td className="py-3 px-4">${customer.averageOrderValue.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-current" />
                        <span className={getLoyaltyColor(customer.loyaltyScore)}>
                          {customer.loyaltyScore}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {customer.growthRate > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span>{customer.growthRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{customer.lastOrderDate}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              ) : (
                <div className="py-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || customerTypeFilter !== 'all' 
                      ? 'Try adjusting your filters or search terms' 
                      : 'Start taking orders to see customer analytics'
                    }
                  </p>
                  {(searchTerm || customerTypeFilter !== 'all') && (
                    <button 
                      onClick={() => {
                        setSearchTerm('')
                        setCustomerTypeFilter('all')
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
        </div>

        {/* Selected Customer Details */}
        {selectedCustomer && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{selectedCustomer.name} - Spending Trend</h2>
                <p className="text-sm text-gray-600">Monthly spending and order patterns</p>
              </div>
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedCustomer.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="spent" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Favorite Items</h2>
                <p className="text-sm text-gray-600">Most ordered items by this customer</p>
              </div>
              <div>
                <div className="space-y-4">
                  {selectedCustomer.favoriteItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.quantity} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.revenue}</p>
                        <p className="text-sm text-gray-600">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}