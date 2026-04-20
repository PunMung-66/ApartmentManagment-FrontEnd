import { createContext, useContext, useCallback, type ReactNode } from "react"
import { API_BASE_URL, type ApiResponse } from "@/lib/api"
import { useToast } from "./ToastContext"
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

  const getHeaders = (token: string | null, customHeaders?: HeadersInit): HeadersInit => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  })

  const handleResponse = useCallback(
    async <T,>(res: Response, skipToast?: boolean): Promise<ApiResponse<T>> => {
      const data = await res.json() as ApiResponse<T>

      if (res.ok && res.status >= 200 && res.status < 300) {
        if (!skipToast && data.message) {
          showSuccess(data.message)
        }
        return data
      }

      const errorMessage = data.message || "An error occurred"

      if (!skipToast) {
        showError(errorMessage)
      }

      throw { ...data, status: res.status }
    },
    [showError, showSuccess]
  )

  const handleUnauthorized = useCallback(() => {
    removeCookie("token")
    removeCookie("user")
  }, [])

  const makeFetchRequest = useCallback(
    async <T,>(
      url: string,
      method: string,
      body?: unknown,
      options?: FetchOptions
    ): Promise<ApiResponse<T>> => {
      const token = getCookie("token")
      const headers = getHeaders(token, options?.headers)

      const res = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })

      if (res.status === 401) {
        handleUnauthorized()
      }

      return handleResponse<T>(res, options?.skipToast)
    },
    [handleResponse, handleUnauthorized]
  )

  const get = useCallback(
    <T,>(url: string, options?: FetchOptions) => makeFetchRequest<T>(url, "GET", undefined, options),
    [makeFetchRequest]
  )

  const post = useCallback(
    <T,>(url: string, body?: unknown, options?: FetchOptions) => makeFetchRequest<T>(url, "POST", body, options),
    [makeFetchRequest]
  )

  const put = useCallback(
    <T,>(url: string, body?: unknown, options?: FetchOptions) => makeFetchRequest<T>(url, "PUT", body, options),
    [makeFetchRequest]
  )

  const del = useCallback(
    <T,>(url: string, options?: FetchOptions) => makeFetchRequest<T>(url, "DELETE", undefined, options),
    [makeFetchRequest]
  )

  const value: ApiContextType = { get, post, put, delete: del }

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}

export function useApi() {
  const context = useContext(ApiContext)
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider")
  }
  return context
}
