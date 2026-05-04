import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { StaffSidebar } from "@/components/StaffSidebar";
import { useUsers, type UserRecord } from "../../components/Useusers";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleBadge(role: string) {
  switch (role.toUpperCase()) {
    case "STAFF":
      return "bg-gray-900 text-white";
    case "TENANT":
      return "bg-teal-50 text-teal-700";
    default:
      return "bg-gray-100 text-gray-500";
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "STAFF" | "TENANT">(
    "ALL"
  );

  const { loading, users, error, refetch } = useUsers();

  const staffCount = users.filter(
    (u) => u.role.toUpperCase() === "STAFF"
  ).length;
  const tenantCount = users.filter(
    (u) => u.role.toUpperCase() === "TENANT"
  ).length;

  const filtered = users.filter((u: UserRecord) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone ?? "").toLowerCase().includes(q);
    const matchesRole =
      roleFilter === "ALL" || u.role.toUpperCase() === roleFilter;
    return matchesSearch && matchesRole;
  });

  // ── Loading state — mirrors FloorInventory ────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-base md:text-sm text-gray-600">Loading...</div>
      </div>
    );
  }

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
          {/* ── Page header ───────────────────────────────────────────── */}
          <div className="mb-5 md:mb-6 lg:mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-gray-900 md:text-2xl lg:text-lg">
                All Users
              </h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 md:text-sm lg:text-xs">
                <span className="font-bold text-gray-900">{staffCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Staff
                </span>
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                <span className="font-bold text-gray-900">{tenantCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Tenants
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {/* Role filter toggle */}
              <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden text-xs font-semibold">
                {(["ALL", "STAFF", "TENANT"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-2 transition-colors lg:px-2.5 lg:py-1.5 ${
                      roleFilter === r
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}>
                    {r}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64 lg:w-52">
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
                  placeholder="Search users…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all lg:text-xs"
                />
              </div>

              {/* New user — wired to modal in next step */}
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

          {/* ── Error state ───────────────────────────────────────────── */}
          {error && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
              <button
                onClick={refetch}
                className="ml-auto text-xs font-semibold underline hover:no-underline">
                Retry
              </button>
            </div>
          )}

          {/* ── Table card ────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      User
                    </th>
                    <th className="px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Role
                    </th>
                    {/* Email hidden on mobile */}
                    <th className="hidden sm:table-cell px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Email
                    </th>
                    {/* Joined hidden on mobile */}
                    <th className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Joined
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
                        className="px-4 py-10 text-center text-sm text-gray-400 lg:text-xs">
                        No users match your search.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u: UserRecord, i: number) => (
                      <tr
                        key={u.id}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                          i % 2 === 1 ? "bg-gray-50/50" : "bg-white"
                        }`}>
                        {/* User — initials + name + phone as subtitle */}
                        <td className="px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="flex h-8 w-8 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-xs font-bold text-gray-600">
                              {getInitials(u.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 lg:text-xs">
                                {u.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate lg:text-[11px]">
                                {u.phone || "No phone"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role badge */}
                        <td className="px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight ${getRoleBadge(
                              u.role
                            )}`}>
                            {u.role}
                          </span>
                        </td>

                        {/* Email — hidden on mobile */}
                        <td className="hidden sm:table-cell px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-sm text-gray-500 lg:text-xs">
                          {u.email}
                        </td>

                        {/* Joined date — hidden on mobile + sm */}
                        <td className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4 lg:px-4 lg:py-3 text-sm text-gray-500 lg:text-xs">
                          {formatDate(u.created_at)}
                        </td>

                        {/* Actions — wired to modals in next step */}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <footer className="mt-auto pt-6 text-center text-xs text-gray-500 md:text-sm lg:text-[11px]">
            © 2024 Editorial Residence Apartments. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}
