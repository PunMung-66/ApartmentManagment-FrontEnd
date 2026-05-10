export interface BillSlip {
  id: string
  bill_id: string
  room_id: string
  slip_url: string
}

export interface Bill {
  bill_id: string
  contract_id: string
  rate_id: string
  record_date: string
  rent_fee: number
  water_fee: number
  electricity_fee: number
  common_fee: number
  total_amount: number
  old_water_unit: number
  new_water_unit: number
  old_electric_unit: number
  new_electric_unit: number
  water_rate: number
  electric_rate: number
  status: 'Unpaid' | 'WaitingApproval' | 'Paid' | 'Rejected'
  due_date: string
  created_at: string
  updated_at: string
  bill_slip?: BillSlip
}
