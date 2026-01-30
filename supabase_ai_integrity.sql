-- =============================================
-- 1. CLEANUP (Reset for Idempotency)
-- =============================================
drop trigger if exists on_stats_upload on public.match_stats;
drop function if exists public.detect_anomalies();
drop table if exists public.integrity_logs;
drop table if exists public.match_stats;

-- =============================================
-- 2. MATCH STATS (Data Lake for AI)
-- =============================================

create table public.match_stats (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) not null,
  player_id uuid references public.profiles(id) not null,
  
  -- Performance Metrics
  duration_seconds int not null,
  apm int default 0, -- Actions Per Minute
  damage_dealt int default 0,
  damage_taken int default 0,
  
  -- AI Computed Metadata (can be updated later)
  ai_win_probability float, -- e.g. 0.85 (85% chance to win based on historical data)
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.match_stats enable row level security;
create policy "Everyone can view stats" on match_stats for select using ( true );
create policy "Players can upload own stats" on match_stats for insert with check ( auth.uid() = player_id );


-- =============================================
-- 2. INTEGRITY / ANTI-CHEAT LOGS
-- =============================================

create table if not exists public.integrity_logs (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id),
  user_id uuid references public.profiles(id),
  
  flag_reason text not null, -- 'SPEED_RUN', 'EXTREME_UPSET', 'APM_ANOMALY', 'SUSPICIOUS_WIN_STREAK'
  severity text not null check (severity in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  details jsonb, -- Flexible data for the "AI" reasoning
  
  status text default 'PENDING' check (status in ('PENDING', 'REVIEWED', 'BANNED', 'DISMISSED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Only Admins should see this really, but for demo we allow read for now)
alter table public.integrity_logs enable row level security;
create policy "Public view for demo" on integrity_logs for select using ( true ); 
-- No insert policy for users. Only the TRIGGER (System) can insert.


-- =============================================
-- 3. "AI" ANOMALY DETECTION LOGIC (Trigger)
-- =============================================

create or replace function public.detect_anomalies()
returns trigger as $$
declare
  v_winner_rating int;
  v_loser_rating int;
  v_rating_diff int;
  v_win_count int;
begin
  -- 1. Check for "Speed Run" (Impossible Win Time)
  if new.duration_seconds < 30 then
    insert into public.integrity_logs (match_id, user_id, flag_reason, severity, details)
    values (new.match_id, new.player_id, 'SPEED_HACK_SUSPICION', 'HIGH', json_build_object('duration', new.duration_seconds, 'threshold', 30));
  end if;

  -- 2. Check for "Bot/Macro" (Inhuman APM)
  if new.apm > 600 then
    insert into public.integrity_logs (match_id, user_id, flag_reason, severity, details)
    values (new.match_id, new.player_id, 'APM_ANOMALY', 'MEDIUM', json_build_object('apm', new.apm, 'limit', 600));
  end if;

  -- 3. Check for "Smurfing/Boosting" (Massive Rating Upset)
  -- Get ratings (Assuming this stats row is for the winner, logic simplifies)
  -- (In a real system we'd query match result, here we do a simple check)
  
  -- 4. Check for Win Streak (e.g. 10 wins in last hour)
  -- select count(*) into v_win_count from matches where winner_id = new.player_id and created_at > now() - interval '1 hour';
  -- if v_win_count > 10 then ... end if;

  return new;
end;
$$ language plpgsql security definer;

-- Attach Trigger to Match Stats
drop trigger if exists on_stats_upload on public.match_stats;
create trigger on_stats_upload
  after insert on public.match_stats
  for each row execute procedure public.detect_anomalies();

-- Helper to simulate "AI Processing"
create or replace function public.process_match_ai(p_match_id uuid)
returns void language plpgsql as $$
begin
  -- This function could call an external Edge Function (OpenAI) in production.
  -- Here is acts as a placeholder that marks the stats as "AI Processed".
  update match_stats set ai_win_probability = random() where match_id = p_match_id;
end;
$$;


