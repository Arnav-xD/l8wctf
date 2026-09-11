-- Replace the pre-launch SRN account model with global email/password signup.
-- Apply after 202609070002_ctf_submission_concurrency.sql.

begin;

alter table public.ctf_profiles rename column handle to username;
alter table public.ctf_profiles drop constraint if exists ctf_profiles_srn_key;
alter table public.ctf_profiles drop constraint if exists ctf_profiles_srn_check;
alter table public.ctf_profiles drop constraint if exists ctf_profiles_handle_key;
alter table public.ctf_profiles drop constraint if exists ctf_profiles_handle_check;
alter table public.ctf_profiles drop column srn;

alter table public.ctf_profiles
  add constraint ctf_profiles_username_key unique (username),
  add constraint ctf_profiles_username_check
    check (username ~ '^[a-z0-9_-]{3,24}$'),
  add column account_status text not null default 'active'
    check (account_status in ('active', 'suspended'));

create or replace function public.handle_new_ctf_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := lower(trim(new.raw_user_meta_data ->> 'username'));
begin
  if v_username is null or v_username !~ '^[a-z0-9_-]{3,24}$' then
    raise exception 'Invalid CTF username' using errcode = '23514';
  end if;

  insert into public.ctf_profiles (
    id, username, display_name, role, account_status
  ) values (
    new.id, v_username, v_username, 'student', 'active'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_ctf_profile on auth.users;
create trigger on_auth_user_created_create_ctf_profile
after insert on auth.users
for each row execute function public.handle_new_ctf_user();

revoke all on function public.handle_new_ctf_user() from public, anon, authenticated;

drop policy if exists "published weeks are readable" on public.ctf_weeks;
create policy "published weeks are readable"
  on public.ctf_weeks for select
  using (published or exists (
    select 1 from public.ctf_profiles p
    where p.id = auth.uid()
      and p.account_status = 'active'
      and p.role in ('host', 'admin')
  ));

drop policy if exists "published challenges are readable" on public.ctf_challenges;
create policy "published challenges are readable"
  on public.ctf_challenges for select
  using (published or exists (
    select 1 from public.ctf_profiles p
    where p.id = auth.uid()
      and p.account_status = 'active'
      and p.role in ('host', 'admin')
  ));

drop function if exists public.ctf_leaderboard(integer);
create function public.ctf_leaderboard(limit_count integer default 10)
returns table (
  username text,
  total_points bigint,
  solve_count bigint,
  last_solve_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.username,
    coalesce(sum(s.points_awarded), 0)::bigint as total_points,
    count(s.challenge_id)::bigint as solve_count,
    max(s.solved_at) as last_solve_at
  from public.ctf_profiles p
  join public.ctf_solves s on s.user_id = p.id
  where p.account_status = 'active'
  group by p.id, p.username
  order by total_points desc, last_solve_at asc
  limit least(greatest(limit_count, 1), 100);
$$;

grant execute on function public.ctf_leaderboard(integer) to anon, authenticated;

create or replace function public.submit_ctf_flag(
  p_challenge_id uuid,
  p_submitted_hash text
)
returns table (outcome text, awarded_points integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz;
  v_points integer;
  v_starts_at timestamptz;
  v_expected_hash text;
  v_inserted_rows integer;
begin
  if v_user_id is null then
    return query select 'unauthenticated'::text, 0;
    return;
  end if;

  if not exists (
    select 1 from public.ctf_profiles
    where id = v_user_id and account_status = 'active'
  ) then
    return query select 'account_disabled'::text, 0;
    return;
  end if;

  if p_submitted_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid flag hash';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('ctf-submit:' || v_user_id::text, 0)
  );
  v_now := clock_timestamp();

  if (
    select count(*) from public.ctf_submissions
    where user_id = v_user_id
      and submitted_at >= v_now - interval '1 minute'
  ) >= 8 then
    return query select 'rate_limited'::text, 0;
    return;
  end if;

  select c.points, w.starts_at, s.flag_hash
    into v_points, v_starts_at, v_expected_hash
  from public.ctf_challenges c
  join public.ctf_weeks w on w.id = c.week_id
  join public.ctf_challenge_secrets s on s.challenge_id = c.id
  where c.id = p_challenge_id
    and c.published = true
    and w.published = true
    and v_now between w.starts_at and w.ends_at;

  if not found then
    return query select 'unavailable'::text, 0;
    return;
  end if;

  if exists (
    select 1 from public.ctf_solves
    where user_id = v_user_id and challenge_id = p_challenge_id
  ) then
    return query select 'solved'::text, 0;
    return;
  end if;

  insert into public.ctf_submissions
    (user_id, challenge_id, submitted_hash, correct)
  values
    (v_user_id, p_challenge_id, p_submitted_hash, p_submitted_hash = v_expected_hash);

  if p_submitted_hash <> v_expected_hash then
    return query select 'wrong'::text, 0;
    return;
  end if;

  insert into public.ctf_solves
    (user_id, challenge_id, points_awarded, elapsed_seconds)
  values (
    v_user_id,
    p_challenge_id,
    v_points,
    greatest(0, floor(extract(epoch from (v_now - v_starts_at)))::integer)
  )
  on conflict (user_id, challenge_id) do nothing;

  get diagnostics v_inserted_rows = row_count;
  if v_inserted_rows = 0 then
    return query select 'solved'::text, 0;
  else
    return query select 'correct'::text, v_points;
  end if;
end;
$$;

revoke all on function public.submit_ctf_flag(uuid, text) from public, anon;
grant execute on function public.submit_ctf_flag(uuid, text) to authenticated;

commit;
