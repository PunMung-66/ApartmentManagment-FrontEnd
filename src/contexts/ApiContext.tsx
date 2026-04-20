import { createContext, useContext, useCallback, type ReactNode } from "react"
import { API_BASE_URL, type ApiResponse } from "@/lib/api"
import { useToast, type ToastType } from "./ToastContext"
import { getCookie, removeCookie } from "@/lib/cookies"

interface FetchOptions extends RequestInit {
  skipToast?: boolean
}

type ApiMethod = <T>(url: string, body?: unknown, options?: FetchOptions) => Promise<ApiResponse<T>>

interface ApiContextType {
  get: <T>(url: string, options?: FetchOptions) => Promise<ApiResponse<T>>
  post: ApiMethod
  put: ApiMethod
  delete: <T>(url: string, options?: FetchOptions) => Promise<ApiResponse<T>>
}

const ApiContext = createContext<ApiContextType | undefined>(undefined)

export function ApiProvider({ children }: { children: ReactNode }) {
  const { error: showError, success: showSuccess } = useToast()

  const handleResponse = useCallback(async <T,>(res: Response, skipToast?: boolean): Promise<ApiResponse<T>> => {
    const data = await res.json() as ApiResponse<T>
    
    if (res.ok && res.status >= 200 && res.status < 300) {
      if (!skipToast && data.message) {
        showSuccess(data.message)
      }
      return data
    }
    
    const toastType: ToastType = res.status === 401 ? "error" : "error"
    void toastType
    const errorMessage = data.message || "An error occurred"
    
    if (!skipToast) {
      showError(errorMessage)
    }
    
    throw { ...data, status: res.status }
  }, [showError, showSuccess])

  const handleUnauthorized = useCallback(() => {
    removeCookie("token")
    removeCookie("user")
    // Don't redirect here - let the component handle it
  }, [])

  const get = useCallback(async <T,>(url: string, options?: FetchOptions): Promise<ApiResponse<T>> => {
    const token = getCookie("token")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    }

    const res = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: "GET",
      headers,
    })

    if (res.status === 401) {
      handleUnauthorized()
      return handleResponse<T>(res, options?.skipToast)
    }

    return handleResponse<T>(res, options?.skipToast)
  }, [handleResponse, handleUnauthorized])

  const post = useCallback(async <T,>(url: string, body?: unknown, options?: FetchOptions): Promise<ApiResponse<T>> => {
    const token = getCookie("token")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    }

    const res = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (res.status === 401) {
      handleUnauthorized()
      return handleResponse<T>(res, options?.skipToast)
    }

    return handleResponse<T>(res, options?.skipToast)
  }, [handleResponse, handleUnauthorized])

  const put = useCallback(async <T,>(url: string, body?: unknown, options?: FetchOptions): Promise<ApiResponse<T>> => {
    const token = getCookie("token")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    }

    const res = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (res.status === 401) {
      handleUnauthorized()
      return handleResponse<T>(res, options?.skipToast)
    }

    return handleResponse<T>(res, options?.skipToast)
  }, [handleResponse, handleUnauthorized])

  const del = useCallback(async <T,>(url: string, options?: FetchOptions): Promise<ApiResponse<T>> => {
    const token = getCookie("token")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    }

    const res = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: "DELETE",
      headers,
    })

    if (res.status === 401) {
      handleUnauthorized()
      return handleResponse<T>(res, options?.skipToast)
    }

    return handleResponse<T>(res, options?.skipToast)
  }, [handleResponse, handleUnauthorized])

  return (
    <ApiContext.Provider value={{ get, post, put, delete: del }}>
      {children}
    </ApiContext.Provider>
  )
}

export function useApi() {
  const context = useContext(ApiContext)
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider")
  }
  return context
}
