# Sherwood Elementary Chess Club Manager

A web application for managing the Sherwood Elementary School Chess Club, designed to streamline attendance tracking, tournament organization, and student registration.

## About the Club

- **Grades:** 2nd through 6th
- **Schedule:** Wednesdays after school (30 minutes)
- **Season:** November through March (with holiday break)
- **Cost:** Free for all students
- **Experience Level:** All skill levels welcome

## Features

### 1. Attendance Management
- Digital check-in/check-out system
- Real-time attendance tracking
- Historical attendance records
- Automated alerts for missed checkouts
- Weekly attendance statistics

### 2. Tournament System
- Match recording and results tracking
- Student rankings and statistics
- Achievement tracking system including:
  - "5 Point Club"
  - "10 Point Master"
  - "Social Player" (5+ unique opponents)
  - "Chess Ambassador" (10+ unique opponents)
  - "Active Player" (10+ games)
  - "Chess Champion" (70%+ win rate with 5+ games)

### 3. Student Management
- Digital registration system
- Student directory
- Contact information management
- Active/inactive status tracking
- Grade and teacher tracking

## Technical Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router DOM
- Lucide Icons
- Radix UI Components

### Backend
- Supabase
  - PostgreSQL Database
  - Authentication
  - Real-time subscriptions

## Getting Started

### Prerequisites
```bash
node >= 18.0.0
npm >= 8.0.0
```

### Environment Variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Database Schema

### Students
```sql
create table students (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text not null,
  grade integer not null,
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
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### Attendance
```sql
create table attendance_sessions (
  id uuid primary key default uuid_generate_v4(),
  session_date date not null,
  start_time time not null,
  end_time time not null,
  notes text
);

create table attendance_records (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id),
  session_id uuid references attendance_sessions(id),
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  missed_checkout boolean default false
);
```

### Tournaments
```sql
create table matches (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references attendance_sessions(id),
  player1_id uuid references students(id),
  player2_id uuid references students(id),
  result text check (result in ('player1_win', 'player2_win', 'draw', 'incomplete')),
  material_difference integer,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

## Project Structure
```
chess-club/
├── src/
│   ├── components/
│   │   ├── attendance/    # Attendance tracking components
│   │   ├── students/      # Student management components
│   │   ├── tournaments/   # Tournament tracking components
│   │   └── layout/        # Layout components
│   ├── lib/
│   │   ├── supabase.ts    # Supabase client
│   │   └── utils.js       # Helper functions
│   ├── pages/            # Page components
│   └── styles/           # Global styles
└── public/              # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For support or questions, please open an issue in the repository or contact the club administrator.