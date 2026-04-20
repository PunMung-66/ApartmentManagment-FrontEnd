import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import './index.css'
import App from './App.tsx'
import LoginPage from './pages/LoginPage.tsx'
import StaffDashboard from './pages/StaffDashboard.tsx'
import TenantDashboard from './pages/TenantDashboard.tsx'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ToastProvider } from './contexts/ToastContext'
import { ApiProvider } from './contexts/ApiContext'
import { AuthProvider } from './contexts/AuthContext'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/staff",
    element: (
      <ProtectedRoute requiredRole="STAFF">
        <StaffDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tenant",
    element: (
      <ProtectedRoute requiredRole="TENANT">
        <TenantDashboard />
      </ProtectedRoute>
    ),
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <ApiProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ApiProvider>
    </ToastProvider>
  </StrictMode>,
);