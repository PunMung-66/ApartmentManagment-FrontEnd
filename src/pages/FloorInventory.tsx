import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";
import type { Room, RoomStats, FloorGroup } from "@/types/room";
import { Card } from "@/components/ui/card";
import { StaffSidebar } from "@/components/StaffSidebar";

export default function FloorInventory() {
  const api = useApiWithAuth();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState<RoomStats>({
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
  });
  const [floorGroups, setFloorGroups] = useState<FloorGroup[]>([]);

  function calculateStats(roomData: Room[]) {
    const stats: RoomStats = {
      total: roomData.length,
      available: roomData.filter((r) => r.status === "Available").length,
      occupied: roomData.filter((r) => r.status === "Occupied").length,
      maintenance: roomData.filter((r) => r.status === "Maintenance").length,
    };
    setStats(stats);
  }

  function groupByFloor(roomData: Room[]) {
    const grouped = roomData.reduce((acc, room) => {
      const existing = acc.find((g) => g.level === room.level);
      if (existing) {
        existing.rooms.push(room);
      } else {
        acc.push({ level: room.level, rooms: [room] });
      }
      return acc;
    }, [] as FloorGroup[]);

    // Sort by level ascending
    grouped.sort((a, b) => a.level - b.level);

    // Sort rooms within each floor by room number
    grouped.forEach((group) => {
      group.rooms.sort((a, b) =>
        a.room_number.localeCompare(b.room_number, undefined, {
          numeric: true,
        }),
      );
    });

    setFloorGroups(grouped);
  }

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Room[]>("/rooms", { skipToast: true });

      if (response.data) {
        calculateStats(response.data);
        groupByFloor(response.data);
      }
    } catch (error) {
      console.error("[FloorInventory] Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRooms();
  }, [fetchRooms]);

  const getStatusColor = (status: Room["status"]) => {
    switch (status) {
      case "Available":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "Occupied":
        return "bg-red-50 text-red-700 border-red-200";
      case "Maintenance":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusBadgeColor = (status: Room["status"]) => {
    switch (status) {
      case "Available":
        return "bg-teal-500";
      case "Occupied":
        return "bg-red-500";
      case "Maintenance":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
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
              Floor Inventory
            </h2>
            <p className="mt-1 text-sm text-gray-600 md:text-sm lg:text-xs">
              Live occupancy status and unit management
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mb-6 md:grid-cols-2 md:gap-4 lg:mb-4 lg:grid-cols-4 lg:gap-3">
            <Card variant="elevated" className="p-4 md:p-4 lg:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 lg:text-[10px]">
                    Total Rooms
                  </p>
                  <p className="text-2xl font-bold text-gray-900 md:text-3xl lg:text-2xl">
                    {stats.total}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 md:h-11 md:w-11 lg:h-9 lg:w-9">
                  <svg
                    className="h-5 w-5 text-gray-600 lg:h-4 lg:w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>
            </Card>

            <Card variant="elevated" className="p-4 md:p-4 lg:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 lg:text-[10px]">
                    Available
                  </p>
                  <p className="text-2xl font-bold text-teal-600 md:text-3xl lg:text-2xl">
                    {stats.available}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 md:h-11 md:w-11 lg:h-9 lg:w-9">
                  <svg
                    className="h-5 w-5 text-teal-600 lg:h-4 lg:w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </Card>

            <Card variant="elevated" className="p-4 md:p-4 lg:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 lg:text-[10px]">
                    Occupied
                  </p>
                  <p className="text-2xl font-bold text-red-600 md:text-3xl lg:text-2xl">
                    {stats.occupied}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 md:h-11 md:w-11 lg:h-9 lg:w-9">
                  <svg
                    className="h-5 w-5 text-red-600 lg:h-4 lg:w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </Card>

            <Card variant="elevated" className="p-4 md:p-4 lg:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 lg:text-[10px]">
                    Maintenance
                  </p>
                  <p className="text-2xl font-bold text-orange-600 md:text-3xl lg:text-2xl">
                    {stats.maintenance}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 md:h-11 md:w-11 lg:h-9 lg:w-9">
                  <svg
                    className="h-5 w-5 text-orange-600 lg:h-4 lg:w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </div>

          {/* Floor Sections */}
          <div className="space-y-4 md:space-y-5 lg:space-y-3">
            {floorGroups.map((floor) => (
              <section
                key={floor.level}
                className="rounded-xl bg-white p-4 shadow-sm md:p-5 lg:rounded-lg lg:p-3"
              >
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 lg:mb-3 lg:pb-2">
                  <h3 className="font-display text-lg font-bold text-gray-900 md:text-xl lg:text-sm">
                    Level {floor.level.toString().padStart(2, "0")}
                  </h3>
                  <span className="text-sm font-medium text-gray-500 lg:text-xs">
                    {floor.rooms.length} {floor.rooms.length === 1 ? "Unit" : "Units"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 md:gap-3 lg:grid-cols-4 lg:gap-2.5">
                  {floor.rooms.map((room) => (
                    <button
                      key={room.room_id}
                      className={`relative rounded-lg border-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm md:p-4 lg:p-2.5 ${getStatusColor(room.status)}`}
                    >
                      <div className="mb-2.5 flex items-start justify-between lg:mb-2">
                        <span className="font-display text-base font-bold text-gray-900 md:text-lg lg:text-sm">
                          {room.room_number}
                        </span>
                        <svg
                          className="h-4 w-4 text-gray-400 lg:h-3.5 lg:w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${getStatusBadgeColor(room.status)}`}
                        ></span>
                        <span className="text-sm font-semibold lg:text-xs">{room.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Footer */}
          <footer className="mt-8 text-center text-xs text-gray-500 md:text-sm lg:mt-6 lg:text-[11px]">
            © 2024 Editorial Residence Apartments. All rights reserved.
          </footer>
        </main>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-5 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl md:bottom-6 md:right-6 md:h-14 md:w-14 lg:bottom-5 lg:right-5 lg:h-10 lg:w-10">
        <svg
          className="h-5 w-5 lg:h-4 lg:w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
}
