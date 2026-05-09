import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import "./index.css";
import App from "./App.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import StaffDashboard from "./pages/StaffDashboard.tsx";
import TenantDashboard from "./pages/TenantDashboard.tsx";
import AllUsers from "./pages/AllUsers.tsx";
import FloorInventory from "./pages/FloorInventory.tsx";
import AllContracts from "./pages/AllContracts.tsx";
import UtilityRates from "./pages/UtilityRates.tsx";
import UtilityUsages from "./pages/UtilityUsages.tsx";
import Bills from "./pages/Bills.tsx";
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
        path: "/staff",
        element: (
          <ProtectedRoute requiredRole="STAFF">
            <StaffDashboard />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <FloorInventory />,
          },
          {
            path: "contracts",
            element: <AllContracts />,
          },
          {
            path: "users",
            element: <AllUsers />,
          },
          {
            path: "utility-rates",
            element: <UtilityRates />,
          },
          {
            path: "utility-usages",
            element: <UtilityUsages />,
          },
          {
            path: "bills",
            element: <Bills />,
          },
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
  </StrictMode>,
);
