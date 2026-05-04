import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import "./index.css";
import App from "./App.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import StaffDashboard from "./pages/Admin/StaffDashboard.tsx";
import FloorInventory from "./pages/Admin/FloorInventory.tsx";
import ContractDashboard from "./pages/Admin/ContractDashboard.tsx";
import UserDashboard from "./pages/Admin/UserDashBoard.tsx";
import TenantDashboard from "./pages/Tenant/TenantDashboard.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RootLayout } from "./components/RootLayout";
import { ToastProvider } from "./contexts/ToastContext";
import { ApiProvider } from "./contexts/ApiContext";

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
        // StaffDashboard is now a layout route — it renders <Outlet />
        // ProtectedRoute wraps the whole subtree, so all children are protected
        path: "/staff",
        element: (
          <ProtectedRoute requiredRole="STAFF">
            <StaffDashboard />
          </ProtectedRoute>
        ),
        children: [
          // index: true means this renders at exactly /staff
          { index: true, element: <FloorInventory /> },
          // These render at /staff/contracts and /staff/users respectively
          { path: "contracts", element: <ContractDashboard /> },
          { path: "users", element: <UserDashboard /> },
        ],
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
  <StrictMode>
    <ToastProvider>
      <ApiProvider>
        <RouterProvider router={router} />
      </ApiProvider>
    </ToastProvider>
  </StrictMode>
);