import { AuthInfo } from "../store/slices/authSlice";
import { ApiResponse } from "../types";
import apiService from "./apiService";

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(
    phoneNumber: string,
    password: string
  ): Promise<ApiResponse<AuthInfo>> {
    try {
      const response = await apiService.post<any, ApiResponse<AuthInfo>>(
        `${BASE_API_URL}/auth/login`,
        { phoneNumber, password, userType: 1 }
      );
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async loginWithGoogle(googleAccessToken: string): Promise<ApiResponse<AuthInfo>> {
    try {
      const response = await apiService.post<any, ApiResponse<AuthInfo>>(
  `${BASE_API_URL}/auth/restaurent-login-with-google`,
  googleAccessToken ,
  { headers: { "Content-Type": "application/json" } }
);
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }
}
export const authService = AuthService.getInstance();
