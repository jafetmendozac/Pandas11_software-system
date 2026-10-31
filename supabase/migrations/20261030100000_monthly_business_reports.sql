-- Actividad 5.4: reportes agregados sin datos personales.
create function public.monthly_business_reports(p_from date, p_to date)
returns jsonb
language plpgsql stable security definer
set search_path = '' as $$
declare
  v_month date;
  v_start timestamptz;
  v_end timestamptz;
  v_previous timestamptz;
  v_base bigint;
  v_returned bigint;
  v_kpis jsonb;
  v_rows jsonb := '[]'::jsonb;
begin
  if not private.sales_operator() or not public.has_permission('analytics.read') then
    raise exception 'Sin permiso para consultar reportes' using errcode = '42501';
  end if;
  if p_from is null or p_to is null
    or p_from <> date_trunc('month', p_from)::date
    or p_to <> date_trunc('month', p_to)::date
    or p_from > p_to
    or p_to > date_trunc('month', now() at time zone 'America/Lima')::date
    or p_to >= (p_from + interval '12 months')::date then
    raise exception 'Intervalo mensual inválido' using errcode = '22023';
  end if;

  for v_month in select g::date from generate_series(p_from::timestamp, p_to::timestamp, interval '1 month') g loop
    v_previous := (v_month - interval '1 month')::timestamp at time zone 'America/Lima';
    v_start := v_month::timestamp at time zone 'America/Lima';
    v_end := (v_month + interval '1 month')::timestamp at time zone 'America/Lima';
    v_kpis := public.dashboard_kpis(v_month);

    with previous_clients as (
      select distinct a.client_id from public.appointments a
      where a.status = 'COMPLETED' and a.starts_at >= v_previous and a.starts_at < v_start
    ), current_clients as (
      select distinct a.client_id from public.appointments a
      where a.status = 'COMPLETED' and a.starts_at >= v_start and a.starts_at < v_end
    )
    select count(*)::bigint, count(c.client_id)::bigint into v_base, v_returned
    from previous_clients p left join current_clients c using (client_id);

    v_rows := v_rows || jsonb_build_array(jsonb_build_object(
      'month', to_char(v_month, 'YYYY-MM'),
      'service_collections', v_kpis->>'service_collections',
      'product_collections', v_kpis->>'product_collections',
      'total_collections', v_kpis->>'total_collections',
      'completed_appointments', (v_kpis->>'completed_appointments')::bigint,
      'previous_clients', v_base,
      'returning_clients', v_returned,
      'retention_rate', case when v_base = 0 then null
        else round(v_returned::numeric * 100 / v_base, 2)::text end
    ));
  end loop;

  return jsonb_build_object('timezone', 'America/Lima', 'from', to_char(p_from, 'YYYY-MM'),
    'to', to_char(p_to, 'YYYY-MM'), 'rows', v_rows);
end;
$$;

revoke all on function public.monthly_business_reports(date, date) from public, anon;
grant execute on function public.monthly_business_reports(date, date) to authenticated;
