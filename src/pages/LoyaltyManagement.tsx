import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { updateConfig, addReward, updateReward, deleteReward } from '../store/slices/loyaltySlice';
import { selectRewardAnalytics } from '../store/slices/loyaltySlice';
import { 
  GiftIcon, 
  StarIcon, 
  CurrencyDollarIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  TrophyIcon,
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '../components/ui/Icons';

const LoyaltyManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { config, rewards, customerLoyalty, transactions } = useSelector((state: RootState) => state.loyalty);
  const { items: menuItems } = useSelector((state: RootState) => state.menuItems);

  const [activeTab, setActiveTab] = useState<'config' | 'rewards' | 'customers' | 'analytics'>('config');
  const [editingConfig, setEditingConfig] = useState(false);
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [showAddReward, setShowAddReward] = useState(false);

  // Config form state
  const [configForm, setConfigForm] = useState<{
    pointsPerAmount: number;
    pointValue: number;
    isActive: boolean;
  }>({
    pointsPerAmount: config?.pointsPerAmount || 100,
    pointValue: config?.pointValue || 0.25,
    isActive: config?.isActive ?? true,
  });

  // Reward form state
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    type: 'fixed_discount' as 'free_item' | 'fixed_discount' | 'percentage_discount',
    pointsRequired: 0,
    rewardValue: 0,
    applicableItems: [] as string[],
    maxDiscountAmount: 0,
    usageLimit: null as number | null,
    validUntil: '',
    expirationDays: null as number | null,
    isActive: true,
  });

  const handleConfigSave = () => {
    dispatch(updateConfig(configForm));
    setEditingConfig(false);
  };

  const handleAddReward = () => {
    dispatch(addReward(rewardForm));
    setRewardForm({
      name: '',
      description: '',
      type: 'fixed_discount',
      pointsRequired: 0,
      rewardValue: 0,
      applicableItems: [],
      maxDiscountAmount: 0,
      usageLimit: null,
      validUntil: '',
      expirationDays: null,
      isActive: true,
    });
    setShowAddReward(false);
  };

  const handleUpdateReward = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward) {
      dispatch(updateReward({ ...reward, ...rewardForm }));
      setEditingReward(null);
    }
  };

  const handleDeleteReward = (rewardId: string) => {
    if (confirm('Are you sure you want to delete this reward?')) {
      dispatch(deleteReward(rewardId));
    }
  };

  const startEditReward = (reward: any) => {
    setRewardForm({
      name: reward.name,
      description: reward.description,
      type: reward.type,
      pointsRequired: reward.pointsRequired,
      rewardValue: reward.rewardValue,
      applicableItems: reward.applicableItems || [],
      maxDiscountAmount: reward.maxDiscountAmount || 0,
      usageLimit: reward.usageLimit,
      validUntil: reward.validUntil || '',
      expirationDays: reward.expirationDays || null,
      isActive: reward.isActive,
    });
    setEditingReward(reward.id);
    setShowAddReward(false);
  };

  // Calculate analytics
  const analytics = useSelector(selectRewardAnalytics);
  
  const totalPointsIssued = customerLoyalty.reduce((sum, cl) => sum + cl.pointsEarned, 0);
  const totalPointsRedeemed = customerLoyalty.reduce((sum, cl) => sum + cl.pointsRedeemed, 0);
  const activeCustomers = customerLoyalty.filter(cl => cl.totalPoints > 0).length;
  const totalRewardsClaimed = rewards.reduce((sum, r) => sum + r.usageCount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrophyIcon className="w-8 h-8 text-yellow-500" />
            Loyalty Management
          </h1>
          <p className="text-gray-600 mt-2">Manage reward points, redemption options, and customer loyalty programs</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Points Issued</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalPointsIssued.toLocaleString()}</p>
              </div>
              <StarIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Points Redeemed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalPointsRedeemed.toLocaleString()}</p>
              </div>
              <GiftIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{activeCustomers}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rewards Claimed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalRewardsClaimed}</p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'config', label: 'Configuration', icon: CurrencyDollarIcon },
                { id: 'rewards', label: 'Rewards', icon: GiftIcon },
                { id: 'customers', label: 'Customers', icon: UsersIcon },
                { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Points Configuration</h2>
                {!editingConfig && (
                  <button
                    onClick={() => setEditingConfig(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit Configuration
                  </button>
                )}
              </div>

              {editingConfig ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Points per Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={configForm.pointsPerAmount}
                        onChange={(e) => setConfigForm({ ...configForm, pointsPerAmount: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Customers earn 1 point for every ₹{configForm.pointsPerAmount} spent</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Point Value (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={configForm.pointValue}
                        onChange={(e) => setConfigForm({ ...configForm, pointValue: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 0.25"
                      />
                      <p className="text-xs text-gray-500 mt-1">Each point is worth ₹{configForm.pointValue}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={configForm.isActive}
                      onChange={(e) => setConfigForm({ ...configForm, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Enable loyalty program
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleConfigSave}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setEditingConfig(false);
                        setConfigForm({
                          pointsPerAmount: config?.pointsPerAmount || 100,
                          pointValue: config?.pointValue || 0.25,
                          isActive: config?.isActive || true,
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Points Earning Rate</h3>
                      <p className="text-2xl font-bold text-gray-900">1 point = ₹{configForm.pointsPerAmount}</p>
                      <p className="text-sm text-gray-500 mt-1">Customers earn points based on their order amount</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-600 mb-2">Point Redemption Value</h3>
                      <p className="text-2xl font-bold text-gray-900">1 point = ₹{configForm.pointValue}</p>
                      <p className="text-sm text-gray-500 mt-1">Each point has monetary value for rewards</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      configForm.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {configForm.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Reward Options</h2>
                <button
                  onClick={() => {
                    setShowAddReward(true);
                    setEditingReward(null);
                    setRewardForm({
                      name: '',
                      description: '',
                      type: 'fixed_discount',
                      pointsRequired: 0,
                      rewardValue: 0,
                      applicableItems: [],
                      maxDiscountAmount: 0,
                      usageLimit: null,
                      validUntil: '',
                      expirationDays: null,
                      isActive: true,
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Reward
                </button>
              </div>

              {/* Add/Edit Reward Form */}
              {(showAddReward || editingReward) && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingReward ? 'Edit Reward' : 'Add New Reward'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reward Name</label>
                      <input
                        type="text"
                        value={rewardForm.name}
                        onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Free Noodles"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={rewardForm.type}
                        onChange={(e) => setRewardForm({ ...rewardForm, type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="fixed_discount">Fixed Discount</option>
                        <option value="percentage_discount">Percentage Discount</option>
                        <option value="free_item">Free Item</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Points Required</label>
                      <input
                        type="number"
                        value={rewardForm.pointsRequired}
                        onChange={(e) => setRewardForm({ ...rewardForm, pointsRequired: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {rewardForm.type === 'percentage_discount' ? 'Discount Percentage' : 
                         rewardForm.type === 'free_item' ? 'Item Value (₹)' : 'Discount Amount (₹)'}
                      </label>
                      <input
                        type="number"
                        value={rewardForm.rewardValue}
                        onChange={(e) => setRewardForm({ ...rewardForm, rewardValue: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={rewardForm.type === 'percentage_discount' ? 'e.g., 20' : 'e.g., 50'}
                      />
                    </div>

                    {rewardForm.type === 'percentage_discount' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Discount Amount (₹)</label>
                        <input
                          type="number"
                          value={rewardForm.maxDiscountAmount}
                          onChange={(e) => setRewardForm({ ...rewardForm, maxDiscountAmount: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 100"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Usage Limit (optional)</label>
                      <input
                        type="number"
                        value={rewardForm.usageLimit || ''}
                        onChange={(e) => setRewardForm({ ...rewardForm, usageLimit: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until (optional)</label>
                      <input
                        type="date"
                        value={rewardForm.validUntil}
                        onChange={(e) => setRewardForm({ ...rewardForm, validUntil: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Days (optional)</label>
                      <input
                        type="number"
                        value={rewardForm.expirationDays || ''}
                        onChange={(e) => setRewardForm({ ...rewardForm, expirationDays: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 30"
                        min="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Number of days from creation when reward expires</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={rewardForm.description}
                      onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the reward benefits..."
                    />
                  </div>

                  <div className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      id="rewardActive"
                      checked={rewardForm.isActive}
                      onChange={(e) => setRewardForm({ ...rewardForm, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="rewardActive" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => editingReward ? handleUpdateReward(editingReward) : handleAddReward()}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckIcon className="w-4 h-4" />
                      {editingReward ? 'Update Reward' : 'Add Reward'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddReward(false);
                        setEditingReward(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Rewards List */}
              <div className="space-y-4">
                {rewards.map((reward) => (
                  <div key={reward.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{reward.name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            reward.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {reward.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {reward.type === 'fixed_discount' ? 'Fixed Discount' :
                             reward.type === 'percentage_discount' ? 'Percentage Discount' : 'Free Item'}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{reward.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Points Required:</span>
                            <span className="ml-2 font-medium text-gray-900">{reward.pointsRequired}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Value:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {reward.type === 'percentage_discount' ? `${reward.rewardValue}%` : `₹${reward.rewardValue}`}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Used:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {reward.usageCount}{reward.usageLimit ? `/${reward.usageLimit}` : ''}
                            </span>
                          </div>
                          {reward.validUntil && (
                            <div>
                              <span className="text-gray-500">Valid Until:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {new Date(reward.validUntil).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {reward.expirationDays && (
                            <div>
                              <span className="text-gray-500">Expires in:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {reward.expirationDays} days
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => startEditReward(reward)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReward(reward.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Loyalty Status</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points Earned
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points Redeemed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerLoyalty.map((customer) => (
                      <tr key={customer.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.customerEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">{customer.totalPoints}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          +{customer.pointsEarned}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          -{customer.pointsRedeemed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.lastUpdated).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Loyalty Analytics</h2>
              
              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Rewards</p>
                      <p className="text-3xl font-bold text-blue-900 mt-1">{analytics.totalRewards}</p>
                      <p className="text-xs text-blue-600 mt-1">{analytics.activeRewards} active</p>
                    </div>
                    <TrophyIcon className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Total Usage</p>
                      <p className="text-3xl font-bold text-green-900 mt-1">{analytics.totalUsage}</p>
                      <p className="text-xs text-green-600 mt-1">{analytics.recentTransactions} this month</p>
                    </div>
                    <ChartBarIcon className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Expiring Soon</p>
                      <p className="text-3xl font-bold text-yellow-900 mt-1">{analytics.expiringSoon}</p>
                      <p className="text-xs text-yellow-600 mt-1">{analytics.expiredRewards} expired</p>
                    </div>
                    <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Potential Value</p>
                      <p className="text-3xl font-bold text-purple-900 mt-1">₹{analytics.totalPotentialValue.toFixed(0)}</p>
                      <p className="text-xs text-purple-600 mt-1">In customer points</p>
                    </div>
                    <CurrencyDollarIcon className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Points Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Points Issued:</span>
                      <span className="font-medium text-gray-900">{totalPointsIssued.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Points Redeemed:</span>
                      <span className="font-medium text-gray-900">{totalPointsRedeemed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Points:</span>
                      <span className="font-medium text-green-600">
                        {(totalPointsIssued - totalPointsRedeemed).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Redemption Rate:</span>
                      <span className="font-medium text-gray-900">
                        {totalPointsIssued > 0 ? 
                          `${((totalPointsRedeemed / totalPointsIssued) * 100).toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Rewards</h3>
                  <div className="space-y-3">
                    {analytics.topRewards.map((reward, index) => (
                      <div key={reward.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                            {index + 1}
                          </span>
                          <span className="text-gray-700">{reward.name}</span>
                        </div>
                        <span className="font-medium text-gray-900">{reward.usageCount} times</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Points
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.slice(0, 10).map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.customerEmail}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'earned' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'}>
                              {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyManagement;