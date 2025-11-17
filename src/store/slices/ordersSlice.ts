import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order, OrderItem } from '../../types';

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

const generateMockOrders = (): Order[] => {
  const orders: Order[] = [];
  const customers = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];
  const statuses: Order['status'][] = ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'];
  const paymentModes: Order['paymentMode'][] = ['Cash', 'Card', 'Online'];
  const sources: Order['source'][] = ['internal', 'external'];
  
  for (let i = 1; i <= 50; i++) {
    const items: OrderItem[] = [
      {
        id: `${i}-1`,
        menuItemId: '1',
        menuItem: {
          id: '1',
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce with caesar dressing',
          price: 8.99,
          image: 'https://via.placeholder.com/150x150?text=Salad',
          isVegetarian: true,
          categoryId: '1',
          sortOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        quantity: Math.floor(Math.random() * 3) + 1,
        price: 8.99,
        subtotal: 0,
      },
      {
        id: `${i}-2`,
        menuItemId: '4',
        menuItem: {
          id: '4',
          name: 'Grilled Salmon',
          description: 'Fresh Atlantic salmon with herbs',
          price: 18.99,
          image: 'https://via.placeholder.com/150x150?text=Salmon',
          isVegetarian: false,
          categoryId: '2',
          sortOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        quantity: Math.floor(Math.random() * 2) + 1,
        price: 18.99,
        subtotal: 0,
      },
    ];
    
    items.forEach(item => {
      item.subtotal = item.quantity * item.price;
    });
    
    const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const hasDiscount = Math.random() > 0.7; // 30% of orders have discount
    const discount = hasDiscount ? (Math.random() > 0.5 ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 15) + 5) : 0;
    const discountType = hasDiscount ? (Math.random() > 0.5 ? 'percentage' as const : 'fixed' as const) : undefined;
    const discountAmount = discountType === 'percentage' ? (itemsSubtotal * discount / 100) : discount;
    const discountedSubtotal = itemsSubtotal - discountAmount;
    const taxRate = 0.1;
    const tax = discountedSubtotal * taxRate;
    const deliveryFee = Math.random() > 0.5 ? 5.99 : undefined;
    const totalAmount = discountedSubtotal + tax + (deliveryFee || 0);
    
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
    
    orders.push({
      id: i.toString(),
      customerName: customers[Math.floor(Math.random() * customers.length)],
      customerMobile: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      customerEmail: `customer${i}@example.com`,
      customerAddress: `${Math.floor(Math.random() * 999)} Main St, City, State`,
      items,
      totalAmount,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      paymentMode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
      deliveryTime: Math.random() > 0.5 ? [5, 10, 15, 30][Math.floor(Math.random() * 4)] : undefined,
      deliveryFee,
      discount: hasDiscount ? discount : undefined,
      discountType,
      tax,
      taxRate,
      notes: Math.random() > 0.7 ? 'Extra napkins please' : undefined,
      source: sources[Math.floor(Math.random() * sources.length)],
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
  }
  
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const initialState: OrdersState = {
  orders: generateMockOrders(),
  loading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    addOrder: (state, action: PayloadAction<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newOrder: Order = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.orders.unshift(newOrder);
    },
    addExternalOrder: (state, action: PayloadAction<Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'source'>>) => {
      const newOrder: Order = {
        ...action.payload,
        id: Date.now().toString(),
        source: 'external',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.orders.unshift(newOrder);
    },
    updateOrder: (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex(order => order.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = {
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: Order['status']; deliveryTime?: number; discount?: number; discountType?: 'percentage' | 'fixed'; taxRate?: number; tax?: number }>) => {
      const order = state.orders.find(o => o.id === action.payload.orderId);
      if (order) {
        order.status = action.payload.status;
        if (action.payload.deliveryTime !== undefined) {
          order.deliveryTime = action.payload.deliveryTime;
        }
        if (action.payload.discount !== undefined) {
          order.discount = action.payload.discount;
        }
        if (action.payload.discountType !== undefined) {
          order.discountType = action.payload.discountType;
        }
        if (action.payload.taxRate !== undefined) {
          order.taxRate = action.payload.taxRate;
        }
        if (action.payload.tax !== undefined) {
          order.tax = action.payload.tax;
        }
        order.updatedAt = new Date().toISOString();
      }
    },
    acceptOrder: (state, action: PayloadAction<string>) => {
      const order = state.orders.find(o => o.id === action.payload);
      if (order && order.status === 'pending') {
        order.status = 'accepted';
        order.updatedAt = new Date().toISOString();
      }
    },
    rejectOrder: (state, action: PayloadAction<string>) => {
      const order = state.orders.find(o => o.id === action.payload);
      if (order && order.status === 'pending') {
        order.status = 'rejected';
        order.updatedAt = new Date().toISOString();
      }
    },
    moveToKitchen: (state, action: PayloadAction<string>) => {
      const order = state.orders.find(o => o.id === action.payload);
      if (order && order.status === 'accepted') {
        order.status = 'in-kitchen';
        order.updatedAt = new Date().toISOString();
      }
    },
    markAsReady: (state, action: PayloadAction<string>) => {
      const order = state.orders.find(o => o.id === action.payload);
      if (order && order.status === 'in-kitchen') {
        order.status = 'ready';
        order.updatedAt = new Date().toISOString();
      }
    },
    markAsDelivered: (state, action: PayloadAction<string>) => {
      const order = state.orders.find(o => o.id === action.payload);
      if (order && (order.status === 'ready' || order.status === 'accepted')) {
        order.status = 'delivered';
        order.updatedAt = new Date().toISOString();
      }
    },
    deleteOrder: (state, action: PayloadAction<string>) => {
      state.orders = state.orders.filter(order => order.id !== action.payload);
    },
  },
});

export const { 
  addOrder, 
  addExternalOrder,
  updateOrder, 
  updateOrderStatus, 
  acceptOrder,
  rejectOrder,
  moveToKitchen,
  markAsReady,
  markAsDelivered,
  deleteOrder 
} = ordersSlice.actions;
export default ordersSlice.reducer;