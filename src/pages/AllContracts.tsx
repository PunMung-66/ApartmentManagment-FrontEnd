import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";
import { useToast } from "@/contexts/ToastContext";
import type { Contract } from "@/types/contract";
import type { User } from "@/lib/api";
import type { Room } from "@/types/room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StaffSidebar } from "@/components/StaffSidebar";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  Plus,
  Search,
  X,
  Eye,
  Edit2,
  Trash2,
  Info,
  Loader2,
} from "lucide-react";

interface ContractWithDetails extends Contract {
  tenantName?: string;
  tenantEmail?: string;
  roomNumber?: string;
}

type ModalMode = "create" | "edit" | "view" | "delete" | null;

interface FormData {
  user_id: string;
  room_id: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function AllContracts() {
  const api = useApiWithAuth();
  const { user, logout } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "Active" | "Inactive"
  >("ALL");
  const [stats, setStats] = useState({
    active: 0,
    inactive: 0,
  });

  const [tenants, setTenants] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedContract, setSelectedContract] =
    useState<ContractWithDetails | null>(null);
  const [formData, setFormData] = useState<FormData>({
    user_id: "",
    room_id: "",
    start_date: "",
    end_date: "",
    status: "Active",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const enrichContracts = useCallback(
    async (contracts: Contract[]) => {
      const tenantMap = new Map<string, User>();
      const roomMap = new Map<string, Room>();

      const uniqueUserIds = [...new Set(contracts.map((c) => c.user_id))];
      const uniqueRoomIds = [...new Set(contracts.map((c) => c.room_id))];

      const tenantPromises = uniqueUserIds.map(async (id) => {
        try {
          const res = await api.get<User>(`/users/${id}`, { skipToast: true });
          if (res.data) tenantMap.set(id, res.data);
        } catch {
          // ignore individual failures
        }
      });

      const roomPromises = uniqueRoomIds.map(async (id) => {
        try {
          const res = await api.get<Room>(`/rooms/${id}`, { skipToast: true });
          if (res.data) roomMap.set(id, res.data);
        } catch {
          // ignore individual failures
        }
      });

      await Promise.all([...tenantPromises, ...roomPromises]);

      return contracts.map((contract) => {
        const tenant = tenantMap.get(contract.user_id);
        const room = roomMap.get(contract.room_id);
        return {
          ...contract,
          tenantName: tenant?.name || "Unknown",
          tenantEmail: tenant?.email || "",
          roomNumber: room?.room_number || "Unknown",
        };
      });
    },
    [api],
  );

  const fetchDropdownData = useCallback(async () => {
    try {
      const [tenantRes, roomRes] = await Promise.all([
        api.get<User[]>("/users?role=TENANT", { skipToast: true }),
        api.get<Room[]>("/rooms", { skipToast: true }),
      ]);
      if (tenantRes.data) setTenants(tenantRes.data);
      if (roomRes.data) setRooms(roomRes.data);
    } catch {
      // ignore
    }
  }, [api]);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Contract[]>("/contracts", {
        skipToast: true,
      });

      if (response.data) {
        const enriched = await enrichContracts(response.data);
        setContracts(enriched);

        const activeCount = enriched.filter(
          (c) => c.status === "Active",
        ).length;
        const inactiveCount = enriched.filter(
          (c) => c.status === "Inactive",
        ).length;
        setStats({ active: activeCount, inactive: inactiveCount });
      }
    } catch (error) {
      console.error("[AllContracts] Failed to fetch contracts:", error);
    } finally {
      setLoading(false);
    }
  }, [api, enrichContracts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContracts();
  }, [fetchContracts]);

  const filteredContracts = useMemo(() => {
    let result = contracts;

    if (statusFilter !== "ALL") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.tenantName?.toLowerCase().includes(term) ||
          c.tenantEmail?.toLowerCase().includes(term) ||
          c.roomNumber?.toLowerCase().includes(term) ||
          c.status.toLowerCase().includes(term),
      );
    }

    return result;
  }, [searchTerm, contracts, statusFilter]);

  const activeContractUserIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of contracts) {
      if (c.status === "Active") ids.add(c.user_id);
    }
    return ids;
  }, [contracts]);

  const getStatusBadgeColor = (status: Contract["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Inactive":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.user_id) errors.user_id = "Tenant is required";
    if (!formData.room_id) errors.room_id = "Room is required";
    if (!formData.start_date) errors.start_date = "Start date is required";
    if (
      formData.start_date &&
      formData.end_date &&
      formData.end_date < formData.start_date
    )
      errors.end_date = "End date must be after start date";
    if (!formData.status) errors.status = "Status is required";
    return errors;
  };

  const openCreateModal = () => {
    fetchDropdownData();
    setFormData({
      user_id: "",
      room_id: "",
      start_date: "",
      end_date: "",
      status: "Active",
    });
    setFormErrors({});
    setSelectedContract(null);
    setModalMode("create");
  };

  const openEditModal = (c: ContractWithDetails) => {
    fetchDropdownData();
    setSelectedContract(c);
    setFormData({
      user_id: c.user_id,
      room_id: c.room_id,
      start_date: c.start_date.slice(0, 10),
      end_date: c.end_date ? c.end_date.slice(0, 10) : "",
      status: c.status,
    });
    setFormErrors({});
    setModalMode("edit");
  };

  const openViewModal = (c: ContractWithDetails) => {
    setSelectedContract(c);
    setModalMode("view");
  };

  const openDeleteModal = (c: ContractWithDetails) => {
    setSelectedContract(c);
    setModalMode("delete");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedContract(null);
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      const payload: Record<string, string> = {
        user_id: formData.user_id,
        room_id: formData.room_id,
        start_date: formData.start_date,
        status: formData.status,
      };

      if (formData.end_date) {
        payload.end_date = formData.end_date;
      }

      if (modalMode === "create") {
        const response = await api.post("/contracts", payload, {
          skipToast: true,
        });
        showSuccess(response.message || "Contract created successfully");
      } else if (modalMode === "edit" && selectedContract) {
        const response = await api.put(
          `/contracts/${selectedContract.contract_id}`,
          payload,
          { skipToast: true },
        );
        showSuccess(response.message || "Contract updated successfully");
      }

      closeModal();
      await fetchContracts();
    } catch (error: unknown) {
      const errorMsg =
        (error as { message?: string }).message || "Failed to save contract";
      showError(errorMsg);
      console.error("[AllContracts] Failed to save contract:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedContract) return;

    setSubmitting(true);
    try {
      const response = await api.delete(
        `/contracts/${selectedContract.contract_id}`,
        {
          skipToast: true,
        },
      );
      showSuccess(response.message || "Contract deleted successfully");
      closeModal();
      await fetchContracts();
    } catch (error: unknown) {
      const errorMsg =
        (error as { message?: string }).message || "Failed to delete contract";
      showError(errorMsg);
      console.error("[AllContracts] Failed to delete contract:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const contractColumns: Column<ContractWithDetails>[] = [
    {
      header: "Tenant",
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white md:h-9 md:w-9">
            {c.tenantName?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 text-sm md:text-base truncate">
              {c.tenantName || "Unknown"}
            </p>
            <p className="text-xs text-gray-500">{c.tenantEmail || ""}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Room",
      render: (c) => (
        <p className="text-sm font-medium text-gray-700">
          {c.roomNumber || "N/A"}
        </p>
      ),
    },
    {
      header: "Start Date",
      render: (c) => (
        <p className="text-sm text-gray-700">{formatDate(c.start_date)}</p>
      ),
    },
    {
      header: "End Date",
      render: (c) => (
        <p className="text-sm text-gray-700">
          {c.end_date ? formatDate(c.end_date) : "No end date"}
        </p>
      ),
    },
    {
      header: "Status",
      render: (c) => (
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(c.status)}`}
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${c.status === "Active" ? "bg-green-500" : "bg-gray-500"}`}
          />
          {c.status}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (c) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openViewModal(c)}
            className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 transition-colors"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(c)}
            className="rounded-md border border-blue-200 p-2 text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit contract"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => openDeleteModal(c)}
            className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50 transition-colors"
            title="Delete contract"
          >
            <Trash2 className="h-4 w-4" />
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
          className={`flex-1 min-w-0 px-4 pb-20 pt-4 md:px-6 md:pt-5 lg:px-5 lg:pt-4 ${
            isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          {/* Header */}
          <div className="mb-5 md:mb-6 lg:mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900 md:text-2xl lg:text-lg">
                  All Contracts
                </h2>
                <p className="mt-1 text-sm text-gray-600 md:text-sm lg:text-xs">
                  {stats.active} Active • {stats.inactive} Inactive
                </p>
              </div>
              <Button
                onClick={openCreateModal}
                className="gap-2 bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                New Contract
              </Button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="mb-4 md:mb-5 lg:mb-3 flex gap-2">
            {(["ALL", "Active", "Inactive"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  statusFilter === status
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {status === "ALL" && "All"}
                {status === "Active" && "Active"}
                {status === "Inactive" && "Inactive"}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="mb-5 md:mb-6 lg:mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tenant name, room, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                spellCheck="false"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>

          {/* Contracts Table */}
          <DataTable
            columns={contractColumns}
            data={filteredContracts}
            keyExtractor={(c) => c.contract_id}
            emptyMessage="No contracts found"
          />
        </main>
      </div>

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
              {/* View Modal */}
              {modalMode === "view" && selectedContract && (
                <ContractViewModal
                  contract={selectedContract}
                  onClose={closeModal}
                  formatDate={formatDate}
                  getStatusBadgeColor={getStatusBadgeColor}
                />
              )}

              {/* Create / Edit Modal */}
              {(modalMode === "create" || modalMode === "edit") && (
                <ContractFormModal
                  mode={modalMode}
                  formData={formData}
                  errors={formErrors}
                  submitting={submitting}
                  tenants={tenants}
                  rooms={rooms}
                  activeContractUserIds={activeContractUserIds}
                  onFieldChange={handleFieldChange}
                  onSubmit={handleSubmit}
                  onCancel={closeModal}
                />
              )}

              {/* Delete Modal */}
              {modalMode === "delete" && selectedContract && (
                <ContractDeleteModal
                  contract={selectedContract}
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

function ContractViewModal({
  contract,
  onClose,
  formatDate,
  getStatusBadgeColor,
}: {
  contract: ContractWithDetails;
  onClose: () => void;
  formatDate: (dateStr: string) => string;
  getStatusBadgeColor: (status: Contract["status"]) => string;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {contract.tenantName?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900">
              Contract Details
            </h3>
            <p className="text-xs text-gray-500">
              {contract.tenantName || "Unknown"}
            </p>
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
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Tenant
          </p>
          <p className="text-sm text-gray-900 font-medium">
            {contract.tenantName || "Unknown"}
          </p>
          <p className="text-xs text-gray-500">{contract.tenantEmail || ""}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Room
          </p>
          <p className="text-sm text-gray-900 font-medium">
            {contract.roomNumber || "N/A"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Start Date
            </p>
            <p className="text-sm text-gray-900">
              {formatDate(contract.start_date)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              End Date
            </p>
            <p className="text-sm text-gray-900">
              {contract.end_date
                ? formatDate(contract.end_date)
                : "No end date"}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Status
          </p>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(contract.status)}`}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${contract.status === "Active" ? "bg-green-500" : "bg-gray-500"}`}
            />
            {contract.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Created
            </p>
            <p className="text-xs text-gray-700">
              {formatDate(contract.created_at)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Updated
            </p>
            <p className="text-xs text-gray-700">
              {formatDate(contract.updated_at)}
            </p>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Contract ID
          </p>
          <p className="text-xs text-gray-500 font-mono break-all">
            {contract.contract_id}
          </p>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
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

function ContractFormModal({
  mode,
  formData,
  errors,
  submitting,
  tenants,
  rooms,
  activeContractUserIds,
  onFieldChange,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  formData: FormData;
  errors: FormErrors;
  submitting: boolean;
  tenants: User[];
  rooms: Room[];
  activeContractUserIds: Set<string>;
  onFieldChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const tenantOptions = useMemo(() => {
    return tenants.filter((t) => {
      if (mode === "edit" && t.user_id === formData.user_id) return true;
      return !activeContractUserIds.has(t.user_id);
    });
  }, [tenants, activeContractUserIds, mode, formData.user_id]);

  const roomOptions = useMemo(() => {
    return rooms.filter((r) => {
      if (mode === "edit" && r.room_id === formData.room_id) return true;
      return r.status === "Available";
    });
  }, [rooms, mode, formData.room_id]);

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-gray-500" />
          <h3 className="font-display text-lg font-bold text-gray-900">
            {mode === "create" ? "Create New Contract" : "Edit Contract"}
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
          <Label htmlFor="contract-tenant">
            Tenant <span className="text-red-500">*</span>
          </Label>
          <select
            id="contract-tenant"
            value={formData.user_id}
            onChange={(e) => onFieldChange("user_id", e.target.value)}
            className={`h-9 w-full min-w-0 rounded-md border ${errors.user_id ? "border-red-500" : "border-input/20"} bg-transparent px-3 py-2 font-body text-sm text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50`}
          >
            <option value="">Select a tenant...</option>
            {tenantOptions.map((t) => (
              <option key={t.user_id} value={t.user_id}>
                {t.name} ({t.email})
              </option>
            ))}
          </select>
          {errors.user_id && (
            <p className="text-red-500 text-xs">{errors.user_id}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contract-room">
            Room <span className="text-red-500">*</span>
          </Label>
          <select
            id="contract-room"
            value={formData.room_id}
            onChange={(e) => onFieldChange("room_id", e.target.value)}
            className={`h-9 w-full min-w-0 rounded-md border ${errors.room_id ? "border-red-500" : "border-input/20"} bg-transparent px-3 py-2 font-body text-sm text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50`}
          >
            <option value="">Select a room...</option>
            {roomOptions.map((r) => (
              <option key={r.room_id} value={r.room_id}>
                Room {r.room_number} (Floor {r.level}) — {r.status}
              </option>
            ))}
          </select>
          {errors.room_id && (
            <p className="text-red-500 text-xs">{errors.room_id}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contract-start-date">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contract-start-date"
              type="date"
              value={formData.start_date}
              onChange={(e) => onFieldChange("start_date", e.target.value)}
              className={errors.start_date ? "border-red-500" : ""}
            />
            {errors.start_date && (
              <p className="text-red-500 text-xs">{errors.start_date}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract-end-date">End Date</Label>
            <Input
              id="contract-end-date"
              type="date"
              value={formData.end_date}
              onChange={(e) => onFieldChange("end_date", e.target.value)}
              className={errors.end_date ? "border-red-500" : ""}
            />
            {errors.end_date && (
              <p className="text-red-500 text-xs">{errors.end_date}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contract-status">
            Status <span className="text-red-500">*</span>
          </Label>
          <select
            id="contract-status"
            value={formData.status}
            onChange={(e) => onFieldChange("status", e.target.value)}
            className="h-9 w-full min-w-0 rounded-md border border-input/20 bg-transparent px-3 py-2 font-body text-sm text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {errors.status && (
            <p className="text-red-500 text-xs">{errors.status}</p>
          )}
        </div>
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
            <>{mode === "create" ? "Create Contract" : "Save Changes"}</>
          )}
        </Button>
      </div>
    </>
  );
}

function ContractDeleteModal({
  contract,
  submitting,
  onConfirm,
  onCancel,
}: {
  contract: ContractWithDetails;
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
            Delete Contract
          </h3>
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm text-gray-700">
          Are you sure you want to delete this contract?
        </p>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {contract.tenantName?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {contract.tenantName || "Unknown"}
              </p>
              <p className="text-xs text-gray-500">
                Room {contract.roomNumber} • {contract.status}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-red-500 font-medium">
          This action cannot be undone.
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
            "Delete Contract"
          )}
        </Button>
      </div>
    </>
  );
}
