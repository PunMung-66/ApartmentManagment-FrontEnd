import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { StaffSidebar } from "@/components/StaffSidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractStatus =
  | "Active"
  | "Pending Renewal"
  | "Expired"
  | "Maintenance Hold";

interface Contract {
  id: number;
  tenantName: string;
  initials: string;
  unit: string;
  period: string;
  status: ContractStatus;
}

// ─── Static badge styling ─────────────────────────────────────────────────────

function getStatusBadge(status: ContractStatus) {
  switch (status) {
    case "Active":
      return {
        dot: "bg-teal-500",
        badge: "bg-teal-50 text-teal-700",
      };
    case "Pending Renewal":
      return {
        dot: "bg-orange-400",
        badge: "bg-orange-50 text-orange-700",
      };
    case "Expired":
      return {
        dot: "bg-red-500",
        badge: "bg-red-50 text-red-700",
      };
    case "Maintenance Hold":
      return {
        dot: "bg-orange-400",
        badge: "bg-orange-50 text-orange-700",
      };
  }
}

// ─── Placeholder data (replace with API call) ─────────────────────────────────

const MOCK_CONTRACTS: Contract[] = [
  {
    id: 1,
    tenantName: "Eleanor Abbott",
    initials: "EA",
    unit: "Penthouse 402",
    period: "Jan 2024 – Jan 2025",
    status: "Active",
  },
  {
    id: 2,
    tenantName: "Julian Martinez",
    initials: "JM",
    unit: "Studio 105",
    period: "Mar 2023 – Mar 2024",
    status: "Pending Renewal",
  },
  {
    id: 3,
    tenantName: "Sienna Wright",
    initials: "SW",
    unit: "Suite 210",
    period: "Jun 2023 – Jun 2024",
    status: "Active",
  },
  {
    id: 4,
    tenantName: "Dominic Reed",
    initials: "DR",
    unit: "Studio 112",
    period: "Dec 2022 – Dec 2023",
    status: "Expired",
  },
  {
    id: 5,
    tenantName: "Lydia Laurent",
    initials: "LL",
    unit: "Penthouse 401",
    period: "Aug 2023 – Aug 2024",
    status: "Active",
  },
  {
    id: 6,
    tenantName: "Tobias Helm",
    initials: "TH",
    unit: "Suite 205",
    period: "Oct 2023 – Oct 2024",
    status: "Maintenance Hold",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContractDashboard() {
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = MOCK_CONTRACTS.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.tenantName.toLowerCase().includes(q) ||
      c.unit.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1">
        <StaffSidebar
          user={user}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleDesktopCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onLogout={logout}
        />

        <main
          className={`flex flex-col flex-1 px-4 pb-20 pt-4 md:px-6 md:pt-5 lg:px-5 lg:pt-4 ${
            isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}>
          {/* ── Page header ─────────────────────────────────────────────── */}
          <div className="mb-5 md:mb-6 lg:mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              {/* Mirrors FloorInventory: text-xl md:text-2xl lg:text-lg */}
              <h2 className="font-display text-xl font-bold text-gray-900 md:text-2xl lg:text-lg">
                All Contracts
              </h2>
              {/* Mirrors FloorInventory: text-sm md:text-sm lg:text-xs */}
              <p className="mt-1 text-sm text-gray-600 md:text-sm lg:text-xs">
                Manage and review tenant contracts
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {/* Total — hidden on mobile to save space */}
              <span className="hidden md:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <span className="text-gray-900 text-sm font-bold lg:text-xs">
                  {MOCK_CONTRACTS.length}
                </span>
                Total
              </span>

              {/* Search — full width on mobile, fixed on larger screens */}
              <div className="relative w-full sm:w-64 lg:w-56">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search contracts…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all lg:text-xs"
                />
              </div>

              {/* New contract button */}
              <button className="flex items-center justify-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 active:scale-95 transition-all lg:text-xs lg:px-3 lg:py-1.5">
                <svg
                  className="h-4 w-4 lg:h-3.5 lg:w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New
              </button>
            </div>
          </div>

          {/* ── Table card ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Tenant
                    </th>
                    {/* Unit hidden on smallest screens — visible from sm+ */}
                    <th className="hidden sm:table-cell px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Unit
                    </th>
                    {/* Period hidden on mobile — visible from md+ */}
                    <th className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Contract Period
                    </th>
                    <th className="px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">
                      Status
                    </th>
                    <th className="px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 md:px-6 md:py-12 text-center text-sm text-gray-400 lg:text-xs">
                        No contracts match your search.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((contract, i) => {
                      const { dot, badge } = getStatusBadge(contract.status);
                      return (
                        <tr
                          key={contract.id}
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                            i % 2 === 1 ? "bg-gray-50/50" : "bg-white"
                          }`}>
                          {/* Tenant */}
                          <td className="px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3">
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                                {contract.initials}
                              </div>
                              <span className="text-sm font-semibold text-gray-900 lg:text-xs">
                                {contract.tenantName}
                              </span>
                            </div>
                          </td>

                          {/* Unit — hidden on mobile */}
                          <td className="hidden sm:table-cell px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-sm text-gray-500 lg:text-xs">
                            {contract.unit}
                          </td>

                          {/* Period — hidden on mobile + sm */}
                          <td className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-sm text-gray-500 lg:text-xs">
                            {contract.period}
                          </td>

                          {/* Status badge */}
                          <td className="px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 md:px-3 text-[10px] font-bold uppercase tracking-tight ${badge}`}>
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${dot}`}
                              />
                              {/* Shorten labels on mobile */}
                              <span className="hidden sm:inline">
                                {contract.status}
                              </span>
                              <span className="sm:hidden">
                                {contract.status === "Pending Renewal"
                                  ? "Renewal"
                                  : contract.status === "Maintenance Hold"
                                  ? "Hold"
                                  : contract.status}
                              </span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                title="Edit"
                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                                <svg
                                  className="h-4 w-4 lg:h-3.5 lg:w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                title="Delete"
                                className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                                <svg
                                  className="h-4 w-4 lg:h-3.5 lg:w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mirrors FloorInventory footer */}
          <footer className="mt-auto pt-6 text-center text-xs text-gray-500 md:text-sm lg:text-[11px]">
            © 2024 Editorial Residence Apartments. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}
