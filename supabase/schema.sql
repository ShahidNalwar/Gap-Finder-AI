-- GapFinder AI schema. Paste into the Supabase SQL editor and run once.
-- Every table has user_id (defaults to the logged-in user) and row-level security.

create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  kind text not null check (kind in ('syllabus','notes','past_paper')),
  created_at timestamptz default now()
);

create table chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  document_id uuid not null references documents on delete cascade,
  content text not null,
  section text,                      -- e.g. "Chapter 1, Section 1.2" or "page 3"
  tsv tsvector generated always as (to_tsvector('english', content)) stored
);
create index chunks_tsv_idx on chunks using gin (tsv);

create table topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  parent_id uuid references topics on delete cascade,
  weight int not null default 1,     -- exam weight = number of mapped past-paper questions (min 1)
  created_at timestamptz default now()
);

create table past_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  document_id uuid references documents on delete cascade,
  text text not null,
  topic_id uuid references topics on delete set null
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  topic_id uuid not null references topics on delete cascade,
  chunk_id uuid not null references chunks on delete cascade,
  question text not null,
  options jsonb not null,            -- ["A text","B text","C text","D text"]
  correct_index int not null check (correct_index between 0 and 3),
  explanation text not null,         -- why the correct answer is right
  misconceptions jsonb not null,     -- per option: why a student might pick it (null for the correct one)
  source_quote text not null,        -- exact sentence from the chunk
  created_at timestamptz default now()
);

create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  created_at timestamptz default now(),
  question_ids uuid[] not null default '{}', -- fixed at the start of each quiz
  submitted_at timestamptz
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  attempt_id uuid not null references attempts on delete restrict,
  question_id uuid not null references questions on delete restrict,
  selected_index int not null check (selected_index between 0 and 3),
  confidence text not null check (confidence in ('sure','guessing')),
  is_correct boolean not null,
  unique (attempt_id, question_id)
);

create table plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  attempt_id uuid references attempts on delete cascade,
  days int not null,
  hours_per_day numeric not null,
  data jsonb not null,               -- ordered items, minutes, tips, change vs previous plan
  created_at timestamptz default now()
);

-- Retrieval: full-text search over the caller's own chunks (RLS applies: security invoker).
-- q is a websearch-style string, e.g. 'photosynthesis or chlorophyll or stomata'.
create or replace function search_chunks(q text, k int default 6, kinds text[] default null)
returns table (id uuid, document_id uuid, content text, section text, kind text, rank real)
language sql stable security invoker as $$
  select c.id, c.document_id, c.content, c.section, d.kind,
         ts_rank(c.tsv, websearch_to_tsquery('english', q)) as rank
  from chunks c
  join documents d on d.id = c.document_id
  where c.tsv @@ websearch_to_tsquery('english', q)
    and (kinds is null or d.kind = any(kinds))
  order by rank desc
  limit k;
$$;

-- Row-level security: each user sees and writes only their own rows.
do $$
declare t text;
begin
  foreach t in array array['documents','chunks','topics','past_questions','questions','attempts','answers','plans']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy own_rows on %I using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
