import { CustomerInfo } from "../pages/Orders/CreateOrder";
import { ApiResponse } from "../types";
import apiService from "./apiService";

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

class UserService {
  private static instance: UserService;

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  fetchCustomers(phoneNumber:string): Promise<ApiResponse<CustomerInfo[]>> {
    return apiService.get<ApiResponse<CustomerInfo[]>>(
      `${BASE_API_URL}/user/get-users-by-phone?phoneNumber=${phoneNumber}`
    );
  }
}
export const userService = UserService.getInstance();
