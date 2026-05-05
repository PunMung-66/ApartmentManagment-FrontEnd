import { useCallback, useEffect, useState } from "react";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";
import type { User } from "@/lib/api";

// The existing User type has id: number but the database uses UUID strings.
// We extend it locally here without touching lib/api.ts.
export interface UserRecord extends Omit<User, "id"> {
  id: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export function useUsers() {
  const api = useApiWithAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Backend requires role query param — /users alone returns 400.
      // Fetch both roles in parallel and merge into one list.
      const [staffRes, tenantRes] = await Promise.all([
        api.get<UserRecord[]>("/users?role=STAFF", { skipToast: true }),
        api.get<UserRecord[]>("/users?role=TENANT", { skipToast: true }),
      ]);

      const staff = staffRes.data ?? [];
      const tenant = tenantRes.data ?? [];
      setUsers([...staff, ...tenant]);
    } catch (err) {
      console.error("[useUsers] Failed to fetch users:", err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    loading,
    users,
    error,
    refetch: fetchUsers,
  };
}
