import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";
import type { Contract } from "@/types/contract";
import type { User, ApiResponse } from "@/lib/api";
import type { Room } from "@/types/room";
import { Card } from "@/components/ui/card";
import { StaffSidebar } from "@/components/StaffSidebar";
import { Search } from "lucide-react";

interface ContractWithDetails extends Contract {
  tenantName?: string;
  tenantEmail?: string;
  roomNumber?: string;
}

export default function AllContracts() {
  const api = useApiWithAuth();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    active: 0,
    inactive: 0,
  });

  const enrichContracts = useCallback(
    async (contracts: Contract[]) => {
      const tenantMap = new Map<string, User>();
      const roomMap = new Map<string, Room>();

      const uniqueUserIds = [...new Set(contracts.map((c) => c.user_id))];
      const uniqueRoomIds = [...new Set(contracts.map((c) => c.room_id))];

      const tenantPromises = uniqueUserIds.map(async (id) => {
        try {
          const res = await api.get<ApiResponse<User>>(`/users/${id}`, { skipToast: true });
          if (res.data) tenantMap.set(id, res.data);
        } catch {
          // ignore individual failures
        }
      });

      const roomPromises = uniqueRoomIds.map(async (id) => {
        try {
          const res = await api.get<ApiResponse<Room>>(`/rooms/${id}`, { skipToast: true });
          if (res.data) roomMap.set(id, res.data);
        } catch {
          // ignore individual failures
        }
      });

      await Promise.all([...tenantPromises, ...roomPromises]);

      return contracts.map((contract) => {
        const tenant = tenantMap.get(contract.user_id);
        const room = roomMap.get(contract.room_id);
        return {
          ...contract,
          tenantName: tenant?.name || "Unknown",
          tenantEmail: tenant?.email || "",
          roomNumber: room?.room_number || "Unknown",
        };
      });
    },
    [api],
  );

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Contract[]>("/contracts", { skipToast: true });

      if (response.data) {
        const enriched = await enrichContracts(response.data);
        setContracts(enriched);

        const activeCount = enriched.filter((c) => c.status === "Active").length;
        const inactiveCount = enriched.filter((c) => c.status === "Inactive").length;
        setStats({ active: activeCount, inactive: inactiveCount });
      }
    } catch (error) {
      console.error("[AllContracts] Failed to fetch contracts:", error);
    } finally {
      setLoading(false);
    }
  }, [api, enrichContracts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContracts();
  }, [fetchContracts]);

  const filteredContracts = useMemo(() => {
    if (!searchTerm) {
      return contracts;
    } else {
      const term = searchTerm.toLowerCase();
      return contracts.filter(
        (c) =>
          c.tenantName?.toLowerCase().includes(term) ||
          c.tenantEmail?.toLowerCase().includes(term) ||
          c.roomNumber?.toLowerCase().includes(term) ||
          c.status.toLowerCase().includes(term),
      );
    }
  }, [searchTerm, contracts]);

  const getStatusBadgeColor = (status: Contract["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Inactive":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-base md:text-sm text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-base font-bold text-gray-900">
              Editorial Residence
            </h1>
            <p className="text-xs text-gray-500">Staff Portal</p>
          </div>
          <button
            type="button"
            aria-label="Toggle sidebar menu"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 shadow-sm"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile/Tablet Overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <div className="flex min-h-screen">
        <StaffSidebar
          user={user}
          isSidebarOpen={isSidebarOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleDesktopCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onLogout={logout}
        />

        {/* Main Content */}
        <main
          className={`flex-1 px-4 pb-20 pt-4 md:px-6 md:pt-5 lg:px-5 lg:pt-4 ${
            isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          {/* Header */}
          <div className="mb-5 md:mb-6 lg:mb-4">
            <h2 className="font-display text-xl font-bold text-gray-900 md:text-2xl lg:text-lg">
              All Contracts
            </h2>
            <p className="mt-1 text-sm text-gray-600 md:text-sm lg:text-xs">
              {stats.active} Active • {stats.inactive} Inactive
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-5 md:mb-6 lg:mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tenant name, room, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>

          {/* Contracts Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold uppercase text-gray-600 lg:text-[10px]">
                      Tenant
                    </th>
                    <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold uppercase text-gray-600 lg:text-[10px]">
                      Room
                    </th>
                    <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold uppercase text-gray-600 lg:text-[10px]">
                      Start Date
                    </th>
                    <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold uppercase text-gray-600 lg:text-[10px]">
                      End Date
                    </th>
                    <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold uppercase text-gray-600 lg:text-[10px]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 md:px-6 text-center text-sm text-gray-500"
                      >
                        No contracts found
                      </td>
                    </tr>
                  ) : (
                    filteredContracts.map((c) => (
                      <tr
                        key={c.contract_id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 md:px-6 md:py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white md:h-9 md:w-9">
                              {c.tenantName?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                                {c.tenantName || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {c.tenantEmail || ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4">
                          <p className="text-sm font-medium text-gray-700">
                            {c.roomNumber || "N/A"}
                          </p>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4">
                          <p className="text-sm text-gray-700">{formatDate(c.start_date)}</p>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4">
                          <p className="text-sm text-gray-700">
                            {c.end_date ? formatDate(c.end_date) : "No end date"}
                          </p>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 flex items-center">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(
                              c.status,
                            )}`}
                          >
                            <span className={`h-2 w-2 shrink-0 rounded-full ${c.status === "Active" ? "bg-green-500" : "bg-gray-500"}`}></span>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </Card>
          </main>
      </div>
    </div>
  );
}
