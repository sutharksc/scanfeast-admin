import { 
  Coupon, 
  CreateCouponRequest, 
  UpdateCouponRequest, 
  CouponValidationResult,
  Customer,
  PaginatedResponse,
  PaginationParams 
} from '../types';

class CouponService {
  private baseUrl = '/api/coupons';

  /**
   * Get all coupons with pagination
   */
  async getCoupons(params: PaginationParams = { page: 1, limit: 10 }): Promise<PaginatedResponse<Coupon>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', params.page.toString());
      queryParams.append('limit', params.limit.toString());
      
      if (params.search) {
        queryParams.append('search', params.search);
      }
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      if (params.sortOrder) {
        queryParams.append('sortOrder', params.sortOrder);
      }

      const response = await fetch(`${this.baseUrl}?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch coupons');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching coupons:', error);
      // Return mock data for development
      return this.getMockCoupons(params);
    }
  }

  /**
   * Get a single coupon by ID
   */
  async getCouponById(id: string): Promise<Coupon | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch coupon');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching coupon:', error);
      // Return mock data for development
      return this.getMockCoupons().data.find(c => c.id === id) || null;
    }
  }

  /**
   * Create a new coupon
   */
  async createCoupon(couponData: CreateCouponRequest): Promise<Coupon> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        throw new Error('Failed to create coupon');
      }

      const result = await response.json();
      
      // Send email notifications if enabled
      if (couponData.notifyByEmail && couponData.availableFor === 'specific' && couponData.customerIds) {
        await this.sendCouponEmails(result.id, couponData.customerIds);
      }

      return result;
    } catch (error) {
      console.error('Error creating coupon:', error);
      // Return mock data for development
      return this.createMockCoupon(couponData);
    }
  }

  /**
   * Update an existing coupon
   */
  async updateCoupon(id: string, couponData: UpdateCouponRequest): Promise<Coupon> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        throw new Error('Failed to update coupon');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating coupon:', error);
      // Return mock data for development
      const existingCoupon = this.getMockCoupons().data.find(c => c.id === id);
      if (existingCoupon) {
        return { ...existingCoupon, ...couponData, updatedAt: new Date().toISOString() };
      }
      throw new Error('Coupon not found');
    }
  }

  /**
   * Delete a coupon
   */
  async deleteCoupon(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete coupon');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      // Mock deletion for development
      console.log(`Mock deleted coupon: ${id}`);
    }
  }

  /**
   * Toggle coupon active status
   */
  async toggleCouponStatus(id: string, isActive: boolean): Promise<Coupon> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle coupon status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      // Return mock data for development
      const existingCoupon = this.getMockCoupons().data.find(c => c.id === id);
      if (existingCoupon) {
        return { ...existingCoupon, isActive, updatedAt: new Date().toISOString() };
      }
      throw new Error('Coupon not found');
    }
  }

  /**
   * Validate a coupon code
   */
  async validateCoupon(code: string, orderAmount: number, customerId?: string): Promise<CouponValidationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, orderAmount, customerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate coupon');
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating coupon:', error);
      // Return mock validation for development
      return this.validateMockCoupon(code, orderAmount, customerId);
    }
  }

  /**
   * Get customers for coupon assignment
   */
  async getCustomers(params: PaginationParams = { page: 1, limit: 50 }): Promise<PaginatedResponse<Customer>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', params.page.toString());
      queryParams.append('limit', params.limit.toString());
      
      if (params.search) {
        queryParams.append('search', params.search);
      }

      const response = await fetch(`/api/customers?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Return mock data for development
      return this.getMockCustomers(params);
    }
  }

  /**
   * Send coupon emails to specific customers
   */
  async sendCouponEmails(couponId: string, customerIds: string[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${couponId}/send-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to send coupon emails');
      }
    } catch (error) {
      console.error('Error sending coupon emails:', error);
      // Mock email sending for development
      console.log(`Mock sent coupon ${couponId} to customers:`, customerIds);
    }
  }

  /**
   * Generate a unique coupon code
   */
  generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Mock data methods for development
  private getMockCoupons(params: PaginationParams = { page: 1, limit: 10 }): PaginatedResponse<Coupon> {
    const mockCoupons: Coupon[] = [
      {
        id: '1',
        name: 'Welcome Discount',
        description: 'Get 20% off on your first order',
        code: 'WELCOME20',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscountAmount: 50,
        minimumOrderAmount: 100,
        usageLimit: 100,
        usageCount: 25,
        availableFor: 'all',
        isActive: true,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        notifyByEmail: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin'
      },
      {
        id: '2',
        name: 'Weekend Special',
        description: 'Flat $10 off on weekends',
        code: 'WEEKEND10',
        discountType: 'fixed',
        discountValue: 10,
        minimumOrderAmount: 50,
        usageLimit: 200,
        usageCount: 75,
        availableFor: 'all',
        isActive: true,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-06-30T23:59:59Z',
        notifyByEmail: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin'
      },
      {
        id: '3',
        name: 'VIP Customer Discount',
        description: 'Exclusive 30% off for VIP customers',
        code: 'VIP30',
        discountType: 'percentage',
        discountValue: 30,
        maxDiscountAmount: 100,
        minimumOrderAmount: 200,
        usageLimit: 50,
        usageCount: 10,
        availableFor: 'specific',
        customerIds: ['1', '2', '3'],
        isActive: true,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        notifyByEmail: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'admin'
      }
    ];

    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;
    const paginatedData = mockCoupons.slice(start, end);

    return {
      data: paginatedData,
      total: mockCoupons.length,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(mockCoupons.length / params.limit)
    };
  }

  private createMockCoupon(couponData: CreateCouponRequest): Coupon {
    return {
      id: Date.now().toString(),
      ...couponData,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin'
    };
  }

  private getMockCustomers(params: PaginationParams = { page: 1, limit: 50 }): PaginatedResponse<Customer> {
    const mockCustomers: Customer[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        totalOrders: 15,
        totalSpent: 1250,
        lastOrderDate: '2024-01-15T00:00:00Z',
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        totalOrders: 8,
        totalSpent: 750,
        lastOrderDate: '2024-01-10T00:00:00Z',
        status: 'active',
        createdAt: '2023-02-01T00:00:00Z'
      },
      {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+1234567892',
        totalOrders: 25,
        totalSpent: 2100,
        lastOrderDate: '2024-01-18T00:00:00Z',
        status: 'active',
        createdAt: '2023-01-15T00:00:00Z'
      }
    ];

    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;
    const paginatedData = mockCustomers.slice(start, end);

    return {
      data: paginatedData,
      total: mockCustomers.length,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(mockCustomers.length / params.limit)
    };
  }

  private validateMockCoupon(code: string, orderAmount: number, customerId?: string): CouponValidationResult {
    const coupons = this.getMockCoupons().data;
    const coupon = coupons.find(c => c.code === code && c.isActive);

    if (!coupon) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Invalid coupon code'
      };
    }

    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);

    if (now < startDate || now > endDate) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Coupon has expired or is not yet active'
      };
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Coupon usage limit has been reached'
      };
    }

    if (coupon.minimumOrderAmount && orderAmount < coupon.minimumOrderAmount) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Minimum order amount of $${coupon.minimumOrderAmount} required`
      };
    }

    if (coupon.availableFor === 'specific' && customerId && !coupon.customerIds?.includes(customerId)) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This coupon is not valid for your account'
      };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    return {
      isValid: true,
      discountAmount,
      message: `Coupon applied successfully! You saved $${discountAmount.toFixed(2)}`,
      coupon
    };
  }
}

export const couponService = new CouponService();