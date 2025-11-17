import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreateCouponRequest, Customer, Coupon } from '../../types';
import { couponService } from '../../services/couponService';
import { 
  ArrowLeftIcon,
  TagIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UsersIcon,
  MailIcon,
  CheckCircleIcon,
  XCircleIcon
} from '../../components/ui/Icons';

const EditCoupon: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [originalCoupon, setOriginalCoupon] = useState<Coupon | null>(null);
  
  const [formData, setFormData] = useState<CreateCouponRequest>({
    name: '',
    description: '',
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    maxDiscountAmount: undefined,
    minimumOrderAmount: undefined,
    usageLimit: undefined,
    availableFor: 'all',
    customerIds: [],
    isActive: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notifyByEmail: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchCoupon();
    }
  }, [id]);

  useEffect(() => {
    if (formData.availableFor === 'specific') {
      fetchCustomers();
    }
  }, [formData.availableFor]);

  const fetchCoupon = async () => {
    if (!id) return;
    
    setFetching(true);
    try {
      const coupon = await couponService.getCouponById(id);
      if (coupon) {
        setOriginalCoupon(coupon);
        setFormData({
          name: coupon.name,
          description: coupon.description,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscountAmount: coupon.maxDiscountAmount,
          minimumOrderAmount: coupon.minimumOrderAmount,
          usageLimit: coupon.usageLimit,
          availableFor: coupon.availableFor,
          customerIds: coupon.customerIds || [],
          isActive: coupon.isActive,
          startDate: coupon.startDate.split('T')[0],
          endDate: coupon.endDate.split('T')[0],
          notifyByEmail: coupon.notifyByEmail
        });
        setSelectedCustomers(coupon.customerIds || []);
      }
    } catch (error) {
      console.error('Error fetching coupon:', error);
    } finally {
      setFetching(false);
    }
  };

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await couponService.getCustomers({ page: 1, limit: 100 });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const generateCouponCode = () => {
    const code = couponService.generateCouponCode();
    setFormData(prev => ({ ...prev, code }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Coupon name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Coupon code is required';
    } else if (!/^[A-Z0-9]{4,20}$/.test(formData.code)) {
      newErrors.code = 'Coupon code must be 4-20 characters (letters and numbers only)';
    }

    if (formData.discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    }

    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = 'Percentage discount cannot exceed 100%';
    }

    if (formData.discountType === 'fixed' && formData.discountValue > 1000) {
      newErrors.discountValue = 'Fixed discount cannot exceed $1000';
    }

    if (formData.maxDiscountAmount && formData.maxDiscountAmount <= 0) {
      newErrors.maxDiscountAmount = 'Maximum discount amount must be greater than 0';
    }

    if (formData.minimumOrderAmount && formData.minimumOrderAmount <= 0) {
      newErrors.minimumOrderAmount = 'Minimum order amount must be greater than 0';
    }

    if (formData.usageLimit && formData.usageLimit <= 0) {
      newErrors.usageLimit = 'Usage limit must be greater than 0';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.availableFor === 'specific' && selectedCustomers.length === 0) {
      newErrors.customerIds = 'Please select at least one customer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !id) {
      return;
    }

    setLoading(true);
    try {
      const couponData = {
        ...formData,
        customerIds: formData.availableFor === 'specific' ? selectedCustomers : undefined
      };

      await couponService.updateCoupon(id, { id, ...couponData });
      navigate(`/coupons/${id}`);
    } catch (error) {
      console.error('Error updating coupon:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateCouponRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCustomerToggle = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllCustomers = () => {
    setSelectedCustomers(customers.map(c => c.id));
  };

  const clearCustomerSelection = () => {
    setSelectedCustomers([]);
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!originalCoupon) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Coupon not found</h3>
        <p className="text-gray-500 mb-6">The coupon you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/coupons')}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
        >
          Back to Coupons
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/coupons/${id}`)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Coupon
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Coupon</h1>
          <p className="text-gray-600 mt-1">Update coupon information and settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TagIcon className="w-5 h-5 mr-2 text-orange-500" />
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Welcome Discount"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Code *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., WELCOME20"
                />
                <button
                  type="button"
                  onClick={generateCouponCode}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Generate
                </button>
              </div>
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the coupon benefits..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Discount Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CurrencyDollarIcon className="w-5 h-5 mr-2 text-green-500" />
            Discount Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type *
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => handleInputChange('discountType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Value *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">
                  {formData.discountType === 'percentage' ? '%' : '$'}
                </span>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => handleInputChange('discountValue', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.discountValue ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                  max={formData.discountType === 'percentage' ? 100 : 1000}
                  step={formData.discountType === 'percentage' ? 1 : 0.01}
                />
              </div>
              {errors.discountValue && (
                <p className="mt-1 text-sm text-red-600">{errors.discountValue}</p>
              )}
            </div>

            {formData.discountType === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Discount Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount || ''}
                    onChange={(e) => handleInputChange('maxDiscountAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      errors.maxDiscountAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.maxDiscountAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxDiscountAmount}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">Maximum discount amount per order</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Order Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.minimumOrderAmount || ''}
                  onChange={(e) => handleInputChange('minimumOrderAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                    errors.minimumOrderAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.minimumOrderAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.minimumOrderAmount}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">Minimum order amount to use this coupon</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usage Limit
              </label>
              <input
                type="number"
                value={formData.usageLimit || ''}
                onChange={(e) => handleInputChange('usageLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.usageLimit ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Unlimited"
                min="1"
              />
              {errors.usageLimit && (
                <p className="mt-1 text-sm text-red-600">{errors.usageLimit}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">Maximum times this coupon can be used</p>
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UsersIcon className="w-5 h-5 mr-2 text-blue-500" />
            Availability
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available For *
              </label>
              <select
                value={formData.availableFor}
                onChange={(e) => handleInputChange('availableFor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Customers</option>
                <option value="specific">Specific Customers</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.isActive}
                    onChange={() => handleInputChange('isActive', true)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!formData.isActive}
                    onChange={() => handleInputChange('isActive', false)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Inactive</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Customer Selection */}
          {formData.availableFor === 'specific' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Select Customers *
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={selectAllCustomers}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearCustomerSelection}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
              
              {errors.customerIds && (
                <p className="mb-2 text-sm text-red-600">{errors.customerIds}</p>
              )}

              {loadingCustomers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => handleCustomerToggle(customer.id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                        <div className="text-xs text-gray-400">
                          {customer.totalOrders} orders • ${customer.totalSpent.toFixed(2)} spent
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-2 text-sm text-gray-500">
                {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          )}
        </div>

        {/* Email Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MailIcon className="w-5 h-5 mr-2 text-purple-500" />
            Email Notifications
          </h2>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.notifyByEmail}
              onChange={(e) => handleInputChange('notifyByEmail', e.target.checked)}
              className="mr-3"
            />
            <div>
              <label className="text-sm font-medium text-gray-700">
                Inform customers by email
              </label>
              <p className="text-sm text-gray-500">
                Send email notifications to customers about this coupon
                {formData.availableFor === 'specific' && ` (${selectedCustomers.length} customers will be notified)`}
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/coupons/${id}`)}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </div>
            ) : (
              'Update Coupon'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCoupon;