import type { ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ModalOverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra className forwarded to DialogContent */
  className?: string;
  /** Whether to show the built-in X close button. Defaults to false for blocking modals. */
  showCloseButton?: boolean;
}

/**
 * ModalOverlay
 *
 * A reusable fully-blocking modal wrapper built on top of Dialog.
 * - Prevents closing by clicking outside (intercepted in onOpenChange).
 * - Prevents closing via the ESC key (intercepted in onOpenChange).
 * - Only closes when the consumer explicitly calls onClose (e.g. via a button).
 *
 * Usage:
 *   <ModalOverlay open={!!selectedItem} onClose={() => setSelectedItem(null)}>
 *     <DialogHeader>...</DialogHeader>
 *     ...
 *   </ModalOverlay>
 */
export function ModalOverlay({
  open,
  onClose,
  children,
  className,
  showCloseButton = false,
}: ModalOverlayProps) {
  /**
   * Base UI's Dialog.Popup does NOT expose onPointerDownOutside / onEscapeKeyDown
   * (those are Radix UI props). In Base UI, all close attempts — including ESC and
   * outside clicks — funnel through onOpenChange on Dialog.Root.
   *
   * By passing a no-op to onOpenChange, we block every automatic close trigger.
   * The dialog can only be dismissed by explicitly calling onClose from within.
   */
  const blockClose = () => {
    // intentionally empty — prevents ESC and outside-click from closing
  };

  return (
    <Dialog open={open} onOpenChange={open ? blockClose : onClose}>
      <DialogContent showCloseButton={showCloseButton} className={className}>
        {children}
      </DialogContent>
    </Dialog>
  );
}
