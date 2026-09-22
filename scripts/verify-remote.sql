begin;
select set_config('retoma.test_user_a',gen_random_uuid()::text,true);
select set_config('retoma.test_user_b',gen_random_uuid()::text,true);
insert into auth.users(id,instance_id,aud,role,email,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values (current_setting('retoma.test_user_a')::uuid,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','retoma-qa-a-'||current_setting('retoma.test_user_a')||'@example.invalid','{}','{"name":"qa a"}',now(),now()),
(current_setting('retoma.test_user_b')::uuid,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','retoma-qa-b-'||current_setting('retoma.test_user_b')||'@example.invalid','{}','{"name":"qa b"}',now(),now());
select set_config('request.jwt.claim.sub',current_setting('retoma.test_user_a'),true);
set local role authenticated;
select public.create_company('retoma qa alfa');
select set_config('retoma.test_quote_a',public.save_quote('cliente de teste','5561999999999','polimento',85000,(now() at time zone 'America/Sao_Paulo')::date-1,'')::text,true);
select public.save_quote('cliente editado','5561999999999','polimento técnico',90000,(now() at time zone 'America/Sao_Paulo')::date-1,'edição',current_setting('retoma.test_quote_a')::uuid);
select set_config('retoma.test_followup_a',(select id::text from public.followups where quote_id=current_setting('retoma.test_quote_a')::uuid and step=1),true);
select public.complete_followup(current_setting('retoma.test_followup_a')::uuid,'oi, conseguiu olhar o orçamento?');
select public.complete_followup(current_setting('retoma.test_followup_a')::uuid,'clique repetido');
select public.resolve_quote(current_setting('retoma.test_quote_a')::uuid,'won');
select public.resolve_quote(current_setting('retoma.test_quote_a')::uuid,'won');
do $$ begin
 if (select recovered_cents from public.quotes where id=current_setting('retoma.test_quote_a')::uuid)<>90000 then raise exception 'wrong recovered value'; end if;
 if (select count(*) from public.followups where completed_at is not null)<>1 then raise exception 'duplicate followup'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('retoma.test_user_b'),true);
set local role authenticated;
select public.create_company('retoma qa beta');
do $$ begin
 if exists(select 1 from public.quotes) or exists(select 1 from public.followups) then raise exception 'tenant leak'; end if;
 if exists(select 1 from public.profiles where id=current_setting('retoma.test_user_a')::uuid) then raise exception 'profile leak'; end if;
 begin
 perform public.resolve_quote(current_setting('retoma.test_quote_a')::uuid,'lost','preço');
 raise exception 'unexpected cross tenant mutation';
 exception when others then if sqlerrm<>'not found' then raise; end if; end;
 begin
 update public.quotes set notes='hacked';
 raise exception 'direct write allowed';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('retoma.test_quote_b',public.save_quote('cliente beta','5561999999999','ppf',100000,(now() at time zone 'America/Sao_Paulo')::date,'')::text,true);
select public.resolve_quote(current_setting('retoma.test_quote_b')::uuid,'lost','preço');
do $$ begin
 if not exists(select 1 from public.quotes where status='lost' and loss_reason='preço' and recovered_cents is null) then raise exception 'loss failed'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform 1 from public.quotes; raise exception 'anon read allowed'; exception when insufficient_privilege then null; end;
 begin perform public.create_company('anon'); raise exception 'anon rpc allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'passed: two tenant database isolation, company creation, quote creation/edit, followup idempotency, won idempotency, loss, anon restrictions' as result;
rollback;
