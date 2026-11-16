-- For projects that already ran schema.sql. Safe to run more than once.
-- Existing answers are retained; duplicate answers must be resolved manually.
begin;
alter table public.attempts
  add column if not exists question_ids uuid[] not null default '{}';

alter table public.answers drop constraint if exists answers_attempt_id_fkey;
alter table public.answers drop constraint if exists answers_question_id_fkey;
alter table public.answers
  add constraint answers_attempt_id_fkey foreign key (attempt_id)
    references public.attempts(id) on delete restrict;
alter table public.answers
  add constraint answers_question_id_fkey foreign key (question_id)
    references public.questions(id) on delete restrict;

create unique index if not exists answers_attempt_question_unique
  on public.answers(attempt_id, question_id);
commit;
