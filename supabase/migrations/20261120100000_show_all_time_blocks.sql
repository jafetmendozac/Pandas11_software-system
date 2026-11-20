-- La tabla general de ausencias y bloqueos debe mostrar bloqueos globales y personales.
create or replace function public.work_calendar(p_employee_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_work_permission('schedules.read');
 perform private.require_work_permission('time_blocks.read');
 select jsonb_build_object(
  'schedules',coalesce((select jsonb_agg(to_jsonb(s) order by weekday,start_time,id) from public.employee_schedules s where employee_id=p_employee_id),'[]'::jsonb),
  'business',coalesce((select jsonb_agg(to_jsonb(h)||jsonb_build_object('start_time',open_time,'end_time',close_time) order by weekday,open_time,id) from public.business_hours h),'[]'::jsonb),
  'blocks',coalesce((select jsonb_agg(to_jsonb(b)||jsonb_build_object(
    'starts_local',to_char(starts_at at time zone 'America/Lima','YYYY-MM-DD"T"HH24:MI:SS'),
    'ends_local',to_char(ends_at at time zone 'America/Lima','YYYY-MM-DD"T"HH24:MI:SS')) order by starts_at,id)
   from public.time_blocks b where p_employee_id is null or employee_id=p_employee_id or employee_id is null),'[]'::jsonb)) into result;
 return result;
end $$;