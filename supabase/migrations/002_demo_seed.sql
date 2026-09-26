-- Demo seed for TOP Okno Trenčín (optional — demo mode uses file store)
-- Replace :company_id with a real company UUID when running manually.

/*
update public.companies
set
  name = 'TOP Okno Trenčín s.r.o.',
  subtitle = 'Okná, dvere a doplnky pre bývanie od roku 2013',
  address = 'Zlatovská 22, 911 05 Trenčín',
  ico = '46444254',
  ic_dph = 'SK2820007058',
  email = 'trencin@toptn.sk',
  phone = '0903 590 687',
  website = 'https://toptn.sk',
  primary_color = '#2E5894'
where id = ':company_id';

update public.pricing_settings
set
  price_per_m2_plastove_okna = 280,
  price_per_m2_plastove_dvere = 320,
  price_per_m2_hlinik = 420,
  price_per_m2_interierove_dvere = 180,
  price_per_m2_tieniaca = 120,
  price_per_m2_garazove_brany = 200,
  fixed_fee = 80,
  montaz_per_m2 = 45,
  demontaz_per_unit = 35,
  likvidacia_fee = 60,
  parapet_vnutorny_fee = 25,
  parapet_vonkajsi_fee = 35,
  siete_fee = 40,
  buffer_min_multiplier = 0.92,
  buffer_max_multiplier = 1.12
where company_id = ':company_id';
*/
