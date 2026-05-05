import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import Footer from "@/components/Footer"

interface FormData {
  name: string
  phone: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  [key: string]: string
}

const INITIAL_FORM_DATA: FormData = {
  name: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
}

function PasswordInput({ id, placeholder, value, onChange }: { id: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-foreground transition-colors"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeIcon /> : <EyeOffIcon />}
      </button>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
  )
}

function FormField({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}

function LoginForm({ isLoading, errors, formData, onFieldChange, onSubmit }: {
  isLoading: boolean
  errors: FormErrors
  formData: FormData
  onFieldChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <motion.form
      key="login"
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 30, opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
      onSubmit={onSubmit}
    >
      <FormField label="Email" id="email" error={errors.email}>
        <Input
          id="email"
          type="email"
          placeholder="hello@example.com"
          value={formData.email}
          onChange={(e) => onFieldChange("email", e.target.value)}
          className={errors.email ? "border-red-500" : ""}
        />
      </FormField>

      <FormField label="Password" id="password" error={errors.password}>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(value) => onFieldChange("password", value)}
        />
      </FormField>

      <Button className="w-full mt-6" variant="secondary" type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </motion.form>
  )
}

function RegisterForm({ isLoading, errors, formData, onFieldChange, onSubmit }: {
  isLoading: boolean
  errors: FormErrors
  formData: FormData
  onFieldChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <motion.form
      key="register"
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -30, opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
      onSubmit={onSubmit}
    >
      <FormField label="Full Name" id="name" error={errors.name}>
        <Input
          id="name"
          placeholder="Your name"
          value={formData.name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          className={errors.name ? "border-red-500" : ""}
        />
      </FormField>

      <FormField label="Phone" id="phone" error={errors.phone}>
        <Input
          id="phone"
          placeholder="Your phone number"
          value={formData.phone}
          onChange={(e) => onFieldChange("phone", e.target.value)}
          className={errors.phone ? "border-red-500" : ""}
        />
      </FormField>

      <FormField label="Email" id="email" error={errors.email}>
        <Input
          id="email"
          type="email"
          placeholder="hello@example.com"
          value={formData.email}
          onChange={(e) => onFieldChange("email", e.target.value)}
          className={errors.email ? "border-red-500" : ""}
        />
      </FormField>

      <FormField label="Password" id="password" error={errors.password}>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(value) => onFieldChange("password", value)}
        />
      </FormField>

      <FormField label="Confirm Password" id="confirm-password" error={errors.confirmPassword}>
        <PasswordInput
          id="confirm-password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(value) => onFieldChange("confirmPassword", value)}
        />
      </FormField>

      <Button className="w-full mt-6" variant="secondary" type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Account"}
      </Button>
    </motion.form>
  )
}

function FormValidator() {
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): boolean => {
    return password.length >= 6
  }

  const validateLoginForm = (formData: FormData): FormErrors => {
    const errors: FormErrors = {}

    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      errors.email = "Invalid email format"
    }

    if (!formData.password) {
      errors.password = "Password is required"
    } else if (!validatePassword(formData.password)) {
      errors.password = "Password must be at least 6 characters"
    }

    return errors
  }

  const validateRegisterForm = (formData: FormData): FormErrors => {
    const errors: FormErrors = {}

    if (!formData.name.trim()) {
      errors.name = "Name is required"
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone is required"
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      errors.email = "Invalid email format"
    }

    if (!formData.password) {
      errors.password = "Password is required"
    } else if (!validatePassword(formData.password)) {
      errors.password = "Password must be at least 6 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    return errors
  }

  return { validateLoginForm, validateRegisterForm }
}

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState<FormErrors>({})
  const { login, register, isLoading } = useAuth()
  const { validateLoginForm, validateRegisterForm } = FormValidator()

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validateLoginForm(formData)
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      await login({ email: formData.email, password: formData.password })
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validateRegisterForm(formData)
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      await register({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        role: "TENANT",
      })
      setIsRegister(false)
      setFormData(INITIAL_FORM_DATA)
      setErrors({})
    }
  }

  const toggleAuthMode = () => {
    setIsRegister(!isRegister)
    setFormData(INITIAL_FORM_DATA)
    setErrors({})
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  }

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <motion.div
        className="flex flex-1 items-center justify-center p-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={cardVariants} className="w-full max-w-md">
          <Card variant="elevated" className="rounded-xl">
            <CardHeader className="space-y-6 text-center pb-2">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <CardTitle className="font-display text-2xl font-bold tracking-tight">
                  Apartment System (Yen Sabai)
                </CardTitle>
              </motion.div>
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <CardDescription className="font-body text-sm">
                  {isRegister ? "Create your sanctuary" : "Welcome home"}
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent>
              <AnimatePresence mode="wait">
                {isRegister ? (
                  <RegisterForm
                    isLoading={isLoading}
                    errors={errors}
                    formData={formData}
                    onFieldChange={updateField}
                    onSubmit={handleRegister}
                  />
                ) : (
                  <LoginForm
                    isLoading={isLoading}
                    errors={errors}
                    formData={formData}
                    onFieldChange={updateField}
                    onSubmit={handleLogin}
                  />
                )}
              </AnimatePresence>

              <motion.div
                className="mt-6 text-center font-body text-sm text-on-surface-variant"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {isRegister ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-secondary font-semibold hover:underline underline-offset-2"
                      onClick={toggleAuthMode}
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="text-secondary font-semibold hover:underline underline-offset-2"
                      onClick={toggleAuthMode}
                    >
                      Register
                    </button>
                  </>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      <div className="mt-8"></div>
      <Footer />
    </div>
  )
}
