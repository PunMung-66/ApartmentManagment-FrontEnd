import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";
import { useToast } from "@/contexts/ToastContext";
import type { Room, RoomStats, FloorGroup } from "@/types/room";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StaffSidebar } from "@/components/StaffSidebar";
import { Plus, X, Edit2, Trash2, Info, Loader2 } from "lucide-react";

type ModalMode = "create" | "edit" | "view" | "delete" | null;

interface FormData {
  room_number: string;
  level: number | "";
  status: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function FloorInventory() {
  const api = useApiWithAuth();
  const { user, logout } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
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

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<FormData>({
    room_number: "",
    level: "",
    status: "Available",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [roomHasContract, setRoomHasContract] = useState(false);

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

    grouped.sort((a, b) => a.level - b.level);

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

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.room_number.trim())
      errors.room_number = "Room number is required";
    if (formData.level === "" || Number(formData.level) < 1)
      errors.level = "Level is required and must be at least 1";
    return errors;
  };

  const openCreateModal = () => {
    setFormData({
      room_number: "",
      level: "",
      status: "Available",
    });
    setFormErrors({});
    setSelectedRoom(null);
    setModalMode("create");
  };

  const openViewModal = (room: Room) => {
    setSelectedRoom(room);
    setModalMode("view");
  };

  const openEditModal = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      room_number: room.room_number,
      level: room.level,
      status: room.status,
    });
    setFormErrors({});
    setRoomHasContract(room.status === "Occupied");
    setModalMode("edit");

    api
      .get<unknown[]>(`/rooms/${room.room_id}/contracts`, { skipToast: true })
      .then((res) => {
        if (res.data) setRoomHasContract(res.data.length > 0);
      })
      .catch(() => setRoomHasContract(false));
  };

  const openDeleteModal = (room: Room) => {
    setSelectedRoom(room);
    setModalMode("delete");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedRoom(null);
    setRoomHasContract(false);
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "level" ? (value === "" ? "" : Number(value)) : value,
    }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, string | number> = {
        room_number: formData.room_number.trim(),
        level: Number(formData.level),
        status: modalMode === "create" ? "Available" : formData.status,
      };

      if (modalMode === "create") {
        const response = await api.post("/rooms", payload, { skipToast: true });
        showSuccess(response.message || "Room created successfully");
      } else if (modalMode === "edit" && selectedRoom) {
        const response = await api.put(
          `/rooms/${selectedRoom.room_id}`,
          payload,
          { skipToast: true },
        );
        showSuccess(response.message || "Room updated successfully");
      }

      closeModal();
      await fetchRooms();
    } catch (error: unknown) {
      const errorMsg =
        (error as { message?: string }).message || "Failed to save room";
      showError(errorMsg);
      console.error("[FloorInventory] Failed to save room:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;

    setSubmitting(true);
    try {
      const response = await api.delete(`/rooms/${selectedRoom.room_id}`, {
        skipToast: true,
      });
      showSuccess(response.message || "Room deleted successfully");
      closeModal();
      await fetchRooms();
    } catch (error: unknown) {
      const errorMsg =
        (error as { message?: string }).message || "Failed to delete room";
      showError(errorMsg);
      console.error("[FloorInventory] Failed to delete room:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900 md:text-2xl lg:text-lg">
                  Floor Inventory
                </h2>
                <p className="mt-1 text-sm text-gray-600 md:text-sm lg:text-xs">
                  Live occupancy status and unit management
                </p>
              </div>
              <Button
                onClick={openCreateModal}
                className="gap-2 bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                New Room
              </Button>
            </div>
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
                    {floor.rooms.length}{" "}
                    {floor.rooms.length === 1 ? "Unit" : "Units"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 md:gap-3 lg:grid-cols-4 lg:gap-2.5">
                  {floor.rooms.map((room) => (
                    <button
                      key={room.room_id}
                      onClick={() => openViewModal(room)}
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
                        <span className="text-sm font-semibold lg:text-xs">
                          {room.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={openCreateModal}
        className="fixed bottom-5 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl md:bottom-6 md:right-6 md:h-14 md:w-14 lg:bottom-5 lg:right-5 lg:h-10 lg:w-10"
      >
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

      {/* Modal Overlay */}
      <AnimatePresence>
        {modalMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden"
            >
              {modalMode === "view" && selectedRoom && (
                <RoomViewModal
                  room={selectedRoom}
                  onClose={closeModal}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                  formatDate={formatDate}
                  getStatusBadgeColor={getStatusBadgeColor}
                />
              )}

              {(modalMode === "create" || modalMode === "edit") && (
                <RoomFormModal
                  mode={modalMode}
                  formData={formData}
                  errors={formErrors}
                  submitting={submitting}
                  roomHasContract={roomHasContract}
                  onFieldChange={handleFieldChange}
                  onSubmit={handleSubmit}
                  onCancel={closeModal}
                />
              )}

              {modalMode === "delete" && selectedRoom && (
                <RoomDeleteModal
                  room={selectedRoom}
                  submitting={submitting}
                  onConfirm={handleDelete}
                  onCancel={closeModal}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoomViewModal({
  room,
  onClose,
  onEdit,
  onDelete,
  formatDate,
  getStatusBadgeColor,
}: {
  room: Room;
  onClose: () => void;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  formatDate: (dateStr?: string) => string;
  getStatusBadgeColor: (status: Room["status"]) => string;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {room.room_number.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900">
              Room Details
            </h3>
            <p className="text-xs text-gray-500">Room {room.room_number}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Room Number
            </p>
            <p className="text-sm text-gray-900 font-medium">
              {room.room_number}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Level
            </p>
            <p className="text-sm text-gray-900 font-medium">{room.level}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Status
          </p>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
              room.status === "Available"
                ? "bg-teal-100 text-teal-700"
                : room.status === "Occupied"
                  ? "bg-red-100 text-red-700"
                  : "bg-orange-100 text-orange-700"
            }`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${getStatusBadgeColor(room.status)}`}
            />
            {room.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Created
            </p>
            <p className="text-xs text-gray-700">
              {formatDate(room.created_at)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Updated
            </p>
            <p className="text-xs text-gray-700">
              {formatDate(room.updated_at)}
            </p>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Room ID
          </p>
          <p className="text-xs text-gray-500 font-mono break-all">
            {room.room_id}
          </p>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => onDelete(room)}
            className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50 transition-colors"
            title="Delete room"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(room)}
            className="rounded-md border border-blue-200 p-2 text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit room"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
        <Button
          onClick={onClose}
          variant="secondary"
          className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-white"
        >
          Close
        </Button>
      </div>
    </>
  );
}

function RoomFormModal({
  mode,
  formData,
  errors,
  submitting,
  roomHasContract,
  onFieldChange,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  formData: FormData;
  errors: FormErrors;
  submitting: boolean;
  roomHasContract: boolean;
  onFieldChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    options.add(formData.status);
    options.add("Maintenance");
    if (roomHasContract) {
      options.add("Occupied");
    } else {
      options.add("Available");
    }
    return Array.from(options);
  }, [formData.status, roomHasContract]);

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-gray-500" />
          <h3 className="font-display text-lg font-bold text-gray-900">
            {mode === "create" ? "Create New Room" : "Edit Room"}
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="room-number">
            Room Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="room-number"
            type="text"
            placeholder="e.g. 101"
            value={formData.room_number}
            onChange={(e) => onFieldChange("room_number", e.target.value)}
            className={errors.room_number ? "border-red-500" : ""}
          />
          {errors.room_number && (
            <p className="text-red-500 text-xs">{errors.room_number}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="room-level">
            Level <span className="text-red-500">*</span>
          </Label>
          <Input
            id="room-level"
            type="number"
            min={1}
            placeholder="e.g. 1"
            value={formData.level}
            onChange={(e) => onFieldChange("level", e.target.value)}
            className={errors.level ? "border-red-500" : ""}
          />
          {errors.level && (
            <p className="text-red-500 text-xs">{errors.level}</p>
          )}
        </div>

        {mode === "edit" && (
          <div className="space-y-2">
            <Label htmlFor="room-status">Status</Label>
            <select
              id="room-status"
              value={formData.status}
              onChange={(e) => onFieldChange("status", e.target.value)}
              className="h-9 w-full min-w-0 rounded-md border border-input/20 bg-transparent px-3 py-2 font-body text-sm text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
        <Button
          onClick={onCancel}
          variant="secondary"
          className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-white"
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          className="bg-primary hover:bg-primary/90 text-white"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              {mode === "create" ? "Creating..." : "Saving..."}
            </>
          ) : (
            <>{mode === "create" ? "Create Room" : "Save Changes"}</>
          )}
        </Button>
      </div>
    </>
  );
}

function RoomDeleteModal({
  room,
  submitting,
  onConfirm,
  onCancel,
}: {
  room: Room;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-red-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-4 w-4 text-red-600" />
          </div>
          <h3 className="font-display text-lg font-bold text-gray-900">
            Delete Room
          </h3>
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm text-gray-700">
          Are you sure you want to delete this room?
        </p>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {room.room_number.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                Room {room.room_number}
              </p>
              <p className="text-xs text-gray-500">
                Level {room.level} &middot; {room.status}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-red-500 font-medium">
          This action cannot be undone. Rooms with existing contracts cannot be
          deleted.
        </p>
      </div>

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
        <Button
          onClick={onCancel}
          variant="secondary"
          className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-white"
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          className="bg-red-600 hover:bg-red-700 text-white"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              Deleting...
            </>
          ) : (
            "Delete Room"
          )}
        </Button>
      </div>
    </>
  );
}
