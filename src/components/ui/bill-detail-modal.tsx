import type { Bill } from "@/types/bill";
import { X, Eye } from "lucide-react";
import { Button } from "./button";

const STATUS_STYLES: Record<string, string> = {
  Unpaid: "bg-red-100 text-red-700 border-red-200",
  WaitingApproval: "bg-amber-100 text-amber-700 border-amber-200",
  Paid: "bg-teal-100 text-teal-700 border-teal-200",
  Rejected: "bg-gray-100 text-gray-500 border-gray-200",
};

interface BillDetailModalProps {
  bill: Bill;
  roomNumber?: string;
  tenantName?: string;
  onClose: () => void;
  onPreviewSlip: (url: string) => void;
  formatCurrency: (v: number) => string;
  formatDate: (s: string) => string;
}

export default function BillDetailModal({
  bill,
  roomNumber,
  tenantName,
  onClose,
  onPreviewSlip,
  formatCurrency,
  formatDate,
}: BillDetailModalProps) {
  const waterUsage = bill.new_water_unit - bill.old_water_unit;
  const electricUsage = bill.new_electric_unit - bill.old_electric_unit;

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {roomNumber ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {roomNumber}
            </div>
          ) : null}
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900">
              Bill Details
            </h3>
            {roomNumber && tenantName ? (
              <p className="text-xs text-gray-500">
                Room #{roomNumber} &middot; {tenantName}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Recorded: {formatDate(bill.record_date)}
              </p>
            )}
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
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[bill.status] || ""}`}
          >
            {bill.status}
          </span>
          <p className="text-2xl font-bold text-gray-900">
            ฿{formatCurrency(bill.total_amount)}
          </p>
        </div>

        {/* Usage & Rate Breakdown Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-right">Old</th>
                <th className="px-3 py-2 text-right">New</th>
                <th className="px-3 py-2 text-right">Used</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50/50">
                <td className="px-3 py-2 font-medium text-gray-700">Water</td>
                <td className="px-3 py-2 text-right text-gray-600">{bill.old_water_unit}</td>
                <td className="px-3 py-2 text-right text-gray-600">{bill.new_water_unit}</td>
                <td className="px-3 py-2 text-right font-semibold text-blue-700">{waterUsage} units</td>
                <td className="px-3 py-2 text-right text-gray-600">฿{formatCurrency(bill.water_rate)}</td>
                <td className="px-3 py-2 text-right font-semibold text-blue-700">฿{formatCurrency(bill.water_fee)}</td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="px-3 py-2 font-medium text-gray-700">Electricity</td>
                <td className="px-3 py-2 text-right text-gray-600">{bill.old_electric_unit}</td>
                <td className="px-3 py-2 text-right text-gray-600">{bill.new_electric_unit}</td>
                <td className="px-3 py-2 text-right font-semibold text-amber-700">{electricUsage} units</td>
                <td className="px-3 py-2 text-right text-gray-600">฿{formatCurrency(bill.electric_rate)}</td>
                <td className="px-3 py-2 text-right font-semibold text-amber-700">฿{formatCurrency(bill.electricity_fee)}</td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="px-3 py-2 font-medium text-gray-700">Common Fee</td>
                <td className="px-3 py-2 text-right text-gray-400" colSpan={3}>—</td>
                <td className="px-3 py-2 text-right text-gray-600">—</td>
                <td className="px-3 py-2 text-right font-semibold text-teal-700">฿{formatCurrency(bill.common_fee)}</td>
              </tr>
              <tr className="hover:bg-gray-50/50">
                <td className="px-3 py-2 font-medium text-gray-700">Rent Fee</td>
                <td className="px-3 py-2 text-right text-gray-400" colSpan={3}>—</td>
                <td className="px-3 py-2 text-right text-gray-600">—</td>
                <td className="px-3 py-2 text-right font-semibold text-gray-900">฿{formatCurrency(bill.rent_fee)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className="px-3 py-2 text-gray-700">Total</td>
                <td className="px-3 py-2 text-right text-gray-400" colSpan={4}></td>
                <td className="px-3 py-2 text-right text-gray-900">฿{formatCurrency(bill.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Record Date
            </p>
            <p className="text-sm text-gray-900">
              {formatDate(bill.record_date)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Due Date
            </p>
            <p className="text-sm text-gray-900">{formatDate(bill.due_date)}</p>
          </div>
        </div>

        {bill.bill_slip && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Payment Slip
            </p>
            <button
              onClick={() => onPreviewSlip(bill.bill_slip!.slip_url)}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Eye className="h-4 w-4" />
              View uploaded slip
            </button>
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
