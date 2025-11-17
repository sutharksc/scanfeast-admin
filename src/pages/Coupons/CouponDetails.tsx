import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Coupon, Customer } from '../../types';
import { couponService } from '../../services/couponService';
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MailIcon,
  TagIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UsersIcon,
  ClockIcon,
  ShoppingBagIcon
} from '../../components/ui/Icons';

const CouponDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmails, setSendingEmails] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCoupon();
    }
  }, [id]);

  const fetchCoupon = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await couponService.getCouponById(id);
      setCoupon(data);
    } catch (error) {
      console.error('Error fetching coupon:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!coupon) return;
    
    try {
      await couponService.toggleCouponStatus(coupon.id, !coupon.isActive);
      fetchCoupon();
    } catch (error) {
      console.error('Error toggling coupon status:', error);
    }
  };

  const handleDelete = async () => {
    if (!coupon) return;
    
    if (window.confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      try {
        await couponService.deleteCoupon(coupon.id);
        window.location.href = '/coupons';
      } catch (error) {
        console.error('Error deleting coupon:', error);
      }
    }
  };

  const handleSendEmails = async () => {
    if (!coupon || coupon.availableFor !== 'specific' || !coupon.customerIds) return;
    
    setSendingEmails(true);
    try {
      await couponService.sendCouponEmails(coupon.id, coupon.customerIds);
      alert('Coupon emails sent successfully!');
    } catch (error) {
      console.error('Error sending coupon emails:', error);
      alert('Failed to send coupon emails. Please try again.');
    } finally {
      setSendingEmails(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%${coupon.maxDiscountAmount ? ` (max $${coupon.maxDiscountAmount})` : ''}`;
    }
    return `$${coupon.discountValue}`;
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? (
          <>
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircleIcon className="w-4 h-4 mr-1" />
            Inactive
          </>
        )}
      </span>
    );
  };

  const getUsageProgress = () => {
    if (!coupon) return 0;
    if (!coupon.usageLimit) return 0;
    return (coupon.usageCount / coupon.usageLimit) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Coupon not found</h3>
        <p className="text-gray-500 mb-6">The coupon you're looking for doesn't exist.</p>
        <Link
          to="/coupons"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
        >
          Back to Coupons
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/coupons"
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Coupons
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{coupon.name}</h1>
            <p className="text-gray-600 mt-1">Coupon details and management</p>
          </div>
        </div>
        
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Link
            to={`/coupons/${coupon.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleToggleStatus}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              coupon.isActive
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            {coupon.isActive ? (
              <>
                <XCircleIcon className="w-4 h-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white">
              <TagIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-900">Coupon Status</h3>
              <p className="text-orange-700">Code: {coupon.code}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {getStatusBadge(coupon.isActive)}
            <div className="text-right">
              <p className="text-sm text-orange-600">Usage</p>
              <p className="text-lg font-semibold text-orange-900">
                {coupon.usageCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Coupon Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TagIcon className="w-5 h-5 mr-2 text-orange-500" />
              Coupon Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <p className="text-gray-900">{coupon.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Discount Type</label>
                  <p className="text-gray-900 capitalize">{coupon.discountType}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Discount Value</label>
                  <p className="text-gray-900 font-semibold">{formatDiscount(coupon)}</p>
                </div>
                
                {coupon.minimumOrderAmount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Minimum Order</label>
                    <p className="text-gray-900">${coupon.minimumOrderAmount}</p>
                  </div>
                )}
                
                {coupon.usageLimit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Usage Limit</label>
                    <p className="text-gray-900">{coupon.usageLimit} uses</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Usage Progress */}
          {coupon.usageLimit && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShoppingBagIcon className="w-5 h-5 mr-2 text-blue-500" />
                Usage Progress
              </h2>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Used: {coupon.usageCount}</span>
                  <span className="text-gray-600">Remaining: {coupon.usageLimit - coupon.usageCount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${getUsageProgress()}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">
                  {getUsageProgress().toFixed(1)}% of usage limit reached
                </p>
              </div>
            </div>
          )}

          {/* Customer Information */}
          {coupon.availableFor === 'specific' && coupon.customers && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UsersIcon className="w-5 h-5 mr-2 text-purple-500" />
                Selected Customers
              </h2>
              
              <div className="space-y-3">
                {coupon.customers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                      <p className="text-xs text-gray-400">
                        {customer.totalOrders} orders • ${customer.totalSpent.toFixed(2)} spent
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {coupon.notifyByEmail && (
                <div className="mt-4 flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center text-green-700">
                    <MailIcon className="w-4 h-4 mr-2" />
                    <span className="text-sm">Email notifications enabled</span>
                  </div>
                  <button
                    onClick={handleSendEmails}
                    disabled={sendingEmails}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {sendingEmails ? 'Sending...' : 'Send Now'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Validity Period */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-green-500" />
              Validity Period
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                <p className="text-gray-900">{formatDate(coupon.startDate)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">End Date</label>
                <p className="text-gray-900">{formatDate(coupon.endDate)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {new Date() > new Date(coupon.endDate) 
                      ? 'Expired' 
                      : new Date() < new Date(coupon.startDate) 
                      ? 'Not yet active' 
                      : 'Active'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UsersIcon className="w-5 h-5 mr-2 text-blue-500" />
              Availability
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Available For</label>
                <p className="text-gray-900">
                  {coupon.availableFor === 'all' ? 'All Customers' : `${coupon.customers?.length || 0} Selected Customers`}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email Notifications</label>
                <div className="flex items-center">
                  {coupon.notifyByEmail ? (
                    <>
                      <MailIcon className="w-4 h-4 mr-2 text-green-500" />
                      <span className="text-sm text-green-600">Enabled</span>
                    </>
                  ) : (
                    <>
                      <MailIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-500">Disabled</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                <p className="text-gray-900">{formatDate(coupon.createdAt)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <p className="text-gray-900">{formatDate(coupon.updatedAt)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
                <p className="text-gray-900">{coupon.createdBy}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponDetails;