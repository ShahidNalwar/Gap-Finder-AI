-- Installs the reset action only; running this migration does NOT delete data.
begin;

create or replace function public.reset_study_workspace(confirmation text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
begin
  if owner_id is null then
    raise exception 'Please log in to reset your study workspace.' using errcode = '28000';
  end if;
  if confirmation is distinct from 'DELETE MY STUDY DATA' then
    raise exception 'The reset confirmation phrase does not match.' using errcode = '22023';
  end if;

  -- A function call is one transaction. No swallowed errors or partial resets.
  -- Delete dependent records explicitly before their restricted parents.
  delete from public.plans where user_id = owner_id;
  delete from public.answers where user_id = owner_id;
  delete from public.attempts where user_id = owner_id;
  delete from public.past_questions where user_id = owner_id;
  delete from public.questions where user_id = owner_id;
  delete from public.topics where user_id = owner_id;
  delete from public.chunks where user_id = owner_id;
  delete from public.documents where user_id = owner_id;
end;
$$;

revoke all on function public.reset_study_workspace(text) from public, anon;
grant execute on function public.reset_study_workspace(text) to authenticated;

commit;
