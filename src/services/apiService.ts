import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor(baseURL?: string) {
    this.axiosInstance = axios.create({
      baseURL: "",
      timeout: 10000,
    });

    // Request interceptor to attach token
    this.axiosInstance.interceptors.request.use(
      (config:any) => {
        const auth = localStorage.getItem("auth");
        if (auth) {
          const token = JSON.parse(auth)?.token ?? ""; 
          config.headers = config.headers ?? {}
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor (global error handling)
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error("API Error:", error.response.data);
          if (error.response.status === 401) {

            localStorage.removeItem("persist:root");

            // Get current page path
          const currentPath = encodeURIComponent(window.location.pathname + window.location.search);

          // Redirect to login with `next` param
          window.location.href = `/login?next=${currentPath}`;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, { ...config, params });
    return response.data;
  }

  async post<T, R = T>(url: string, data?: T, config?: AxiosRequestConfig): Promise<R> {
    const response = await this.axiosInstance.post<R>(url, data, config);
    return response.data;
  }

  async put<T, R = T>(url: string, data?: T, config?: AxiosRequestConfig): Promise<R> {
    const response = await this.axiosInstance.put<R>(url, data, config);
    return response.data;
  }

  async delete<R = any>(url: string, config?: AxiosRequestConfig): Promise<R> {
    const response = await this.axiosInstance.delete<R>(url, config);
    return response.data;
  }
}

export default new ApiService();
