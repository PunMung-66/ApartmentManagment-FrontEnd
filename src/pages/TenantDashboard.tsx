import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApiWithAuth } from "@/hooks/useApiWithAuth";
import { useToast } from "@/contexts/ToastContext";
import type { Bill } from "@/types/bill";
import type { Room } from "@/types/room";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { API_BASE_URL } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import BillDetailModal from "@/components/ui/bill-detail-modal"
import SlipPreviewModal from "@/components/ui/slip-preview-modal"
import {
  Search,
  Upload,
  Loader2,
  LogOut,
  Home,
  AlertCircle,
  Eye,
  FileText,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  Unpaid: "bg-red-100 text-red-700 border-red-200",
  WaitingApproval: "bg-amber-100 text-amber-700 border-amber-200",
  Paid: "bg-teal-100 text-teal-700 border-teal-200",
  Rejected: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function TenantDashboard() {
  const api = useApiWithAuth();
  const { user, logout } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomError, setRoomError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadingBillId, setUploadingBillId] = useState<string | null>(null);
  const [previewSlipUrl, setPreviewSlipUrl] = useState<string | null>(null);
  const [selectedDetailBill, setSelectedDetailBill] = useState<Bill | null>(null);
  const uploadBillIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setRoomError(false);
      const [billsRes, roomRes] = await Promise.allSettled([
        api.get<Bill[]>("/me/bills", { skipToast: true }),
        api.get<Room>("/me/room", { skipToast: true }),
      ]);
      if (billsRes.status === "fulfilled" && billsRes.value.data)
        setBills(billsRes.value.data);
      if (roomRes.status === "fulfilled" && roomRes.value.data)
        setRoom(roomRes.value.data);
      else if (roomRes.status === "rejected")
        setRoomError(true);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const total = bills.length;
    const unpaid = bills.filter((b) => b.status === "Unpaid").length;
    const waiting = bills.filter((b) => b.status === "WaitingApproval").length;
    const paid = bills.filter((b) => b.status === "Paid").length;
    return { total, unpaid, waiting, paid };
  }, [bills]);

  const handleUploadClick = (billId: string) => {
    uploadBillIdRef.current = billId;
    setUploadingBillId(billId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const billId = uploadBillIdRef.current;
    if (!file || !billId || !room) return;

    try {
      const token = getCookie("token");
      const formData = new FormData();
      formData.append("bill_id", billId);
      formData.append("room_id", room.room_id);
      formData.append("slip", file);

      const res = await fetch(`${API_BASE_URL}/billslips/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      showSuccess("Payment slip uploaded successfully");
      await fetchData();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || "Upload failed";
      showError(msg);
    } finally {
      setUploadingBillId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredBills = useMemo(() => {
    if (!searchTerm) return bills;
    const term = searchTerm.toLowerCase();
    return bills.filter(
      (b) =>
        b.status.toLowerCase().includes(term) ||
        formatDate(b.record_date).toLowerCase().includes(term)
    );
  }, [searchTerm, bills]);

  const columns: Column<Bill>[] = [
    {
      header: "Bill",
      render: (b) => (
        <button
          onClick={() => setSelectedDetailBill(b)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
          title="View bill details"
        >
          <FileText className="h-4 w-4" />
        </button>
      ),
    },
    {
      header: "Period",
      render: (b) => (
        <p className="text-sm font-medium text-gray-900">
          {formatDate(b.record_date)}
        </p>
      ),
    },
    {
      header: "Due Date",
      render: (b) => (
        <p className="text-sm text-gray-600">{formatDate(b.due_date)}</p>
      ),
    },
    {
      header: "Total",
      render: (b) => (
        <p className="text-sm font-semibold text-gray-900">
          ฿{formatCurrency(b.total_amount)}
        </p>
      ),
    },
    {
      header: "Status",
      render: (b) => (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status] || ""}`}
        >
          {b.status}
        </span>
      ),
    },
    {
      header: "Slip",
      render: (b) =>
        b.bill_slip ? (
          <button
            onClick={() => setPreviewSlipUrl(b.bill_slip!.slip_url)}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
          >
            <Eye className="h-3 w-3" />
            View
          </button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      header: "",
      render: (b) =>
        b.status === "Unpaid" ? (
          <Button
            onClick={() => handleUploadClick(b.bill_id)}
            variant="secondary"
            className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs py-1 px-2.5 h-auto bg-white"
            disabled={uploadingBillId === b.bill_id}
          >
            {uploadingBillId === b.bill_id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            Upload Slip
          </Button>
        ) : null,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileSelected}
        className="hidden"
      />

      {previewSlipUrl && (
        <SlipPreviewModal
          slipUrl={previewSlipUrl}
          onClose={() => setPreviewSlipUrl(null)}
        />
      )}

      {selectedDetailBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
            <BillDetailModal
              bill={selectedDetailBill}
              onClose={() => setSelectedDetailBill(null)}
              onPreviewSlip={(url) => setPreviewSlipUrl(url)}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-base font-bold text-gray-900">
              Yensabai
            </h1>
            <p className="text-xs text-gray-500">Tenant Portal</p>
          </div>
          <Button
            onClick={logout}
            variant="secondary"
            className="gap-2 border-gray-200 text-gray-600 text-sm py-1.5 px-3 h-auto bg-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-12 pt-5">
        {/* Room Info */}
        {room ? (
          <Card variant="elevated" className="p-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                <Home className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Room #{room.room_number} &middot; Level {room.level}
                </p>
                <p className="text-xs text-gray-500 capitalize">{room.status}</p>
              </div>
            </div>
            {user && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-600">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                  {user.name?.charAt(0) || "T"}
                </div>
                {user.name} &middot; {user.email}
              </div>
            )}
          </Card>
        ) : roomError ? (
          <Card variant="elevated" className="p-4 mb-5 border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">No active contract</p>
                <p className="text-xs text-amber-600">Contact the management for assistance</p>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Stats */}
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold text-gray-900 mb-3">
            My Bills
          </h2>
          <div className="grid grid-cols-4 gap-3">
            <Card variant="elevated" className="p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Total
              </p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </Card>
            <Card variant="elevated" className="p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Unpaid
              </p>
              <p className="text-xl font-bold text-red-600">{stats.unpaid}</p>
            </Card>
            <Card variant="elevated" className="p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Waiting
              </p>
              <p className="text-xl font-bold text-amber-600">{stats.waiting}</p>
            </Card>
            <Card variant="elevated" className="p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Paid
              </p>
              <p className="text-xl font-bold text-teal-600">{stats.paid}</p>
            </Card>
          </div>
        </div>

        {/* Search */}
        <div className="mb-3 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            spellCheck="false"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        {/* Bills Table */}
        <DataTable
          columns={columns}
          data={filteredBills}
          keyExtractor={(b) => b.bill_id}
          emptyMessage="No bills found"
        />
      </main>
    </div>
  );
}