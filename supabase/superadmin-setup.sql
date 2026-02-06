-- Script to create superadmin account
-- This script works with Supabase Auth properly

-- First, we'll use Supabase's auth.admin extension to create the user
-- Run this in your Supabase SQL Editor

-- Create the superadmin user through Supabase Auth
-- Note: This requires you to run this as a superuser or use Supabase's dashboard

-- Alternative approach: Create the user records directly in public tables
-- assuming the auth user will be created through the application signup

-- Insert the tenant record first
INSERT INTO public.tenants (
    id,
    name,
    admin_email,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Super Admin Organization',
    'aldrincabanez9@gmail.com',
    NOW(),
    NOW()
) ON CONFLICT (admin_email) DO UPDATE SET
    name = 'Super Admin Organization',
    updated_at = NOW();

-- Insert the user record (this will be linked when user signs up)
INSERT INTO public.users (
    id,
    email,
    tenant_id,
    role,
    is_superadmin,
    created_at,
    updated_at
) 
SELECT 
    t.id,
    'aldrincabanez9@gmail.com',
    t.id,
    'admin',
    true,
    NOW(),
    NOW()
FROM public.tenants t
WHERE t.admin_email = 'aldrincabanez9@gmail.com'
ON CONFLICT (email) DO UPDATE SET
    is_superadmin = true,
    role = 'admin',
    updated_at = NOW();

-- If you want to manually create the auth user (requires superuser privileges)
-- Uncomment the following block and run it in Supabase SQL Editor:

/*
-- This requires superuser privileges in Supabase
SELECT auth.email_sign_up(
    'aldrincabanez9@gmail.com',
    'Akoangnagwagi84%'
);

-- Then update the user metadata to mark as superadmin
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{is_superadmin}',
    'true'::jsonb
)
WHERE email = 'aldrincabanez9@gmail.com';
*/