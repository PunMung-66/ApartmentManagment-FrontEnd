export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"

export interface ApiResponse<T = unknown> {
  status: number
  message: string
  date: string
  data?: T
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user?: User
}

export interface RegisterRequest {
  name: string
  phone: string
  email: string
  password: string
  role?: string
}

export interface User {
  user_id: string
  id?: number
  name: string
  phone: string
  email: string
  role: string
  created_at?: string
  updated_at?: string
}