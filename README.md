# LifeOS

A comprehensive personal life management system that helps you organize tasks, track goals, manage finances, take notes, and schedule events—all in one place.

## Features

- **🔐 Authentication**: Secure login with email/password, Google, and GitHub OAuth
- **📊 Dashboard**: Overview of your personal productivity metrics and recent activities
- **✅ Task Management**: Create, organize, and track tasks with priorities and due dates
- **🎯 Goal Tracking**: Set goals, monitor progress, and link related tasks
- **📝 Notes**: Rich text note-taking with tags and search functionality
- **💰 Finance Tracking**: Record and categorize income and expenses
- **📅 Event Calendar**: Schedule and manage events with reminders
- **👤 Profile Management**: Customize your profile with avatar upload and timezone settings

## Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **Supabase JS Client** - Database and authentication

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Supabase** - PostgreSQL database and authentication
- **CORS** - Cross-origin resource sharing

## Project Structure

```
LifeOS/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── dashboard/ # Dashboard section components
│   │   │   ├── AuthScreen.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── lib/          # Utility libraries
│   │   ├── App.jsx       # Main app component
│   │   ├── main.jsx      # Entry point
│   │   └── styles.css    # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/               # Express backend API
│   ├── server/
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth and other middleware
│   │   ├── model/        # Data models
│   │   ├── routes/       # API routes
│   │   ├── server.js     # Express server setup
│   │   └── supabaseClient.js
│   └── package.json
│
├── supabase/             # Database schema
│   └── schema.sql        # PostgreSQL schema
│
└── package.json          # Root package configuration
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd LifeOS
   ```

2. Install root dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Install backend dependencies:
   ```bash
   cd ../backend
   npm install
   ```

## Configuration

### Frontend Setup

1. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Backend Setup

1. Create a `.env` file in the `backend/server` directory:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   PORT=3000
   ```

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the schema from `supabase/schema.sql` in your Supabase SQL editor

3. Enable authentication providers:
   - Go to Authentication > Providers
   - Enable Email provider
   - Configure Google OAuth (optional)
   - Configure GitHub OAuth (optional)

4. Configure Row Level Security (RLS) policies as defined in the schema

## Running the Application

### Development Mode

1. Start the backend server:
   ```bash
   cd backend
   node server/server.js
   ```
   The API will run on `http://localhost:3000`

2. In a new terminal, start the frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```
   The app will run on `http://localhost:5173`

### Production Build

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Preview the production build:
   ```bash
   npm run preview
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Profiles
- `GET /api/profiles/:userId` - Get user profile
- `PUT /api/profiles/:userId` - Update user profile
- `POST /api/profiles/:userId/avatar` - Upload avatar

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create a new goal
- `PUT /api/goals/:id` - Update a goal
- `DELETE /api/goals/:id` - Delete a goal

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note

### Finances
- `GET /api/finances` - Get all financial records
- `POST /api/finances` - Create a new financial record
- `PUT /api/finances/:id` - Update a financial record
- `DELETE /api/finances/:id` - Delete a financial record

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create a new event
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event

## Database Schema

The application uses PostgreSQL via Supabase with the following main tables:

- **profiles** - User profile information
- **dashboards** - User dashboard layouts and widgets
- **goals** - User goals with progress tracking
- **tasks** - Task items with priorities and due dates
- **notes** - Notes with tags and content
- **finances** - Income and expense records
- **events** - Calendar events with start/end times

All tables include Row Level Security (RLS) policies to ensure users can only access their own data.

## Security

- Authentication is handled by Supabase Auth
- All API endpoints (except `/api/auth/*`) require authentication
- Row Level Security (RLS) policies enforce data access control at the database level
- CORS is configured to allow requests from the frontend origin
- Passwords are never stored in plain text

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Supabase](https://supabase.com/)
- Icons by [Lucide](https://lucide.dev/)
- Bundled with [Vite](https://vitejs.dev/)

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

---

**Made with ❤️ by the LifeOS Team**
