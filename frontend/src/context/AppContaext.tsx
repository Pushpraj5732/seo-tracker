import type { AxiosInstance } from "axios";
import axios from "axios";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  analysisCount?: number;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  api: AxiosInstance;

  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;

  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;

  logout: () => void;
}

const Backend_Url =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const appContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setuser] = useState<User | null>(null);

  const [token, settoken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const [loading, setloading] = useState(true);

  const api = axios.create({
    baseURL: Backend_Url,
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(
        `${Backend_Url}/api/auth/login`,
        { email, password }
      );

      if (res.data.success) {
        settoken(res.data.token);
        setuser(res.data.user);

        localStorage.setItem("token", res.data.token);

        return { success: true };
      }

      return { success: false, message: res.data.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    try {
      const res = await axios.post(
        `${Backend_Url}/api/auth/register`,
        { name, email, password }
      );

      if (res.data.success) {
        settoken(res.data.token);

        setuser(res.data.user);

        localStorage.setItem("token", res.data.token);

        return { success: true };
      }

      return { success: false, message: res.data.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Register failed",
      };
    }
  };

  const logout = () => {
    settoken(null);

    setuser(null);

    localStorage.removeItem("token");
  };

  const loadUser = async () => {
    if (token) {
      try {
        const { data } = await api.get("/api/auth/user");

        if (data.success) {
          setuser(data.user);
        }
      } catch (error) {
        localStorage.removeItem("token");

        setuser(null);

        settoken(null);
      }
    }

    setloading(false);
  };

  useEffect(() => {
    loadUser();
  }, [token]);

  const value = {
    user,
    token,
    api,
    loading,
    login,
    register,
    logout,
  };

  return (
    <appContext.Provider value={value}>
      {children}
    </appContext.Provider>
  );
}

export function useApp() {
  const context = useContext(appContext);

  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }

  return context;
} 