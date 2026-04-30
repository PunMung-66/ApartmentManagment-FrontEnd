import type { Room } from "@/types/room";
import { ModalOverlay } from "@/components/Reusable Component/ModalOverlay";
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
              <span className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${getStatusBadgeColor(
                    room.status
                  )}`}
                />
                <span className="font-semibold">{room.status}</span>
              </span>

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

          <DialogFooter className="flex justify-between items-center">
            <DialogClose asChild>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" onClick={onClose}>
                Update
              </Button>
            </DialogClose>
          </DialogFooter>
        </>
      )}
    </ModalOverlay>
  );
}
