import { useEffect, useState } from "react";
import type { Room } from "@/types/room";
import { ModalOverlay } from "@/components/ModalOverlay";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";

interface DeleteRoomDialogProps {
  room: Room | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteRoomDialog({
  room,
  open,
  onClose,
  onSuccess,
}: DeleteRoomDialogProps) {
  const api = useApiWithAuth();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Reset confirmation text when the modal opens/closes
  useEffect(() => {
    if (open) {
      setConfirmText("");
    }
  }, [open]);

  const handleDelete = async () => {
    if (!room) return;
    if (confirmText !== "DELETE") return;

    setDeleting(true);
    try {
      await api.delete(`/rooms/${room.room_id}`);
      onSuccess();
      onClose();
    } catch (err) {
      // Error handling delegated to ApiContext / useApiWithAuth
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={onClose} showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Delete Room</DialogTitle>
        <DialogDescription>
          This action cannot be undone. To confirm, type "DELETE" in the box
          below.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-2">
        <div className="mb-2 text-sm text-muted-foreground">
          {room
            ? `Room ${room.room_number} (Level ${room.level})`
            : "No room selected."}
        </div>

        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder='Type "DELETE" to confirm'
          aria-label="Type DELETE to confirm"
        />
      </div>

      <DialogFooter className="mt-4" showCloseButton={false}>
        <DialogClose asChild>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogClose>

        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting || confirmText !== "DELETE"}>
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogFooter>
    </ModalOverlay>
  );
}
