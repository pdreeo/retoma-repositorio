-- Reschedule only the next pending follow-up of a quote in the caller's company.
-- Later pending steps keep at least their original interval from that step.
create function public.reschedule_followup(p_quote_id uuid, p_due_on date)
returns void language plpgsql security definer set search_path = '' as $$
declare
  q public.quotes;
  next_step integer;
  offsets integer[];
  today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  select * into q from public.quotes
  where id = p_quote_id and company_id = public.my_company_id() for update;
  if not found then raise exception 'not found'; end if;
  if q.status in ('won', 'lost') then raise exception 'closed quote'; end if;
  if p_due_on is null or p_due_on < today + 1 or p_due_on > today + 365
  then raise exception 'invalid followup date'; end if;

  select step into next_step from public.followups
  where quote_id = q.id and company_id = q.company_id
    and completed_at is null and skipped_at is null
  order by step limit 1;
  if next_step is null then raise exception 'no pending followup'; end if;

  select followup_days into offsets from public.companies where id = q.company_id;
  update public.followups as f
  set due_on = case when f.step = next_step then p_due_on
                    else greatest(f.due_on, p_due_on + offsets[f.step] - offsets[next_step]) end
  where f.quote_id = q.id and f.company_id = q.company_id
    and f.step >= next_step and f.completed_at is null and f.skipped_at is null;
  update public.quotes set status = 'awaiting', updated_at = now() where id = q.id;
end; $$;

revoke execute on function public.reschedule_followup(uuid,date) from public, anon;
grant execute on function public.reschedule_followup(uuid,date) to authenticated;
