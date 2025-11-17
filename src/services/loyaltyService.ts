import { LoyaltyConfig, LoyaltyReward, CustomerLoyalty, LoyaltyTransaction } from '../types';

export class LoyaltyService {
  private static instance: LoyaltyService;

  static getInstance(): LoyaltyService {
    if (!LoyaltyService.instance) {
      LoyaltyService.instance = new LoyaltyService();
    }
    return LoyaltyService.instance;
  }

  // Calculate points earned from an order amount
  calculatePointsEarned(amount: number, config: LoyaltyConfig): number {
    if (!config.isActive) return 0;
    return Math.floor(amount / config.pointsPerAmount);
  }

  // Calculate monetary value of points
  calculatePointsValue(points: number, config: LoyaltyConfig): number {
    return points * config.pointValue;
  }

  // Check if customer can redeem a reward
  canRedeemReward(customerPoints: number, reward: LoyaltyReward): boolean {
    return customerPoints >= reward.pointsRequired && 
           reward.isActive && 
           (!reward.usageLimit || reward.usageCount < reward.usageLimit) &&
           (!reward.validUntil || new Date(reward.validUntil) > new Date());
  }

  // Calculate reward benefit
  calculateRewardBenefit(reward: LoyaltyReward, orderAmount?: number): number {
    switch (reward.type) {
      case 'fixed_discount':
        return reward.rewardValue;
      
      case 'percentage_discount':
        const discount = (orderAmount || 0) * (reward.rewardValue / 100);
        return reward.maxDiscountAmount ? Math.min(discount, reward.maxDiscountAmount) : discount;
      
      case 'free_item':
        return reward.rewardValue;
      
      default:
        return 0;
    }
  }

  // Get available rewards for customer
  getAvailableRewards(customerPoints: number, allRewards: LoyaltyReward[]): LoyaltyReward[] {
    return allRewards.filter(reward => this.canRedeemReward(customerPoints, reward));
  }

  // Generate loyalty summary for customer
  generateCustomerSummary(customerLoyalty: CustomerLoyalty, config: LoyaltyConfig): {
    totalPoints: number;
    monetaryValue: number;
    pointsEarned: number;
    pointsRedeemed: number;
    redemptionRate: number;
  } {
    const monetaryValue = this.calculatePointsValue(customerLoyalty.totalPoints, config);
    const redemptionRate = customerLoyalty.pointsEarned > 0 
      ? (customerLoyalty.pointsRedeemed / customerLoyalty.pointsEarned) * 100 
      : 0;

    return {
      totalPoints: customerLoyalty.totalPoints,
      monetaryValue,
      pointsEarned: customerLoyalty.pointsEarned,
      pointsRedeemed: customerLoyalty.pointsRedeemed,
      redemptionRate,
    };
  }

  // Get customer loyalty tier based on points
  getLoyaltyTier(points: number): {
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    benefits: string[];
    nextTierPoints?: number;
    pointsToNextTier?: number;
  } {
    if (points < 100) {
      return {
        tier: 'Bronze',
        benefits: ['Basic point earning', 'Standard rewards'],
        nextTierPoints: 100,
        pointsToNextTier: 100 - points,
      };
    } else if (points < 500) {
      return {
        tier: 'Silver',
        benefits: ['2x point earning on weekends', 'Exclusive silver rewards'],
        nextTierPoints: 500,
        pointsToNextTier: 500 - points,
      };
    } else if (points < 1000) {
      return {
        tier: 'Gold',
        benefits: ['3x point earning on weekends', 'Exclusive gold rewards', 'Birthday bonus'],
        nextTierPoints: 1000,
        pointsToNextTier: 1000 - points,
      };
    } else {
      return {
        tier: 'Platinum',
        benefits: ['5x point earning on weekends', 'Exclusive platinum rewards', 'Birthday bonus', 'Priority support'],
      };
    }
  }

  // Validate reward configuration
  validateRewardConfig(reward: Partial<LoyaltyReward>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!reward.name || reward.name.trim().length === 0) {
      errors.push('Reward name is required');
    }

    if (!reward.description || reward.description.trim().length === 0) {
      errors.push('Reward description is required');
    }

    if (!reward.type || !['fixed_discount', 'percentage_discount', 'free_item'].includes(reward.type)) {
      errors.push('Valid reward type is required');
    }

    if (!reward.pointsRequired || reward.pointsRequired <= 0) {
      errors.push('Points required must be greater than 0');
    }

    if (!reward.rewardValue || reward.rewardValue <= 0) {
      errors.push('Reward value must be greater than 0');
    }

    if (reward.type === 'percentage_discount' && (reward.rewardValue <= 0 || reward.rewardValue > 100)) {
      errors.push('Percentage discount must be between 1 and 100');
    }

    if (reward.usageLimit !== undefined && reward.usageLimit <= 0) {
      errors.push('Usage limit must be greater than 0');
    }

    if (reward.validUntil && new Date(reward.validUntil) <= new Date()) {
      errors.push('Valid until date must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Generate loyalty analytics
  generateAnalytics(
    customerLoyalty: CustomerLoyalty[],
    rewards: LoyaltyReward[],
    transactions: LoyaltyTransaction[],
    config: LoyaltyConfig
  ): {
    totalCustomers: number;
    activeCustomers: number;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    totalMonetaryValue: number;
    averagePointsPerCustomer: number;
    topRewards: Array<{ reward: LoyaltyReward; usageCount: number }>;
    customerTiers: Record<string, number>;
    redemptionRate: number;
  } {
    const activeCustomers = customerLoyalty.filter(cl => cl.totalPoints > 0).length;
    const totalPointsIssued = customerLoyalty.reduce((sum, cl) => sum + cl.pointsEarned, 0);
    const totalPointsRedeemed = customerLoyalty.reduce((sum, cl) => sum + cl.pointsRedeemed, 0);
    const totalMonetaryValue = this.calculatePointsValue(totalPointsIssued, config);
    const averagePointsPerCustomer = customerLoyalty.length > 0 ? totalPointsIssued / customerLoyalty.length : 0;

    const topRewards = rewards
      .map(reward => ({
        reward,
        usageCount: transactions.filter(t => t.rewardId === reward.id).length,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    const customerTiers = customerLoyalty.reduce((tiers, customer) => {
      const tier = this.getLoyaltyTier(customer.totalPoints).tier;
      tiers[tier] = (tiers[tier] || 0) + 1;
      return tiers;
    }, {} as Record<string, number>);

    const redemptionRate = totalPointsIssued > 0 ? (totalPointsRedeemed / totalPointsIssued) * 100 : 0;

    return {
      totalCustomers: customerLoyalty.length,
      activeCustomers,
      totalPointsIssued,
      totalPointsRedeemed,
      totalMonetaryValue,
      averagePointsPerCustomer,
      topRewards,
      customerTiers,
      redemptionRate,
    };
  }
}

export const loyaltyService = LoyaltyService.getInstance();