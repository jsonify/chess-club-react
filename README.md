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

### Supabase Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. In your Supabase dashboard, go to the SQL Editor

3. Create a new query and paste the complete SQL setup script (available in `supabase/init.sql` in the repository)
   - This script will:
     - Create all necessary tables with proper constraints
     - Set up indexes for performance optimization
     - Enable Row Level Security (RLS)
     - Create security policies
     - Set up triggers for timestamp management
     - Create useful views for statistics

4. Configure Authentication:
   - Go to Authentication > Settings
   - Enable Email provider
   - Disable Email confirmations for development (optional)
   - Set up any additional auth providers as needed

5. Get Your API Keys:
   - Go to Project Settings > API
   - Copy the `anon` public key and URL
   - Add these to your `.env` file:
     ```
     VITE_SUPABASE_URL=your_project_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

6. Set up Storage Buckets (if needed):
   - Go to Storage
   - Create a new bucket called `avatars` (if you plan to add profile images)
   - Set bucket public/private access as needed

7. Verify Setup:
   - Run the test query:
     ```sql
     select * from students;
     select * from attendance_sessions;
     ```
   - You should see empty tables with the correct structure

8. Optional: Import Sample Data
   - Use the provided `sample_data.sql` script (if available in repository)
   - Or manually add test data through the dashboard

Note: Make sure to regularly backup your database using Supabase's backup features. You can find backup options in Project Settings > Database.

For production deployments, review and possibly modify the RLS policies to match your security requirements.

### Loading Sample Data

To populate your database with sample data for testing:

1. First ensure you've run the initialization script (`init.sql`)
2. Go to the SQL Editor in your Supabase dashboard
3. Open the sample data script (`supabase/sample_data.sql`)
4. Run the script to populate your database with test data

The sample data includes:
- 12 students (10 active, 2 inactive)
- Attendance records for the last 4 club meetings
- Various chess matches with results
- Achievement examples

This data will let you test all features of the application including:
- Attendance tracking
- Tournament management
- Student directory
- Achievement tracking

Note: Running the sample data script multiple times is safe - it will clear existing data before inserting new records.

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