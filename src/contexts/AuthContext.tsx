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

  useEffect(() => {
    const storedUser = getCookie("user")
    const token = getCookie("token")
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true)
    try {
      const res = await api.post<LoginResponse>("/auth/login", data, { skipToast: true })
      
      if (res.data?.access_token) {
        setCookie("token", res.data.access_token, 7)
        
        // Extract role from JWT token (secure - verified by backend)
        const roleFromJWT = getTokenRole(res.data.access_token)
        
        // Use user data from backend response if available, otherwise create minimal user object
        const userData: User = res.data.user || {
          id: 0,
          name: "",
          phone: "",
          email: data.email,
          role: roleFromJWT || "TENANT",
        }
        
        // Override role with JWT value to ensure security
        userData.role = roleFromJWT || userData.role
        
        setUser(userData)
        setCookie("user", JSON.stringify(userData), 7)
        
        success("Login successful")
        
        if (userData.role === "STAFF") {
          navigate("/staff")
        } else {
          navigate("/tenant")
        }
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      showError(error.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }, [api, success, showError, navigate])

  const register = useCallback(async (data: RegisterRequest) => {
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
  }, [api, success, showError])

  const logout = useCallback(() => {
    removeCookie("token")
    removeCookie("user")
    setUser(null)
    navigate("/login")
  }, [navigate])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}