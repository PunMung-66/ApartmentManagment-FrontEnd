import { useNavigate } from "react-router"
import { useApi } from "@/contexts/ApiContext"
import { useCallback } from "react"
import { removeCookie } from "@/lib/cookies"

export function useApiWithAuth() {
  const api = useApi()
  const navigate = useNavigate()

  const handleApiError = useCallback((error: unknown) => {
    const err = error as { status?: number }
    if (err.status === 401) {
      removeCookie("token")
      removeCookie("user")
      navigate("/login")
    }
    throw error
  }, [navigate])

  return {
    get: async <T,>(url: string, options?: any) => {
      try {
        return await api.get<T>(url, options)
      } catch (error) {
        return handleApiError(error)
      }
    },
    post: async <T,>(url: string, body?: unknown, options?: any) => {
      try {
        return await api.post<T>(url, body, options)
      } catch (error) {
        return handleApiError(error)
      }
    },
    put: async <T,>(url: string, body?: unknown, options?: any) => {
      try {
        return await api.put<T>(url, body, options)
      } catch (error) {
        return handleApiError(error)
      }
    },
    delete: async <T,>(url: string, options?: any) => {
      try {
        return await api.delete<T>(url, options)
      } catch (error) {
        return handleApiError(error)
      }
    },
  }
}
