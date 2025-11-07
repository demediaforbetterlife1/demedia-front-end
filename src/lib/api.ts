import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// 🔹 السيرفرات
const API_BASE = ""; // عبر Next.js API proxy
const DIRECT_API_BASE = "https://demedia-backend.fly.dev"; // fallback مباشر

// 🔹 إنشاء instance موحد
const api = axios.create({
  baseURL: API_BASE || DIRECT_API_BASE,
  timeout: 20000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ إضافة التوكن تلقائيًا قبل كل طلب
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ معالجة الردود والأخطاء بدون logout
api.interceptors.response.use(
  (response) => {
    // ✅ لو السيرفر رجّع توكن جديد نحفظه
    if (response.data?.token && typeof window !== "undefined") {
      localStorage.setItem("token", response.data.token);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ⚠️ لو Unauthorized → بس نحذر ونكمل
    if (error.response?.status === 401) {
      console.warn("⚠️ Token might be expired or invalid (ignored).");
      return Promise.resolve({ data: null, error: "unauthorized" });
    }

    // 🔄 لو السيرفر الأساسي وقع → جرب السيرفر المباشر
    if (!error.response && !originalRequest._retry) {
      try {
        console.log("⚠️ Main API failed → trying direct fallback...");
        originalRequest._retry = true;
        const directRes = await axios({
          ...originalRequest,
          baseURL: DIRECT_API_BASE,
        });
        return directRes;
      } catch (fallbackError) {
        console.error("❌ Fallback API also failed:", fallbackError);
      }
    }

    console.error("❌ API error:", error);
    return Promise.resolve({ data: null, error: error.message });
  }
);

// ===== 🧩 دوال مختصرة =====

export async function apiGet<T>(url: string, config: AxiosRequestConfig = {}): Promise<T | null> {
  try {
    const res: AxiosResponse<T> = await api.get(url, config);
    return res.data;
  } catch (err) {
    console.error("GET error:", err);
    return null;
  }
}

export async function apiPost<T>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T | null> {
  try {
    const res: AxiosResponse<T> = await api.post(url, data, config);
    return res.data;
  } catch (err) {
    console.error("POST error:", err);
    return null;
  }
}

export async function apiPut<T>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T | null> {
  try {
    const res: AxiosResponse<T> = await api.put(url, data, config);
    return res.data;
  } catch (err) {
    console.error("PUT error:", err);
    return null;
  }
}

export async function apiDelete<T>(url: string, config: AxiosRequestConfig = {}): Promise<T | null> {
  try {
    const res: AxiosResponse<T> = await api.delete(url, config);
    return res.data;
  } catch (err) {
    console.error("DELETE error:", err);
    return null;
  }
}

// ===== 📦 مثال لجلب بروفايل المستخدم =====
export async function getUserProfile(userId: string | number) {
  try {
    const data = await apiGet(`/api/users/${userId}/profile`);
    return data;
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    return null;
  }
}

export default api;