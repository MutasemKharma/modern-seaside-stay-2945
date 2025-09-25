-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'chalet_owner');

-- Create profiles table for admin and owner users
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  role user_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Create chalets table for owners to manage
CREATE TABLE public.chalets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  governorate text NOT NULL,
  address text NOT NULL,
  coordinates jsonb,
  category text NOT NULL CHECK (category IN ('youth', 'family')),
  price_per_day numeric(10,2) NOT NULL,
  max_capacity integer NOT NULL,
  features text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  has_pool boolean DEFAULT false,
  pool_sanitized boolean DEFAULT false,
  cleanliness_rating numeric(2,1) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on chalets
ALTER TABLE public.chalets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chalets
CREATE POLICY "Everyone can view active chalets" ON public.chalets
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage their chalets" ON public.chalets
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all chalets" ON public.chalets
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_chalets_updated_at
  BEFORE UPDATE ON public.chalets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();