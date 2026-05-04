import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/api";

// ─── Routing-ready nav config ─────────────────────────────────────────────────
// When React Router is added: import { Link, useLocation } from "react-router-dom"
// Replace <a href={item.path}> with <Link to={item.path}>
// Replace activePath prop with: const { pathname } = useLocation()

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Floor Overview",
    path: "/floor",
    icon: (
      <svg
        className="h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    label: "All Contracts",
    path: "/contracts",
    icon: (
      <svg
        className="h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    label: "All Users",
    path: "/users",
    icon: (
      <svg
        className="h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface StaffSidebarProps {
  user: User | null;
  /** Optional external control of mobile open state. If not provided, managed internally. */
  isSidebarOpen?: boolean;
  isSidebarCollapsed: boolean;
  onToggleDesktopCollapse: () => void;
  onLogout: () => void;
  /**
   * Current pathname for active nav highlighting.
   * Pass window.location.pathname now; swap for useLocation().pathname when
   * React Router is introduced. Keeping this as a prop prevents window access
   * inside the component and makes it testable.
   */
  activePath?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StaffSidebar({
  user,
  isSidebarOpen,
  isSidebarCollapsed,
  onToggleDesktopCollapse,
  onLogout,
  activePath = "",
}: StaffSidebarProps) {
  // Internal mobile open/close — only used when isSidebarOpen is not provided externally
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isOpen = isSidebarOpen ?? isOpenInternal;

  function openSidebar() {
    setIsOpenInternal(true);
  }
  function closeSidebar() {
    setIsOpenInternal(false);
  }

  // Lock body scroll while mobile sidebar is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [isOpen]);

  // ── Style helpers (desktop variants untouched) ───────────────────────────
  const navButtonBase =
    "flex w-full items-center rounded-lg text-left font-medium transition-colors";
  const navButtonSize = isSidebarCollapsed
    ? "justify-center px-2 py-2"
    : "gap-2.5 px-3 py-2.5 lg:py-2";

  return (
    <>
      {/*
       * ── MOBILE HAMBURGER ──────────────────────────────────────────────────
       * FIX: changed from `sticky` inside a flow header to `fixed` so it stays
       * visible when the user scrolls and is always reachable.
       * z-50 keeps it above the sidebar (z-40) and overlay (z-30).
       */}
      <button
        type="button"
        aria-label="Toggle sidebar menu"
        onClick={openSidebar}
        className="fixed right-4 top-4 z-50 flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 shadow-sm lg:hidden">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/*
       * ── MOBILE OVERLAY ────────────────────────────────────────────────────
       * FIX: overlay now calls closeSidebar() (internal setter) rather than
       * setIsOpenInternal(false) directly, so it works consistently regardless
       * of whether open state is internal or externally controlled.
       */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/*
       * ── SIDEBAR PANEL ─────────────────────────────────────────────────────
       * FIX: added `overflow-hidden` to prevent the w-72 panel from creating
       * a scrollable overflow region on small screens when translated off-screen.
       * All lg: classes are preserved exactly as they were.
       */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 overflow-hidden
          transform transition-all duration-200
          bg-white shadow-xl
          w-72
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:shadow-lg
          ${isSidebarCollapsed ? "lg:w-20" : "lg:w-64"}
        `}>
        <div className="flex h-full flex-col">
          {/* ── Sidebar header (desktop collapse toggle) ── */}
          <div
            className={`border-b border-gray-100 px-4 py-4 lg:py-3 ${
              isSidebarCollapsed ? "lg:px-2.5" : "lg:px-4"
            }`}>
            <div
              className={`flex items-start ${
                isSidebarCollapsed ? "justify-center" : "justify-between"
              }`}>
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
              {/* Desktop-only collapse toggle — hidden on mobile */}
              <button
                type="button"
                aria-label={
                  isSidebarCollapsed
                    ? "Expand desktop sidebar"
                    : "Collapse desktop sidebar"
                }
                onClick={onToggleDesktopCollapse}
                className="hidden rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 lg:inline-flex">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
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

          {/* ── Nav ── */}
          <nav
            className={`flex-1 space-y-1.5 py-3 ${
              isSidebarCollapsed ? "px-2" : "px-3"
            }`}>
            {NAV_ITEMS.map((item) => {
              const isActive = activePath === item.path;
              return (
                // Router swap point: replace <a href> with <Link to={item.path}>
                <a
                  key={item.path}
                  href={item.path}
                  title={item.label}
                  className={`${navButtonBase} ${navButtonSize} text-sm lg:text-xs ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}>
                  {item.icon}
                  {!isSidebarCollapsed && item.label}
                </a>
              );
            })}
          </nav>

          {/* ── User + Logout ── */}
          <div
            className={`border-t border-gray-100 p-3 ${
              isSidebarCollapsed ? "lg:px-2" : ""
            }`}>
            <div
              className={`mb-3 flex items-center rounded-lg bg-gray-50 p-2.5 ${
                isSidebarCollapsed ? "justify-center" : "gap-2.5"
              }`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white lg:h-8 lg:w-8 lg:text-xs">
                {user?.name?.charAt(0) ?? "P"}
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 lg:text-xs">
                    {user?.name ?? "Property Manager"}
                  </p>
                  <p className="text-xs text-gray-500 lg:text-[11px]">
                    Lead Admin
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={onLogout}
              title="Logout"
              className={`w-full justify-center border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 lg:text-xs ${
                isSidebarCollapsed ? "px-2" : ""
              }`}>
              {isSidebarCollapsed ? "↩" : "Logout"}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
