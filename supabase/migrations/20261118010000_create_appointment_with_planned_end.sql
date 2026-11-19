-- Create the reservation and adjust its planned end in one transaction.
-- An unavailable chosen end rolls back the entire new appointment.
create function public.create_internal_appointment_with_planned_end(p_input jsonb,p_ends_local text) returns jsonb
language plpgsql volatile security definer set search_path='' as $$
declare created jsonb;
begin
 created:=public.save_internal_appointment(p_input);
 return public.adjust_appointment_planned_end((created->>'id')::uuid,(created->>'version')::integer,p_ends_local);
end $$;
revoke all on function public.create_internal_appointment_with_planned_end(jsonb,text) from public,anon;
grant execute on function public.create_internal_appointment_with_planned_end(jsonb,text) to authenticated;
notify pgrst, 'reload schema';
