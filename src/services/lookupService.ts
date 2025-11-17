import { useSelector } from "react-redux";
import { ApiResponse, SelectListItem } from "../types";
import apiService from "./apiService";
import { RootState } from "../store";

export interface States{
    id:number
    name:string
    code:string
} 

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL

export class LookupService {
  private static instance: LookupService;

  static getInstance(): LookupService {
    if (!LookupService.instance) {
      LookupService.instance = new LookupService();
    }
    return LookupService.instance;
  }

  getStates(): Promise<ApiResponse<States[]>> {
  return apiService.get<ApiResponse<States[]>>(`${BASE_API_URL}/lookup/states`);
}

getMenuCategories() : Promise<ApiResponse<SelectListItem[]>> {
  return apiService.get<ApiResponse<SelectListItem[]>>(`${BASE_API_URL}/lookup/get-menu-categories`);
}

}

export const lookupService = LookupService.getInstance();