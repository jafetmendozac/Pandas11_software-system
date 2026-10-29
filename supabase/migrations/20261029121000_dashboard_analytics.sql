-- Actividad 5.2: series y rankings agregados del panel.
create function public.dashboard_analytics(p_month date)
returns jsonb
language plpgsql stable security definer
set search_path = '' as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_trend_start timestamptz;
  v_kpis jsonb;
  v_trend jsonb;
  v_services jsonb;
  v_products jsonb;
begin
  if not private.sales_operator() or not public.has_permission('analytics.read') then
    raise exception 'Sin permiso para consultar indicadores' using errcode = '42501';
  end if;
  if p_month is null or p_month <> date_trunc('month', p_month)::date then
    raise exception 'Indique el primer día del mes' using errcode = '22023';
  end if;

  v_start := p_month::timestamp at time zone 'America/Lima';
  v_end := (p_month + interval '1 month')::timestamp at time zone 'America/Lima';
  v_trend_start := (p_month - interval '11 months')::timestamp at time zone 'America/Lima';
  v_kpis := public.dashboard_kpis(p_month);

  with months as (
    select (p_month - (11 - g.n) * interval '1 month')::date as month_start
    from generate_series(0, 11) as g(n)
  ), service_receipts as (
    select date_trunc('month', p.paid_at at time zone 'America/Lima')::date as month_start,
           sum(p.amount) as amount
    from public.payments p
    where p.status = 'PAID' and p.type in ('BALANCE', 'DEPOSIT')
      and p.paid_at >= v_trend_start and p.paid_at < v_end
    group by 1
  ), product_receipts as (
    select date_trunc('month', sp.paid_at at time zone 'America/Lima')::date as month_start,
           sum(sp.amount) as amount
    from public.sale_payments sp
    where sp.status = 'PAID' and sp.paid_at >= v_trend_start and sp.paid_at < v_end
    group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'month', to_char(m.month_start, 'YYYY-MM'),
    'service_collections', round(coalesce(sr.amount, 0), 2)::text,
    'product_collections', round(coalesce(pr.amount, 0), 2)::text
  ) order by m.month_start), '[]'::jsonb)
  into v_trend
  from months m
  left join service_receipts sr using (month_start)
  left join product_receipts pr using (month_start);

  select coalesce(jsonb_agg(jsonb_build_object(
    'service_id', ranked.service_id,
    'name', ranked.name,
    'quantity', ranked.quantity
  ) order by ranked.quantity desc, ranked.service_id), '[]'::jsonb)
  into v_services
  from (
    select i.service_id, s.name, count(*) as quantity
    from public.appointment_items i
    join public.appointments a on a.id = i.appointment_id
    join public.services s on s.id = i.service_id
    where a.status = 'COMPLETED' and a.starts_at >= v_start and a.starts_at < v_end
    group by i.service_id, s.name
    order by quantity desc, i.service_id
    limit 5
  ) ranked;

  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id', ranked.product_id,
    'name', ranked.name,
    'quantity', ranked.quantity
  ) order by ranked.quantity desc, ranked.product_id), '[]'::jsonb)
  into v_products
  from (
    select m.product_id, p.name, sum(-m.delta)::bigint as quantity
    from public.inventory_movements m
    join public.sales sa on sa.id = m.sale_id and sa.status = 'CONFIRMED'
    join public.products p on p.id = m.product_id
    where m.kind = 'SALE' and m.created_at >= v_start and m.created_at < v_end
    group by m.product_id, p.name
    order by quantity desc, m.product_id
    limit 5
  ) ranked;

  return jsonb_build_object(
    'month', to_char(p_month, 'YYYY-MM'),
    'timezone', 'America/Lima',
    'kpis', v_kpis,
    'trend', v_trend,
    'services', v_services,
    'products', v_products
  );
end;
$$;

revoke all on function public.dashboard_analytics(date) from public, anon;
grant execute on function public.dashboard_analytics(date) to authenticated;
