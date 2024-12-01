-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create tables with proper data types and constraints
create table students (
    id uuid primary key default uuid_generate_v4(),
    first_name text not null,
    last_name text not null,
    grade integer not null check (grade between 2 and 6),
    teacher text not null,
    active boolean default true,
    contact1_name text not null,
    contact1_phone text not null,
    contact1_email text not null,
    contact1_relationship text not null,
    contact2_name text,
    contact2_phone text,
    contact2_email text,
    contact2_relationship text,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table attendance_sessions (
    id uuid primary key default uuid_generate_v4(),
    session_date date not null,
    start_time time not null,
    end_time time not null,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table attendance_records (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references students(id) on delete cascade,
    session_id uuid references attendance_sessions(id) on delete cascade,
    check_in_time timestamp with time zone,
    check_out_time timestamp with time zone,
    missed_checkout boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table matches (
    id uuid primary key default uuid_generate_v4(),
    session_id uuid references attendance_sessions(id) on delete cascade,
    player1_id uuid references students(id) on delete cascade,
    player2_id uuid references students(id) on delete cascade,
    result text check (result in ('player1_win', 'player2_win', 'draw', 'incomplete')),
    material_difference integer default 0,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create system configuration table
create table system_config (
    key text primary key,
    value jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create reset audit log table
create table reset_audit_log (
    id uuid primary key default uuid_generate_v4(),
    reset_type text not null check (reset_type in ('tournament', 'session', 'scheduled')),
    initiated_by uuid references auth.users(id),
    status text not null check (status in ('success', 'failed')),
    error_message text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes for better query performance
create index idx_students_active on students(active);
create index idx_students_grade on students(grade);
create index idx_attendance_records_session on attendance_records(session_id);
create index idx_attendance_records_student on attendance_records(student_id);
create index idx_matches_session on matches(session_id);
create index idx_matches_players on matches(player1_id, player2_id);
create index idx_reset_audit_log_type on reset_audit_log(reset_type);
create index idx_system_config_key on system_config(key);

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
alter table students enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;
alter table matches enable row level security;
alter table system_config enable row level security;
alter table reset_audit_log enable row level security;

-- Create a function to check if user is authenticated
create or replace function auth.is_authenticated()
returns boolean as $$
begin
  return (auth.role() = 'authenticated');
end;
$$ language plpgsql security definer;

-- Create policies for all tables
create policy "Allow read access to authenticated users"
  on students for select
  using (auth.is_authenticated());

create policy "Allow insert access to authenticated users"
  on students for insert
  with check (auth.is_authenticated());

create policy "Allow update access to authenticated users"
  on students for update
  using (auth.is_authenticated());

-- Repeat similar policies for other tables
create policy "Allow read access to authenticated users"
  on attendance_sessions for select
  using (auth.is_authenticated());

create policy "Allow insert access to authenticated users"
  on attendance_sessions for insert
  with check (auth.is_authenticated());

create policy "Allow update access to authenticated users"
  on attendance_sessions for update
  using (auth.is_authenticated());

create policy "Allow read access to authenticated users"
  on attendance_records for select
  using (auth.is_authenticated());

create policy "Allow insert access to authenticated users"
  on attendance_records for insert
  with check (auth.is_authenticated());

create policy "Allow update access to authenticated users"
  on attendance_records for update
  using (auth.is_authenticated());

create policy "Allow delete access to authenticated users"
  on attendance_records for delete
  using (auth.is_authenticated());

create policy "Allow read access to authenticated users"
  on matches for select
  using (auth.is_authenticated());

create policy "Allow insert access to authenticated users"
  on matches for insert
  with check (auth.is_authenticated());

create policy "Allow update access to authenticated users"
  on matches for update
  using (auth.is_authenticated());

create policy "Allow read access to authenticated users"
  on system_config for select
  using (auth.is_authenticated());

create policy "Allow update access to authenticated users"
  on system_config for update
  using (auth.is_authenticated());

create policy "Allow read access to authenticated users"
  on reset_audit_log for select
  using (auth.is_authenticated());

create policy "Allow insert access to authenticated users"
  on reset_audit_log for insert
  with check (auth.is_authenticated());

-- Create function for scheduled reset
create or replace function process_scheduled_reset()
returns void as $$
declare
    v_config jsonb;
    v_current_time time;
    v_current_day integer;
    v_session_id uuid;
begin
    -- Get reset configuration
    select value::jsonb into v_config
    from system_config
    where key = 'attendance_reset_schedule';

    -- Check if enabled
    if (v_config->>'enabled')::boolean then
        v_current_time := current_time;
        v_current_day := extract(dow from current_date);

        -- Check if it's time to reset
        if v_current_day = (v_config->>'dayOfWeek')::integer 
           and v_current_time >= (v_config->>'time')::time then
            
            -- Get current session
            select id into v_session_id
            from attendance_sessions
            where session_date = current_date;

            if found then
                -- Clear attendance records for current session
                delete from attendance_records
                where session_id = v_session_id;

                -- Log successful reset
                insert into reset_audit_log (reset_type, status)
                values ('scheduled', 'success');

                -- Update last reset timestamp
                update system_config
                set value = jsonb_set(value, '{lastReset}', to_jsonb(now()::text))
                where key = 'attendance_reset_schedule';
            end if;
        end if;
    end if;
exception when others then
    -- Log failed reset
    insert into reset_audit_log (reset_type, status, error_message)
    values ('scheduled', 'failed', SQLERRM);
end;
$$ language plpgsql security definer;

-- Create function for tournament reset
create or replace function reset_tournament_data()
returns void as $$
begin
    delete from matches;
    
    insert into reset_audit_log (reset_type, initiated_by, status)
    values ('tournament', auth.uid(), 'success');
exception when others then
    insert into reset_audit_log (reset_type, initiated_by, status, error_message)
    values ('tournament', auth.uid(), 'failed', SQLERRM);
    raise;
end;
$$ language plpgsql security definer;

-- Create trigger functions for updated_at timestamps
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for all tables
create trigger set_timestamp before update
  on students
  for each row
  execute function handle_updated_at();

create trigger set_timestamp before update
  on attendance_sessions
  for each row
  execute function handle_updated_at();

create trigger set_timestamp before update
  on attendance_records
  for each row
  execute function handle_updated_at();

create trigger set_timestamp before update
  on matches
  for each row
  execute function handle_updated_at();

create trigger set_timestamp before update
  on system_config
  for each row
  execute