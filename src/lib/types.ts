// Typy odzwierciedlające schemat bazy.
// Docelowo generowane automatycznie przez Supabase CLI:
//   supabase gen types typescript --linked > src/lib/types.ts

export type Role = 'admin' | 'member'

export interface Household {
  id: string
  name: string
  created_by: string | null
  created_at: string
}

export interface HouseholdMember {
  id: string
  household_id: string
  user_id: string
  display_name: string | null
  role: Role
  joined_at: string
}

export interface HouseholdInvite {
  id: string
  household_id: string
  token: string
  created_by: string | null
  created_at: string
  expires_at: string
  used_at: string | null
  used_by: string | null
}

export interface Category {
  id: string
  household_id: string
  name: string
  emoji: string
  color: string
  sort_order: number
  created_at: string
}

export interface Item {
  id: string
  household_id: string
  category_id: string | null
  name: string
  quantity: string | null
  note: string | null
  added_by: string | null
  is_bought: boolean
  bought_by: string | null
  bought_at: string | null
  archived_at: string | null
  created_at: string
  // joined
  category?: Category | null
}

// Pogrupowana lista dla widoku
export interface ItemsByCategory {
  category: Category | null
  items: Item[]
}

// Payload do Server Actions
export interface AddItemPayload {
  name: string
  quantity?: string
  note?: string
  category_id?: string
}
