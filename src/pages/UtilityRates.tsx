import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";
import { useToast } from "@/contexts/ToastContext";
import type { UtilityRate } from "@/types/utilityRate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StaffSidebar } from "@/components/StaffSidebar";
import {
  Plus,
  X,
  Eye,
  Edit2,
  Trash2,
  Info,
  Loader2,
  Zap,
} from "lucide-react";

type ModalMode = "create" | "edit" | "view" | "delete" | null;

interface FormData {
  period: string;
  water_rate: string;
  electric_rate: string;
  common_fee: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function UtilityRates() {
  const api = useApiWithAuth();
  const { user, logout } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [rates, setRates] = useState<UtilityRate[]>([]);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedRate, setSelectedRate] = useState<UtilityRate | null>(null);
  const [formData, setFormData] = useState<FormData>({
    period: "",
    water_rate: "",
    electric_rate: "",
    common_fee: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<UtilityRate[]>("/utility-rates", {
        skipToast: true,
      });
      if (response.data) setRates(response.data);
    } catch (error) {
      console.error("[UtilityRates] Failed to fetch rates:", error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const sortedRates = useMemo(() => {
    return [...rates].sort((a, b) => b.period.localeCompare(a.period));
  }, [rates]);

  const currentRate = sortedRates[0] || null;
  const pastRates = sortedRates.slice(1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.period.trim())
      errors.period = "Period is required (e.g. 2025-05)";
    const water = parseFloat(formData.water_rate);
    if (formData.water_rate === "" || isNaN(water) || water < 0)
      errors.water_rate = "Must be a valid number >= 0";
    const electric = parseFloat(formData.electric_rate);
    if (formData.electric_rate === "" || isNaN(electric) || electric < 0)
      errors.electric_rate = "Must be a valid number >= 0";
    const common = parseFloat(formData.common_fee);
    if (formData.common_fee === "" || isNaN(common) || common < 0)
      errors.common_fee = "Must be a valid number >= 0";
    return errors;
  };

  const openCreateModal = () => {
    setFormData({
      period: "",
      water_rate: "",
      electric_rate: "",
      common_fee: "",
    });
    setFormErrors({});
    setSelectedRate(null);
    setModalMode("create");
  };

  const openEditModal = (rate: UtilityRate) => {
    setSelectedRate(rate);
    setFormData({
      period: rate.period,
      water_rate: String(rate.water_rate),
      electric_rate: String(rate.electric_rate),
      common_fee: String(rate.common_fee),
    });
    setFormErrors({});
    setModalMode("edit");
  };

  const openViewModal = (rate: UtilityRate) => {
    setSelectedRate(rate);
    setModalMode("view");
  };

  const openDeleteModal = (rate: UtilityRate) => {
    setSelectedRate(rate);
    setModalMode("delete");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedRate(null);
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
      const payload = {
        period: formData.period.trim(),
        water_rate: parseFloat(formData.water_rate),
        electric_rate: parseFloat(formData.electric_rate),
        common_fee: parseFloat(formData.common_fee),
      };

      if (modalMode === "create") {
        const response = await api.post("/utility-rates", payload, {
          skipToast: true,
        });
        showSuccess(response.message || "Utility rate created successfully");
      } else if (modalMode === "edit" && selectedRate) {
        const response = await api.put(
          `/utility-rates/${selectedRate.rate_id}`,
          payload,
          { skipToast: true },
        );
        showSuccess(response.message || "Utility rate updated successfully");
      }

      closeModal();
      await fetchRates();
    } catch (error: unknown) {
      const errorMsg =
        (error as { message?: string }).message ||
        "Failed to save utility rate";
      showError(errorMsg);
      console.error("[UtilityRates] Failed to save rate:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRate) return;

    setSubmitting(true);
    try {
      const response = await api.delete(
        `/utility-rates/${selectedRate.rate_id}`,
        { skipToast: true },
      );
      showSuccess(response.message || "Utility rate deleted successfully");
      closeModal();
      await fetchRates();
    } catch (error: unknown) {
      const errorMsg =
        (error as { message?: string }).message ||
        "Failed to delete utility rate";
      showError(errorMsg);
      console.error("[UtilityRates] Failed to delete rate:", error);
    } finally {
      setSubmitting(false);
    }
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
          className={`flex-1 min-w-0 max-w-full px-4 pb-20 pt-4 md:px-6 md:pt-5 lg:px-5 lg:pt-4 ${
            isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <div className="mb-5 md:mb-6 lg:mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900 md:text-2xl lg:text-lg">
                  Utility Rates
                </h2>
                <p className="mt-1 text-sm text-gray-600 md:text-sm lg:text-xs">
                  {rates.length} rate{rates.length !== 1 ? "s" : ""} configured
                </p>
              </div>
              <Button
                onClick={openCreateModal}
                className="gap-2 bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                New Rate
              </Button>
            </div>
          </div>

          {rates.length === 0 ? (
            <Card variant="elevated" className="p-8 text-center">
              <Zap className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                No utility rates configured yet
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Create your first rate to get started
              </p>
              <Button
                onClick={openCreateModal}
                className="mt-4 gap-2 bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="h-4 w-4" />
                Add Rate
              </Button>
            </Card>
          ) : (
            <div className="space-y-4 md:space-y-5 lg:space-y-3">
              {/* Currently Active Rate */}
              {currentRate && (
                <section className="rounded-xl border-2 border-primary/20 bg-white p-4 shadow-sm md:p-5 lg:rounded-lg lg:p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <span className="mr-1.5 h-2 w-2 rounded-full bg-primary"></span>
                      Currently Active
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Card className="border border-gray-100 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Water Rate
                      </p>
                      <p className="mt-1 text-xl font-bold text-blue-600">
                        ฿{formatCurrency(currentRate.water_rate)}
                      </p>
                      <p className="text-xs text-gray-400">per unit</p>
                    </Card>
                    <Card className="border border-gray-100 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Electric Rate
                      </p>
                      <p className="mt-1 text-xl font-bold text-amber-600">
                        ฿{formatCurrency(currentRate.electric_rate)}
                      </p>
                      <p className="text-xs text-gray-400">per unit</p>
                    </Card>
                    <Card className="border border-gray-100 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Common Fee
                      </p>
                      <p className="mt-1 text-xl font-bold text-teal-600">
                        ฿{formatCurrency(currentRate.common_fee)}
                      </p>
                      <p className="text-xs text-gray-400">fixed</p>
                    </Card>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400">
                      Created {formatDate(currentRate.created_at)}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openViewModal(currentRate)}
                        className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(currentRate)}
                        className="rounded-md border border-blue-200 p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit rate"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(currentRate)}
                        className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete rate"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Past Rates */}
              {pastRates.length > 0 && (
                <section className="rounded-xl bg-white p-4 shadow-sm md:p-5 lg:rounded-lg lg:p-3">
                  <h3 className="mb-3 font-display text-sm font-bold text-gray-700">
                    Previous Rates ({pastRates.length})
                  </h3>
                  <div className="space-y-2">
                    {pastRates.map((rate) => (
                      <div
                        key={rate.rate_id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                            {rate.period.slice(-2)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              Period {rate.period}
                            </p>
                            <p className="text-xs text-gray-500">
                              Water ฿
                              {formatCurrency(rate.water_rate)} &middot; Elec
                              ฿
                              {formatCurrency(rate.electric_rate)} &middot;
                              Common ฿{formatCurrency(rate.common_fee)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openViewModal(rate)}
                            className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(rate)}
                            className="rounded-md border border-blue-200 p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit rate"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(rate)}
                            className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete rate"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
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
              {modalMode === "view" && selectedRate && (
                <ViewModal
                  rate={selectedRate}
                  onClose={closeModal}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                />
              )}

              {(modalMode === "create" || modalMode === "edit") && (
                <FormModal
                  mode={modalMode}
                  formData={formData}
                  errors={formErrors}
                  submitting={submitting}
                  onFieldChange={handleFieldChange}
                  onSubmit={handleSubmit}
                  onCancel={closeModal}
                />
              )}

              {modalMode === "delete" && selectedRate && (
                <DeleteModal
                  rate={selectedRate}
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

function ViewModal({
  rate,
  onClose,
  formatDate,
  formatCurrency,
}: {
  rate: UtilityRate;
  onClose: () => void;
  formatDate: (dateStr?: string) => string;
  formatCurrency: (value: number) => string;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {rate.period.slice(-2)}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900">
              Rate Details
            </h3>
            <p className="text-xs text-gray-500">Period {rate.period}</p>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
              Water Rate
            </p>
            <p className="text-2xl font-bold text-blue-700">
              ฿{formatCurrency(rate.water_rate)}
            </p>
            <p className="text-xs text-blue-500">per unit</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
              Electric Rate
            </p>
            <p className="text-2xl font-bold text-amber-700">
              ฿{formatCurrency(rate.electric_rate)}
            </p>
            <p className="text-xs text-amber-500">per unit</p>
          </div>
          <div className="rounded-lg bg-teal-50 p-4">
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">
              Common Fee
            </p>
            <p className="text-2xl font-bold text-teal-700">
              ฿{formatCurrency(rate.common_fee)}
            </p>
            <p className="text-xs text-teal-500">fixed</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Period
            </p>
            <p className="text-sm text-gray-900 font-medium">{rate.period}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Created
            </p>
            <p className="text-sm text-gray-900">{formatDate(rate.created_at)}</p>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Rate ID
          </p>
          <p className="text-xs text-gray-500 font-mono break-all">
            {rate.rate_id}
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

function FormModal({
  mode,
  formData,
  errors,
  submitting,
  onFieldChange,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  formData: FormData;
  errors: FormErrors;
  submitting: boolean;
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
            {mode === "create" ? "Create New Rate" : "Edit Rate"}
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
          <Label htmlFor="rate-period">
            Period <span className="text-red-500">*</span>
          </Label>
          <Input
            id="rate-period"
            type="text"
            placeholder="e.g. 2025-05"
            value={formData.period}
            onChange={(e) => onFieldChange("period", e.target.value)}
            className={errors.period ? "border-red-500" : ""}
          />
          {errors.period && (
            <p className="text-red-500 text-xs">{errors.period}</p>
          )}
          <p className="text-xs text-gray-400">
            Format: YYYY-MM (e.g. 2025-05 for May 2025)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate-water">
            Water Rate (per unit) <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              ฿
            </span>
            <Input
              id="rate-water"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={formData.water_rate}
              onChange={(e) => onFieldChange("water_rate", e.target.value)}
              className={`pl-7 ${errors.water_rate ? "border-red-500" : ""}`}
            />
          </div>
          {errors.water_rate && (
            <p className="text-red-500 text-xs">{errors.water_rate}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate-electric">
            Electric Rate (per unit) <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              ฿
            </span>
            <Input
              id="rate-electric"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={formData.electric_rate}
              onChange={(e) => onFieldChange("electric_rate", e.target.value)}
              className={`pl-7 ${errors.electric_rate ? "border-red-500" : ""}`}
            />
          </div>
          {errors.electric_rate && (
            <p className="text-red-500 text-xs">{errors.electric_rate}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate-common">
            Common Fee (fixed) <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              ฿
            </span>
            <Input
              id="rate-common"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={formData.common_fee}
              onChange={(e) => onFieldChange("common_fee", e.target.value)}
              className={`pl-7 ${errors.common_fee ? "border-red-500" : ""}`}
            />
          </div>
          {errors.common_fee && (
            <p className="text-red-500 text-xs">{errors.common_fee}</p>
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
            <>{mode === "create" ? "Create Rate" : "Save Changes"}</>
          )}
        </Button>
      </div>
    </>
  );
}

function DeleteModal({
  rate,
  submitting,
  onConfirm,
  onCancel,
  formatCurrency,
}: {
  rate: UtilityRate;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  formatCurrency: (value: number) => string;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-red-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-4 w-4 text-red-600" />
          </div>
          <h3 className="font-display text-lg font-bold text-gray-900">
            Delete Rate
          </h3>
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm text-gray-700">
          Are you sure you want to delete this utility rate?
        </p>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {rate.period.slice(-2)}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                Period {rate.period}
              </p>
              <p className="text-xs text-gray-500">
                Water ฿{formatCurrency(rate.water_rate)} &middot; Elec ฿
                {formatCurrency(rate.electric_rate)} &middot; Common ฿
                {formatCurrency(rate.common_fee)}
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
            "Delete Rate"
          )}
        </Button>
      </div>
    </>
  );
}
