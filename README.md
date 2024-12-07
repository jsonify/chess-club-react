# Sherwood Elementary Chess Club Manager

A web application for managing elementary school chess clubs, designed to streamline attendance tracking, tournament organization, and student registration.

## Features

- **Attendance Management**
  - Digital check-in/check-out system
  - Real-time attendance tracking with live updates
  - Self-release approval tracking
  - Historical session viewing
  - Pacific Time (PT) synchronization
  - Automated session creation
  - Weekly attendance statistics
  - Configurable automatic reset schedules

- **Tournament System**
  - Match recording and results tracking 
  - Grade-based rankings
  - Overall tournament standings
  - Real-time tournament standings
  - Material difference tracking
  - Match history with detailed results
  - Achievement tracking system including:
    - "5 Point Club"
    - "10 Point Master" 
    - "Social Player" (5+ unique opponents)
    - "Chess Ambassador" (10+ unique opponents)
    - "Active Player" (10+ games)
    - "Chess Champion" (70%+ win rate with 5+ games)

- **Student Management**
  - Digital registration system with validation
  - Comprehensive student directory
  - Multi-contact support for guardians
  - Self-release permission management
  - Contact information management
  - Student notes and history tracking
  - Active/inactive status management
  - Grade and teacher filtering
  - Real-time student updates

- **Administrative Features**
  - Secure admin dashboard
  - Session management tools
  - Historical data access
  - Database reset controls
  - Student data purging tools
  - Tournament data reset capability
  - Automated cleanup scheduling
  - Real-time synchronization status
  - Pacific Time enforcement

## Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- A Supabase account (free tier works fine)
- A Vercel account (free tier works fine)
- Git installed on your local machine

### Database Features

The application now includes:

1. **Self-Release Management**
   - Toggle self-release permissions
   - Track self-release checkouts
   - Permission inheritance
   - Real-time permission updates

2. **Historical Session Access**
   - View past session data
   - Attendance history tracking
   - Session statistics
   - Non-modifiable historical records

3. **Real-Time Updates**
   - Live attendance tracking
   - Instant permission changes
   - Connection status monitoring
   - Automatic data synchronization

4. **Time Management**
   - Pacific Time enforcement
   - Automated session creation
   - Time-based validations
   - Session schedule tracking
   
### Supabase Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. In your Supabase dashboard, go to the SQL Editor

3. Create a new query and paste the complete SQL setup script (available in `supabase/init.sql`)
   - This script will:
     - Create all necessary tables with proper constraints
     - Set up indexes for performance optimization
     - Enable Row Level Security (RLS)
     - Create security policies
     - Set up triggers for timestamp management
     - Create useful views for statistics
     - Initialize reset management system
     - Set up audit logging

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

6. Set up Tables:
   - Students table (personal and contact info)
   - Attendance sessions and records
   - Tournament matches and results
   - System configuration
   - Reset audit logs

7. Verify Setup:
   - Run the test queries provided in the verification section
   - Check table structures and relationships
   - Verify RLS policies are active
   - Test authentication flows

8. Configure Reset Management:
   - System includes automatic and manual reset capabilities
   - Configure through admin interface
   - Set up scheduled resets if needed
   - Test reset functionality with sample data

### Reset Management System

The application includes sophisticated data management features:

1. **Automated Reset Scheduling**
   - Schedule automatic resets for attendance data
   - Configure specific days and times for resets
   - All times are handled in Pacific Time (PT)
   - Track last reset timestamp
   - Email notifications for scheduled resets

2. **Manual Reset Options**
   - Tournament data reset with verification
   - Current session reset capability
   - Protected by math verification challenge
   - Audit trail of reset operations

3. **Safety Features**
   - Two-step verification for critical operations
   - Math challenge verification
   - Confirmation dialogs
   - Detailed logging of reset operations
   - Timezone-aware scheduling

### Development Setup

1. Fork and Clone:
```bash
git clone [your-fork-url]
cd chess-club
```

2. Install Dependencies:
```bash
npm install
```

3. Environment Setup:
```bash
# Create .env file
cp .env.example .env

# Update with your values
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. Local Development:
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment

1. Vercel Setup:
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

2. Environment Variables:
   - Set up in Vercel dashboard:
     - VITE_SUPABASE_URL
     - VITE_SUPABASE_ANON_KEY
   - Enable preview branches if needed
   - Configure custom domain (optional)

### Security Considerations

- Comprehensive authentication using Supabase Auth
- Row Level Security (RLS) policies on all tables
- Protected reset operations with verification
- Audit logging for critical operations
- Secure session management
- Environmental variable protection
- Regular automated backups
- Rate limiting on API endpoints

### Maintenance

1. Regular Tasks:
   - Monitor scheduled resets
   - Review audit logs
   - Backup database
   - Update dependencies
   - Check error logs

2. Seasonal Tasks:
   - Archive old tournament data
   - Update student roster
   - Review system configurations
   - Update teacher lists

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Contribution Guidelines:
- Follow existing code style
- Add tests for new features
- Update documentation
- Test thoroughly

## Project Structure

```
src/
├── components/        # React components
│   ├── attendance/    # Attendance tracking
│   ├── tournaments/   # Tournament management
│   ├── students/      # Student management
│   └── shared/        # Shared components
├── hooks/            # Custom React hooks
├── lib/             # Utility functions
├── pages/           # Route pages
└── styles/          # Global styles
```

## License

MIT License - See LICENSE file for details

## Support

For support:
1. Check documentation
2. Review common issues
3. Open GitHub issue
4. Contact maintainers

## Acknowledgments

- React + Vite for framework
- Supabase for backend
- Vercel for hosting
- TailwindCSS for styling
- Contributors and maintainers
