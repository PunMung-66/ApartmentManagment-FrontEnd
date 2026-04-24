import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";
import type { Room, RoomStats, FloorGroup } from "@/types/room";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FloorInventory() {
  const api = useApiWithAuth();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RoomStats>({
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
  });
  const [floorGroups, setFloorGroups] = useState<FloorGroup[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadRooms = async () => {
      if (isMounted) {
        await fetchRooms();
      }
    };

    loadRooms();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchRooms = async () => {
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
  };

  const calculateStats = (roomData: Room[]) => {
    const stats: RoomStats = {
      total: roomData.length,
      available: roomData.filter((r) => r.status === "Available").length,
      occupied: roomData.filter((r) => r.status === "Occupied").length,
      maintenance: roomData.filter((r) => r.status === "Maintenance").length,
    };
    setStats(stats);
  };

  const groupByFloor = (roomData: Room[]) => {
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
  };

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg fixed h-full flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="font-display text-xl font-bold text-gray-900">
            Editorial Residence
          </h1>
          <p className="text-sm text-gray-500 mt-1">Staff Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white font-medium">
            <svg
              className="w-5 h-5"
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
            Floor Overview
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">
            <svg
              className="w-5 h-5"
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
            All Contracts
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">
            <svg
              className="w-5 h-5"
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
            All Users
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
              {user?.name?.charAt(0) || "P"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || "Property Manager"}
              </p>
              <p className="text-xs text-gray-500">Lead Admin</p>
            </div>
          </div>
          <Button
            onClick={logout}
            className="w-full justify-center border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="font-display text-3xl font-bold text-gray-900">
            Floor Inventory
          </h2>
          <p className="text-gray-600 mt-1">
            Live occupancy status and unit management
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Total Rooms
                </p>
                <p className="text-4xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-600"
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

          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Available
                </p>
                <p className="text-4xl font-bold text-teal-600">
                  {stats.available}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-teal-600"
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

          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Occupied
                </p>
                <p className="text-4xl font-bold text-red-600">
                  {stats.occupied}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
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

          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Maintenance
                </p>
                <p className="text-4xl font-bold text-orange-600">
                  {stats.maintenance}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600"
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
        <div className="space-y-8">
          {floorGroups.map((floor) => (
            <div
              key={floor.level}
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h3 className="font-display text-xl font-bold text-gray-900">
                  Level {floor.level.toString().padStart(2, "0")}
                </h3>
                <span className="text-sm text-gray-500 font-medium">
                  {floor.rooms.length}{" "}
                  {floor.rooms.length === 1 ? "Unit" : "Units"}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {floor.rooms.map((room) => (
                  <button
                    key={room.room_id}
                    className={`relative p-5 rounded-xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5 ${getStatusColor(room.status)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-display text-lg font-bold text-gray-900">
                        {room.room_number}
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-400"
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
                        className={`w-2 h-2 rounded-full ${getStatusBadgeColor(room.status)}`}
                      ></span>
                      <span className="text-xs font-semibold">
                        {room.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          © 2024 Editorial Residence Apartments. All rights reserved.
        </footer>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center">
        <svg
          className="w-6 h-6"
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
