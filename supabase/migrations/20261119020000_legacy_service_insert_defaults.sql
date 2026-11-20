-- Compatibilidad de inserciones de pruebas y flujos internos que usan precio fijo.
create function private.fill_service_range() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.base_max_price is null then new.base_max_price:=new.base_price; end if;
 return new;
end $$;
create trigger fill_service_range before insert on public.services
 for each row execute function private.fill_service_range();

create function private.fill_service_price_range() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.max_price is null then new.max_price:=new.price; end if;
 return new;
end $$;
create trigger fill_service_price_range before insert on public.service_prices
 for each row execute function private.fill_service_price_range();

create function private.fill_appointment_service_name() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.service_name_snapshot is null then
  select name into new.service_name_snapshot from public.services where id=new.service_id;
 end if;
 return new;
end $$;
create trigger fill_appointment_service_name before insert on public.appointment_items
 for each row execute function private.fill_appointment_service_name();
