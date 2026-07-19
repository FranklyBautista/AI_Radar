create table if not exists public.airadar_runs (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  query text not null,
  language text not null,
  criteria text not null,
  contract_version text not null,
  generated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint airadar_runs_snapshot_unique unique (
    snapshot_date,
    query,
    language,
    criteria,
    contract_version
  )
);

create table if not exists public.airadar_signals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.airadar_runs(id) on delete cascade,
  signal_id text not null,
  title text not null,
  evidence text not null,
  impact text not null,
  action text not null,
  status text not null,
  confidence text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint airadar_signals_run_signal_unique unique (run_id, signal_id),
  constraint airadar_signals_status_check check (
    status in ('nueva', 'activa', 'accionable', 'en-seguimiento', 'en-observacion')
  ),
  constraint airadar_signals_confidence_check check (
    confidence is null or confidence in ('alta', 'media', 'baja')
  )
);

create table if not exists public.airadar_sources (
  id uuid primary key default gen_random_uuid(),
  signal_row_id uuid not null references public.airadar_signals(id) on delete cascade,
  name text not null,
  url text not null,
  publication_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint airadar_sources_signal_url_unique unique (signal_row_id, url),
  constraint airadar_sources_url_required check (length(trim(url)) > 0)
);

create index if not exists airadar_runs_latest_idx
  on public.airadar_runs (snapshot_date desc, updated_at desc);

alter table public.airadar_runs enable row level security;
alter table public.airadar_signals enable row level security;
alter table public.airadar_sources enable row level security;

revoke all on public.airadar_runs from public, anon, authenticated;
revoke all on public.airadar_signals from public, anon, authenticated;
revoke all on public.airadar_sources from public, anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.airadar_runs to service_role;
grant select, insert, update, delete on public.airadar_signals to service_role;
grant select, insert, update, delete on public.airadar_sources to service_role;

-- Guarda un snapshot completo en una sola transacción. PostgREST expone esta
-- función como POST /rest/v1/rpc/save_airadar_snapshot.
create or replace function public.save_airadar_snapshot(snapshot jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  run_row public.airadar_runs;
  signal_row public.airadar_signals;
  signal jsonb;
  source jsonb;
  received integer := 0;
  inserted integer := 0;
  updated integer := 0;
  sources_count integer := 0;
begin
  insert into public.airadar_runs (
    snapshot_date, query, language, criteria, contract_version, generated_at,
    metadata, updated_at
  ) values (
    (snapshot->>'fecha')::date,
    snapshot->'busqueda'->>'consulta',
    snapshot->'busqueda'->>'idioma',
    snapshot->'busqueda'->>'criterio',
    snapshot->>'contract_version',
    nullif(snapshot->>'generado_en', '')::timestamptz,
    jsonb_build_object('source', 'api/signals/save'),
    now()
  ) on conflict (snapshot_date, query, language, criteria, contract_version)
  do update set generated_at = excluded.generated_at, metadata = excluded.metadata,
    updated_at = now()
  returning * into run_row;

  for signal in select value from jsonb_array_elements(snapshot->'senales') loop
    received := received + 1;
    insert into public.airadar_signals (
      run_id, signal_id, title, evidence, impact, action, status, confidence, tags, updated_at
    ) values (
      run_row.id, signal->>'id', signal->>'titulo', signal->>'evidencia',
      signal->>'impacto', signal->>'accion', signal->>'estado',
      nullif(signal->>'confianza', ''),
      coalesce(array(select jsonb_array_elements_text(signal->'etiquetas')), '{}'::text[]),
      now()
    ) on conflict (run_id, signal_id) do update set
      title = excluded.title, evidence = excluded.evidence, impact = excluded.impact,
      action = excluded.action, status = excluded.status, confidence = excluded.confidence,
      tags = excluded.tags, updated_at = now()
    returning * into signal_row;

    if signal_row.created_at = signal_row.updated_at then
      inserted := inserted + 1;
    else
      updated := updated + 1;
    end if;

    source := signal->'fuente';
    insert into public.airadar_sources (
      signal_row_id, name, url, publication_date, updated_at
    ) values (
      signal_row.id, source->>'nombre', source->>'url',
      nullif(source->>'fecha_publicacion', '')::date, now()
    ) on conflict (signal_row_id, url) do update set
      name = excluded.name, publication_date = excluded.publication_date, updated_at = now();
    sources_count := sources_count + 1;
  end loop;

  return jsonb_build_object(
    'run_id', run_row.id, 'received', received, 'inserted', inserted,
    'updated', updated, 'sources', sources_count
  );
end;
$$;

revoke all on function public.save_airadar_snapshot(jsonb) from public, anon, authenticated;
grant execute on function public.save_airadar_snapshot(jsonb) to service_role;
