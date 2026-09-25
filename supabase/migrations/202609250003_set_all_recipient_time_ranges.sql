begin;

-- Set the requested time range for every existing recipient, replacing prior times.
update public.dharma_recipients
set received_time = time '13:00',
    received_end_time = time '15:00'
where received_time is distinct from time '13:00'
   or received_end_time is distinct from time '15:00';

commit;
