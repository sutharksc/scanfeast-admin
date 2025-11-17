import { AuthInfo } from "../store/slices/authSlice";
import { ApiResponse } from "../types";
import apiService from "./apiService";

const BASE_API_URL = "https://localhost:7240/api"

class AuthService{
    private static instance: AuthService;

    static getInstance(): AuthService {
        if (!AuthService.instance) {
          AuthService.instance = new AuthService();
        }
        return AuthService.instance;
      }

       async login(phoneNumber:string,password:string): Promise<ApiResponse<AuthInfo>> {
    try {
      // Call login API
      const response = await apiService.post<any, ApiResponse<AuthInfo>>(`${BASE_API_URL}/auth/login`, {phoneNumber,password,userType:1});
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }
    
}
export const authService = AuthService.getInstance();