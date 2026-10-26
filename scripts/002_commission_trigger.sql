create or replace function public.calculate_entry_commission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_rate numeric;
  staff_type text;
  staff_tiers jsonb;
  monthly_total numeric;
  applicable_rate numeric;
begin
  select commission_rate, commission_type, tiered_rates
    into staff_rate, staff_type, staff_tiers
  from public.staff_profiles
  where id = new.staff_id and business_id = new.business_id;

  if staff_rate is null then
    raise exception 'Active staff profile not found for entry';
  end if;

  new.commission_rate := staff_rate;
  new.commission_type := staff_type;

  if staff_type = 'flat' then
    new.commission_amount := round(staff_rate, 2);
  elsif staff_type = 'tiered' then
    select coalesce(sum(gross_amount), 0)
      into monthly_total
    from public.entries
    where staff_id = new.staff_id
      and service_date >= date_trunc('month', new.service_date)
      and service_date < date_trunc('month', new.service_date) + interval '1 month'
      and id <> coalesce(new.id, gen_random_uuid())
      and status <> 'rejected';

    select coalesce((tier ->> 'rate')::numeric, staff_rate)
      into applicable_rate
    from jsonb_array_elements(coalesce(staff_tiers, '[]'::jsonb)) tier
    where monthly_total >= coalesce((tier ->> 'min')::numeric, 0)
      and ((tier ->> 'max') is null or monthly_total <= (tier ->> 'max')::numeric)
    order by coalesce((tier ->> 'min')::numeric, 0) desc
    limit 1;

    new.commission_amount := round(new.gross_amount * coalesce(applicable_rate, staff_rate) / 100, 2);
  else
    new.commission_amount := round(new.gross_amount * staff_rate / 100, 2);
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists entries_commission_calc on public.entries;
create trigger entries_commission_calc
before insert or update of staff_id, business_id, gross_amount, service_date, status
on public.entries
for each row execute function public.calculate_entry_commission();
