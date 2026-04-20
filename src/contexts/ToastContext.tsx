import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"

export type ToastType = "success" | "error" | "info"

export interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)
const TOAST_STORAGE_KEY = "pending_toasts"
const TOAST_DURATION = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Load pending toasts from sessionStorage on mount
  useEffect(() => {
    const pendingToasts = sessionStorage.getItem(TOAST_STORAGE_KEY)
    if (pendingToasts) {
      try {
        const parsed = JSON.parse(pendingToasts) as Toast[]
        setToasts(parsed)
        sessionStorage.removeItem(TOAST_STORAGE_KEY)
      } catch (error) {
        console.error("Failed to parse pending toasts:", error)
      }
    }
  }, [])

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, message, type }
    setToasts((prev) => [...prev, newToast])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_DURATION)
  }, [])

  const success = useCallback((message: string) => showToast(message, "success"), [showToast])
  const error = useCallback((message: string) => showToast(message, "error"), [showToast])

  // Store toasts to sessionStorage before page unload (for redirect scenarios)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (toasts.length > 0) {
        sessionStorage.setItem(TOAST_STORAGE_KEY, JSON.stringify(toasts))
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [toasts])

  const value: ToastContextType = { toasts, showToast, success, error }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} setToasts={setToasts} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

interface ToastContainerProps {
  toasts: Toast[]
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>
}

function ToastContainer({ toasts, setToasts }: ToastContainerProps) {
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const getToastStyles = (type: ToastType) => {
    const baseStyles = "flex items-center gap-3 px-4 py-3 rounded-lg shadow-ambient"
    const typeStyles = {
      success: "bg-secondary text-secondary-foreground",
      error: "bg-destructive text-destructive-foreground",
      info: "bg-primary text-primary-foreground",
    }
    return `${baseStyles} ${typeStyles[type]}`
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={getToastStyles(toast.type)}
          >
            <ToastIcon type={toast.type} />
            <span className="flex-1 font-body text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Close toast"
            >
              <CloseIcon />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }

  if (type === "error") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    )
  }

  return null
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
