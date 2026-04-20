import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useNavigate } from "react-router"
import { useApi } from "./ApiContext"
import { useToast } from "./ToastContext"
import { type LoginRequest, type LoginResponse, type RegisterRequest, type User } from "@/lib/api"
import { getTokenRole } from "@/lib/jwt"
import { setCookie, getCookie, removeCookie } from "@/lib/cookies"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const api = useApi()
  const { success, error: showError } = useToast()

  // Initialize user from cookies on mount
  useEffect(() => {
    const storedUser = getCookie("user")
    const token = getCookie("token")

    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const createUserObject = (token: string, email: string, backendUser?: User): User => {
    const roleFromJWT = getTokenRole(token)

    return backendUser
      ? { ...backendUser, role: roleFromJWT || backendUser.role }
      : {
          id: 0,
          name: "",
          phone: "",
          email,
          role: roleFromJWT || "TENANT",
        }
  }

  const saveUserSession = (token: string, user: User) => {
    setCookie("token", token, 7)
    setCookie("user", JSON.stringify(user), 7)
    setUser(user)
  }

  const clearUserSession = () => {
    removeCookie("token")
    removeCookie("user")
    setUser(null)
  }

  const navigateByRole = (role: string) => {
    navigate(role === "STAFF" ? "/staff" : "/tenant")
  }

  const login = useCallback(
    async (data: LoginRequest) => {
      setIsLoading(true)
      try {
        const res = await api.post<LoginResponse>("/auth/login", data, { skipToast: true })

        if (res.data?.access_token) {
          const userData = createUserObject(res.data.access_token, data.email, res.data.user)
          saveUserSession(res.data.access_token, userData)
          success("Login successful")
          navigateByRole(userData.role)
        }
      } catch (err: unknown) {
        const error = err as { message?: string }
        showError(error.message || "Login failed")
      } finally {
        setIsLoading(false)
      }
    },
    [api, success, showError, navigate]
  )

  const register = useCallback(
    async (data: RegisterRequest) => {
      setIsLoading(true)
      try {
        await api.post<User>("/auth/register", data, { skipToast: true })
        success("Registration successful! Please login.")
      } catch (err: unknown) {
        const error = err as { message?: string }
        showError(error.message || "Registration failed")
      } finally {
        setIsLoading(false)
      }
    },
    [api, success, showError]
  )

  const logout = useCallback(() => {
    clearUserSession()
    navigate("/login")
  }, [navigate])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
