import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";
import type { User } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StaffSidebar } from "@/components/StaffSidebar";
import { Trash2, Edit2, Plus, Search, X, Eye, Info, Loader2, EyeOff } from "lucide-react";

interface UserWithCount extends User {
  contractCount?: number;
}

type ModalMode = "create" | "edit" | "view" | "delete" | null;

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function AllUsers() {
  const api = useApiWithAuth();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState<UserWithCount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "STAFF" | "TENANT">("ALL");
  const [stats, setStats] = useState({ staff: 0, tenants: 0 });

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithCount | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "TENANT",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const [staffRes, tenantRes] = await Promise.all([
        api.get<UserWithCount[]>("/users?role=STAFF", { skipToast: true }),
        api.get<UserWithCount[]>("/users?role=TENANT", { skipToast: true }),
      ]);

      const allUsers: UserWithCount[] = [
        ...(staffRes.data || []),
        ...(tenantRes.data || []),
      ];

      setUsers(allUsers);

      const staffCount = allUsers.filter((u) => u.role === "STAFF").length;
      const tenantCount = allUsers.filter((u) => u.role === "TENANT").length;
      setStats({ staff: staffCount, tenants: tenantCount });
    } catch (error) {
      console.error("[AllUsers] Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    let result = users;

    if (roleFilter !== "ALL") {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.role.toLowerCase().includes(term),
      );
    }

    return result;
  }, [searchTerm, users, roleFilter]);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = (isCreate: boolean): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!validateEmail(formData.email)) errors.email = "Invalid email format";
    if (isCreate && !formData.password) errors.password = "Password is required";
    if (formData.password && formData.password.length < 6) errors.password = "Password must be at least 6 characters";
    if (isCreate && !formData.confirmPassword) errors.confirmPassword = "Confirm password is required";
    if (isCreate && formData.password !== formData.confirmPassword && formData.confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (!formData.role) errors.role = "Role is required";
    return errors;
  };

  const openCreateModal = () => {
    setFormData({ name: "", email: "", phone: "", password: "", confirmPassword: "", role: "TENANT" });
    setFormErrors({});
    setSelectedUser(null);
    setModalMode("create");
  };

  const openEditModal = (u: UserWithCount) => {
    setSelectedUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      password: "",
      confirmPassword: "",
      role: u.role,
    });
    setFormErrors({});
    setModalMode("edit");
  };

  const openViewModal = (u: UserWithCount) => {
    setSelectedUser(u);
    setModalMode("view");
  };

  const openDeleteModal = (u: UserWithCount) => {
    setSelectedUser(u);
    setModalMode("delete");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedUser(null);
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
    const errors = validateForm(modalMode === "create");
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, string> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (modalMode === "create") {
        await api.post("/users", payload, { skipToast: true });
      } else if (modalMode === "edit" && selectedUser) {
        await api.put(`/users/${selectedUser.user_id}`, payload, { skipToast: true });
      }

      closeModal();
      await fetchUsers();
    } catch (error) {
      console.error("[AllUsers] Failed to save user:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      await api.delete(`/users/${selectedUser.user_id}`, { skipToast: true });
      closeModal();
      await fetchUsers();
    } catch (error) {
      console.error("[AllUsers] Failed to delete user:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "STAFF":
        return "bg-blue-100 text-blue-700";
      case "TENANT":
        return "bg-teal-100 text-teal-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      {/* Mobile Header */}
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
                <h2 className="font-display text-xl font-bold text-gray-900 md:text-2xl lg:text-lg">All Users</h2>
                <p className="mt-1 text-sm text-gray-600 md:text-sm lg:text-xs">
                  {stats.staff} Staff • {stats.tenants} Tenants
                </p>
              </div>
              <Button onClick={openCreateModal} className="gap-2 bg-primary hover:bg-primary/90 text-white w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                New User
              </Button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="mb-4 md:mb-5 lg:mb-3 flex gap-2">
            {(["ALL", "STAFF", "TENANT"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  roleFilter === role
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {role === "ALL" && "All"}
                {role === "STAFF" && "Staff"}
                {role === "TENANT" && "Tenant"}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="mb-5 md:mb-6 lg:mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, role, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                name="search-users"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="w-full max-w-full overflow-x-auto">
            <Card className="p-0">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold uppercase text-gray-600 lg:text-[10px]">User Identity</th>
                    <th className="px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold uppercase text-gray-600 lg:text-[10px]">Role</th>
                    <th className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold uppercase text-gray-600 lg:text-[10px]">Email Address</th>
                    <th className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4 text-left text-xs font-semibold uppercase text-gray-600 lg:text-[10px]">Status</th>
                    <th className="px-4 py-3 md:px-6 md:py-4 text-right text-xs font-semibold uppercase text-gray-600 lg:text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 md:px-6 text-center text-sm text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.user_id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 md:px-6 md:py-4">
                          <button
                            onClick={() => openViewModal(u)}
                            className="flex items-center gap-3 text-left group"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white md:h-9 md:w-9">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 text-sm md:text-base truncate group-hover:text-primary transition-colors">
                                {u.name}
                              </p>
                              <p className="text-xs text-gray-500">{u.phone || "N/A"}</p>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4">
                          <p className="text-sm text-gray-700 truncate">{u.email}</p>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4 flex items-center justify-center">
                          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-green-500"></span>
                            Active
                          </span>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openViewModal(u)}
                              className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(u)}
                              className="rounded-md border border-blue-200 p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit user"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(u)}
                              className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          </div>
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
              {modalMode === "view" && selectedUser && (
                <ViewModal user={selectedUser} onClose={closeModal} formatDate={formatDate} getRoleBadgeColor={getRoleBadgeColor} />
              )}

              {/* Create / Edit Modal */}
              {(modalMode === "create" || modalMode === "edit") && (
                <UserFormModal
                  mode={modalMode}
                  formData={formData}
                  errors={formErrors}
                  submitting={submitting}
                  onFieldChange={handleFieldChange}
                  onSubmit={handleSubmit}
                  onCancel={closeModal}
                />
              )}

              {/* Delete Modal */}
              {modalMode === "delete" && selectedUser && (
                <DeleteModal
                  user={selectedUser}
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

function ViewModal({
  user,
  onClose,
  formatDate,
  getRoleBadgeColor,
}: {
  user: UserWithCount;
  onClose: () => void;
  formatDate: (dateStr?: string) => string;
  getRoleBadgeColor: (role: string) => string;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900">User Details</h3>
            <p className="text-xs text-gray-500">{user.name}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-5 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
          <p className="text-sm text-gray-900 font-medium">{user.name}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
          <p className="text-sm text-gray-900">{user.email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</p>
          <p className="text-sm text-gray-900">{user.phone || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Role</p>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
            {user.role}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created</p>
            <p className="text-xs text-gray-700">{formatDate(user.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Updated</p>
            <p className="text-xs text-gray-700">{formatDate(user.updated_at)}</p>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">User ID</p>
          <p className="text-xs text-gray-500 font-mono break-all">{user.user_id}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
        <Button onClick={onClose} variant="secondary" className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-white">
          Close
        </Button>
      </div>
    </>
  );
}

function UserFormModal({
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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-gray-500" />
          <h3 className="font-display text-lg font-bold text-gray-900">
            {mode === "create" ? "Create New User" : "Edit User"}
          </h3>
        </div>
        <button onClick={onCancel} className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Form */}
      <div className="px-6 py-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="user-name">Full Name <span className="text-red-500">*</span></Label>
          <Input
            id="user-name"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
            autoComplete="name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-email">Email <span className="text-red-500">*</span></Label>
          <Input
            id="user-email"
            type="email"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => onFieldChange("email", e.target.value)}
            autoComplete="off"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-phone">Phone</Label>
          <Input
            id="user-phone"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={(e) => onFieldChange("phone", e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="user-password">
            Password {mode === "create" ? <span className="text-red-500">*</span> : <span className="text-gray-400 text-xs">(leave blank to keep current)</span>}
          </Label>
          <div className="relative">
            <Input
              id="user-password"
              type={showPassword ? "text" : "password"}
              placeholder={mode === "create" ? "Enter password" : "••••••••"}
              value={formData.password}
              onChange={(e) => onFieldChange("password", e.target.value)}
              autoComplete={mode === "create" ? "new-password" : "current-password"}
              className={errors.password ? "border-red-500 pr-10" : "pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
        </div>

        {mode === "create" && (
          <div className="space-y-2">
            <Label htmlFor="user-confirm-password">Confirm Password <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="user-confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) => onFieldChange("confirmPassword", e.target.value)}
                autoComplete="new-password"
                className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="user-role">Role <span className="text-red-500">*</span></Label>
          <select
            id="user-role"
            value={formData.role}
            onChange={(e) => onFieldChange("role", e.target.value)}
            className="h-9 w-full min-w-0 rounded-md border border-input/20 bg-transparent px-3 py-2 font-body text-sm text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="STAFF">STAFF</option>
            <option value="TENANT">TENANT</option>
          </select>
          {errors.role && <p className="text-red-500 text-xs">{errors.role}</p>}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary" className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-white" disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={onSubmit} className="bg-primary hover:bg-primary/90 text-white" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              {mode === "create" ? "Creating..." : "Saving..."}
            </>
          ) : (
            <>{mode === "create" ? "Create User" : "Save Changes"}</>
          )}
        </Button>
      </div>
    </>
  );
}

function DeleteModal({
  user,
  submitting,
  onConfirm,
  onCancel,
}: {
  user: UserWithCount;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-red-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-4 w-4 text-red-600" />
          </div>
          <h3 className="font-display text-lg font-bold text-gray-900">Delete User</h3>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        <p className="text-sm text-gray-700">
          Are you sure you want to delete this user?
        </p>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email} • {user.role}</p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-red-500 font-medium">
          This action cannot be undone.
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary" className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-white" disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              Deleting...
            </>
          ) : (
            "Delete User"
          )}
        </Button>
      </div>
    </>
  );
}
