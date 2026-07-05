create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  role text not null,
  department text not null,
  mobile text,
  email text,
  manager_id uuid references public.employees(id) on delete set null,
  is_manager boolean not null default false,
  head_of_departments text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_manager_id_idx on public.employees(manager_id);

alter table public.profiles enable row level security;
alter table public.employees enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_directory_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_directory_admin() from public;
grant execute on function public.is_directory_admin() to authenticated;

drop policy if exists "Users can view their profile" on public.profiles;
create policy "Users can view their profile"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Authenticated users can view employees" on public.employees;
create policy "Authenticated users can view employees"
  on public.employees
  for select
  to authenticated
  using (true);

drop policy if exists "Administrators can add employees" on public.employees;
create policy "Administrators can add employees"
  on public.employees
  for insert
  to authenticated
  with check ((select public.is_directory_admin()));

drop policy if exists "Administrators can update employees" on public.employees;
create policy "Administrators can update employees"
  on public.employees
  for update
  to authenticated
  using ((select public.is_directory_admin()))
  with check ((select public.is_directory_admin()));

drop policy if exists "Administrators can delete employees" on public.employees;
create policy "Administrators can delete employees"
  on public.employees
  for delete
  to authenticated
  using ((select public.is_directory_admin()));

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.employees to authenticated;

insert into public.profiles (id, role)
select id, 'viewer'
from auth.users
on conflict (id) do nothing;
