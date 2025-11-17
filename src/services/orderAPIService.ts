import { Order, ORDER_STATUS } from '../types';
import { store } from '../store';
import { addExternalOrder, updateOrderStatus } from '../store/slices/ordersSlice';

export interface ExternalOrderData {
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  customerAddress: string;
  items: {
    menuItemId: string;
    quantity: number;
    price: number;
  }[];
  paymentMode: 'Cash' | 'Card' | 'Online';
  deliveryTime?: number;
  deliveryFee?: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  taxRate?: number;
  notes?: string;
}

class OrderAPIService {
  // Simulate receiving an order from external app
  async receiveExternalOrder(orderData: ExternalOrderData): Promise<Order> {
    try {
      // In a real implementation, this would be an API endpoint
      // For now, we'll simulate the process
      
      // Calculate total amount
      const itemsSubtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmount = orderData.discountType === 'percentage' 
        ? (itemsSubtotal * (orderData.discount || 0) / 100) 
        : (orderData.discount || 0);
      const discountedSubtotal = itemsSubtotal - discountAmount;
      const tax = discountedSubtotal * (orderData.taxRate || 0.1);
      const totalAmount = discountedSubtotal + tax + (orderData.deliveryFee || 0);
      
      // Get menu items from store to create complete order items
      const state = store.getState();
      const menuItems = state.menuItems.items;
      
      const orderItems = orderData.items.map((item, index) => {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
        if (!menuItem) {
          throw new Error(`Menu item with ID ${item.menuItemId} not found`);
        }
        
        return {
          id: `${Date.now()}-${index}`,
          menuItemId: item.menuItemId,
          menuItem,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        };
      });
      
      // Create the order
      const newOrder: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'source'> = {
        customerName: orderData.customerName,
        customerMobile: orderData.customerMobile,
        customerEmail: orderData.customerEmail,
        customerAddress: orderData.customerAddress,
        items: orderItems,
        totalAmount,
        status: ORDER_STATUS.PENDING, // New orders start as pending
        paymentMode: orderData.paymentMode,
        deliveryTime: orderData.deliveryTime,
        deliveryFee: orderData.deliveryFee,
        discount: orderData.discount,
        discountType: orderData.discountType,
        tax: tax,
        taxRate: orderData.taxRate,
        notes: orderData.notes,
      };
      
      // Dispatch to store
      store.dispatch(addExternalOrder(newOrder));
      
      // Return the created order (with ID and timestamps)
      const createdOrder: Order = {
        ...newOrder,
        id: Date.now().toString(),
        source: 'external',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Trigger notification for new order
      this.notifyNewOrder(createdOrder);
      
      return createdOrder;
    } catch (error) {
      console.error('Error processing external order:', error);
      throw error;
    }
  }
  
  // Update order status
  async updateOrderStatus(orderId: string, newStatus: Order['status']): Promise<Order> {
    try {
      // Get current order from store
      const state = store.getState();
      const order = state.orders.orders.find(o => o.id === orderId);
      
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }
      
      // Validate status transition
      if (!this.isValidStatusTransition(order.status, newStatus)) {
        throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
      }
      
      // Update order in store
      store.dispatch(updateOrderStatus({ orderId, status: newStatus }));
      
      // Get updated order
      const updatedState = store.getState();
      const updatedOrder = updatedState.orders.orders.find(o => o.id === orderId);
      
      if (!updatedOrder) {
        throw new Error('Failed to retrieve updated order');
      }
      
      // Trigger notification for status change
      this.notifyStatusChange(updatedOrder, order.status, newStatus);
      
      return updatedOrder;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
  
  // Accept order (change from pending to accepted)
  async acceptOrder(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, ORDER_STATUS.ACCEPTED);
  }
  
  // Start preparing order (change from accepted to preparing)
  async startPreparing(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, ORDER_STATUS.PREPARING);
  }
  
  // Mark order as ready (change from preparing to ready)
  async markReady(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, ORDER_STATUS.READY);
  }
  
  // Mark order as delivered (change from ready to delivered)
  async markDelivered(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, ORDER_STATUS.DELIVERED);
  }
  
  // Cancel order
  async cancelOrder(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, ORDER_STATUS.CANCELLED);
  }
  
  // Validate status transition
  private isValidStatusTransition(currentStatus: Order['status'], newStatus: Order['status']): boolean {
    const validTransitions: Record<Order['status'], Order['status'][]> = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED],
      [ORDER_STATUS.ACCEPTED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED, ORDER_STATUS.IN_KITCHEN],
      [ORDER_STATUS.IN_KITCHEN]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.READY]: [ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.DELIVERED]: [], // No transitions from delivered
      [ORDER_STATUS.CANCELLED]: [], // No transitions from cancelled
      [ORDER_STATUS.REJECTED]: [] // No transitions from rejected
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
  
  // Notify about status change
  private notifyStatusChange(order: Order, oldStatus: Order['status'], newStatus: Order['status']) {
    console.log('📋 Order status updated:', {
      id: order.id,
      customer: order.customerName,
      oldStatus,
      newStatus
    });
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Order Status Updated', {
        body: `Order #${order.id} for ${order.customerName} is now ${newStatus}`,
        icon: '/logo.svg',
        tag: order.id
      });
    }
  }
  
  // Simulate webhook endpoint for external apps
  async handleWebhook(orderData: ExternalOrderData): Promise<{ success: boolean; orderId?: string; message?: string }> {
    try {
      const order = await this.receiveExternalOrder(orderData);
      return {
        success: true,
        orderId: order.id,
        message: 'Order received successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process order'
      };
    }
  }
  
  // Notify about new order
  private notifyNewOrder(order: Order) {
    // In a real implementation, this could:
    // - Send push notifications
    // - Play sound notification
    // - Send email/SMS
    // - Update real-time dashboard
    
    console.log('🔔 New order received:', {
      id: order.id,
      customer: order.customerName,
      total: order.totalAmount,
      items: order.items.length,
      source: 'external'
    });
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Order Received', {
        body: `${order.customerName} - ${order.items.length} items - $${order.totalAmount.toFixed(2)}`,
        icon: '/logo.svg',
        tag: order.id
      });
    }
  }
  
  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}

// Export singleton instance
export const orderAPIService = new OrderAPIService();