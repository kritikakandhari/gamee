-- =============================================
-- MONEY MATCH ADMIN & ANALYSIS
-- =============================================

-- 1. Support Tickets Table
create table if not exists public.support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  message text not null,
  type text not null, -- 'ACCOUNT', 'PAYMENT', 'MATCH_DISPUTE', 'TECHNICAL', 'FEEDBACK'
  status text default 'OPEN' not null, -- 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
  admin_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Support Tickets
alter table public.support_tickets enable row level security;

drop policy if exists "Users can manage own tickets" on support_tickets;
create policy "Users can manage own tickets" on support_tickets 
for all using ( auth.uid() = user_id );

drop policy if exists "Admins can view all tickets" on support_tickets;
create policy "Admins can view all tickets" on support_tickets 
for select using ( 
  exists (select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'is_admin' = 'true')
);


-- 2. Enhanced Analytics View
create or replace view public.app_analytics as
select
  count(*) as total_matches,
  sum(stake_cents) as total_volume_cents,
  avg(stake_cents) as avg_stake_cents,
  count(distinct winner_id) as total_winners,
  (select count(*) from support_tickets) as total_support_tickets,
  (select count(*) from profiles) as total_users,
  -- Group by stats as JSON for frontend consumption
  jsonb_build_object(
    'by_platform', (select jsonb_object_agg(platform, count) from (select platform, count(*) from matches group by platform) s),
    'by_type', (select jsonb_object_agg(match_type, count) from (select match_type, count(*) from matches group by match_type) s),
    'by_status', (select jsonb_object_agg(status, count) from (select status, count(*) from matches group by status) s)
  ) as extended_stats
from matches;


-- 3. Function to resolve ticket and notify
create or replace function public.resolve_support_ticket(
  p_ticket_id uuid,
  p_status text,
  p_admin_note text default null
)
returns void
language plpgsql security definer as $$
declare
  v_user_id uuid;
begin
  update support_tickets 
  set status = p_status, updated_at = now() 
  where id = p_ticket_id
  returning user_id into v_user_id;

  -- Notify User
  perform public.create_notification(
    v_user_id,
    'ALERT',
    'Support Ticket Update',
    'Your ticket status has been updated to: ' || p_status || '.',
    jsonb_build_object('ticket_id', p_ticket_id)
  );
end;
$$;
