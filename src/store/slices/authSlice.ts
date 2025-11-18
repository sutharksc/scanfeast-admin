import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ApiResponse, User } from "../../types";
import apiService from "../../services/apiService";
import { authService } from "../../services/authService";
import { RootState } from "..";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthInfo {
  token: string;
  user: User;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

//
// 🔹 Login user
//
const BASE_API_URL = "https://localhost:7240/api"
export const loginAsync = createAsyncThunk(
  "auth/login",
  async ({ phone, password }: { phone: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.login(phone, password);
      const { user, token } = response.data;
      localStorage.setItem("auth", JSON.stringify({ user, token }));
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.description || "Login failed");
    }
  }
);

export const loginWithGoogleAsync = createAsyncThunk(
  "auth/login",
  async (accessToken:string, { rejectWithValue }) => {
    try {debugger;
      const response = await authService.loginWithGoogle(accessToken);
      const { user, token } = response.data;
      localStorage.setItem("auth", JSON.stringify({ user, token }));
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.description || "Login failed");
    }
  }
);

//
// 🔹 Logout user
//
export const logoutAsync = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("auth");
});

//
// 🔹 Verify token on first load
//
export const checkAuth = createAsyncThunk(
  "/api/auth/checkAuth",
  async (_, thunkAPI) => {
    // Get entire Redux state
    const state = thunkAPI.getState();  

    // If you have typed RootState
    // const state = thunkAPI.getState() as RootState;

    // Access token from auth slice
    const authToken :any= (state as RootState).auth.token;

    if (!authToken) {
      return thunkAPI.rejectWithValue("No token found");
    }

    // Now you can call API with this token
    const response = await apiService.post<{ token: string }, ApiResponse<AuthInfo>>(
      `${BASE_API_URL}/auth/verify-token`,
      { token:authToken }
    );

    const { user, token } = response.data;

    localStorage.setItem("auth", JSON.stringify({ user, token }));

    return { user, token };
  }
);

//
// 🔹 Slice
//
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })

      // Logout
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })

      // Check Auth (verify token)
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
