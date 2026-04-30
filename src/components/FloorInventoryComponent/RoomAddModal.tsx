import { useEffect, useState } from "react";
import type { Room } from "@/types/room";
import { ModalOverlay } from "@/components/ModalOverlay";
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";

interface RoomAddModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RoomAddModal({ open, onClose, onSuccess }: RoomAddModalProps) {
  const api = useApiWithAuth();

  const [roomNumber, setRoomNumber] = useState("");
  const [level, setLevel] = useState<number | "">("");
  const [status, setStatus] = useState<Room["status"]>("Available");
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setRoomNumber("");
      setLevel("");
      setStatus("Available");
      setLoading(false);
    }
  }, [open]);

  const isInvalid = loading || roomNumber.trim() === "" || level === "";

  const handleCreate = async () => {
    if (isInvalid) return;
    setLoading(true);
    try {
      await api.post("/rooms", {
        room_number: roomNumber.trim(),
        level: Number(level),
        status,
      });
      onSuccess();
      onClose();
    } catch (err) {
      // Error handling delegated to useApiWithAuth / ApiContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={onClose} showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Add Room</DialogTitle>
      </DialogHeader>

      <div className="grid gap-3 py-2">
        <div className="grid gap-1">
          <label className="text-sm font-medium text-muted-foreground">
            Room Number
          </label>
          <Input
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g. A101"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium text-muted-foreground">
            Level
          </label>
          <Input
            type="number"
            value={level === "" ? "" : String(level)}
            onChange={(e) => {
              const v = e.target.value;
              setLevel(v === "" ? "" : Number(v));
            }}
            placeholder="e.g. 1"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium text-muted-foreground">
            Status
          </label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as Room["status"])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Occupied">Occupied</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter className="mt-4" showCloseButton={false}>
        <Button variant="secondary" onClick={handleCreate} disabled={isInvalid}>
          {loading ? "Creating..." : "Create"}
        </Button>

        <DialogClose asChild>
          <Button variant="primary" onClick={onClose}>
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </ModalOverlay>
  );
}
