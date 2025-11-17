import React, { useState, useEffect, useRef } from 'react'
import { BellIcon, XIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon, TrendingUpIcon, UsersIcon, PackageIcon, DollarSign } from './Icons'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'order' | 'analytics'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'New Order Received',
    message: 'Order #12345 for $45.99 has been placed by John Doe',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    action: {
      label: 'View Order',
      onClick: () => console.log('View order')
    },
    icon: <PackageIcon className="w-5 h-5" />
  },
  {
    id: '2',
    type: 'analytics',
    title: 'Sales Milestone Achieved',
    message: 'Daily sales target of $1000 reached! Current sales: $1,234',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    action: {
      label: 'View Analytics',
      onClick: () => console.log('View analytics')
    },
    icon: <TrendingUpIcon className="w-5 h-5" />
  },
  {
    id: '3',
    type: 'success',
    title: 'Payment Processed',
    message: 'Payment of $89.50 from Jane Smith has been successfully processed',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: true,
    icon: <CheckCircleIcon className="w-5 h-5" />
  },
  {
    id: '4',
    type: 'warning',
    title: 'Low Inventory Alert',
    message: 'Margherita Pizza is running low. Only 5 portions remaining',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: true,
    action: {
      label: 'Update Inventory',
      onClick: () => console.log('Update inventory')
    },
    icon: <AlertCircleIcon className="w-5 h-5" />
  },
  {
    id: '5',
    type: 'info',
    title: 'New Customer Registered',
    message: 'Welcome! Sarah Johnson has joined as a new customer',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
    icon: <UsersIcon className="w-5 h-5" />
  }
]

const NotificationsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'order':
        return 'bg-purple-50 border-purple-200 text-purple-800'
      case 'analytics':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircleIcon className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertCircleIcon className="w-5 h-5 text-yellow-600" />
      case 'info':
        return <InfoIcon className="w-5 h-5 text-blue-600" />
      case 'order':
        return <PackageIcon className="w-5 h-5 text-purple-600" />
      case 'analytics':
        return <TrendingUpIcon className="w-5 h-5 text-orange-600" />
      default:
        return <InfoIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Notifications</h3>
                <p className="text-orange-100 text-sm">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BellIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No notifications yet</p>
                <p className="text-gray-400 text-sm mt-1">We'll notify you when something important happens</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50/30' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                        {notification.icon || getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className={`font-semibold text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h4>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              {notification.action && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    notification.action?.onClick()
                                  }}
                                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                                >
                                  {notification.action.label}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="bg-gray-50 p-3 border-t border-gray-200">
              <button className="w-full text-center text-sm text-gray-600 hover:text-gray-900 font-medium">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationsDropdown