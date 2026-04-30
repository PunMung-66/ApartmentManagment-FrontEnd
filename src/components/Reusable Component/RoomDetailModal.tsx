import { useEffect, useState } from "react";
import type { Room } from "@/types/room";
import { ModalOverlay } from "@/components/Reusable Component/ModalOverlay";
import { DeleteRoomDialog } from "@/components/Reusable Component/DeleteRoomDialog";
import {
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";

interface RoomDetailModalProps {
  room: Room | null;
  onClose: () => void;
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

export function RoomDetailModal({ room, onClose }: RoomDetailModalProps) {
  const api = useApiWithAuth();

  // State management
  const [status, setStatus] = useState<Room["status"]>(() =>
    room ? room.status : "Available"
  );
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Synchronize status when the room prop changes
  useEffect(() => {
    if (room) {
      setStatus(room.status);
    } else {
      setStatus("Available");
    }
  }, [room]);

  const handleUpdate = async () => {
    if (!room) return;
    if (status === room.status) return;
    setSaving(true);
    try {
      await api.put(`/rooms/${room.room_id}`, {
        room_number: room.room_number,
        level: room.level,
        status: status,
      });
      onClose();
    } catch (err) {
      // Error handling is managed by useApiWithAuth context
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay open={!!room} onClose={onClose}>
      {room && (
        <>
          <DialogHeader>
            <DialogTitle>Room {room.room_number}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-1">
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
              <span className="font-medium text-muted-foreground">Level</span>
              <span className="text-foreground">
                {room.level.toString().padStart(2, "0")}
              </span>

              <span className="font-medium text-muted-foreground">Status</span>
              <div className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 rounded-full ${getStatusBadgeColor(
                    status
                  )}`}
                />
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as Room["status"])}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Occupied">Occupied</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <span className="font-medium text-muted-foreground">
                Created At
              </span>
              <span className="text-foreground">
                {new Date(room.created_at).toLocaleString()}
              </span>

              <span className="font-medium text-muted-foreground">
                Updated At
              </span>
              <span className="text-foreground">
                {new Date(room.updated_at).toLocaleString()}
              </span>
            </div>
          </div>

          <DialogFooter className="mt-4" showCloseButton={false}>
            {/* Delete button pushed to the left using sm:mr-auto */}
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              className="sm:mr-auto">
              Delete
            </Button>

            <Button
              variant="secondary"
              onClick={handleUpdate}
              disabled={saving || status === room.status}>
              {saving ? "Updating..." : "Update"}
            </Button>

            <DialogClose asChild>
              <Button variant="primary" onClick={onClose}>
                Close
              </Button>
            </DialogClose>
          </DialogFooter>

          {/* Separate Dialog for Deletion Confirmation */}
          <DeleteRoomDialog
            room={room}
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            onSuccess={() => {
              setDeleteOpen(false);
              onClose(); // Close the detail modal after successful deletion
            }}
          />
        </>
      )}
    </ModalOverlay>
  );
}
