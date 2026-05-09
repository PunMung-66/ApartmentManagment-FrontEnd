import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";
import { useToast } from "@/contexts/ToastContext";
import type { Bill } from "@/types/bill";
import type { Contract } from "@/types/contract";
import type { Room } from "@/types/room";
import type { User } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StaffSidebar } from "@/components/StaffSidebar";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Info,
  Loader2,
  FileText,
  ExternalLink,
} from "lucide-react";

interface EnrichedBill extends Bill {
  roomNumber: string;
  tenantName: string;
}

type ModalMode = "generate" | "view" | "status" | "delete" | null;

const STATUS_STYLES: Record<string, string> = {
  Unpaid: "bg-red-100 text-red-700 border-red-200",
  WaitingApproval: "bg-amber-100 text-amber-700 border-amber-200",
  Paid: "bg-teal-100 text-teal-700 border-teal-200",
  Rejected: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function Bills() {
  const api = useApiWithAuth();
  const { user, logout } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [bills, setBills] = useState<Bill[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<User[]>([]);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [formData, setFormData] = useState({
    room_id: "",
    contract_id: "",
    record_date: "",
    due_date: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [billsRes, contractsRes, roomsRes, tenantsRes] = await Promise.allSettled([
        api.get<Bill[]>("/bills", { skipToast: true }),
        api.get<Contract[]>("/contracts", { skipToast: true }),
        api.get<Room[]>("/rooms", { skipToast: true }),
        api.get<User[]>("/users?role=TENANT", { skipToast: true }),
      ]);
      if (billsRes.status === "fulfilled" && billsRes.value.data) setBills(billsRes.value.data);
      if (contractsRes.status === "fulfilled" && contractsRes.value.data) setContracts(contractsRes.value.data);
      if (roomsRes.status === "fulfilled" && roomsRes.value.data) setRooms(roomsRes.value.data);
      if (tenantsRes.status === "fulfilled" && tenantsRes.value.data) setTenants(tenantsRes.value.data);
      if (billsRes.status === "rejected") console.error("[Bills] Failed to fetch bills:", billsRes.reason);
      if (contractsRes.status === "rejected") console.error("[Bills] Failed to fetch contracts:", contractsRes.reason);
      if (roomsRes.status === "rejected") console.error("[Bills] Failed to fetch rooms:", roomsRes.reason);
      if (tenantsRes.status === "rejected") console.error("[Bills] Failed to fetch tenants:", tenantsRes.reason);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const roomMap = useMemo(() => {
    const map = new Map<string, Room>();
    for (const r of rooms) map.set(r.room_id, r);
    return map;
  }, [rooms]);

  const tenantMap = useMemo(() => {
    const map = new Map<string, User>();
    for (const t of tenants) map.set(t.user_id, t);
    return map;
  }, [tenants]);

  const contractById = useMemo(() => {
    const map = new Map<string, Contract>();
    for (const c of contracts) map.set(c.contract_id, c);
    return map;
  }, [contracts]);

  const activeContracts = useMemo(() => {
    return contracts.filter((c) => c.status === "Active");
  }, [contracts]);

  const enrichedBills = useMemo(() => {
    return bills
      .map((b) => {
        const contract = contractById.get(b.contract_id);
        if (!contract) return null;
        const room = roomMap.get(contract.room_id);
        const tenant = tenantMap.get(contract.user_id);
        return {
          ...b,
          roomNumber: room?.room_number || "Unknown",
          tenantName: tenant?.name || "Unknown",
        };
      })
      .filter(Boolean) as EnrichedBill[];
  }, [bills, contractById, roomMap, tenantMap]);

  const filteredBills = useMemo(() => {
    if (!searchTerm) return enrichedBills;
    const term = searchTerm.toLowerCase();
    return enrichedBills.filter(
      (b) =>
        b.roomNumber.toLowerCase().includes(term) ||
        b.tenantName.toLowerCase().includes(term) ||
        b.status.toLowerCase().includes(term),
    );
  }, [searchTerm, enrichedBills]);

  const stats = useMemo(() => {
    const total = bills.length;
    const unpaid = bills.filter((b) => b.status === "Unpaid").length;
    const waiting = bills.filter((b) => b.status === "WaitingApproval").length;
    const paid = bills.filter((b) => b.status === "Paid").length;
    return { total, unpaid, waiting, paid };
  }, [bills]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openGenerateModal = () => {
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const dueDefault = nextMonth.toISOString().slice(0, 10);
    setFormData({
      room_id: "",
      contract_id: "",
      record_date: today,
      due_date: dueDefault,
    });
    setFormErrors({});
    setSelectedBill(null);
    setModalMode("generate");
  };

  const openViewModal = (bill: EnrichedBill) => {
    setSelectedBill(bill);
    setModalMode("view");
  };

  const openStatusModal = (bill: EnrichedBill) => {
    setSelectedBill(bill);
    setModalMode("status");
  };

  const openDeleteModal = (bill: EnrichedBill) => {
    setSelectedBill(bill);
    setModalMode("delete");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedBill(null);
  };

  const handleRoomChange = (roomId: string) => {
    const contract = activeContracts.find((c) => c.room_id === roomId);
    setFormData((prev) => ({
      ...prev,
      room_id: roomId,
      contract_id: contract ? contract.contract_id : "",
    }));
    if (formErrors.room_id) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.room_id;
        return next;
      });
    }
  };

  const validateGenerate = () => {
    const errors: Record<string, string> = {};
    if (!formData.room_id) errors.room_id = "Room is required";
    if (!formData.contract_id) errors.contract_id = "No active contract for this room";
    if (!formData.record_date) errors.record_date = "Record date is required";
    if (!formData.due_date) errors.due_date = "Due date is required";
    return errors;
  };

  const handleGenerate = async () => {
    const errors = validateGenerate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/bills/generate", {
        room_id: formData.room_id,
        contract_id: formData.contract_id,
        record_date: formData.record_date,
        due_date: formData.due_date,
      }, { skipToast: true });
      showSuccess(response.message || "Bill generated successfully");
      closeModal();
      await fetchData();
    } catch (error: unknown) {
      const errorMsg = (error as { message?: string }).message || "Failed to generate bill";
      showError(errorMsg);
      console.error("[Bills] Failed to generate bill:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedBill) return;

    setSubmitting(true);
    try {
      const response = await api.put(`/bills/${selectedBill.bill_id}`, { status: newStatus }, { skipToast: true });
      showSuccess(response.message || "Bill status updated");
      closeModal();
      await fetchData();
    } catch (error: unknown) {
      const errorMsg = (error as { message?: string }).message || "Failed to update status";
      showError(errorMsg);
      console.error("[Bills] Failed to update status:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBill) return;

    setSubmitting(true);
    try {
      const response = await api.delete(`/bills/${selectedBill.bill_id}`, { skipToast: true });
      showSuccess(response.message || "Bill deleted successfully");
      closeModal();
      await fetchData();
    } catch (error: unknown) {
      const errorMsg = (error as { message?: string }).message || "Failed to delete bill";
      showError(errorMsg);
      console.error("[Bills] Failed to delete bill:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const billsColumns: Column<EnrichedBill>[] = [
    {
      header: "Room",
      render: (b) => <p className="text-sm font-semibold text-gray-900">{b.roomNumber}</p>,
    },
    {
      header: "Tenant",
      render: (b) => <p className="text-sm text-gray-700">{b.tenantName}</p>,
    },
    {
      header: "Total",
      render: (b) => <p className="text-sm font-semibold text-gray-900">฿{formatCurrency(b.total_amount)}</p>,
    },
    {
      header: "Status",
      render: (b) => (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status] || ""}`}>
          {b.status}
        </span>
      ),
    },
    {
      header: "Due Date",
      render: (b) => <p className="text-sm text-gray-500">{formatDate(b.due_date)}</p>,
    },
    {
      header: "Slip",
      render: (b) =>
        b.bill_slip ? (
          <a
            href={b.bill_slip.slip_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="h-3 w-3" />
            View
          </a>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (b) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openViewModal(b)}
            className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
            title="View details"
          >
            <FileText className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => openStatusModal(b)}
            className="rounded-md border border-blue-200 p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
            title="Update status"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => openDeleteModal(b)}
            className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 transition-colors"
            title="Delete bill"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-base md:text-sm text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-base font-bold text-gray-900">Editorial Residence</h1>
            <p className="text-xs text-gray-500">Staff Portal</p>
          </div>
          <button
            type="button"
            aria-label="Toggle sidebar menu"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 shadow-sm"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

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

        <main className={`flex-1 min-w-0 px-4 pb-20 pt-4 md:px-6 md:pt-5 lg:px-5 lg:pt-4 ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
          <div className="mb-5 md:mb-6 lg:mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900 md:text-2xl lg:text-lg">Bills</h2>
                <p className="mt-1 text-sm text-gray-600 md:text-sm lg:text-xs">
                  {stats.total} Total &middot; {stats.unpaid} Unpaid &middot; {stats.paid} Paid &middot; {stats.waiting} Waiting
                </p>
              </div>
              <Button onClick={openGenerateModal} className="gap-2 bg-primary hover:bg-primary/90 text-white w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Generate Bill
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-3">
            <Card variant="elevated" className="p-4 lg:p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </Card>
            <Card variant="elevated" className="p-4 lg:p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Unpaid</p>
              <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
            </Card>
            <Card variant="elevated" className="p-4 lg:p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Waiting</p>
              <p className="text-2xl font-bold text-amber-600">{stats.waiting}</p>
            </Card>
            <Card variant="elevated" className="p-4 lg:p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Paid</p>
              <p className="text-2xl font-bold text-teal-600">{stats.paid}</p>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by room, tenant, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              spellCheck="false"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>

          <DataTable
            columns={billsColumns}
            data={filteredBills}
            keyExtractor={(b) => b.bill_id}
            emptyMessage="No bills found"
          />
        </main>
      </div>

      {/* Modals */}
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
              {modalMode === "generate" && (
                <GenerateBillModal
                  formData={formData}
                  errors={formErrors}
                  submitting={submitting}
                  rooms={rooms}
                  activeContracts={activeContracts}
                  onRoomChange={handleRoomChange}
                  onFieldChange={(field, value) => {
                    setFormData((prev) => ({ ...prev, [field]: value }));
                    if (formErrors[field]) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next[field];
                        return next;
                      });
                    }
                  }}
                  onSubmit={handleGenerate}
                  onCancel={closeModal}
                  roomMap={roomMap}
                />
              )}

              {modalMode === "view" && selectedBill && (
                <ViewBillModal
                  bill={selectedBill as EnrichedBill}
                  onClose={closeModal}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              )}

              {modalMode === "status" && selectedBill && (
                <StatusModal
                  bill={selectedBill as EnrichedBill}
                  submitting={submitting}
                  onUpdate={handleStatusUpdate}
                  onCancel={closeModal}
                />
              )}

              {modalMode === "delete" && selectedBill && (
                <DeleteBillModal
                  bill={selectedBill as EnrichedBill}
                  submitting={submitting}
                  onConfirm={handleDelete}
                  onCancel={closeModal}
                  formatCurrency={formatCurrency}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GenerateBillModal({
  formData,
  errors,
  submitting,
  rooms,
  activeContracts,
  onRoomChange,
  onFieldChange,
  onSubmit,
  onCancel,
  roomMap,
}: {
  formData: { room_id: string; contract_id: string; record_date: string; due_date: string };
  errors: Record<string, string>;
  submitting: boolean;
  rooms: Room[];
  activeContracts: Contract[];
  onRoomChange: (roomId: string) => void;
  onFieldChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  roomMap: Map<string, Room>;
}) {
  const occupiedRooms = useMemo(
    () => rooms.filter((r) => r.status === "Occupied"),
    [rooms],
  );

  const getContractForRoom = (roomId: string) =>
    activeContracts.find((c) => c.room_id === roomId);

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-gray-500" />
          <h3 className="font-display text-lg font-bold text-gray-900">Generate Bill</h3>
        </div>
        <button onClick={onCancel} className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bill-room">
            Room <span className="text-red-500">*</span>
          </Label>
          <select
            id="bill-room"
            value={formData.room_id}
            onChange={(e) => onRoomChange(e.target.value)}
            className="h-9 w-full min-w-0 rounded-md border border-input/20 bg-transparent px-3 py-2 font-body text-sm text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="">Select a room...</option>
            {occupiedRooms.map((r) => {
              const contract = getContractForRoom(r.room_id);
              return (
                <option key={r.room_id} value={r.room_id} disabled={!contract}>
                  #{r.room_number} — Level {r.level} {contract ? "" : "(no active contract)"}
                </option>
              );
            })}
          </select>
          {errors.room_id && <p className="text-red-500 text-xs">{errors.room_id}</p>}
        </div>

        {formData.room_id && (
          <div className={`rounded-lg p-3 ${getContractForRoom(formData.room_id) ? "bg-gray-50" : "bg-red-50 border border-red-200"}`}>
            <p className="text-xs text-gray-500">Contract</p>
            {getContractForRoom(formData.room_id) ? (
              <p className="text-sm font-semibold text-gray-900">
                Active · {getContractForRoom(formData.room_id)!.contract_id.slice(0, 8)}...
              </p>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-red-600 font-medium">No active contract found for this room</span>
              </div>
            )}
          </div>
        )}
        {errors.contract_id && <p className="text-red-500 text-xs">{errors.contract_id}</p>}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bill-record-date">
              Record Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bill-record-date"
              type="date"
              value={formData.record_date}
              onChange={(e) => onFieldChange("record_date", e.target.value)}
              className={errors.record_date ? "border-red-500" : ""}
            />
            {errors.record_date && <p className="text-red-500 text-xs">{errors.record_date}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill-due-date">
              Due Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bill-due-date"
              type="date"
              value={formData.due_date}
              onChange={(e) => onFieldChange("due_date", e.target.value)}
              className={errors.due_date ? "border-red-500" : ""}
            />
            {errors.due_date && <p className="text-red-500 text-xs">{errors.due_date}</p>}
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary" className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-white" disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={onSubmit} className="bg-primary hover:bg-primary/90 text-white" disabled={submitting}>
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-1" />Generating...</>
          ) : (
            "Generate Bill"
          )}
        </Button>
      </div>
    </>
  );
}

function ViewBillModal({
  bill,
  onClose,
  formatCurrency,
  formatDate,
}: {
  bill: EnrichedBill;
  onClose: () => void;
  formatCurrency: (v: number) => string;
  formatDate: (s: string) => string;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {bill.roomNumber}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900">Bill Details</h3>
            <p className="text-xs text-gray-500">Room #{bill.roomNumber} &middot; {bill.tenantName}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[bill.status] || ""}`}>
            {bill.status}
          </span>
          <p className="text-2xl font-bold text-gray-900">฿{formatCurrency(bill.total_amount)}</p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Rent Fee</span>
            <span className="font-medium text-gray-900">฿{formatCurrency(bill.rent_fee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Water Fee</span>
            <span className="font-medium text-blue-700">฿{formatCurrency(bill.water_fee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Electric Fee</span>
            <span className="font-medium text-amber-700">฿{formatCurrency(bill.electricity_fee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Common Fee</span>
            <span className="font-medium text-teal-700">฿{formatCurrency(bill.common_fee)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
            <span className="text-gray-700">Total</span>
            <span className="text-gray-900">฿{formatCurrency(bill.total_amount)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Record Date</p>
            <p className="text-sm text-gray-900">{formatDate(bill.record_date)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Due Date</p>
            <p className="text-sm text-gray-900">{formatDate(bill.due_date)}</p>
          </div>
        </div>

        {bill.bill_slip && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment Slip</p>
            <a
              href={bill.bill_slip.slip_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-4 w-4" />
              View uploaded slip
            </a>
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
        <Button onClick={onClose} variant="secondary" className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-white">
          Close
        </Button>
      </div>
    </>
  );
}

function StatusModal({
  bill,
  submitting,
  onUpdate,
  onCancel,
}: {
  bill: EnrichedBill;
  submitting: boolean;
  onUpdate: (status: string) => void;
  onCancel: () => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState(bill.status);
  const STATUS_OPTIONS = ["Unpaid", "WaitingApproval", "Paid", "Rejected"];

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Edit2 className="h-5 w-5 text-blue-500" />
          <h3 className="font-display text-lg font-bold text-gray-900">Update Bill Status</h3>
        </div>
        <button onClick={onCancel} className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {bill.roomNumber}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Room #{bill.roomNumber} &middot; {bill.tenantName}</p>
              <p className="text-xs text-gray-500">Total: ฿{(bill.total_amount).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bill-status">Status</Label>
          <select
            id="bill-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 w-full min-w-0 rounded-md border border-input/20 bg-transparent px-3 py-2 font-body text-sm text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary" className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-white" disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={() => onUpdate(selectedStatus)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={submitting || selectedStatus === bill.status}
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-1" />Updating...</>
          ) : (
            "Update Status"
          )}
        </Button>
      </div>
    </>
  );
}

function DeleteBillModal({
  bill,
  submitting,
  onConfirm,
  onCancel,
  formatCurrency,
}: {
  bill: EnrichedBill;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  formatCurrency: (v: number) => string;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-red-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-4 w-4 text-red-600" />
          </div>
          <h3 className="font-display text-lg font-bold text-gray-900">Delete Bill</h3>
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm text-gray-700">Are you sure you want to delete this bill?</p>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {bill.roomNumber}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Room #{bill.roomNumber} &middot; {bill.tenantName}</p>
              <p className="text-xs text-gray-500">
                ฿{formatCurrency(bill.total_amount)} &middot; {bill.status} &middot; Due {new Date(bill.due_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-red-500 font-medium">This action cannot be undone.</p>
      </div>

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary" className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-white" disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white" disabled={submitting}>
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Deleting...</> : "Delete Bill"}
        </Button>
      </div>
    </>
  );
}
