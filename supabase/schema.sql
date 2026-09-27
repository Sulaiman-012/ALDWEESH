-- =====================================================================
-- لوحة صندوق عائلة الدويش — مخطط قاعدة البيانات (Supabase / Postgres)
-- =====================================================================
-- ملاحظة أمنية: الدخول بالاسم + رمز PIN يتم عبر واجهة خادم (API route)
-- فقط، وليس عبر قراءة مباشرة من المتصفح لجدول accounts. لذلك RLS على
-- accounts تمنع القراءة العامة للأعمدة الحساسة (pin_hash) من العميل،
-- وكل القراءة/الكتابة الفعلية تمر عبر service role على الخادم.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- اللجان
-- ---------------------------------------------------------------------
create table committees (
  id text primary key,
  name text not null,
  purpose text default '',
  head_title text default '',
  note text default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- الحسابات (أعضاء العائلة)
-- ---------------------------------------------------------------------
create table accounts (
  id text primary key default ('acc_' || replace(gen_random_uuid()::text, '-', '')),
  name text not null,
  pin_hash text not null,              -- تجزئة الرمز (4 أرقام) — لا يُخزَّن أبدًا كنص صريح
  phone text default '',
  is_admin boolean not null default false,
  is_trustee boolean not null default false,
  is_executive boolean not null default false,
  is_executive_head boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- تفويضات العضو على لجنة معينة (رئيس / سكرتير / عضو)
create table account_grants (
  id bigint generated always as identity primary key,
  account_id text not null references accounts(id) on delete cascade,
  committee_id text not null references committees(id) on delete cascade,
  role text not null check (role in ('head','secretary','member')),
  unique(account_id, committee_id, role)
);

-- ---------------------------------------------------------------------
-- المهام
-- ---------------------------------------------------------------------
create table tasks (
  id text primary key default ('t_' || replace(gen_random_uuid()::text, '-', '')),
  committee_id text not null references committees(id) on delete cascade,
  title text not null,
  assignee text default '',            -- اسم العضو المسند إليه (يُطابق accounts.name)
  assignee_account_id text references accounts(id) on delete set null,
  priority text default 'متوسطة',       -- عالية / متوسطة / منخفضة
  status text not null default 'قيد التنفيذ',
  type text default 'once',            -- once / recurring
  recurrence text default '',
  due_date date,
  note text default '',
  source_minute_id text,               -- إن نشأت من توصية محضر اجتماع
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ---------------------------------------------------------------------
-- محاضر الاجتماعات
-- ---------------------------------------------------------------------
create table minutes (
  id text primary key default ('m_' || replace(gen_random_uuid()::text, '-', '')),
  committee_id text not null references committees(id) on delete cascade,
  meeting_date date not null,
  attendees text default '',
  summary text default '',
  recommendations jsonb not null default '[]',  -- [{text, convertedToTaskId}]
  created_by text default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- بطاقات الأداء (Scorecards)
-- ---------------------------------------------------------------------
create table scorecards (
  id text primary key,
  committee_id text references committees(id) on delete cascade,
  goals jsonb not null default '[]',   -- [{id, title, progress}]
  fields jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- تقييمات اللجان من الإدارة التنفيذية
-- ---------------------------------------------------------------------
create table committee_evaluations (
  id text primary key default ('ev_' || replace(gen_random_uuid()::text, '-', '')),
  committee_id text not null references committees(id) on delete cascade,
  evaluated_by text default '',
  score int check (score between 1 and 10),
  notes text default '',
  period text default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- الأفكار التطويرية
-- ---------------------------------------------------------------------
create table ideas (
  id text primary key default ('idea_' || replace(gen_random_uuid()::text, '-', '')),
  submitted_by text default '',
  submitted_by_account_id text references accounts(id) on delete set null,
  title text not null,
  description text default '',
  status text not null default 'جديدة',   -- جديدة / قيد المراجعة / مقبولة / مرفوضة
  response text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- اللوائح
-- ---------------------------------------------------------------------
create table regulations (
  id text primary key default ('reg_' || replace(gen_random_uuid()::text, '-', '')),
  title text not null,
  body text default '',
  file_url text default '',
  added_by text default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- إشعارات واتساب المُرسَلة (لتفادي التكرار)
-- ---------------------------------------------------------------------
create table notif_sent (
  key text primary key,
  sent_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- فهارس مساعدة
-- ---------------------------------------------------------------------
create index idx_tasks_committee on tasks(committee_id);
create index idx_tasks_assignee on tasks(assignee_account_id);
create index idx_minutes_committee on minutes(committee_id);
create index idx_grants_account on account_grants(account_id);
create index idx_grants_committee on account_grants(committee_id);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
-- التطبيق لا يستخدم Supabase Auth (الدخول بالاسم + PIN عبر خادم Next.js
-- بمفتاح service role الذي يتجاوز RLS). لذلك نغلق كل القراءة/الكتابة من
-- المتصفح مباشرة (anon key) ونجعل كل الوصول يمر عبر API routes الخادم.
alter table committees enable row level security;
alter table accounts enable row level security;
alter table account_grants enable row level security;
alter table tasks enable row level security;
alter table minutes enable row level security;
alter table scorecards enable row level security;
alter table committee_evaluations enable row level security;
alter table ideas enable row level security;
alter table regulations enable row level security;
alter table notif_sent enable row level security;
-- لا توجد سياسات = لا وصول لمفتاح anon إطلاقًا؛ service role يتجاوز RLS دائمًا.
