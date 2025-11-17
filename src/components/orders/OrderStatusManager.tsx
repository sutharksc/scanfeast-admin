import React from 'react';
import { Order } from '../../types';
import { useDispatch } from 'react-redux';
import { 
  acceptOrder, 
  rejectOrder, 
  moveToKitchen, 
  markAsReady, 
  markAsDelivered 
} from '../../store/slices/ordersSlice';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  FireIcon, 
  TruckIcon,
  EyeIcon 
} from '../ui/Icons';

interface OrderStatusManagerProps {
  order: Order;
  onViewDetails?: (order: Order) => void;
}

const OrderStatusManager: React.FC<OrderStatusManagerProps> = ({ 
  order, 
  onViewDetails 
}) => {
  const dispatch = useDispatch();

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in-kitchen':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />;
      case 'in-kitchen':
        return <FireIcon className="w-4 h-4" />;
      case 'ready':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'delivered':
        return <TruckIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'in-kitchen':
        return 'In Kitchen';
      case 'ready':
        return 'Ready for Pickup';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  const handleAcceptOrder = () => {
    dispatch(acceptOrder(order.id));
  };

  const handleRejectOrder = () => {
    if (window.confirm('Are you sure you want to reject this order?')) {
      dispatch(rejectOrder(order.id));
    }
  };

  const handleMoveToKitchen = () => {
    dispatch(moveToKitchen(order.id));
  };

  const handleMarkAsReady = () => {
    dispatch(markAsReady(order.id));
  };

  const handleMarkAsDelivered = () => {
    dispatch(markAsDelivered(order.id));
  };

  const renderActionButtons = () => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex space-x-2">
            <button
              onClick={handleAcceptOrder}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Accept
            </button>
            <button
              onClick={handleRejectOrder}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <XCircleIcon className="w-4 h-4 mr-1" />
              Reject
            </button>
          </div>
        );
      
      case 'accepted':
        return (
          <div className="flex space-x-2">
            <button
              onClick={handleMoveToKitchen}
              className="px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors flex items-center"
            >
              <FireIcon className="w-4 h-4 mr-1" />
              Send to Kitchen
            </button>
            <button
              onClick={handleMarkAsDelivered}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <TruckIcon className="w-4 h-4 mr-1" />
              Mark Delivered
            </button>
          </div>
        );
      
      case 'in-kitchen':
        return (
          <div className="flex space-x-2">
            <button
              onClick={handleMarkAsReady}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Mark as Ready
            </button>
          </div>
        );
      
      case 'ready':
        return (
          <div className="flex space-x-2">
            <button
              onClick={handleMarkAsDelivered}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <TruckIcon className="w-4 h-4 mr-1" />
              Mark Delivered
            </button>
          </div>
        );
      
      case 'delivered':
      case 'rejected':
        return (
          <span className="text-sm text-gray-500">Order completed</span>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            <span>{getStatusText(order.status)}</span>
          </div>
          {order.source === 'external' && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              External
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          #{order.id}
        </span>
      </div>

      <div className="mb-3">
        <h3 className="font-semibold text-gray-900">{order.customerName}</h3>
        <p className="text-sm text-gray-600">{order.customerMobile}</p>
        <p className="text-sm text-gray-500">{order.customerEmail}</p>
      </div>

      <div className="mb-3">
        <div className="text-sm text-gray-600 mb-1">
          {order.items.length} items • ${order.totalAmount.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">
          {new Date(order.createdAt).toLocaleString()}
        </div>
      </div>

      {order.notes && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
          <strong>Note:</strong> {order.notes}
        </div>
      )}

      <div className="flex items-center justify-between">
        {renderActionButtons()}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(order)}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <EyeIcon className="w-4 h-4 mr-1" />
            View
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderStatusManager;