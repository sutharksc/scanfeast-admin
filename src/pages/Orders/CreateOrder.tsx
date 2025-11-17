import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addOrder } from '../../store/slices/ordersSlice';
import { MenuItem } from '../../types';
import { 
  ArrowLeftIcon,
  UserCircleIcon,
  MapPinIcon,
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
  PencilIcon
} from '../../components/ui/Icons';
import { userService } from '../../services/userService';

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  subtotal: number;
}

export interface CustomerInfo {
  id?:string | null;
  fullName: string;
  phoneNumber: string;
}

const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: menuItems } = useSelector((state: RootState) => state.menuItems);
  const { categories } = useSelector((state: RootState) => state.menuCategories);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: '',
    id: null,
    phoneNumber: ''
  });
  const [isDineIn, setIsDineIn] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [taxRate, setTaxRate] = useState(0.1); // 10% default tax

  // Filter menu items
  const filteredMenuItems = (menuItems || []).filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = discountType === 'percentage' ? (subtotal * discount / 100) : discount;
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * taxRate;
  const total = discountedSubtotal + tax;

  // Add item to order
  const addItemToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItem.id === menuItem.id);
    
    if (existingItem) {
      updateItemQuantity(menuItem.id, existingItem.quantity + 1);
    } else {
      setOrderItems([...orderItems, {
        menuItem,
        quantity: 1,
        subtotal: menuItem.price
      }]);
    }
  };

  // Update item quantity
  const updateItemQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(menuItemId);
      return;
    }
    
    setOrderItems(orderItems.map(item => {
      if (item.menuItem.id === menuItemId) {
        return {
          ...item,
          quantity,
          subtotal: item.menuItem.price * quantity
        };
      }
      return item;
    }));
  };

  // Remove item from order
  const removeItemFromOrder = (menuItemId: string) => {
    setOrderItems(orderItems.filter(item => item.menuItem.id !== menuItemId));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orderItems.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }
    
    if (!customerInfo.fullName || !customerInfo.phoneNumber) {
      alert('Please fill in customer information');
      return;
    }

    const order = {
      id: `ORD-${Date.now()}`,
      customerName: customerInfo.fullName,
      customerMobile: customerInfo.phoneNumber,
      customerEmail: "",
      customerAddress:  '',
      items: orderItems.map(item => ({
        id: `OI-${Date.now()}-${item.menuItem.id}`,
        menuItemId: item.menuItem.id,
        menuItem: item.menuItem,
        quantity: item.quantity,
        price: item.menuItem.price,
        subtotal: item.subtotal
      })),
      totalAmount: total,
      status: 'pending' as const,
      paymentMode: 'Cash' as const,
      deliveryFee:  undefined,
      discount: discount > 0 ? discount : undefined,
      discountType: discount > 0 ? discountType : undefined,
      tax: tax > 0 ? tax : undefined,
      taxRate: taxRate > 0 ? taxRate : undefined,
      source: 'internal' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dispatch(addOrder(order));
    navigate(`/orders/${order.id}`);
  };

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : `Category ${categoryId}`;
  };

    const handleCustomerSelect = (item) => {
    console.log("Selected: ", item);
  };

const fetchCustomers = async (phoneNumber:string) =>{debugger
  const response = await userService.fetchCustomers(phoneNumber);
  return response.data;
}
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/orders')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Orders
        </button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
            Create New Order
          </h1>
          <p className="text-gray-600 mt-1">Add items and create a customer order</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Items Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserCircleIcon className="w-5 h-5 mr-2 text-orange-500" />
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.fullName}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
<Autocomplete
  getItemValue={(item) => item.label}
  items={[
    { label: 'apple' },
    { label: 'banana' },
    { label: 'pear' }
  ]}
  renderItem={(item, isHighlighted) =>
    <div style={{ background: isHighlighted ? 'lightgray' : 'white' }}>
      {item.label}
    </div>
  }
  value={value}
  onChange={(e) => value = e.target.value}
  onSelect={(val) => value = val}
/>
                    {/* <Autocomplete
        fetchData={fetchCustomers}
        onSelect={handleCustomerSelect}
        defaultValue={customerInfo.phoneNumber} // prefilled form value
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      /> */}
                    {/* <input
                      type="tel"
                      value={customerInfo.phoneNumber}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phoneNumber: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="234 567 8900"
                    /> */}
                  </div>
                </div>
                
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <div className="relative">
                    <PencilIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <textarea value={customerInfo.phoneNumber} onChange={(e) => setCustomerInfo({ ...customerInfo, phoneNumber: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="eg. Extra Spicy" />
                   
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={isDineIn}
                        onChange={() => setIsDineIn(true)}
                        className="mr-2 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm">Dine In</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!isDineIn}
                        onChange={() => setIsDineIn(false)}
                        className="mr-2 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm">Pickup</span>
                    </label>
                  </div>
                </div>
              </div>
              
             
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShoppingCartIcon className="w-5 h-5 mr-2 text-orange-500" />
                Menu Items
              </h2>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 text-gray-400">🔍</div>
                  </div>
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredMenuItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://picsum.photos/seed/${item.name}/100/100.jpg`;
                        }}
                      />
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold text-orange-600">${item.price.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => addItemToOrder(item)}
                            className="inline-flex items-center px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded hover:bg-orange-600 transition-colors"
                          >
                            <PlusIcon className="w-3 h-3 mr-1" />
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredMenuItems.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No menu items found</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Discount & Tax Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 mr-2 text-orange-500" />
                Discount & Tax Settings
              </h2>
              
              <div className="space-y-4">
                {/* Discount Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="fixed">$ Fixed</option>
                      <option value="percentage">% Percentage</option>
                    </select>
                  </div>
                </div>
                
                {/* Tax Rate Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={(taxRate * 100).toFixed(1)}
                    onChange={(e) => setTaxRate((parseFloat(e.target.value) || 0) / 100)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="10.0"
                  />
                </div>
              </div>
            </div>
            
            {/* Current Order */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShoppingCartIcon className="w-5 h-5 mr-2 text-orange-500" />
                Current Order
              </h2>
              
              {orderItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCartIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No items added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{item.menuItem.name}</h4>
                        <p className="text-xs text-gray-500">${item.menuItem.price.toFixed(2)} each</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.menuItem.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          <MinusIcon className="w-3 h-3" />
                        </button>
                        
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.menuItem.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          <PlusIcon className="w-3 h-3" />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => removeItemFromOrder(item.menuItem.id)}
                          className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center ml-2"
                        >
                          <TrashIcon className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="font-semibold text-gray-900">${item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 mr-2 text-orange-500" />
                Order Summary
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-green-600">
                      Discount ({discountType === 'percentage' ? `${discount}%` : `$${discount.toFixed(2)}`})
                    </span>
                    <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(0)}%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-orange-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={orderItems.length === 0}
                className="w-full mt-6 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Create Order
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;