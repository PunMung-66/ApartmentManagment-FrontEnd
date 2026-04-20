export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"

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
  id: number
  name: string
  phone: string
  email: string
  role: string
  createdAt?: string
  updatedAt?: string
}