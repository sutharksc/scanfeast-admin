import apiService from './apiService';
import { 
  Expense, 
  CreateExpenseRequest, 
  UpdateExpenseRequest, 
  ExpenseFilters,
  ProfitLossData,
  ProfitLossFilters,
  ApiResponse,
  PaginatedResponse,
  PaginationParams 
} from '../types';

class ExpenseService {
  // Get all expenses with optional filters
  async getExpenses(filters?: ExpenseFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Expense>> {
    const params = { ...filters, ...pagination };
    return apiService.get<PaginatedResponse<Expense>>('/api/expenses', params);
  }

  // Get expense by ID
  async getExpenseById(id: string): Promise<ApiResponse<Expense>> {
    return apiService.get<ApiResponse<Expense>>(`/api/expenses/${id}`);
  }

  // Create new expense
  async createExpense(expenseData: CreateExpenseRequest): Promise<ApiResponse<Expense>> {
    return apiService.post<CreateExpenseRequest, ApiResponse<Expense>>('/api/expenses', expenseData);
  }

  // Update expense
  async updateExpense(expenseData: UpdateExpenseRequest): Promise<ApiResponse<Expense>> {
    return apiService.put<UpdateExpenseRequest, ApiResponse<Expense>>(`/api/expenses/${expenseData.id}`, expenseData);
  }

  // Delete expense
  async deleteExpense(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<ApiResponse<void>>(`/api/expenses/${id}`);
  }

  // Upload expense attachment
  async uploadExpenseAttachment(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post<FormData, ApiResponse<{ url: string }>>('/api/expenses/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Get profit & loss data
  async getProfitLossData(filters: ProfitLossFilters): Promise<ApiResponse<ProfitLossData>> {
    return apiService.get<ApiResponse<ProfitLossData>>('/api/reports/profit-loss', filters);
  }

  // Export expenses data
  async exportExpenses(filters?: ExpenseFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<Blob> {
    const params = { ...filters, format };
    const response = await apiService.get('/api/expenses/export', params, {
      responseType: 'blob',
    });
    return response;
  }

  // Export profit & loss report
  async exportProfitLoss(filters: ProfitLossFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<Blob> {
    const params = { ...filters, format };
    const response = await apiService.get('/api/reports/profit-loss/export', params, {
      responseType: 'blob',
    });
    return response;
  }

  // Get expense summary statistics
  async getExpenseSummary(filters?: ExpenseFilters): Promise<ApiResponse<{
    totalExpenses: number;
    averageExpense: number;
    expenseCount: number;
    expensesByType: Array<{
      type: string;
      amount: number;
      count: number;
    }>;
  }>> {
    return apiService.get<ApiResponse<any>>('/api/expenses/summary', filters);
  }
}

export default new ExpenseService();