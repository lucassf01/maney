begin;

alter table public.workspaces add column if not exists previous_data jsonb;

create or replace function public.touch_workspace() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.previous_data = old.data;
  new.updated_at = now();
  new.revision = old.revision + 1;
  return new;
end;
$$;

commit;
