import { publicDecrypt } from "crypto";

export interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  phone?: string;
  avatar?: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  roles:string[]
}

export interface Permission {
  page: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface Table {
  id: string;
  number: string;
  description: string;
  type: number;
  capacity: number;
  status: TableStatus;
  createdAt: string;
  updatedAt: string;
}

export enum TableStatus{
  Available = 1,
  Occupied = 2
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVegetarian: boolean;
  categoryId: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  price: number;
  subtotal: number;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'in-kitchen' | 'ready' | 'delivered' | 'cancelled' | 'rejected';

export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  IN_KITCHEN: 'in-kitchen',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
} as const;

export interface Order {
  id: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMode: 'Cash' | 'Card' | 'Online';
  deliveryTime?: number;
  deliveryFee?: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  tax?: number;
  taxRate?: number;
  notes?: string;
  source: 'internal' | 'external';
  createdAt: string;
  updatedAt: string;
}

// export interface Restaurant {
//   id: string;
//   name: string;
//   address: string;
//   phone: string;
//   logo: string;
//   description: string;
//   email: string;
//   website: string;
//   cuisine: string;
//   priceRange: string;
//   operatingHours?: {
//     opening: string;
//     closing: string;
//   };
//   openingHours: {
//     monday: string;
//     tuesday: string;
//     wednesday: string;
//     thursday: string;
//     friday: string;
//     saturday: string;
//     sunday: string;
//   };
//   deliveryFee: number;
//   minimumOrder: number;
//   estimatedDeliveryTime: string;
//   paymentMethods: string[];
//   features: string[];
//   socialMedia: {
//     facebook: string;
//     twitter: string;
//     instagram: string;
//   };
//   coverImage: string;
//   taxRate: number;
// }

export interface QRDesign {
  id: string;
  name: string;
  description: string;
  template: 'minimal' | 'branded' | 'elegant' | 'fun' | 'compact';
}

export interface QRCode {
  id: string;
  tableId: string;
  table: Table;
  design: QRDesign;
  url: string;
  generatedAt: string;
}

export interface SalesStats {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  dailySales: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    sales: number;
    percentage: number;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  isSuccess: boolean;
  isFailure: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Coupon Types
export interface Coupon {
  id: string;
  name: string;
  description: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  minimumOrderAmount?: number;
  usageLimit?: number;
  usageCount: number;
  availableFor: 'all' | 'specific';
  customerIds?: string[];
  customers?: Customer[];
  isActive: boolean;
  startDate: string;
  endDate: string;
  notifyByEmail: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface LoyaltyConfig {
  id: string;
  pointsPerAmount: number; // e.g., 100 = 1 point
  pointValue: number; // e.g., 1 point = 0.25 rs
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  type: 'free_item' | 'fixed_discount' | 'percentage_discount';
  pointsRequired: number;
  rewardValue: number; // either item price, discount amount, or percentage
  applicableItems?: string[]; // for free_item rewards
  maxDiscountAmount?: number; // for percentage discounts
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  validUntil?: string;
  expirationDays?: number; // Number of days from creation when reward expires
  createdAt: string;
  updatedAt: string;
}

export interface CustomerLoyalty {
  id: string;
  customerId: string;
  customerEmail: string;
  totalPoints: number;
  pointsEarned: number;
  pointsRedeemed: number;
  lastUpdated: string;
  createdAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerLoyaltyId: string;
  customerId: string;
  customerEmail: string;
  type: 'earned' | 'redeemed';
  points: number;
  orderId?: string;
  rewardId?: string;
  description: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  status: 'active' | 'inactive';
  loyaltyPoints?: number;
  createdAt: string;
}

export interface CreateCouponRequest {
  name: string;
  description: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  minimumOrderAmount?: number;
  usageLimit?: number;
  availableFor: 'all' | 'specific';
  customerIds?: string[];
  isActive: boolean;
  startDate: string;
  endDate: string;
  notifyByEmail: boolean;
}

export interface UpdateCouponRequest extends Partial<CreateCouponRequest> {
  id: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  discountAmount: number;
  message: string;
  coupon?: Coupon;
}

export interface ApiResponse<T>{
    isSuccess:boolean,
    data: T,
    error: Error
}

interface Error{
    code:string,
    description
}

export interface DataListResponse<T>{
  totalRecords : number,
  records : T
}

export interface DataListRequest{
  pageNumber:number,
  pageSize:number,
  searchTerm?:string
}

export interface SelectListItem{
  text:string;
  value:string;
}