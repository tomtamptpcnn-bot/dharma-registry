begin;
alter table public.dharma_recipients
  add column received_end_time time without time zone,
  add constraint dharma_recipients_received_time_range_check check (
    received_end_time is null or (
      received_time is not null
      and received_end_time > received_time
      and received_end_time < time '24:00'
    )
  );
comment on column public.dharma_recipients.received_time is
  'Local start time of receiving Dharma; optional, entered as HH:mm.';
comment on column public.dharma_recipients.received_end_time is
  'Local end time of receiving Dharma on the same day; entered as HH:mm.';
commit;
