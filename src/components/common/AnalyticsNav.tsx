import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChartBarIcon as BarChart3, TrendingUpIcon, UsersIcon, PackageIcon, ArrowLeftIcon } from '../../components/ui/Icons'

const AnalyticsNav: React.FC = () => {
  const location = useLocation()
  
  const isActive = (path: string) => {
    return location.pathname === path
  }

  const isAnalyticsPage = location.pathname.startsWith('/analytics')

  if (!isAnalyticsPage) return null

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link
              to="/reports"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Reports
            </Link>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <nav className="flex space-x-1">
              <Link
                to="/analytics/item-wise"
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/analytics/item-wise')
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <PackageIcon className="w-4 h-4 mr-2" />
                Item Analytics
              </Link>
              
              <Link
                to="/analytics/customer-wise"
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/analytics/customer-wise')
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <UsersIcon className="w-4 h-4 mr-2" />
                Customer Analytics
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics Dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsNav