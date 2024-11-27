-- src/supabase/sample_data.sql

-- Clear existing data (if any)
truncate table matches cascade;
truncate table attendance_records cascade;
truncate table attendance_sessions cascade;
truncate table students cascade;

-- Insert sample students
insert into students (
    first_name, last_name, grade, teacher,
    contact1_name, contact1_phone, contact1_email, contact1_relationship,
    contact2_name, contact2_phone, contact2_email, contact2_relationship,
    active
) values
    ('Emma', 'Smith', 4, 'Chapin', 'Sarah Smith', '(555) 123-4567', 'sarah.smith@email.com', 'Mom', 'John Smith', '(555) 123-4568', 'john.smith@email.com', 'Dad', true),
    ('Noah', 'Johnson', 3, 'Parsons', 'Mary Johnson', '(555) 234-5678', 'mary.johnson@email.com', 'Mom', null, null, null, null, true),
    ('Olivia', 'Williams', 5, 'Larson', 'James Williams', '(555) 345-6789', 'james.williams@email.com', 'Dad', 'Lisa Williams', '(555) 345-6780', 'lisa.williams@email.com', 'Mom', true),
    ('Liam', 'Brown', 4, 'Chapin', 'Patricia Brown', '(555) 456-7890', 'patricia.brown@email.com', 'Mom', null, null, null, null, true),
    ('Ava', 'Jones', 6, 'Unruh', 'Michael Jones', '(555) 567-8901', 'michael.jones@email.com', 'Dad', null, null, null, null, true),
    ('Lucas', 'Garcia', 3, 'Parsons', 'Maria Garcia', '(555) 678-9012', 'maria.garcia@email.com', 'Mom', 'Carlos Garcia', '(555) 678-9013', 'carlos.garcia@email.com', 'Dad', true),
    ('Isabella', 'Miller', 5, 'Larson', 'Robert Miller', '(555) 789-0123', 'robert.miller@email.com', 'Dad', null, null, null, null, true),
    ('Mason', 'Davis', 2, 'Gregerson', 'Jennifer Davis', '(555) 890-1234', 'jennifer.davis@email.com', 'Mom', null, null, null, null, true),
    ('Sophia', 'Rodriguez', 4, 'Chapin', 'David Rodriguez', '(555) 901-2345', 'david.rodriguez@email.com', 'Dad', 'Ana Rodriguez', '(555) 901-2346', 'ana.rodriguez@email.com', 'Mom', true),
    ('Ethan', 'Martinez', 6, 'Unruh', 'Linda Martinez', '(555) 012-3456', 'linda.martinez@email.com', 'Mom', null, null, null, null, true),
    -- Add some inactive students
    ('Jacob', 'Anderson', 5, 'Larson', 'Emily Anderson', '(555) 123-9999', 'emily.anderson@email.com', 'Mom', null, null, null, null, false),
    ('Mia', 'Taylor', 4, 'Chapin', 'William Taylor', '(555) 234-8888', 'william.taylor@email.com', 'Dad', null, null, null, null, false);

-- Insert sample attendance sessions (last 4 Wednesdays)
insert into attendance_sessions (session_date, start_time, end_time, notes)
select 
    date_trunc('week', current_date - interval '7 days' * generate_series(0, 3))::date + interval '3 days' as session_date,
    '15:30'::time as start_time,
    '16:30'::time as end_time,
    'Regular chess club meeting' as notes;

-- Insert sample attendance records
-- Get the session IDs we just created
with sessions as (
    select id, session_date 
    from attendance_sessions 
    order by session_date desc 
    limit 4
)
insert into attendance_records (student_id, session_id, check_in_time, check_out_time, missed_checkout)
select 
    s.id as student_id,
    sess.id as session_id,
    (sess.session_date + '15:30:00'::time)::timestamp + (random() * interval '10 minutes') as check_in_time,
    case 
        when random() > 0.1 then (sess.session_date + '16:30:00'::time)::timestamp + (random() * interval '10 minutes')
        else null 
    end as check_out_time,
    random() > 0.9 as missed_checkout
from students s
cross join sessions sess
where s.active = true
    and random() > 0.2; -- 80% attendance rate

-- Insert sample matches
with active_students as (
    select id from students where active = true
),
student_pairs as (
    select 
        s1.id as player1_id,
        s2.id as player2_id
    from active_students s1
    cross join active_students s2
    where s1.id < s2.id -- Avoid duplicate pairs
),
sessions as (
    select id, session_date
    from attendance_sessions
    order by session_date desc
    limit 4
)
insert into matches (
    session_id,
    player1_id,
    player2_id,
    result,
    material_difference,
    notes
)
select
    s.id as session_id,
    sp.player1_id,
    sp.player2_id,
    (array['player1_win', 'player2_win', 'draw'])[floor(random() * 3 + 1)] as result,
    floor(random() * 10)::integer as material_difference,
    case 
        when random() > 0.7 then 'Great match!'
        when random() > 0.4 then 'Good sportsmanship shown'
        else null 
    end as notes
from student_pairs sp
cross join sessions s
where random() < 0.3; -- Control number of matches per session

-- Add some specific achievements
insert into matches (
    session_id,
    player1_id,
    player2_id,
    result,
    material_difference,
    notes
)
select 
    (select id from attendance_sessions order by session_date desc limit 1),
    (select id from students where first_name = 'Emma' and last_name = 'Smith'),
    (select id from students where first_name = 'Noah' and last_name = 'Johnson'),
    'player1_win',
    5,
    'Emma joins the 5 Point Club!'
where exists (select 1 from students where first_name = 'Emma' and last_name = 'Smith')
  and exists (select 1 from students where first_name = 'Noah' and last_name = 'Johnson');