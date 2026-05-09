import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router";
import type { User } from "@/lib/api";

interface StaffSidebarProps {
  user: User | null;
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  onToggleDesktopCollapse: () => void;
  onLogout: () => void;
}

export function StaffSidebar({
  user,
  isSidebarOpen,
  isSidebarCollapsed,
  onToggleDesktopCollapse,
  onLogout,
}: StaffSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const navButtonBase =
    "flex w-full items-center rounded-lg text-left font-medium transition-colors";
  const navButtonSize = isSidebarCollapsed
    ? "justify-center px-2 py-2"
    : "gap-2.5 px-3 py-2.5 lg:py-2";

  const isActive = (path: string) => {
    if (path === "/staff") return currentPath === "/staff";
    return currentPath.startsWith(path);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 transform bg-white shadow-xl transition-all duration-200 ${
        isSidebarCollapsed ? "lg:w-20" : "lg:w-64"
      } lg:translate-x-0 lg:shadow-lg w-72 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col">
        <div
          className={`border-b border-gray-100 px-4 py-4 lg:py-3 ${
            isSidebarCollapsed ? "lg:px-2.5" : "lg:px-4"
          }`}
        >
          <div
            className={`flex items-start ${
              isSidebarCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            {!isSidebarCollapsed && (
              <div>
                <h1 className="font-display text-lg font-bold text-gray-900 lg:text-base">
                  Editorial Residence
                </h1>
                <p className="mt-0.5 text-xs text-gray-500 lg:text-[11px]">
                  Staff Portal
                </p>
              </div>
            )}
            <button
              type="button"
              aria-label={
                isSidebarCollapsed
                  ? "Expand desktop sidebar"
                  : "Collapse desktop sidebar"
              }
              onClick={onToggleDesktopCollapse}
              className="hidden rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 lg:inline-flex"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isSidebarCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
                />
              </svg>
            </button>
          </div>
        </div>

        <nav
          className={`flex-1 space-y-1.5 py-3 ${
            isSidebarCollapsed ? "px-2" : "px-3"
          }`}
        >
          <Link
            to="/staff"
            className={`${navButtonBase} ${navButtonSize} ${
              isActive("/staff") && !isActive("/staff/contracts") && !isActive("/staff/users")
                ? "bg-primary text-sm text-white lg:text-xs"
                : "text-sm text-gray-700 hover:bg-gray-50 lg:text-xs"
            }`}
            title="Floor Overview"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {!isSidebarCollapsed && "Floor Overview"}
          </Link>

          <Link
            to="/staff/contracts"
            className={`${navButtonBase} ${navButtonSize} ${
              isActive("/staff/contracts")
                ? "bg-primary text-sm text-white lg:text-xs"
                : "text-sm text-gray-700 hover:bg-gray-50 lg:text-xs"
            }`}
            title="All Contracts"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {!isSidebarCollapsed && "All Contracts"}
          </Link>

          <Link
            to="/staff/utility-rates"
            className={`${navButtonBase} ${navButtonSize} ${
              isActive("/staff/utility-rates")
                ? "bg-primary text-sm text-white lg:text-xs"
                : "text-sm text-gray-700 hover:bg-gray-50 lg:text-xs"
            }`}
            title="Utility Rates"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            {!isSidebarCollapsed && "Utility Rates"}
          </Link>

          <Link
            to="/staff/utility-usages"
            className={`${navButtonBase} ${navButtonSize} ${
              isActive("/staff/utility-usages")
                ? "bg-primary text-sm text-white lg:text-xs"
                : "text-sm text-gray-700 hover:bg-gray-50 lg:text-xs"
            }`}
            title="Utility Usage"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            {!isSidebarCollapsed && "Utility Usage"}
          </Link>

          <Link
            to="/staff/bills"
            className={`${navButtonBase} ${navButtonSize} ${
              isActive("/staff/bills")
                ? "bg-primary text-sm text-white lg:text-xs"
                : "text-sm text-gray-700 hover:bg-gray-50 lg:text-xs"
            }`}
            title="Bills"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {!isSidebarCollapsed && "Bills"}
          </Link>

          <Link
            to="/staff/users"
            className={`${navButtonBase} ${navButtonSize} ${
              isActive("/staff/users")
                ? "bg-primary text-sm text-white lg:text-xs"
                : "text-sm text-gray-700 hover:bg-gray-50 lg:text-xs"
            }`}
            title="All Users"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            {!isSidebarCollapsed && "All Users"}
          </Link>

        </nav>

        <div
          className={`border-t border-gray-100 p-3 ${
            isSidebarCollapsed ? "lg:px-2" : ""
          }`}
        >
          <div
            className={`mb-3 flex items-center rounded-lg bg-gray-50 p-2.5 ${
              isSidebarCollapsed ? "justify-center" : "gap-2.5"
            }`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white lg:h-8 lg:w-8 lg:text-xs">
              {user?.name?.charAt(0) || "P"}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 lg:text-xs">
                  {user?.name || "Property Manager"}
                </p>
                <p className="text-xs text-gray-500 lg:text-[11px]">
                  {user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : 'Staff'}
                </p>
              </div>
            )}
          </div>
          <Button
            onClick={onLogout}
            title="Logout"
            className={`w-full justify-center border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 lg:text-xs ${
              isSidebarCollapsed ? "px-2" : ""
            }`}
          >
            {isSidebarCollapsed ? "↩" : "Logout"}
          </Button>
        </div>
      </div>
    </aside>
  );
}
