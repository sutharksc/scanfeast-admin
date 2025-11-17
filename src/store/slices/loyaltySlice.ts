import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LoyaltyConfig, LoyaltyReward, CustomerLoyalty, LoyaltyTransaction } from '../../types';

// Helper function to check if a reward is expired
const isRewardExpired = (reward: LoyaltyReward): boolean => {
  if (reward.validUntil) {
    return new Date(reward.validUntil) < new Date();
  }
  if (reward.expirationDays && reward.createdAt) {
    const expirationDate = new Date(reward.createdAt);
    expirationDate.setDate(expirationDate.getDate() + reward.expirationDays);
    return expirationDate < new Date();
  }
  return false;
};

// Helper function to get days until expiration
const getDaysUntilExpiration = (reward: LoyaltyReward): number | null => {
  if (reward.validUntil) {
    const now = new Date();
    const expiry = new Date(reward.validUntil);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  if (reward.expirationDays && reward.createdAt) {
    const now = new Date();
    const created = new Date(reward.createdAt);
    const expiry = new Date(created);
    expiry.setDate(expiry.getDate() + reward.expirationDays);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  return null;
};

interface LoyaltyState {
  config: LoyaltyConfig | null;
  rewards: LoyaltyReward[];
  customerLoyalty: CustomerLoyalty[];
  transactions: LoyaltyTransaction[];
  loading: boolean;
  error: string | null;
}

// Mock data
const mockConfig: LoyaltyConfig = {
  id: '1',
  pointsPerAmount: 100, // 100 rupees = 1 point
  pointValue: 0.25, // 1 point = 0.25 rupees
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockRewards: LoyaltyReward[] = [
  {
    id: '1',
    name: 'Free Noodles',
    description: 'Get a free bowl of noodles worth ₹200',
    type: 'free_item',
    pointsRequired: 500,
    rewardValue: 200,
    applicableItems: ['noodles', 'pasta'],
    isActive: true,
    usageLimit: 100,
    usageCount: 23,
    validUntil: '2025-12-31',
    expirationDays: 365,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: '₹50 Discount',
    description: 'Get ₹50 off on your next order',
    type: 'fixed_discount',
    pointsRequired: 200,
    rewardValue: 50,
    isActive: true,
    usageLimit: null,
    usageCount: 45,
    expirationDays: 180,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: '20% Off',
    description: 'Get 20% discount on your order (max ₹100)',
    type: 'percentage_discount',
    pointsRequired: 300,
    rewardValue: 20,
    maxDiscountAmount: 100,
    isActive: true,
    usageLimit: 50,
    usageCount: 12,
    validUntil: '2025-12-30',
    expirationDays: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Free Burger',
    description: 'Get a free burger worth ₹150',
    type: 'free_item',
    pointsRequired: 600,
    rewardValue: 150,
    applicableItems: ['burger', 'sandwich'],
    isActive: true,
    usageLimit: 75,
    usageCount: 8,
    expirationDays: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockCustomerLoyalty: CustomerLoyalty[] = [
  {
    id: '1',
    customerId: '1',
    customerEmail: 'customer1@example.com',
    totalPoints: 750,
    pointsEarned: 1200,
    pointsRedeemed: 450,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    customerId: '2',
    customerEmail: 'customer2@example.com',
    totalPoints: 230,
    pointsEarned: 500,
    pointsRedeemed: 270,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const mockTransactions: LoyaltyTransaction[] = [
  {
    id: '1',
    customerLoyaltyId: '1',
    customerId: '1',
    customerEmail: 'customer1@example.com',
    type: 'earned',
    points: 25,
    orderId: 'order123',
    description: 'Points earned from order #123',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    customerLoyaltyId: '1',
    customerId: '1',
    customerEmail: 'customer1@example.com',
    type: 'redeemed',
    points: 500,
    rewardId: '1',
    description: 'Redeemed Free Noodles',
    createdAt: new Date().toISOString(),
  },
];

const initialState: LoyaltyState = {
  config: mockConfig,
  rewards: mockRewards,
  customerLoyalty: mockCustomerLoyalty,
  transactions: mockTransactions,
  loading: false,
  error: null,
};

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    updateConfig: (state, action: PayloadAction<Partial<LoyaltyConfig>>) => {
      if (state.config) {
        state.config = {
          ...state.config,
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    addReward: (state, action: PayloadAction<Omit<LoyaltyReward, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>>) => {
      const newReward: LoyaltyReward = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      };
      state.rewards.push(newReward);
    },
    updateReward: (state, action: PayloadAction<LoyaltyReward>) => {
      const index = state.rewards.findIndex(reward => reward.id === action.payload.id);
      if (index !== -1) {
        state.rewards[index] = {
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    deleteReward: (state, action: PayloadAction<string>) => {
      state.rewards = state.rewards.filter(reward => reward.id !== action.payload);
    },
    redeemReward: (state, action: PayloadAction<{ customerId: string; rewardId: string; pointsUsed: number }>) => {
      const { customerId, rewardId, pointsUsed } = action.payload;
      
      // Update customer loyalty points
      const customerLoyalty = state.customerLoyalty.find(cl => cl.customerId === customerId);
      if (customerLoyalty && customerLoyalty.totalPoints >= pointsUsed) {
        customerLoyalty.totalPoints -= pointsUsed;
        customerLoyalty.pointsRedeemed += pointsUsed;
        customerLoyalty.lastUpdated = new Date().toISOString();
      }

      // Update reward usage count
      const reward = state.rewards.find(r => r.id === rewardId);
      if (reward) {
        reward.usageCount += 1;
      }

      // Add transaction record
      const transaction: LoyaltyTransaction = {
        id: Date.now().toString(),
        customerLoyaltyId: customerLoyalty?.id || '',
        customerId,
        customerEmail: customerLoyalty?.customerEmail || '',
        type: 'redeemed',
        points: pointsUsed,
        rewardId,
        description: `Redeemed ${reward?.name}`,
        createdAt: new Date().toISOString(),
      };
      state.transactions.unshift(transaction);
    },
    earnPoints: (state, action: PayloadAction<{ customerId: string; customerEmail: string; orderId: string; amount: number }>) => {
      const { customerId, customerEmail, orderId, amount } = action.payload;
      
      if (!state.config) return;

      const pointsEarned = Math.floor(amount / state.config.pointsPerAmount);

      // Find or create customer loyalty record
      let customerLoyalty = state.customerLoyalty.find(cl => cl.customerId === customerId);
      if (!customerLoyalty) {
        customerLoyalty = {
          id: Date.now().toString(),
          customerId,
          customerEmail,
          totalPoints: 0,
          pointsEarned: 0,
          pointsRedeemed: 0,
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        state.customerLoyalty.push(customerLoyalty);
      }

      // Update points
      customerLoyalty.totalPoints += pointsEarned;
      customerLoyalty.pointsEarned += pointsEarned;
      customerLoyalty.lastUpdated = new Date().toISOString();

      // Add transaction record
      const transaction: LoyaltyTransaction = {
        id: Date.now().toString(),
        customerLoyaltyId: customerLoyalty.id,
        customerId,
        customerEmail,
        type: 'earned',
        points: pointsEarned,
        orderId,
        description: `Points earned from order #${orderId}`,
        createdAt: new Date().toISOString(),
      };
      state.transactions.unshift(transaction);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  updateConfig,
  addReward,
  updateReward,
  deleteReward,
  redeemReward,
  earnPoints,
  setLoading,
  setError,
} = loyaltySlice.actions;

// Selectors
export const selectExpiredRewards = (state: { loyalty: LoyaltyState }) => 
  state.loyalty.rewards.filter(isRewardExpired);

export const selectExpiringSoonRewards = (state: { loyalty: LoyaltyState }) => 
  state.loyalty.rewards.filter(reward => {
    const days = getDaysUntilExpiration(reward);
    return days !== null && days > 0 && days <= 30;
  });

export const selectActiveRewards = (state: { loyalty: LoyaltyState }) => 
  state.loyalty.rewards.filter(reward => reward.isActive && !isRewardExpired(reward));

export const selectRewardAnalytics = (state: { loyalty: LoyaltyState }) => {
  const { rewards, customerLoyalty, transactions, config } = state.loyalty;
  
  // Defensive checks to prevent errors
  if (!rewards || !Array.isArray(rewards)) {
    return {
      totalRewards: 0,
      activeRewards: 0,
      expiredRewards: 0,
      expiringSoon: 0,
      totalUsage: 0,
      totalPotentialValue: 0,
      recentTransactions: 0,
      topRewards: [],
    };
  }
  
  // Create copies of arrays to avoid mutation issues
  const rewardsCopy = [...rewards];
  const customerLoyaltyCopy = [...(customerLoyalty || [])];
  const transactionsCopy = [...(transactions || [])];
  
  const expiredRewards = rewardsCopy.filter(isRewardExpired);
  const expiringSoon = rewardsCopy.filter(reward => {
    const days = getDaysUntilExpiration(reward);
    return days !== null && days > 0 && days <= 30;
  });
  const activeRewards = rewardsCopy.filter(reward => reward.isActive && !isRewardExpired(reward));
  
  const totalUsage = rewardsCopy.reduce((sum, reward) => sum + (reward.usageCount || 0), 0);
  const totalPotentialValue = customerLoyaltyCopy.reduce((sum, cl) => sum + (cl.totalPoints || 0), 0) * (config?.pointValue || 0);
  
  const recentTransactions = transactionsCopy
    .filter(t => t.createdAt && new Date(t.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .length;
  
  return {
    totalRewards: rewardsCopy.length,
    activeRewards: activeRewards.length,
    expiredRewards: expiredRewards.length,
    expiringSoon: expiringSoon.length,
    totalUsage,
    totalPotentialValue,
    recentTransactions,
    topRewards: rewardsCopy
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5),
  };
};

export default loyaltySlice.reducer;