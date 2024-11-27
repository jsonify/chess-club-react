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

-- Create indexes for better query performance
create index idx_students_active on students(active);
create index idx_students_grade on students(grade);
create index idx_attendance_records_session on attendance_records(session_id);
create index idx_attendance_records_student on attendance_records(student_id);
create index idx_matches_session on matches(session_id);
create index idx_matches_players on matches(player1_id, player2_id);

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
alter table students enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;
alter table matches enable row level security;

-- Create a function to check if user is authenticated
create or replace function auth.is_authenticated()
returns boolean as $$
begin
  return (auth.role() = 'authenticated');
end;
$$ language plpgsql security definer;

-- Create policies for students table
create policy "Allow read access to authenticated users"
  on students for select
  using (auth.is_authenticated());

create policy "Allow insert access to authenticated users"
  on students for insert
  with check (auth.is_authenticated());

create policy "Allow update access to authenticated users"
  on students for update
  using (auth.is_authenticated());

-- Create policies for attendance_sessions table
create policy "Allow read access to authenticated users"
  on attendance_sessions for select
  using (auth.is_authenticated());

create policy "Allow insert access to authenticated users"
  on attendance_sessions for insert
  with check (auth.is_authenticated());

create policy "Allow update access to authenticated users"
  on attendance_sessions for update
  using (auth.is_authenticated());

-- Create policies for attendance_records table
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

-- Create policies for matches table
create policy "Allow read access to authenticated users"
  on matches for select
  using (auth.is_authenticated());

create policy "Allow insert access to authenticated users"
  on matches for insert
  with check (auth.is_authenticated());

create policy "Allow update access to authenticated users"
  on matches for update
  using (auth.is_authenticated());

-- Create trigger functions for updated_at timestamps
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
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

-- Create view for active students with attendance stats
create view student_attendance_stats as
select 
    s.id,
    s.first_name,
    s.last_name,
    s.grade,
    s.teacher,
    count(distinct ar.session_id) as total_sessions_attended,
    count(distinct case when ar.missed_checkout then ar.session_id end) as missed_checkouts
from students s
left join attendance_records ar on s.id = ar.student_id
where s.active = true
group by s.id, s.first_name, s.last_name, s.grade, s.teacher;

-- Create view for match statistics
create view match_statistics as
select 
    s.id as student_id,
    s.first_name,
    s.last_name,
    count(m.*) as total_matches,
    count(case when 
        (m.player1_id = s.id and m.result = 'player1_win') or
        (m.player2_id = s.id and m.result = 'player2_win')
    then 1 end) as wins,
    count(case when m.result = 'draw' then 1 end) as draws,
    count(distinct case when m.player1_id = s.id then m.player2_id
                       when m.player2_id = s.id then m.player1_id
                  end) as unique_opponents
from students s
left join matches m on s.id = m.player1_id or s.id = m.player2_id
where s.active = true
group by s.id, s.first_name, s.last_name;