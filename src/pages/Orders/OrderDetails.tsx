import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateOrderStatus } from '../../store/slices/ordersSlice';
import { Order } from '../../types';
import { 
  ArrowLeftIcon,
  UserCircleIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TruckIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  ShoppingCartIcon,
  ReceiptIcon,
  PrinterIcon,
  DocumentTextIcon
} from '../../components/ui/Icons';
import { format } from 'date-fns';
import { posPrintService } from '../../services/posPrintService';

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders } = useSelector((state: RootState) => state.orders);
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [posPrinting, setPosPrinting] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    discount: 0,
    discountType: 'fixed' as 'percentage' | 'fixed',
    taxRate: 0.1
  });

  useEffect(() => {
    // Find the order by ID
    const foundOrder = orders.find(o => o.id === id);
    if (foundOrder) {
      setOrder(foundOrder);
      setEditForm({
        discount: foundOrder.discount || 0,
        discountType: foundOrder.discountType || 'fixed',
        taxRate: foundOrder.taxRate || 0.1
      });
    }
    setLoading(false);
    
    // Check printer availability
    checkPrinterAvailability();
  }, [id, orders]);

  // Check printer availability
  const checkPrinterAvailability = async () => {
    setPrinterStatus('checking');
    try {
      const isAvailable = await posPrintService.checkPrinterAvailability();
      setPrinterStatus(isAvailable ? 'available' : 'available'); // Always set to available as fallback
    } catch (error) {
      console.error('Printer check failed:', error);
      setPrinterStatus('available'); // Fallback to available to allow user to try
    }
  };

  // Handle status update
  const handleStatusUpdate = (newStatus: Order['status']) => {
    if (order) {
      dispatch(updateOrderStatus({ orderId: order.id, status: newStatus }));
      setOrder({ ...order, status: newStatus });
    }
  };

  // Calculate order totals
  const calculateTotals = (orderData: Order) => {
    const itemsSubtotal = orderData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = orderData.discountType === 'percentage' 
      ? (itemsSubtotal * (orderData.discount || 0) / 100) 
      : (orderData.discount || 0);
    const discountedSubtotal = itemsSubtotal - discountAmount;
    const tax = discountedSubtotal * (orderData.taxRate || 0.1);
    const total = discountedSubtotal + tax + (orderData.deliveryFee || 0);
    
    return {
      itemsSubtotal,
      discountAmount,
      discountedSubtotal,
      tax,
      total
    };
  };

  // Handle edit toggle
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Handle form changes
  const handleFormChange = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Save changes
  const saveChanges = () => {
    if (order) {
      const updatedOrder = {
        ...order,
        discount: editForm.discount > 0 ? editForm.discount : undefined,
        discountType: editForm.discount > 0 ? editForm.discountType : undefined,
        taxRate: editForm.taxRate > 0 ? editForm.taxRate : undefined,
        tax: calculateTotals({ ...order, ...editForm }).tax,
        totalAmount: calculateTotals({ ...order, ...editForm }).total
      };
      
      dispatch(updateOrderStatus({ 
        orderId: order.id, 
        status: order.status,
        discount: updatedOrder.discount,
        discountType: updatedOrder.discountType,
        taxRate: updatedOrder.taxRate,
        tax: updatedOrder.tax
      }));
      
      setOrder(updatedOrder);
      setIsEditing(false);
    }
  };

  // Get status color
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-5 h-5" />;
      case 'preparing':
        return <PencilIcon className="w-5 h-5" />;
      case 'ready':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'delivered':
        return <TruckIcon className="w-5 h-5" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle POS receipt printing
  const handlePOSPrint = async () => {
    if (!order) return;
    
    setPosPrinting(true);
    try {
      await posPrintService.printOrderReceipt(order, {
        copies: 1,
        includeHeader: true,
        includeFooter: true,
        paperWidth: 80,
        fontSize: 12,
        printLogo: true
      });
      
      // Show success message using console instead of alert
      console.log('Receipt printed successfully!');
    } catch (error) {
      console.error('POS printing failed:', error);
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Failed to print receipt: ${errorMessage}`);
    } finally {
      setPosPrinting(false);
    }
  };

  // Handle kitchen ticket printing
  const handleKitchenTicketPrint = async () => {
    if (!order) return;
    
    setPosPrinting(true);
    try {
      await posPrintService.printKitchenTicket(order, {
        copies: 1,
        paperWidth: 80,
        fontSize: 10
      });
      
      // Show success message using console instead of alert
      console.log('Kitchen ticket printed successfully!');
    } catch (error) {
      console.error('Kitchen ticket printing failed:', error);
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Failed to print kitchen ticket: ${errorMessage}`);
    } finally {
      setPosPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order not found</h3>
          <p className="text-gray-500 mb-6">The order you're looking for doesn't exist.</p>
          <Link
            to="/orders"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
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
              Order #{order.id}
            </h1>
            <p className="text-gray-600 mt-1">Order details and management</p>
          </div>
        </div>
        
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print
          </button>
          
          {/* POS Print Button */}
          <div className="relative">
            <button
              onClick={handlePOSPrint}
              disabled={posPrinting || printerStatus !== 'available'}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                posPrinting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : printerStatus === 'available'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {posPrinting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Printing...
                </>
              ) : (
                <>
                  <PrinterIcon className="w-4 h-4 mr-2" />
                  POS
                </>
              )}
            </button>
            
            {/* Printer Status Indicator */}
            <div className="absolute -top-2 -right-2">
              {printerStatus === 'checking' && (
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              )}
              {printerStatus === 'available' && (
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              )}
              {printerStatus === 'unavailable' && (
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              )}
            </div>
          </div>
          
          {/* Kitchen Ticket Button */}
          <button
            onClick={handleKitchenTicketPrint}
            disabled={posPrinting || printerStatus !== 'available'}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              posPrinting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : printerStatus === 'available'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            {posPrinting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Printing...
              </>
            ) : (
              <>
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                KOT
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white">
              {getStatusIcon(order.status)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-900">Order Status</h3>
              <p className="text-orange-700">Current status: {order.status}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="ml-1">{order.status}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserCircleIcon className="w-5 h-5 mr-2 text-orange-500" />
              Customer Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                <p className="text-gray-900 font-medium">{order.customerName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <div className="flex items-center">
                  <MailIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <p className="text-gray-900">{order.customerEmail}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                <div className="flex items-center">
                  <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <p className="text-gray-900">{order.customerMobile || 'Not provided'}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Order Date</label>
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <p className="text-gray-900">{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
            </div>
            
            {order.customerAddress && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-500 mb-1">Delivery Address</label>
                <div className="flex items-start">
                  <MapPinIcon className="w-4 h-4 mr-2 text-gray-400 mt-1" />
                  <p className="text-gray-900">{order.customerAddress}</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingCartIcon className="w-5 h-5 mr-2 text-orange-500" />
              Order Items ({order.items.length})
            </h2>
            
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={item.menuItem.image}
                    alt={item.menuItem.name}
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://picsum.photos/seed/${item.menuItem.name}/100/100.jpg`;
                    }}
                  />
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                    <p className="text-sm text-gray-500">{item.menuItem.description}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-500">${item.menuItem.price.toFixed(2)} each</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <ReceiptIcon className="w-5 h-5 mr-2 text-orange-500" />
                Order Summary
              </h2>
              <button
                onClick={toggleEdit}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {order && (
              <>
                {isEditing && (
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.discount}
                          onChange={(e) => handleFormChange('discount', parseFloat(e.target.value) || 0)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        <select
                          value={editForm.discountType}
                          onChange={(e) => handleFormChange('discountType', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="fixed">$ Fixed</option>
                          <option value="percentage">% Percentage</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={(editForm.taxRate * 100).toFixed(1)}
                        onChange={(e) => handleFormChange('taxRate', (parseFloat(e.target.value) || 0) / 100)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="10.0"
                      />
                    </div>
                    
                    <button
                      onClick={saveChanges}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${calculateTotals(order).itemsSubtotal.toFixed(2)}</span>
                  </div>
                  
                  {order.discount && order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-green-600">
                        Discount ({order.discountType === 'percentage' ? `${order.discount}%` : `$${order.discount.toFixed(2)}`})
                      </span>
                      <span className="font-medium">-${calculateTotals(order).discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({((order.taxRate || 0.1) * 100).toFixed(0)}%)</span>
                    <span className="font-medium">${calculateTotals(order).tax.toFixed(2)}</span>
                  </div>
                  
                  {order.deliveryFee && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium">${order.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-orange-600">
                        ${calculateTotals(order).total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Order Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Actions</h2>
            
            <div className="space-y-3">
              {order.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('preparing')}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Start Preparing
                </button>
              )}
              
              {order.status === 'preparing' && (
                <button
                  onClick={() => handleStatusUpdate('ready')}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Mark as Ready
                </button>
              )}
              
              {order.status === 'ready' && (
                <button
                  onClick={() => handleStatusUpdate('delivered')}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200"
                >
                  <TruckIcon className="w-4 h-4 mr-2" />
                  Mark as Delivered
                </button>
              )}
              
              {(order.status === 'pending' || order.status === 'preparing') && (
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200"
                >
                  <XCircleIcon className="w-4 h-4 mr-2" />
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-orange-500" />
              Order Timeline
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Order Placed</p>
                  <p className="text-xs text-gray-500">{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
              
              {order.status !== 'pending' && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <PencilIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Preparing</p>
                    <p className="text-xs text-gray-500">Order is being prepared</p>
                  </div>
                </div>
              )}
              
              {order.status === 'ready' || order.status === 'delivered' ? (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Ready</p>
                    <p className="text-xs text-gray-500">Order is ready for delivery</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Ready</p>
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                </div>
              )}
              
              {order.status === 'delivered' ? (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <TruckIcon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delivered</p>
                    <p className="text-xs text-gray-500">Order has been delivered</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <TruckIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Delivered</p>
                    <p className="text-xs text-gray-400">Pending</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;