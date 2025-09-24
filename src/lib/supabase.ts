import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Farm {
  id: string;
  name: string;
  description: string;
  governorate_id: number;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  category: 'youth' | 'family';
  price_per_day: number;
  max_capacity: number;
  features: string[];
  images: string[];
  has_pool: boolean;
  pool_sanitized: boolean;
  cleanliness_rating: number;
  owner_contact: {
    name: string;
    phone: string;
    email: string;
  } | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Governorate {
  id: number;
  name_en: string;
  name_ar: string;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  farm_id: string;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  children_count: number;
  total_amount: number;
  discount_amount: number;
  cashback_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  special_requests: string | null;
  booking_reference: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  role: 'customer' | 'admin' | 'farm_owner';
}