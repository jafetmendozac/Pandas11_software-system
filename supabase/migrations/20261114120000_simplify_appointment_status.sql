-- Mantiene los estados históricos y permite registrar directamente una atención realizada.
create or replace function public.change_appointment_status(p_id uuid,p_target public.appointment_status,p_expected_version integer,p_reason text default null)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare a public.appointments;
begin
 perform private.require_work_permission(case when p_target='CANCELLED' then 'appointments.cancel' else 'appointments.status' end);
 perform private.require_work_permission('appointments.read'); perform private.appointment_lock();
 perform private.require_work_permission(case when p_target='CANCELLED' then 'appointments.cancel' else 'appointments.status' end);
 perform private.require_work_permission('appointments.read');
 select * into strict a from public.appointments where id=p_id for update;
 if a.version is distinct from p_expected_version then raise exception 'La cita cambió. Recarga antes de guardar' using errcode='40001'; end if;
 if p_target is null or not ((a.status='CONFIRMED' and p_target in ('IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW')) or (a.status='IN_PROGRESS' and p_target='COMPLETED')) then raise exception 'Transición de estado no permitida' using errcode='22023'; end if;
 if p_target in ('IN_PROGRESS','NO_SHOW','COMPLETED') and a.starts_at>clock_timestamp() then raise exception 'Todavía no llegó el inicio programado' using errcode='22023'; end if;
 if p_target='CANCELLED' and coalesce(length(btrim(p_reason)),0)=0 then raise exception 'El motivo de cancelación es obligatorio' using errcode='22023'; end if;
 if p_target='IN_PROGRESS' then perform private.validate_appointment(p_id); end if;
 update public.appointments set status=p_target,version=version+1,updated_at=clock_timestamp(),cancelled_at=case when p_target='CANCELLED' then clock_timestamp() end,cancelled_by=case when p_target='CANCELLED' then auth.uid() end,cancel_reason=case when p_target='CANCELLED' then btrim(p_reason) end where id=p_id;
 return private.appointment_json(p_id);
end $$;
