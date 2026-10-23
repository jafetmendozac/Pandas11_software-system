-- Evitar ambigüedad entre la variable de sesión y el alias de la consulta de cierre.
create or replace function public.close_cash(p_id uuid,p_expected_version integer,p_counted text) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare v_session public.cash_sessions; v_counted numeric; v_expected numeric;
begin
 perform private.require_commercial_permission('cash.close');
 perform private.appointment_lock();
 perform private.require_commercial_permission('cash.close');
 if p_counted is null or p_counted !~ '^[0-9]+([.][0-9]{1,2})?$' then raise exception 'Efectivo contado inválido' using errcode='22023'; end if;
 v_counted:=p_counted::numeric;
 if v_counted>='Infinity'::numeric then raise exception 'Efectivo contado inválido' using errcode='22023'; end if;
 select * into v_session from public.cash_sessions where id=p_id for update;
 if not found then raise exception 'Caja no encontrada' using errcode='22023'; end if;
 perform private.require_commercial_permission('cash.close');
 if v_session.status='CLOSED' and v_session.version=p_expected_version+1 and v_session.closed_by=auth.uid() and v_session.counted_cash=v_counted then
  return private.cash_session_json(v_session.id); end if;
 if v_session.version is distinct from p_expected_version then raise exception 'La caja cambió; recarga' using errcode='40001'; end if;
 if v_session.status<>'OPEN' then raise exception 'Caja ya cerrada' using errcode='22023'; end if;
 select cs.opening_cash+coalesce(sum(m.amount),0) into v_expected from public.cash_sessions cs
 left join public.cash_movements m on m.session_id=cs.id and m.method='CASH' where cs.id=p_id group by cs.id;
 update public.cash_sessions set status='CLOSED',closed_at=clock_timestamp(),closed_by=auth.uid(),
 counted_cash=v_counted,expected_cash=v_expected,difference=v_counted-v_expected,version=version+1 where id=p_id;
 return private.cash_session_json(p_id);
end $$;
