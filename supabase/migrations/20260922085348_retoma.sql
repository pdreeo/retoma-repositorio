-- retoma v1. execute once in a new supabase project.
create extension if not exists pgcrypto;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 80),
 created_at timestamptz not null default now()
);
create table public.companies (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 2 and 100),
 timezone text not null default 'America/Sao_Paulo' check (timezone = 'America/Sao_Paulo'),
 followup_days integer[] not null default array[1,3,7] check (followup_days = array[1,3,7]),
 created_at timestamptz not null default now()
);
create table public.company_members (
 company_id uuid not null references public.companies(id) on delete cascade,
 user_id uuid not null unique references public.profiles(id) on delete cascade,
 primary key (company_id,user_id)
);
create table public.quotes (
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id) on delete cascade,
 customer_name text not null check (char_length(customer_name) between 2 and 100),
 phone text not null check (phone ~ '^55[1-9][0-9]{9,10}$'),
 service text not null check (char_length(service) between 2 and 120),
 amount_cents integer not null check (amount_cents between 1 and 999999999),
 sent_on date not null,
 notes text not null default '' check (char_length(notes) <= 2000),
 status text not null default 'new' check (status in ('new','awaiting','won','lost')),
 loss_reason text check (loss_reason in ('preço','prazo','fechou com concorrente','desistiu','não respondeu','outro')),
 loss_note text check (char_length(loss_note) <= 500),
 closed_at timestamptz,
 recovered_cents integer,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (id,company_id),
 check ((status = 'lost') = (loss_reason is not null)),
 check ((status in ('won','lost')) = (closed_at is not null)),
 check ((status = 'won') = (recovered_cents is not null)),
 check (recovered_cents is null or recovered_cents > 0),
 check (loss_reason is distinct from 'outro' or char_length(trim(loss_note)) > 0)
);
create table public.followups (
 id uuid primary key default gen_random_uuid(),
 quote_id uuid not null,
 company_id uuid not null,
 step integer not null check (step between 1 and 3),
 due_on date not null,
 completed_at timestamptz,
 skipped_at timestamptz,
 message text check (char_length(message) <= 2000),
 foreign key (quote_id,company_id) references public.quotes(id,company_id) on delete cascade,
 unique(quote_id,step),
 check (not (completed_at is not null and skipped_at is not null))
);
create index quotes_company_status on public.quotes(company_id,status);
create index followups_company_due on public.followups(company_id,due_on) where completed_at is null and skipped_at is null;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,name) values(new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),'você'),80));
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create function public.my_company_id() returns uuid language sql stable security definer set search_path = '' as $$
 select company_id from public.company_members where user_id = (select auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.quotes enable row level security;
alter table public.followups enable row level security;
create policy own_profile on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy own_company on public.companies for select to authenticated using (id = (select public.my_company_id()));
create policy own_membership on public.company_members for select to authenticated using (user_id = (select auth.uid()));
create policy own_quotes on public.quotes for select to authenticated using (company_id = (select public.my_company_id()));
create policy own_followups on public.followups for select to authenticated using (company_id = (select public.my_company_id()));
-- writes are exclusively narrow RPCs; no member management in v1.
revoke all on public.profiles,public.companies,public.company_members,public.quotes,public.followups from anon,authenticated;
grant select on public.profiles,public.companies,public.company_members,public.quotes,public.followups to authenticated;

create function public.create_company(p_name text) returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid;
begin
 if auth.uid() is null then raise exception 'unauthorized'; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 if public.my_company_id() is not null then raise exception 'company already exists'; end if;
 insert into public.companies(name) values(trim(p_name)) returning id into cid;
 insert into public.company_members(company_id,user_id) values(cid,auth.uid());
 return cid;
end; $$;

create function public.save_quote(p_customer_name text,p_phone text,p_service text,p_amount_cents integer,p_sent_on date,p_notes text default '',p_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid := public.my_company_id(); qid uuid; olddate date; oldstatus text; offsets integer[];
begin
 if cid is null then raise exception 'unauthorized'; end if;
 if p_sent_on > (now() at time zone 'America/Sao_Paulo')::date or p_sent_on < '2000-01-01'::date then raise exception 'invalid date'; end if;
 if p_id is null then
 insert into public.quotes(company_id,customer_name,phone,service,amount_cents,sent_on,notes)
 values(cid,trim(p_customer_name),p_phone,trim(p_service),p_amount_cents,p_sent_on,coalesce(p_notes,'')) returning id into qid;
 select followup_days into offsets from public.companies where id=cid;
 insert into public.followups(quote_id,company_id,step,due_on)
 select qid,cid,ord::integer,p_sent_on+d from unnest(offsets) with ordinality as t(d,ord);
 else
 select sent_on,status into olddate,oldstatus from public.quotes where id=p_id and company_id=cid for update;
 if not found then raise exception 'not found'; end if;
 if oldstatus in ('won','lost') then raise exception 'closed quote'; end if;
 if olddate <> p_sent_on and exists(select 1 from public.followups where quote_id=p_id and (completed_at is not null or skipped_at is not null)) then raise exception 'cannot reschedule contacted quote'; end if;
 update public.quotes set customer_name=trim(p_customer_name),phone=p_phone,service=trim(p_service),amount_cents=p_amount_cents,sent_on=p_sent_on,notes=coalesce(p_notes,''),updated_at=now() where id=p_id;
 if olddate <> p_sent_on then
 select followup_days into offsets from public.companies where id=cid;
 update public.followups set due_on=p_sent_on+offsets[step] where quote_id=p_id;
 end if;
 qid := p_id;
 end if;
 return qid;
end; $$;

create function public.complete_followup(p_id uuid,p_message text) returns void language plpgsql security definer set search_path = '' as $$
declare f public.followups; q public.quotes; today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
 select * into f from public.followups where id=p_id and company_id=public.my_company_id();
 if not found then raise exception 'not found'; end if;
 select * into q from public.quotes where id=f.quote_id and company_id=public.my_company_id() for update;
 -- reload after the quote lock to make concurrent clicks idempotent.
 select * into f from public.followups where id=p_id;
 if f.completed_at is not null then return; end if;
 if q.status in ('won','lost') or f.skipped_at is not null or f.due_on > today then raise exception 'followup unavailable'; end if;
 if p_message is null or char_length(trim(p_message)) not between 1 and 2000 then raise exception 'invalid message'; end if;
 if exists(select 1 from public.followups where quote_id=q.id and step < f.step and completed_at is null and skipped_at is null) then raise exception 'complete earlier followup first'; end if;
 update public.followups set completed_at=now(),message=trim(p_message) where id=p_id;
 -- an old quote must never demand several messages on the same day.
 update public.followups set skipped_at=now() where quote_id=q.id and id<>p_id and due_on<=today and completed_at is null and skipped_at is null;
 update public.quotes set status='awaiting',updated_at=now() where id=q.id;
end; $$;

create function public.resolve_quote(p_id uuid,p_status text,p_reason text default null,p_note text default null) returns void language plpgsql security definer set search_path = '' as $$
declare q public.quotes;
begin
 select * into q from public.quotes where id=p_id and company_id=public.my_company_id() for update;
 if not found then raise exception 'not found'; end if;
 if p_status not in ('awaiting','won','lost') then raise exception 'invalid status'; end if;
 if q.status=p_status then return; end if;
 if q.status in ('won','lost') then raise exception 'closed quote'; end if;
 if p_status='lost' and (p_reason is null or (p_reason='outro' and coalesce(trim(p_note),'')='')) then raise exception 'loss reason required'; end if;
 update public.quotes set status=p_status,
 loss_reason=case when p_status='lost' then p_reason end,
 loss_note=case when p_status='lost' then p_note end,
 closed_at=case when p_status in ('won','lost') then now() end,
 recovered_cents=case when p_status='won' then amount_cents end,
 updated_at=now() where id=q.id;
end; $$;

create function public.update_company(p_name text) returns void language plpgsql security definer set search_path = '' as $$
begin
 if public.my_company_id() is null then raise exception 'unauthorized'; end if;
 update public.companies set name=trim(p_name) where id=public.my_company_id();
end; $$;

revoke execute on function public.handle_new_user() from public,anon,authenticated;
revoke execute on function public.my_company_id() from public,anon;
revoke execute on function public.create_company(text) from public,anon;
revoke execute on function public.save_quote(text,text,text,integer,date,text,uuid) from public,anon;
revoke execute on function public.complete_followup(uuid,text) from public,anon;
revoke execute on function public.resolve_quote(uuid,text,text,text) from public,anon;
revoke execute on function public.update_company(text) from public,anon;
grant execute on function public.my_company_id(),public.create_company(text),public.save_quote(text,text,text,integer,date,text,uuid),public.complete_followup(uuid,text),public.resolve_quote(uuid,text,text,text),public.update_company(text) to authenticated;
