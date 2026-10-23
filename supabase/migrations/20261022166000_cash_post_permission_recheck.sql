-- Si la verificación esperó por una sesión, volver a exigir el permiso antes del ingreso.
create or replace function private.post_verified_payment() returns trigger
language plpgsql volatile security definer set search_path='' as $$
declare v_session uuid;
begin
 if old.status='PENDING' and new.status='PAID' then
  select id into v_session from public.cash_sessions where status='OPEN' for update;
  if v_session is null then raise exception 'Abre caja antes de verificar el cobro' using errcode='22023'; end if;
  if tg_table_name='payments' then
   perform private.require_payment_permission('payments.verify');
   insert into public.cash_movements(session_id,source,method,amount,appointment_payment_id,reason,created_by)
   values(v_session,'APPOINTMENT_PAYMENT',new.method,new.amount,new.id,'Cobro de cita verificado',auth.uid());
  else
   perform private.require_commercial_permission('sale_payments.verify');
   insert into public.cash_movements(session_id,source,method,amount,sale_payment_id,reason,created_by)
   values(v_session,'SALE_PAYMENT',new.method,new.amount,new.id,'Cobro de productos verificado',auth.uid());
  end if;
 end if;
 return new;
end $$;
