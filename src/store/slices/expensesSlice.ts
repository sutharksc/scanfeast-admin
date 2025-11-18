import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import expenseService from '../../services/expenseService';
import { 
  Expense, 
  CreateExpenseRequest, 
  UpdateExpenseRequest, 
  ExpenseFilters,
  ProfitLossData,
  ProfitLossFilters,
  ApiResponse,
  PaginatedResponse 
} from '../../types';

interface ExpenseState {
  expenses: Expense[];
  currentExpense: Expense | null;
  profitLossData: ProfitLossData | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: ExpenseFilters;
}

const initialState: ExpenseState = {
  expenses: [],
  currentExpense: null,
  profitLossData: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
};

// Async thunks
export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async ({ filters, pagination }: { filters?: ExpenseFilters; pagination?: { page: number; limit: number } }) => {
    const response = await expenseService.getExpenses(filters, pagination);
    return response;
  }
);

export const fetchExpenseById = createAsyncThunk(
  'expenses/fetchExpenseById',
  async (id: string) => {
    const response = await expenseService.getExpenseById(id);
    return response;
  }
);

export const createExpense = createAsyncThunk(
  'expenses/createExpense',
  async (expenseData: CreateExpenseRequest) => {
    const response = await expenseService.createExpense(expenseData);
    return response;
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/updateExpense',
  async (expenseData: UpdateExpenseRequest) => {
    const response = await expenseService.updateExpense(expenseData);
    return response;
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async (id: string) => {
    await expenseService.deleteExpense(id);
    return id;
  }
);

export const fetchProfitLossData = createAsyncThunk(
  'expenses/fetchProfitLossData',
  async (filters: ProfitLossFilters) => {
    const response = await expenseService.getProfitLossData(filters);
    return response;
  }
);

export const uploadExpenseAttachment = createAsyncThunk(
  'expenses/uploadAttachment',
  async (file: File) => {
    const response = await expenseService.uploadExpenseAttachment(file);
    return response;
  }
);

// Slice
const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentExpense: (state) => {
      state.currentExpense = null;
    },
    setFilters: (state, action: PayloadAction<ExpenseFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      state.pagination.page = action.payload.page;
      state.pagination.limit = action.payload.limit;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action: PayloadAction<PaginatedResponse<Expense>>) => {
        state.loading = false;
        state.expenses = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch expenses';
      })
      
      // Fetch expense by ID
      .addCase(fetchExpenseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseById.fulfilled, (state, action: PayloadAction<ApiResponse<Expense>>) => {
        state.loading = false;
        state.currentExpense = action.payload.data;
      })
      .addCase(fetchExpenseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch expense';
      })
      
      // Create expense
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action: PayloadAction<ApiResponse<Expense>>) => {
        state.loading = false;
        state.expenses.unshift(action.payload.data);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create expense';
      })
      
      // Update expense
      .addCase(updateExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state, action: PayloadAction<ApiResponse<Expense>>) => {
        state.loading = false;
        const index = state.expenses.findIndex(expense => expense.id === action.payload.data.id);
        if (index !== -1) {
          state.expenses[index] = action.payload.data;
        }
        if (state.currentExpense?.id === action.payload.data.id) {
          state.currentExpense = action.payload.data;
        }
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update expense';
      })
      
      // Delete expense
      .addCase(deleteExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.expenses = state.expenses.filter(expense => expense.id !== action.payload);
        if (state.currentExpense?.id === action.payload) {
          state.currentExpense = null;
        }
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete expense';
      })
      
      // Fetch profit & loss data
      .addCase(fetchProfitLossData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfitLossData.fulfilled, (state, action: PayloadAction<ApiResponse<ProfitLossData>>) => {
        state.loading = false;
        state.profitLossData = action.payload.data;
      })
      .addCase(fetchProfitLossData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profit & loss data';
      })
      
      // Upload attachment
      .addCase(uploadExpenseAttachment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadExpenseAttachment.fulfilled, (state, action: PayloadAction<ApiResponse<{ url: string }>>) => {
        state.loading = false;
        // The attachment URL will be handled in the component
      })
      .addCase(uploadExpenseAttachment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to upload attachment';
      });
  },
});

export const {
  clearError,
  clearCurrentExpense,
  setFilters,
  clearFilters,
  setPagination,
} = expenseSlice.actions;

export default expenseSlice.reducer;