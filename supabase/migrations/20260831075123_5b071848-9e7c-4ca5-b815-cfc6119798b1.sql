
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  brand text not null default '',
  description text,
  specifications jsonb not null default '{}'::jsonb,
  warranty text,
  price numeric not null default 0,
  discount_percent numeric not null default 0,
  stock integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  address text,
  city text,
  pincode text,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null default 0,
  payment_method text not null default 'COD',
  status text not null default 'pending',
  rejection_reason text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  change_qty integer not null,
  reason text,
  created_at timestamptz not null default now()
);

grant select on public.categories, public.products, public.product_images, public.reviews to anon, authenticated;
grant insert on public.customers, public.orders, public.order_items, public.reviews to anon, authenticated;
grant select on public.orders, public.order_items, public.customers, public.inventory_transactions to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images, public.inventory_transactions to authenticated;
grant update, delete on public.reviews, public.orders, public.order_items, public.customers to authenticated;
grant all on public.categories, public.products, public.product_images, public.customers, public.orders, public.order_items, public.reviews, public.inventory_transactions to service_role;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.inventory_transactions enable row level security;

create policy "public read categories" on public.categories for select using (true);
create policy "admin write categories" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "public read products" on public.products for select using (is_active or public.has_role(auth.uid(),'admin'));
create policy "admin write products" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "public read images" on public.product_images for select using (true);
create policy "admin write images" on public.product_images for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "public read visible reviews" on public.reviews for select using (is_visible or public.has_role(auth.uid(),'admin'));
create policy "anyone can review" on public.reviews for insert with check (true);
create policy "admin write reviews" on public.reviews for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "anyone can create customer" on public.customers for insert with check (true);
create policy "admin read customers" on public.customers for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin write customers" on public.customers for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "anyone can create order" on public.orders for insert with check (true);
create policy "read own order by id" on public.orders for select using (true);
create policy "admin write orders" on public.orders for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "anyone can create order items" on public.order_items for insert with check (true);
create policy "read order items" on public.order_items for select using (true);
create policy "admin write order items" on public.order_items for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "admin read inventory" on public.inventory_transactions for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin write inventory" on public.inventory_transactions for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.categories (name, slug) values
 ('Refrigerators','refrigerators'),
 ('Washing Machines','washing-machines'),
 ('Air Conditioners','air-conditioners'),
 ('Televisions','televisions'),
 ('Kitchen Appliances','kitchen-appliances'),
 ('Fans & Coolers','fans-coolers');

insert into public.products (category_id, name, brand, description, specifications, warranty, price, discount_percent, stock, is_featured)
select c.id, v.name, v.brand, v.description, v.specs::jsonb, v.warranty, v.price, v.disc, v.stock, v.feat
from (values
 ('refrigerators','Frost Free Double Door 265L','Samsung','Energy efficient double door refrigerator with digital inverter.','{"Capacity":"265 L","Star Rating":"3 Star","Type":"Frost Free"}','1 year comprehensive, 10 years on compressor',28990,12,8,true),
 ('refrigerators','Single Door 192L','LG','Compact single door fridge ideal for small families.','{"Capacity":"192 L","Star Rating":"4 Star","Type":"Direct Cool"}','1 year comprehensive',16490,8,3,false),
 ('washing-machines','Fully Automatic Front Load 7kg','Bosch','Front load washing machine with 15 wash programs.','{"Capacity":"7 kg","Type":"Front Load","RPM":"1200"}','2 years comprehensive',31990,15,5,true),
 ('washing-machines','Semi Automatic 7.5kg','Whirlpool','Budget friendly semi automatic washer with strong wash.','{"Capacity":"7.5 kg","Type":"Semi Automatic"}','2 years',12490,10,12,false),
 ('air-conditioners','1.5 Ton 5 Star Inverter Split AC','Daikin','Powerful cooling with low power consumption.','{"Capacity":"1.5 Ton","Star Rating":"5 Star","Type":"Inverter Split"}','1 year unit, 10 years compressor',42990,18,4,true),
 ('televisions','43 inch 4K Smart LED TV','Sony','Crisp 4K picture quality with smart apps built in.','{"Screen":"43 inch","Resolution":"4K UHD","Smart":"Yes"}','1 year',37990,20,6,true),
 ('kitchen-appliances','Mixer Grinder 750W','Preethi','Powerful mixer grinder with 4 jars.','{"Power":"750 W","Jars":"4"}','2 years',4490,10,20,false),
 ('kitchen-appliances','Microwave Oven 23L Convection','IFB','Convection microwave with auto cook menus.','{"Capacity":"23 L","Type":"Convection"}','1 year',13990,12,0,false),
 ('fans-coolers','Desert Air Cooler 55L','Symphony','High air delivery desert cooler for large rooms.','{"Capacity":"55 L","Type":"Desert Cooler"}','1 year',10990,15,9,false),
 ('fans-coolers','Ceiling Fan 1200mm','Crompton','Energy saving ceiling fan with high speed.','{"Sweep":"1200 mm","Speed":"380 RPM"}','2 years',1890,5,25,false)
) as v(slug,name,brand,description,specs,warranty,price,disc,stock,feat)
join public.categories c on c.slug = v.slug;
