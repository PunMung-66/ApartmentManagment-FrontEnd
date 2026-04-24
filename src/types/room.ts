// Room types based on backend API structure
export interface Room {
  room_id: string
  room_number: string
  level: number
  status: 'Available' | 'Occupied' | 'Maintenance'
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface RoomStats {
  total: number
  available: number
  occupied: number
  maintenance: number
}

export interface FloorGroup {
  level: number
  rooms: Room[]
}
