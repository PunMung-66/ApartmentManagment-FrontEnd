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
import { RootLayout } from './components/RootLayout'
import { ToastProvider } from './contexts/ToastContext'
import { ApiProvider } from './contexts/ApiContext'

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  // Temporarily disabled StrictMode to prevent double API calls in development
  // <StrictMode>
    <ToastProvider>
      <ApiProvider>
        <RouterProvider router={router} />
      </ApiProvider>
    </ToastProvider>
  // </StrictMode>,
);
