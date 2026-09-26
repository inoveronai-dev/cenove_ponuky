-- Demo seed for MoveQuote
-- NOTE: Requires an existing auth user. After registering, run the block below
-- replacing DEMO_USER_EMAIL with your account email, OR use the app seed action.
--
-- This file documents the expected demo company + Ján Novák quote shape.
-- Prefer: Dashboard → settings shows editable demo data after signup defaults.
-- For a full seed against a known user, use scripts/seed-demo.ts or the SQL below.

-- Example (run manually after creating auth user):
/*
do $$
declare
  v_user_id uuid;
  v_company_id uuid;
  v_quote_id uuid;
begin
  select id into v_user_id from auth.users where email = 'demo@movequote.sk' limit 1;
  if v_user_id is null then
    raise exception 'Create demo@movequote.sk user first via Auth signup';
  end if;

  select company_id into v_company_id
  from public.company_members
  where user_id = v_user_id
  limit 1;

  update public.companies set
    name = 'Sťahovanie Bez Starostí',
    subtitle = 'Profesionálne sťahovanie domácností a firiem',
    address = 'Priemyselná 12, 821 09 Bratislava',
    ico = '12345678',
    dic = '2023456789',
    ic_dph = 'SK2023456789',
    email = 'info@stahovaniebezstarosti.sk',
    phone = '+421 901 234 567',
    website = 'https://stahovaniebezstarosti.sk',
    primary_color = '#1c1917',
    notification_email = 'demo@movequote.sk'
  where id = v_company_id;

  update public.pricing_settings set
    hourly_rate_per_worker = 38,
    kilometer_rate = 0.65,
    fixed_fee = 90,
    disassembly_surcharge = 70,
    assembly_surcharge = 70,
    packing_surcharge = 80,
    packing_material_surcharge = 40,
    heavy_items_surcharge = 60,
    buffer_min_multiplier = 0.92,
    buffer_max_multiplier = 1.12
  where company_id = v_company_id;

  insert into public.quotes (
    public_id, company_id, created_by, status,
    customer_first_name, customer_last_name, customer_name,
    customer_email, customer_phone,
    origin_address, destination_address, origin_property_type,
    origin_floor, origin_elevator, destination_floor, destination_elevator,
    distance_km, box_count, large_items,
    disassembly, assembly, packing, packing_material, heavy_items,
    move_date, estimated_hours, workers, vehicle_type,
    ai_intro, ai_summary, ai_scope_note,
    labor_amount, transport_amount, extras_amount, base_estimate,
    price_min, price_max, valid_until
  ) values (
    '7K4X2P',
    v_company_id,
    v_user_id,
    'ready',
    'Ján', 'Novák', 'Ján Novák',
    'jan.novak@email.sk', '+421 905 111 222',
    'Bratislava – Ružinov', 'Trnava', '3_izbovy',
    4, true, 2, true,
    55, 35, 'sedačka, posteľ, práčka, 2 skrine',
    true, false, false, false, false,
    '2026-09-28', 6, 3, 'velka_dodavka',
    E'Dobrý deň, pán Novák,\n\nna základe informácií, ktoré ste nám poskytli, sme pre vás pripravili orientačný cenový odhad sťahovania. Cieľom je, aby ste ešte pred realizáciou mali jasnú predstavu o rozsahu služby aj približnej cene.',
    'Počítame so sťahovaním 3-izbového bytu z Bratislavy – Ružinova do Trnavy. Ide približne o 35 krabíc, sedačku, posteľ, práčku a dve skrine. Súčasťou realizácie bude aj demontáž vybraného nábytku.',
    'Cena vychádza z informácií uvedených vyššie. Presná suma závisí od skutočného objemu vecí, prístupnosti oboch adries a reálneho času realizácie.',
    684, 35.75, 70, 879.75,
    810, 990,
    current_date + 14
  )
  on conflict (public_id) do nothing;
end $$;
*/
