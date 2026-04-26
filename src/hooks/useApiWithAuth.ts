import { useNavigate } from "react-router"
import { useApi } from "@/contexts/ApiContext"
import { useCallback, useMemo } from "react"
import { removeCookie } from "@/lib/cookies"

interface ApiRequestOptions extends RequestInit {
  skipToast?: boolean
}

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

  const get = useCallback(
    async <T,>(url: string, options?: ApiRequestOptions) => {
      try {
        return await api.get<T>(url, options)
      } catch (error) {
        return handleApiError(error)
      }
    },
    [api, handleApiError]
  )

  const post = useCallback(
    async <T,>(url: string, body?: unknown, options?: ApiRequestOptions) => {
      try {
        return await api.post<T>(url, body, options)
      } catch (error) {
        return handleApiError(error)
      }
    },
    [api, handleApiError]
  )

  const put = useCallback(
    async <T,>(url: string, body?: unknown, options?: ApiRequestOptions) => {
      try {
        return await api.put<T>(url, body, options)
      } catch (error) {
        return handleApiError(error)
      }
    },
    [api, handleApiError]
  )

  const del = useCallback(
    async <T,>(url: string, options?: ApiRequestOptions) => {
      try {
        return await api.delete<T>(url, options)
      } catch (error) {
        return handleApiError(error)
      }
    },
    [api, handleApiError]
  )

  return useMemo(
    () => ({
      get,
      post,
      put,
      delete: del,
    }),
    [get, post, put, del]
  )
}
