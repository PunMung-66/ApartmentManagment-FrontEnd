import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import type { Room } from "@/types/room";
import { Card } from "@/components/ui/card";
import { StaffSidebar } from "@/components/StaffSidebar";
import { useFloorInventory } from "../../components/UseFloorInventory";
import { RoomDetailModal } from "../../components/FloorInventoryComponent/RoomDetailModal";
import { RoomAddModal } from "@/components/FloorInventoryComponent/RoomAddModal";

function getStatusColor(status: Room["status"]) {
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
}

function getStatusBadgeColor(status: Room["status"]) {
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
}

export default function FloorInventory() {
  const { user, logout } = useAuth();

  // Keep ONLY desktop collapse here (mobile handled by sidebar itself)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Add modal
  const [addOpen, setAddOpen] = useState(false);

  const { loading, stats, floorGroups, selectedRoom, setSelectedRoom } =
    useFloorInventory();

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
          {/* Page Header */}
          <div className="mb-5 md:mb-6 lg:mb-4">
            <h2 className="font-display text-xl font-bold text-gray-900 md:text-2xl lg:text-lg">
              Floor Inventory
            </h2>
            <p className="mt-1 text-sm text-gray-600 md:text-sm lg:text-xs">
              Live occupancy status and unit management
            </p>
          </div>

          {/* Stats */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mb-6 lg:grid-cols-4">
            <Card className="p-4">
              <p>Total Rooms</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <p>Available</p>
              <p className="text-xl font-bold text-teal-600">
                {stats.available}
              </p>
            </Card>
            <Card className="p-4">
              <p>Occupied</p>
              <p className="text-xl font-bold text-red-600">{stats.occupied}</p>
            </Card>
            <Card className="p-4">
              <p>Maintenance</p>
              <p className="text-xl font-bold text-orange-600">
                {stats.maintenance}
              </p>
            </Card>
          </div>

          {/* Floors */}
          <div className="space-y-4">
            {floorGroups.map((floor) => (
              <section key={floor.level} className="bg-white p-4 rounded-lg">
                <div className="flex justify-between mb-3">
                  <h3>Level {floor.level}</h3>
                  <span>{floor.rooms.length} units</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {floor.rooms.map((room) => (
                    <button
                      key={room.room_id}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-3 border rounded ${getStatusColor(
                        room.status
                      )}`}>
                      <div className="flex justify-between">
                        <span>{room.room_number}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`w-2 h-2 rounded-full ${getStatusBadgeColor(
                            room.status
                          )}`}
                        />
                        <span>{room.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-auto text-center text-xs text-gray-500 pt-6">
            © 2024 Editorial Residence Apartments
          </footer>
        </main>
      </div>

      {/* Modals */}
      <RoomDetailModal
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
      />

      <RoomAddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => setAddOpen(false)}
      />

      {/* FAB */}
      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-5 right-5 w-12 h-12 bg-black text-white rounded-full">
        +
      </button>
    </div>
  );
}
