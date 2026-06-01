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

export interface ShoppingList {
  id: string
  household_id: string
  name: string
  emoji: string
  archived_at: string | null
  created_by: string | null
  created_at: string
  // computed
  item_count?: number
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
  list_id: string | null
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
  category?: Category | null
}

export interface AddItemPayload {
  name: string
  quantity?: string
  note?: string
  category_id?: string
}

export interface FrequentItem {
  name: string
  category_id: string | null
  occurrence_count: number
}

export interface Preset {
  id: string
  household_id: string
  name: string
  ingredients: string[]
  created_at: string
}
