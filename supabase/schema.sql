create table if not exists public.complaints (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    description text,
    location text,
    category text,
    priority text,
    department text,
    status text default 'Submitted'
);