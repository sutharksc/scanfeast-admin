import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  HomeIcon,
  TableIcon,
  QrCodeIcon,
  FolderIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  PlusCircleIcon,
  MenuAlt2Icon,
  XIcon,
  BellIcon,
  SearchIcon,
  RestaurantIcon,
  TagIcon,
  TrophyIcon
} from '../../components/ui/Icons';
import NotificationsDropdown from '../../components/ui/Notifications';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, page: 'dashboard' },
    { name: 'Tables', href: '/tables', icon: TableIcon, page: 'tables' },
    { name: 'QR Codes', href: '/qr-codes', icon: QrCodeIcon, page: 'qr-codes' },
    { name: 'Menu Categories', href: '/menu-categories', icon: FolderIcon, page: 'menu-categories' },
    { name: 'Menu Items', href: '/menu-items', icon: ShoppingCartIcon, page: 'menu-items' },
    { name: 'Orders', href: '/orders', icon: ShoppingCartIcon, page: 'orders' },
    { name: 'Create Order', href: '/create-order', icon: PlusCircleIcon, page: 'orders', action: 'create' as const },
    { name: 'Coupons', href: '/coupons', icon: TagIcon, page: 'reports' },
    { name: 'Loyalty', href: '/loyalty', icon: TrophyIcon, page: 'loyalty' },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon, page: 'reports' },
    { name: 'Users', href: '/users', icon: UserGroupIcon, page: 'users' },
    { name: 'Restaurant', href: '/restaurant', icon: BuildingStorefrontIcon, page: 'restaurant' },
  ].filter(item => hasPermission(item.page, item.action || 'view'));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 shadow-lg">
          <Link to="/dashboard" className="flex items-center group">
            <div className="relative">
              <div className="w-10 h-10 bg-white rounded-xl mr-3 flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-all duration-300 group-hover:scale-110">
                <RestaurantIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Restaurant</h1>
              <p className="text-xs text-orange-100 font-medium">Admin Panel</p>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-l-4 border-orange-500 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 hover:shadow-sm'
                  }`}
                >
                  <item.icon className={`flex-shrink-0 w-5 h-5 mr-3 transition-colors duration-200 ${
                    isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-500'
                  }`} />
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-bold">
                  {user && getInitials(user.fullName)}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Left side - Mobile menu button and Search */}
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <MenuAlt2Icon className="w-6 h-6" />
                </button>

                {/* Search Bar */}
                <div className="hidden md:block">
                  {isSearchOpen ? (
                    <form onSubmit={handleSearch} className="flex items-center">
                      <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onBlur={() => setIsSearchOpen(false)}
                          className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Search..."
                          autoFocus
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSearchOpen(false)}
                        className="ml-2 p-2 text-gray-400 hover:text-gray-600"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <SearchIcon className="w-4 h-4 mr-2" />
                      Search
                    </button>
                  )}
                </div>
              </div>

              {/* Right side items */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <NotificationsDropdown />

                {/* Profile Menu - Avatar in top right */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                      <span className="text-sm font-bold">
                        {user && getInitials(user.fullName)}
                      </span>
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <UserCircleIcon className="w-4 h-4 mr-3 text-gray-400" />
                        Profile
                      </Link>
                      
                      <Link
                        to="/restaurant"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <BuildingStorefrontIcon className="w-4 h-4 mr-3 text-gray-400" />
                        Restaurant Settings
                      </Link>
                      
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <CogIcon className="w-4 h-4 mr-3 text-gray-400" />
                        Settings
                      </Link>
                      
                      <hr className="my-2 border-gray-100" />
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;