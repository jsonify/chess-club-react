# Sherwood Elementary Chess Club Manager

A web application for managing elementary school chess clubs, designed to streamline attendance tracking, tournament organization, and student registration.

## Features

- **Attendance Management**
  - Digital check-in/check-out system
  - Real-time attendance tracking
  - Historical attendance records
  - Automated alerts for missed checkouts
  - Weekly attendance statistics

- **Tournament System**
  - Match recording and results tracking 
  - Student rankings and statistics
  - Achievement tracking system including:
    - "5 Point Club"
    - "10 Point Master" 
    - "Social Player" (5+ unique opponents)
    - "Chess Ambassador" (10+ unique opponents)
    - "Active Player" (10+ games)
    - "Chess Champion" (70%+ win rate with 5+ games)

- **Student Management**
  - Digital registration system
  - Student directory
  - Contact information management
  - Active/inactive status tracking
  - Grade and teacher tracking

## Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- A Supabase account (free tier works fine)
- A Vercel account (free tier works fine)
- Git installed on your local machine

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Set up the database tables using the following SQL commands in the Supabase SQL editor:

```sql
-- Students table
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

-- Attendance tables
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

-- Tournament table
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

3. In your Supabase project settings, find your project URL and anon key under "API Settings"

### Application Setup

1. Fork the repository
```bash
git clone [your-fork-url]
cd chess-club
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the project root with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Update club configuration:
- Navigate to `src/config/clubConfig.js` (if it doesn't exist, create it)
- Update the configuration to match your club's details:

```javascript
export const clubConfig = {
  clubName: "Your School Chess Club",
  meetingDay: "Wednesday", // or your preferred day
  meetingTime: "3:30 PM",
  grades: [2, 3, 4, 5, 6], // adjust grade range
  seasonMonths: {
    start: "November",
    end: "March"
  }
};
```

### Vercel Setup and Deployment

1. Create a Vercel account at [vercel.com](https://vercel.com)

2. Install the Vercel CLI
```bash
npm i -g vercel
```

3. Login to Vercel via CLI
```bash
vercel login
```

4. Initialize Vercel in your project (if not already initialized)
```bash
vercel init
```

5. Deploy to Vercel
```bash
vercel
```

6. Configure environment variables in Vercel:
   - Go to your project in the Vercel dashboard
   - Navigate to Settings > Environment Variables
   - Add the following variables:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

7. Set up automatic deployments (optional):
   - Connect your GitHub repository to Vercel
   - Enable automatic deployments in the Vercel dashboard
   - Configure branch deployments as needed

8. Configure custom domain (optional):
   - Go to Settings > Domains in your Vercel project
   - Add your custom domain
   - Follow the DNS configuration instructions

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Security Considerations

- The application uses Supabase Authentication for admin access
- Make sure to set up Row Level Security (RLS) policies in Supabase
- Never commit your `.env` file or expose your Supabase credentials
- Regularly review user access and permissions
- Set up proper authentication rules in Vercel for production deployments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For support, please open an issue in the repository.