import { GetMenuItemRequest } from "../pages/MenuItems";
import {
  ApiResponse,
  MenuCategory,
  DataListResponse,
  DataListRequest,
  MenuItem,
} from "../types";
import apiService from "./apiService";

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

class MenuService {
  private static instance: MenuService;

  static getInstance(): MenuService {
    if (!MenuService.instance) {
      MenuService.instance = new MenuService();
    }
    return MenuService.instance;
  }

  getCategories(
    request: DataListRequest
  ): Promise<ApiResponse<DataListResponse<MenuCategory[]>>> {
    return apiService.get<ApiResponse<DataListResponse<MenuCategory[]>>>(
      `${BASE_API_URL}/menu/get-categories?pageNumber=${request.pageNumber}&pageSize=${request.pageSize}&searchTerm=${request.searchTerm}`
    );
  }

  addCategory(
    name: string,
    description: string,
    color: string,
    icon: string,
    sortOrder: number
  ): Promise<ApiResponse<MenuCategory>> {
    return apiService.post<any, ApiResponse<MenuCategory>>(
      `${BASE_API_URL}/menu/add-category`,
      { name, description, color, icon, sortOrder }
    );
  }

  updateCategory(
    id: string,
    name: string,
    description: string,
    color: string,
    icon: string,
    sortOrder: number
  ): Promise<ApiResponse<any>> {
    return apiService.post<any, ApiResponse<any>>(
      `${BASE_API_URL}/menu/update-category`,
      { id, name, description, color, icon, sortOrder }
    );
  }
  deleteCategories(ids: string[]): Promise<ApiResponse<any>> {
    return apiService.post<any, ApiResponse<any>>(
      `${BASE_API_URL}/menu/delete-categories`,
      ids
    );
  }

  getMenuItems(
    request: GetMenuItemRequest
  ): Promise<ApiResponse<DataListResponse<MenuItem[]>>> {
    let url = `${BASE_API_URL}/menu/get-menu-items?pageNumber=${request.pageNumber}&pageSize=${request.pageSize}&searchTerm=${request.searchTerm}&isVeg=${request.isVeg}`;
    if(request.categoryId != null) {
      url = url.concat(`&categoryId=${request.categoryId}`)
    }
    return apiService.get<ApiResponse<DataListResponse<MenuItem[]>>>(
      url
    );
  }

  addMenuItem(
    name: string,
    description: string,
    price: number,
    categoryId: string,
    image: string,
    isVeg:boolean,
    sortOrder:number
  ): Promise<ApiResponse<MenuItem>> {
    return apiService.post<any, ApiResponse<MenuItem>>(
      `${BASE_API_URL}/menu/add-item`,
      { name, description, price, categoryId, image,isVeg,sortOrder }
    );
  }

  updateMenuItem(
    id:string,
    name: string,
    description: string,
    price: number,
    categoryId: string,
    image: string,
    isVeg:boolean,
    sortOrder:number
  ): Promise<ApiResponse<any>> {
    return apiService.post<any, ApiResponse<any>>(
      `${BASE_API_URL}/menu/update-item`,
      { id,name, description, price, categoryId, image,isVeg,sortOrder }
    );
  }

  deleteMenuItems(ids: string[]): Promise<ApiResponse<any>> {
    return apiService.post<any, ApiResponse<any>>(
      `${BASE_API_URL}/menu/delete-items`,
      ids
    );
  }
}
export const menuService = MenuService.getInstance();
