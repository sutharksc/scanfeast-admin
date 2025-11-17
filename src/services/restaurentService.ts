import { ApiResponse, DataListRequest, DataListResponse, Table } from "../types";
import { Restaurant } from "../types/restaurentTypes";
import apiService from "./apiService";

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;
class RestaurentService{
    private static instance: RestaurentService;
    
      static getInstance(): RestaurentService {
        if (!RestaurentService.instance) {
          RestaurentService.instance = new RestaurentService();
        }
        return RestaurentService.instance;
      }
    
      getRestaurentById(id:string): Promise<ApiResponse<Restaurant>> {
      return apiService.get<ApiResponse<Restaurant>>(`${BASE_API_URL}/restaurent/get-by-id/8FE570B2-6CEE-4060-8E34-06D8C2F05F24`);
    }

    update(data:any) : Promise<ApiResponse<any>>{
      return apiService.post<any , ApiResponse<any>>(`${BASE_API_URL}/restaurent/update`,data);
    }

    getTables(request:DataListRequest) : Promise<ApiResponse<DataListResponse<Table[]>>>{
      return apiService.get<ApiResponse<DataListResponse<Table[]>>>(`${BASE_API_URL}/restaurent/get-tables?pageNumber=${request.pageNumber}&pageSize=${request.pageSize}&searchTerm=${request.searchTerm}`);
    }

    addTable(tableType:number,tableNumber:string,capacity:number,description:string): Promise<ApiResponse<Table>> {
      return apiService.post<any , ApiResponse<any>>(`${BASE_API_URL}/restaurent/add-table`,{tableType,tableNumber,capacity,description});
    }

    updateTable(id:string,tableType:number,tableNumber:string,capacity:number,description:string): Promise<ApiResponse<Table>> {
      return apiService.post<any , ApiResponse<any>>(`${BASE_API_URL}/restaurent/update-table`,{id,tableType,tableNumber,capacity,description});
    }
    deleteTables(ids:string[]): Promise<ApiResponse<Table>> {
      return apiService.post<any , ApiResponse<any>>(`${BASE_API_URL}/restaurent/delete-tables`,ids);
    }
}

export const restaurentService = RestaurentService.getInstance();
