-- Actividad 5.1: indicadores mensuales de cobros confirmados y citas completadas.
insert into public.permissions(code, description)
values ('analytics.read', 'Consultar indicadores del negocio')
on conflict (code) do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.code in ('OWNER', 'ADMIN') and p.code = 'analytics.read'
on conflict do nothing;

create function public.dashboard_kpis(p_month date)
returns jsonb
language plpgsql stable security definer
set search_path = '' as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_services numeric;
  v_products numeric;
  v_appointments bigint;
begin
  if not private.sales_operator() or not public.has_permission('analytics.read') then
    raise exception 'Sin permiso para consultar indicadores' using errcode = '42501';
  end if;
  if p_month is null or p_month <> date_trunc('month', p_month)::date then
    raise exception 'Indique el primer día del mes' using errcode = '22023';
  end if;

  v_start := p_month::timestamp at time zone 'America/Lima';
  v_end := (p_month + interval '1 month')::timestamp at time zone 'America/Lima';

  select coalesce(sum(p.amount), 0) into v_services
  from public.payments p
  where p.status = 'PAID' and p.type in ('BALANCE', 'DEPOSIT')
    and p.paid_at >= v_start and p.paid_at < v_end;

  select coalesce(sum(sp.amount), 0) into v_products
  from public.sale_payments sp
  where sp.status = 'PAID' and sp.paid_at >= v_start and sp.paid_at < v_end;

  select count(*) into v_appointments
  from public.appointments a
  where a.status = 'COMPLETED' and a.starts_at >= v_start and a.starts_at < v_end;

  return jsonb_build_object(
    'month', to_char(p_month, 'YYYY-MM'),
    'timezone', 'America/Lima',
    'service_collections', round(v_services, 2)::text,
    'product_collections', round(v_products, 2)::text,
    'total_collections', round(v_services + v_products, 2)::text,
    'completed_appointments', v_appointments
  );
end;
$$;

revoke all on function public.dashboard_kpis(date) from public, anon;
grant execute on function public.dashboard_kpis(date) to authenticated;
