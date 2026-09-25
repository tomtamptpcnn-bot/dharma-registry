begin;
alter table public.dharma_recipients
  add column received_time time without time zone
  check (received_time >= time '00:00' and received_time < time '24:00');
comment on column public.dharma_recipients.received_time is
  'Local time of receiving Dharma; optional, entered as HH:mm.';
commit;
