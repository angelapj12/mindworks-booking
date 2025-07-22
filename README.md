# MindBody Clone - Class Booking Platform

A comprehensive class booking platform for education companies, built with React, TypeScript, and Supabase. This application provides a complete solution for managing classes, instructors, and student bookings with real-time functionality.

## 🚀 Live Demo

**Live Application**: [View Demo](https://cc0u2iluoo.space.minimax.io)

**Demo Accounts:**
- **Student**: student@demo.com / password123
- **Admin**: admin@demo.com / password123

## ✨ Features

### Public Features (No Authentication Required)
- 📚 Browse all available classes with detailed information
- 👨‍🏫 View instructor profiles and specialties
- 🔍 Search and filter classes by date, time, instructor, or type
- 📱 Fully responsive design for all devices

### Student Features
- 🔐 Secure user registration and authentication
- ⚡ Real-time class booking with capacity checking
- 💳 Mock credit purchase system with realistic payment flow
- 💰 Credit balance management and transaction history
- 📅 Personal booking dashboard with upcoming classes
- ❌ Class cancellation and rebooking capabilities

### Admin Features
- 🎯 Complete class management (add, edit, delete)
- 👥 Instructor profile management
- 📊 Real-time enrollment monitoring dashboard
- 💵 Manual credit adjustments for students
- 📈 User management and booking analytics
- ⏰ Class scheduling with capacity control

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **UI Components**: Radix UI, Custom components
- **Build Tool**: Vite
- **Deployment**: Vercel/Netlify compatible

## 🏗️ Architecture

### Frontend Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, etc.)
│   ├── BookingModal.tsx
│   ├── CreditPurchaseModal.tsx
│   └── ...
├── pages/              # Main application pages
├── contexts/           # React Context providers
├── lib/               # Utilities and configurations
└── hooks/             # Custom React hooks
```

### Backend Structure (Supabase)
```
supabase/
├── tables/            # Database schema definitions
├── functions/         # Edge Functions for business logic
└── migrations/        # Database migrations
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-github-repo-url>
   cd mindworks-booking
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Run the SQL scripts in `supabase/tables/` to create the database schema
   - Run the migrations in `supabase/migrations/`
   - Deploy the edge functions in `supabase/functions/`

5. **Start the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📊 Database Schema

### Core Tables
- **profiles**: User accounts and roles
- **instructors**: Instructor information and specialties
- **class_types**: Types of classes offered
- **class_schedules**: Scheduled class sessions
- **bookings**: Student class bookings
- **credit_transactions**: Credit purchase and usage history

### Key Features
- Row Level Security (RLS) for data protection
- Real-time subscriptions for live updates
- Proper foreign key relationships
- Optimized queries for performance

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Enable Authentication with email/password
3. Set up the database schema using provided SQL files
4. Deploy edge functions for business logic
5. Configure Row Level Security policies

### Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🧪 Testing

The application includes comprehensive testing for:
- User authentication flows
- Class booking workflows  
- Admin management features
- Mock payment processing
- Real-time updates

### Demo Data
- Sample classes with images and descriptions
- Demo instructor profiles
- Test student and admin accounts
- Mock credit transactions

## 🎨 Design System

### Brand Colors
- **Primary**: #051235 (Dark Blue) - Authority and trust
- **Secondary**: #FFA726 (Orange) - Energy and motivation  
- **Accent**: #D0E7FF (Light Blue) - Accessibility and calm

### Components
- Consistent typography and spacing
- Accessible color contrast ratios
- Mobile-first responsive design
- Professional UI/UX patterns

## 🚀 Deployment

### Build for Production
```bash
pnpm build
# or
npm run build
```

### Deploy to Vercel
```bash
npx vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## 📝 API Documentation

### Edge Functions
- `book-class`: Process class bookings
- `purchase-credits`: Handle mock credit purchases
- `manage-credits`: Admin credit management
- `manage-class-types`: Class type CRUD operations
- `manage-instructors`: Instructor management
- `manage-class-schedules`: Schedule management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include screenshots and error messages if applicable

## 🗺️ Roadmap

### Future Enhancements
- [ ] Real Stripe payment integration
- [ ] Email notifications and reminders
- [ ] Advanced reporting and analytics
- [ ] Mobile app development
- [ ] Multi-location support
- [ ] Waiting list functionality
- [ ] Package deals and memberships

## ⭐ Acknowledgments

- Built with love using modern web technologies
- Inspired by professional class booking platforms
- Designed for education companies of all sizes

---

**Made with ❤️ by MiniMax Agent**
