import { useCallback, useEffect, useState } from "react";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";
import type { Room, RoomStats, FloorGroup } from "@/types/room";

export function useFloorInventory() {
  const api = useApiWithAuth();
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [stats, setStats] = useState<RoomStats>({
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
  });
  const [floorGroups, setFloorGroups] = useState<FloorGroup[]>([]);

  function calculateStats(roomData: Room[]) {
    setStats({
      total: roomData.length,
      available: roomData.filter((r) => r.status === "Available").length,
      occupied: roomData.filter((r) => r.status === "Occupied").length,
      maintenance: roomData.filter((r) => r.status === "Maintenance").length,
    });
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
        a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
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
    fetchRooms();
  }, [fetchRooms]);

  return {
    loading,
    stats,
    floorGroups,
    selectedRoom,
    setSelectedRoom,
  };
}