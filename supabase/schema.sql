-- Supabase Schema for MikroTik Cloud Manager

-- Enable Row Level Security
alter table if exists auth.users enable row level security;

-- Tenants table
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  admin_email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users table
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  email text not null,
  role text not null default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Routers table
create table if not exists public.routers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  name text not null,
  ip_address text not null,
  api_port integer not null default 8728,
  username text not null,
  password text not null,
  status text not null default 'unknown',
  description text,
  last_seen timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Vouchers table
create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  router_id uuid references public.routers(id) on delete cascade,
  username text not null,
  password text not null,
  profile text not null,
  status text not null default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Router configurations table
create table if not exists public.router_configs (
  id uuid primary key default gen_random_uuid(),
  router_id uuid references public.routers(id) on delete cascade,
  config_data jsonb not null,
  fetched_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists idx_routers_tenant_id on public.routers(tenant_id);
create index if not exists idx_vouchers_tenant_id on public.vouchers(tenant_id);
create index if not exists idx_vouchers_router_id on public.vouchers(router_id);
create index if not exists idx_users_tenant_id on public.users(tenant_id);
create index if not exists idx_router_configs_router_id on public.router_configs(router_id);

-- Enable Row Level Security on all tables
alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.routers enable row level security;
alter table public.vouchers enable row level security;
alter table public.router_configs enable row level security;

-- RLS Policies for Tenants
create policy "Tenants are viewable by admins"
  on public.tenants for select
  using ( 
    exists (
      select 1 from public.users 
      where users.id = auth.uid() 
      and users.role = 'admin'
    )
  );

create policy "Tenants are insertable by admins"
  on public.tenants for insert
  with check (
    exists (
      select 1 from public.users 
      where users.id = auth.uid() 
      and users.role = 'admin'
    )
  );

create policy "Tenants are updatable by admins"
  on public.tenants for update
  using (
    exists (
      select 1 from public.users 
      where users.id = auth.uid() 
      and users.role = 'admin'
    )
  );

-- RLS Policies for Users
create policy "Users can view their own tenant users"
  on public.users for select
  using (
    tenant_id = (
      select tenant_id from public.users 
      where id = auth.uid()
    )
  );

create policy "Users can insert users in their tenant"
  on public.users for insert
  with check (
    tenant_id = (
      select tenant_id from public.users 
      where id = auth.uid()
    )
  );

-- RLS Policies for Routers
create policy "Users can view routers in their tenant"
  on public.routers for select
  using (
    tenant_id = (
      select tenant_id from public.users 
      where id = auth.uid()
    )
  );

create policy "Users can insert routers in their tenant"
  on public.routers for insert
  with check (
    tenant_id = (
      select tenant_id from public.users 
      where id = auth.uid()
    )
  );

create policy "Users can update routers in their tenant"
  on public.routers for update
  using (
    tenant_id = (
      select tenant_id from public.users 
      where id = auth.uid()
    )
  );

create policy "Users can delete routers in their tenant"
  on public.routers for delete
  using (
    tenant_id = (
      select tenant_id from public.users 
      where id = auth.uid()
    )
  );

-- RLS Policies for Vouchers
create policy "Users can view vouchers in their tenant"
  on public.vouchers for select
  using (
    tenant_id = (
      select tenant_id from public.users 
      where id = auth.uid()
    )
  );

create policy "Users can insert vouchers in their tenant"
  on public.vouchers for insert
  with check (
    tenant_id = (
      select tenant_id from public.users 
      where id = auth.uid()
    )
  );

create policy "Users can update vouchers in their tenant"
  on public.vouchers for update
  using (
    tenant_id = (
      select tenant_id from public.users 
      where id = auth.uid()
    )
  );

create policy "Users can delete vouchers in their tenant"
  on public.vouchers for delete
  using (
    tenant_id = (
      select tenant_id from public.users 
      where id = auth.uid()
    )
  );

-- RLS Policies for Router Configs
create policy "Users can view router configs in their tenant"
  on public.router_configs for select
  using (
    exists (
      select 1 from public.routers r
      where r.id = router_configs.router_id
      and r.tenant_id = (
        select tenant_id from public.users 
        where id = auth.uid()
      )
    )
  );

create policy "System can insert router configs"
  on public.router_configs for insert
  with check (true);

-- Functions for automatic timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Triggers for automatic timestamps
create trigger update_tenants_updated_at 
  before update on public.tenants 
  for each row execute function update_updated_at_column();

create trigger update_users_updated_at 
  before update on public.users 
  for each row execute function update_updated_at_column();

create trigger update_routers_updated_at 
  before update on public.routers 
  for each row execute function update_updated_at_column();

create trigger update_vouchers_updated_at 
  before update on public.vouchers 
  for each row execute function update_updated_at_column();