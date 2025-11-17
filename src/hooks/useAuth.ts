import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { loginAsync, logoutAsync, clearError, checkAuth } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  const login = async (phone: string, password: string) => {
    try {
      const result = await dispatch(loginAsync({ phone, password }) as any);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    dispatch(logoutAsync() as any);
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  const checkAuthentication = () => {
    dispatch(checkAuth());
  };

  const hasPermission = (page: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    if (!user) return false;
    if (user.roles.includes("SuperAdmin")) return true;
    
    const permission = user.permissions.find(p => p.page === page);
    if (!permission) return false;
    
    switch (action) {
      case 'view':
        return permission.canView;
      case 'create':
        return permission.canCreate;
      case 'edit':
        return permission.canEdit;
      case 'delete':
        return permission.canDelete;
      default:
        return false;
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    clearError: clearAuthError,
    checkAuth: checkAuthentication,
    hasPermission,
  };
};