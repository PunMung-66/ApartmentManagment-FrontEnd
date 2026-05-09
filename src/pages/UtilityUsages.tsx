import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";
import { useToast } from "@/contexts/ToastContext";
import type { UtilityUsage } from "@/types/utilityUsage";
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
  Search,
  X,
  Edit2,
  Trash2,
  Info,
  Loader2,
  Zap,
  Clock,
} from "lucide-react";

interface ActiveContract extends Contract {
  tenantName?: string;
  roomNumber?: string;
  roomLevel?: number;
  latestUsage?: UtilityUsage;
}

type ModalMode = "record" | "edit" | "view" | "delete" | "history" | null;

interface RecordFormData {
  contract_id: string;
  old_water_unit: string;
  new_water_unit: string;
  old_electric_unit: string;
  new_electric_unit: string;
  record_date: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function UtilityUsages() {
  const api = useApiWithAuth();
  const { user, logout } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [usages, setUsages] = useState<UtilityUsage[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<User[]>([]);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedContract, setSelectedContract] =
    useState<ActiveContract | null>(null);
  const [selectedUsage, setSelectedUsage] = useState<UtilityUsage | null>(null);
  const [contractUsages, setContractUsages] = useState<UtilityUsage[]>([]);
  const [formData, setFormData] = useState<RecordFormData>({
    contract_id: "",
    old_water_unit: "",
    new_water_unit: "",
    old_electric_unit: "",
    new_electric_unit: "",
    record_date: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [contractsRes, usagesRes, roomsRes, tenantsRes] = await Promise.all(
        [
          api.get<Contract[]>("/contracts", { skipToast: true }),
          api.get<UtilityUsage[]>("/utility-usages", { skipToast: true }),
          api.get<Room[]>("/rooms", { skipToast: true }),
          api.get<User[]>("/users?role=TENANT", { skipToast: true }),
        ],
      );

      if (contractsRes.data) setContracts(contractsRes.data);
      if (usagesRes.data) setUsages(usagesRes.data);
      if (roomsRes.data) setRooms(roomsRes.data);
      if (tenantsRes.data) setTenants(tenantsRes.data);
    } catch (error) {
      console.error("[UtilityUsages] Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
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

  const latestUsageByContract = useMemo(() => {
    const map = new Map<string, UtilityUsage>();
    for (const u of usages) {
      const existing = map.get(u.contract_id);
      if (!existing || u.record_date > existing.record_date) {
        map.set(u.contract_id, u);
      }
    }
    return map;
  }, [usages]);

  const activeContracts = useMemo(() => {
    return contracts
      .filter((c) => c.status === "Active")
      .map((c) => {
        const room = roomMap.get(c.room_id);
        const tenant = tenantMap.get(c.user_id);
        return {
          ...c,
          tenantName: tenant?.name || "Unknown",
          roomNumber: room?.room_number || "N/A",
          roomLevel: room?.level || 0,
          latestUsage: latestUsageByContract.get(c.contract_id),
        } as ActiveContract;
      })
      .sort(
        (a, b) =>
          (a.roomLevel || 0) - (b.roomLevel || 0) ||
          (a.roomNumber || "").localeCompare(b.roomNumber || "", undefined, {
            numeric: true,
          }),
      );
  }, [contracts, roomMap, tenantMap, latestUsageByContract]);

  const floorGroups = useMemo(() => {
    const grouped = activeContracts.reduce(
      (acc, c) => {
        const level = c.roomLevel || 0;
        const existing = acc.find((g) => g.level === level);
        if (existing) {
          existing.contracts.push(c);
        } else {
          acc.push({ level, contracts: [c] });
        }
        return acc;
      },
      [] as { level: number; contracts: ActiveContract[] }[],
    );

    grouped.sort((a, b) => a.level - b.level);
    grouped.forEach((g) => {
      g.contracts.sort((a, b) =>
        (a.roomNumber || "").localeCompare(b.roomNumber || "", undefined, {
          numeric: true,
        }),
      );
    });
    return grouped;
  }, [activeContracts]);

  const enrichedUsages = useMemo(() => {
    return usages
      .map((u) => {
        const contract = contracts.find((c) => c.contract_id === u.contract_id);
        if (!contract) return null;
        const room = roomMap.get(contract.room_id);
        const tenant = tenantMap.get(contract.user_id);
        return {
          ...u,
          roomNumber: room?.room_number || "Unknown",
          roomLevel: room?.level || 0,
          tenantName: tenant?.name || "Unknown",
        };
      })
      .filter(Boolean) as (UtilityUsage & {
      roomNumber: string;
      roomLevel: number;
      tenantName: string;
    })[];
  }, [usages, contracts, roomMap, tenantMap]);

  const filteredUsages = useMemo(() => {
    if (!searchTerm) return enrichedUsages;
    const term = searchTerm.toLowerCase();
    return enrichedUsages.filter(
      (u) =>
        u.roomNumber.toLowerCase().includes(term) ||
        u.tenantName.toLowerCase().includes(term),
    );
  }, [searchTerm, enrichedUsages]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isCurrentMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  };

  const validateRecordForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.contract_id) errors.contract_id = "Contract is required";
    const ow = parseInt(formData.old_water_unit);
    if (formData.old_water_unit === "" || isNaN(ow) || ow < 0)
      errors.old_water_unit = "Must be >= 0";
    const nw = parseInt(formData.new_water_unit);
    if (formData.new_water_unit === "" || isNaN(nw) || nw < 0)
      errors.new_water_unit = "Must be >= 0";
    if (!isNaN(ow) && !isNaN(nw) && nw < ow)
      errors.new_water_unit = "Must be >= old reading";
    const oe = parseInt(formData.old_electric_unit);
    if (formData.old_electric_unit === "" || isNaN(oe) || oe < 0)
      errors.old_electric_unit = "Must be >= 0";
    const ne = parseInt(formData.new_electric_unit);
    if (formData.new_electric_unit === "" || isNaN(ne) || ne < 0)
      errors.new_electric_unit = "Must be >= 0";
    if (!isNaN(oe) && !isNaN(ne) && ne < oe)
      errors.new_electric_unit = "Must be >= old reading";
    if (!formData.record_date) errors.record_date = "Record date is required";
    return errors;
  };

  const openRecordModal = (contract: ActiveContract) => {
    const usage = contract.latestUsage;
    const today = new Date().toISOString().slice(0, 10);
    setSelectedContract(contract);
    setFormData({
      contract_id: contract.contract_id,
      old_water_unit: usage ? String(usage.new_water_unit) : "0",
      new_water_unit: usage ? String(usage.new_water_unit) : "",
      old_electric_unit: usage ? String(usage.new_electric_unit) : "0",
      new_electric_unit: usage ? String(usage.new_electric_unit) : "",
      record_date: today,
    });
    setFormErrors({});
    setModalMode("record");
  };

  const openHistoryModal = async (contract: ActiveContract) => {
    setSelectedContract(contract);
    try {
      const res = await api.get<UtilityUsage[]>(
        `/utility-usages/contract/${contract.contract_id}`,
        { skipToast: true },
      );
      setContractUsages(res.data || []);
    } catch {
      setContractUsages([]);
    }
    setModalMode("history");
  };

  const openEditModal = (usage: UtilityUsage) => {
    setSelectedUsage(usage);
    const contract = contracts.find((c) => c.contract_id === usage.contract_id);
    const room = contract ? roomMap.get(contract.room_id) : undefined;
    const tenant = contract ? tenantMap.get(contract.user_id) : undefined;
    setSelectedContract({
      ...(contract || ({} as Contract)),
      tenantName: tenant?.name || "Unknown",
      roomNumber: room?.room_number || "N/A",
      roomLevel: room?.level || 0,
      latestUsage: usage,
    });
    setFormData({
      contract_id: usage.contract_id,
      old_water_unit: String(usage.old_water_unit),
      new_water_unit: String(usage.new_water_unit),
      old_electric_unit: String(usage.old_electric_unit),
      new_electric_unit: String(usage.new_electric_unit),
      record_date: usage.record_date.slice(0, 10),
    });
    setFormErrors({});
    setModalMode("edit");
  };

  const openDeleteModal = (usage: UtilityUsage) => {
    setSelectedUsage(usage);
    const contract = contracts.find((c) => c.contract_id === usage.contract_id);
    const room = contract ? roomMap.get(contract.room_id) : undefined;
    const tenant = contract ? tenantMap.get(contract.user_id) : undefined;
    setSelectedContract({
      ...(contract || ({} as Contract)),
      tenantName: tenant?.name || "Unknown",
      roomNumber: room?.room_number || "N/A",
      roomLevel: room?.level || 0,
      latestUsage: usage,
    });
    setModalMode("delete");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedContract(null);
    setSelectedUsage(null);
    setContractUsages([]);
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

  const handleRecordSubmit = async () => {
    const errors = validateRecordForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        contract_id: formData.contract_id,
        old_water_unit: parseInt(formData.old_water_unit),
        new_water_unit: parseInt(formData.new_water_unit),
        old_electric_unit: parseInt(formData.old_electric_unit),
        new_electric_unit: parseInt(formData.new_electric_unit),
        record_date: formData.record_date + "T00:00:00Z",
      };

      if (modalMode === "record") {
        const response = await api.post("/utility-usages", payload, {
          skipToast: true,
        });
        showSuccess(response.message || "Usage recorded successfully");
      } else if (modalMode === "edit" && selectedUsage) {
        const response = await api.put(
          `/utility-usages/${selectedUsage.usage_id}`,
          payload,
          { skipToast: true },
        );
        showSuccess(response.message || "Usage updated successfully");
      }

      closeModal();
      await fetchData();
    } catch (error: unknown) {
      const errorMsg =
        (error as { message?: string }).message || "Failed to save usage";
      showError(errorMsg);
      console.error("[UtilityUsages] Failed to save usage:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUsage) return;

    setSubmitting(true);
    try {
      const response = await api.delete(
        `/utility-usages/${selectedUsage.usage_id}`,
        { skipToast: true },
      );
      showSuccess(response.message || "Usage deleted successfully");
      closeModal();
      await fetchData();
    } catch (error: unknown) {
      const errorMsg =
        (error as { message?: string }).message || "Failed to delete usage";
      showError(errorMsg);
      console.error("[UtilityUsages] Failed to delete usage:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const usagesColumns: Column<
    UtilityUsage & { roomNumber: string; tenantName: string }
  >[] = [
    {
      header: "Room",
      render: (u) => (
        <p className="text-sm font-semibold text-gray-900">{u.roomNumber}</p>
      ),
    },
    {
      header: "Tenant",
      render: (u) => <p className="text-sm text-gray-700">{u.tenantName}</p>,
    },
    {
      header: "Water",
      render: (u) => (
        <p className="text-sm text-gray-700">
          {u.old_water_unit} → {u.new_water_unit}
        </p>
      ),
    },
    {
      header: "Electric",
      render: (u) => (
        <p className="text-sm text-gray-700">
          {u.old_electric_unit} → {u.new_electric_unit}
        </p>
      ),
    },
    {
      header: "Date",
      render: (u) => (
        <p className="text-sm text-gray-500">{formatDate(u.record_date)}</p>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEditModal(u)}
            className="rounded-md border border-blue-200 p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit usage"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => openDeleteModal(u)}
            className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 transition-colors"
            title="Delete usage"
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

        <main
          className={`flex-1 min-w-0 px-4 pb-20 pt-4 md:px-6 md:pt-5 lg:px-5 lg:pt-4 ${
            isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <div className="mb-5 md:mb-6 lg:mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900 md:text-2xl lg:text-lg">
                  Utility Usage
                </h2>
                <p className="mt-1 text-sm text-gray-600 md:text-sm lg:text-xs">
                  {activeContracts.length} Active{" "}
                  {activeContracts.length === 1 ? "Contract" : "Contracts"}{" "}
                  &middot; {usages.length} Total{" "}
                  {usages.length === 1 ? "Record" : "Records"}
                </p>
              </div>
            </div>
          </div>

          {/* Active Contracts by Floor */}
          {floorGroups.length === 0 ? (
            <Card variant="elevated" className="p-8 text-center mb-5">
              <Zap className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                No active contracts found
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Create a contract to start recording utility usage
              </p>
            </Card>
          ) : (
            <div className="space-y-4 md:space-y-5 lg:space-y-3 mb-6">
              {floorGroups.map((floor) => (
                <section
                  key={floor.level}
                  className="rounded-xl bg-white p-4 shadow-sm md:p-5 lg:rounded-lg lg:p-3"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="font-display text-base font-bold text-gray-900 lg:text-sm">
                      Floor {floor.level.toString().padStart(2, "0")}
                    </h3>
                    <span className="text-xs font-medium text-gray-500">
                      {floor.contracts.length}{" "}
                      {floor.contracts.length === 1 ? "room" : "rooms"}
                    </span>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin lg:grid lg:grid-cols-3 xl:grid-cols-4 lg:gap-2.5 lg:overflow-visible lg:snap-none">
                    {floor.contracts.map((c) => {
                      const hasUsage = !!c.latestUsage;
                      const recent =
                        hasUsage && isCurrentMonth(c.latestUsage!.record_date);
                      return (
                        <div
                          key={c.contract_id}
                          className={`min-w-[260px] snap-start rounded-lg border-2 p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm lg:min-w-0 ${
                            hasUsage
                              ? recent
                                ? "border-teal-200 bg-teal-50/30"
                                : "border-amber-200 bg-amber-50/30"
                              : "border-gray-200 bg-gray-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-display text-base font-bold text-gray-900">
                                #{c.roomNumber}
                              </p>
                              <p className="text-xs text-gray-600">
                                {c.tenantName}
                              </p>
                            </div>
                            <span
                              className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 ${
                                hasUsage
                                  ? recent
                                    ? "bg-teal-500"
                                    : "bg-amber-500"
                                  : "bg-gray-300"
                              }`}
                            ></span>
                          </div>

                          {hasUsage ? (
                            <div className="space-y-1 mb-3">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Water</span>
                                <span className="font-medium text-gray-700">
                                  {c.latestUsage!.old_water_unit} →{" "}
                                  {c.latestUsage!.new_water_unit}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Electric</span>
                                <span className="font-medium text-gray-700">
                                  {c.latestUsage!.old_electric_unit} →{" "}
                                  {c.latestUsage!.new_electric_unit}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 pt-1">
                                {formatDate(c.latestUsage!.record_date)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mb-3">
                              No readings yet
                            </p>
                          )}

                          <div className="flex gap-1.5">
                            <Button
                              onClick={() => openRecordModal(c)}
                              size="sm"
                              className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs h-7"
                            >
                              Record
                            </Button>
                            <button
                              onClick={() => openHistoryModal(c)}
                              className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                              title="View history"
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Usage History Table */}
          <div className="mb-2">
            <h3 className="font-display text-base font-bold text-gray-900 lg:text-sm mb-3">
              Usage History
            </h3>

            <div className="mb-3 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by room or tenant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                spellCheck="false"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>

            <DataTable
              columns={usagesColumns}
              data={filteredUsages}
              keyExtractor={(u) => u.usage_id}
              emptyMessage="No usage records found"
            />
          </div>
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
              {modalMode === "record" && selectedContract && (
                <RecordFormModal
                  mode="record"
                  formData={formData}
                  errors={formErrors}
                  submitting={submitting}
                  contract={selectedContract}
                  onFieldChange={handleFieldChange}
                  onSubmit={handleRecordSubmit}
                  onCancel={closeModal}
                />
              )}

              {modalMode === "edit" && selectedUsage && selectedContract && (
                <RecordFormModal
                  mode="edit"
                  formData={formData}
                  errors={formErrors}
                  submitting={submitting}
                  contract={selectedContract}
                  onFieldChange={handleFieldChange}
                  onSubmit={handleRecordSubmit}
                  onCancel={closeModal}
                />
              )}

              {modalMode === "history" && selectedContract && (
                <HistoryModal
                  contract={selectedContract}
                  usages={contractUsages}
                  onClose={closeModal}
                  formatDate={formatDate}
                />
              )}

              {modalMode === "delete" && selectedUsage && selectedContract && (
                <DeleteModal
                  usage={selectedUsage}
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

function RecordFormModal({
  mode,
  formData,
  errors,
  submitting,
  contract,
  onFieldChange,
  onSubmit,
  onCancel,
}: {
  mode: "record" | "edit";
  formData: RecordFormData;
  errors: FormErrors;
  submitting: boolean;
  contract: ActiveContract;
  onFieldChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-gray-500" />
          <h3 className="font-display text-lg font-bold text-gray-900">
            {mode === "record" ? "Record Usage" : "Edit Usage"}
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {contract.roomNumber}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Room #{contract.roomNumber}
            </p>
            <p className="text-xs text-gray-500">
              {contract.tenantName} &middot; Floor {contract.roomLevel}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="usage-old-water">
              Old Water <span className="text-red-500">*</span>
            </Label>
            <Input
              id="usage-old-water"
              type="number"
              min={0}
              placeholder="0"
              value={formData.old_water_unit}
              onChange={(e) => onFieldChange("old_water_unit", e.target.value)}
              className={errors.old_water_unit ? "border-red-500" : ""}
            />
            {errors.old_water_unit && (
              <p className="text-red-500 text-xs">{errors.old_water_unit}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="usage-new-water">
              New Water <span className="text-red-500">*</span>
            </Label>
            <Input
              id="usage-new-water"
              type="number"
              min={0}
              placeholder="0"
              value={formData.new_water_unit}
              onChange={(e) => onFieldChange("new_water_unit", e.target.value)}
              className={errors.new_water_unit ? "border-red-500" : ""}
            />
            {errors.new_water_unit && (
              <p className="text-red-500 text-xs">{errors.new_water_unit}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="usage-old-electric">
              Old Electric <span className="text-red-500">*</span>
            </Label>
            <Input
              id="usage-old-electric"
              type="number"
              min={0}
              placeholder="0"
              value={formData.old_electric_unit}
              onChange={(e) =>
                onFieldChange("old_electric_unit", e.target.value)
              }
              className={errors.old_electric_unit ? "border-red-500" : ""}
            />
            {errors.old_electric_unit && (
              <p className="text-red-500 text-xs">{errors.old_electric_unit}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="usage-new-electric">
              New Electric <span className="text-red-500">*</span>
            </Label>
            <Input
              id="usage-new-electric"
              type="number"
              min={0}
              placeholder="0"
              value={formData.new_electric_unit}
              onChange={(e) =>
                onFieldChange("new_electric_unit", e.target.value)
              }
              className={errors.new_electric_unit ? "border-red-500" : ""}
            />
            {errors.new_electric_unit && (
              <p className="text-red-500 text-xs">{errors.new_electric_unit}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="usage-record-date">
            Record Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="usage-record-date"
            type="date"
            value={formData.record_date}
            onChange={(e) => onFieldChange("record_date", e.target.value)}
            className={errors.record_date ? "border-red-500" : ""}
          />
          {errors.record_date && (
            <p className="text-red-500 text-xs">{errors.record_date}</p>
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
              {mode === "record" ? "Recording..." : "Saving..."}
            </>
          ) : (
            <>{mode === "record" ? "Record Usage" : "Save Changes"}</>
          )}
        </Button>
      </div>
    </>
  );
}

function HistoryModal({
  contract,
  usages,
  onClose,
  formatDate,
}: {
  contract: ActiveContract;
  usages: UtilityUsage[];
  onClose: () => void;
  formatDate: (dateStr: string) => string;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {contract.roomNumber}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900">
              Usage History
            </h3>
            <p className="text-xs text-gray-500">
              Room #{contract.roomNumber} &middot; {contract.tenantName}
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

      <div className="px-6 py-5">
        {usages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No usage records for this contract yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase">
                    Water
                  </th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase">
                    Electric
                  </th>
                </tr>
              </thead>
              <tbody>
                {usages.map((u) => (
                  <tr key={u.usage_id} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900">
                      {formatDate(u.record_date)}
                    </td>
                    <td className="py-2 text-gray-700">
                      {u.old_water_unit} → {u.new_water_unit}
                    </td>
                    <td className="py-2 text-gray-700">
                      {u.old_electric_unit} → {u.new_electric_unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

function DeleteModal({
  usage,
  contract,
  submitting,
  onConfirm,
  onCancel,
}: {
  usage: UtilityUsage;
  contract: ActiveContract;
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
            Delete Usage
          </h3>
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm text-gray-700">
          Are you sure you want to delete this usage record?
        </p>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {contract.roomNumber}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                Room #{contract.roomNumber} &middot; {contract.tenantName}
              </p>
              <p className="text-xs text-gray-500">
                Water: {usage.old_water_unit}→{usage.new_water_unit} | Electric:{" "}
                {usage.old_electric_unit}→{usage.new_electric_unit}
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
            "Delete Record"
          )}
        </Button>
      </div>
    </>
  );
}
