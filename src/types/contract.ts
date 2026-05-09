export interface Contract {
  contract_id: string
  user_id: string
  room_id: string
  start_date: string
  end_date: string | null
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
}
