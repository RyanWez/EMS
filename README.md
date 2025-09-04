# EMS (Employee Management System)

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC)](https://tailwindcss.com/)

A modern, secure, and feature-rich Employee Management System built with Next.js 15, designed to streamline HR operations with role-based access control, real-time analytics, and comprehensive employee data management.

## ✨ Features

### 🔐 Security & Authentication
- **JWT-based Authentication** with automatic 7-day session expiration
- **Role-Based Access Control (RBAC)** with granular permissions
- **Secure Password Hashing** using bcrypt
- **HTTP-only Cookies** for session management
- **Auto-generated Admin Account** on first login

### 📊 Dashboard & Analytics
- **Interactive Dashboard** with animated metrics and charts
- **Real-time Statistics**: Employee count, monthly hires, birthdays, service anniversaries
- **Data Visualization**: Position distribution (bar chart), hiring trends (line chart)
- **Responsive Design** with dark/light theme support

### 👥 Employee Management
- **Full CRUD Operations** for employee records
- **Advanced Search & Filtering** capabilities
- **Comprehensive Data Fields**: Personal info, professional details, service calculations
- **Specialized Views**: Birthday tracker, 6-month service anniversaries
- **CSV Export** functionality
- **Detailed Employee Profiles** with modal views

### 🔧 User & Role Management
- **User Account Administration**: Create, edit, delete accounts
- **Dynamic Role System**: Custom roles with specific permissions
- **Permission Categories**:
  - Dashboard access
  - Employee operations (view, add, edit, delete)
  - User & role management
  - Profile customization
- **Protected Admin Functions** with secure API endpoints

### 🎨 User Experience
- **Modern UI** built with Tailwind CSS and Radix UI
- **Fully Responsive** design for all devices
- **Theme Toggle** (Dark/Light mode)
- **Toast Notifications** for user feedback
- **Loading States** and comprehensive error handling
- **Accessibility Compliant** components

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: MongoDB (Native Driver)
- **Authentication**: JWT, bcrypt
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context API
- **Icons**: Lucide React
- **AI Integration**: Google Generative AI (optional)

## 📋 Prerequisites

- Node.js 18 or higher
- MongoDB database (local or cloud)
- npm, yarn, or pnpm package manager

## 🚀 Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/RyanWez/EMS.git
   cd EMS
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_APP_NAME=EMS
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret_key
   GOOGLE_GENAI_API_KEY=your_google_ai_api_key  # Optional
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   Open [http://localhost:9002](http://localhost:9002) in your browser

## 🔑 Default Credentials

- **Username**: `Admin`
- **Password**: `ems137245`

> **Note**: The admin account is automatically created on first login with full system permissions. Change the password after initial setup for security.

## 📁 Project Structure

```
EMS/
├── src/
│   ├── actions/           # Server actions for data operations
│   ├── ai/               # AI integration and flows
│   ├── app/              # Next.js App Router
│   │   ├── (app)/        # Protected routes
│   │   ├── api/          # API endpoints
│   │   └── login/        # Authentication
│   ├── components/       # Reusable UI components
│   ├── config/          # Application configuration
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   └── lib/             # Utilities and database
├── public/              # Static assets
│   ├── images/          # Icons and favicons
│   └── sw.js           # Service worker
├── docs/               # Documentation
└── package.json        # Dependencies and scripts
```

## 🔒 Permission System

The system implements granular permissions across four main categories:

### Dashboard
- View analytics and metrics
- Access interactive charts

### Employee Management
- View employee lists and details
- Perform CRUD operations
- Access specialized views (birthdays, anniversaries)
- Export data to CSV
- Control field visibility

### User & Role Management
- Administer user accounts
- Create and modify roles
- Assign permissions
- Manage system access levels

### Profile
- Customize global profile images

## ⚙️ Available Scripts

```bash
npm run dev      # Start development server (port 9002)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run typecheck # Run TypeScript checks
```

## 🔧 Key Features Explained

### Auto-Logout Security
- JWT tokens automatically expire after 7 days
- Secure session cleanup on logout
- HTTP-only cookies prevent XSS attacks

### Responsive Dashboard
- Animated counters for key metrics
- Interactive date range selection
- Real-time data updates
- Mobile-optimized interface

### Advanced Employee Tracking
- Automatic service year calculations
- Birthday and anniversary notifications
- Position-based analytics
- Bulk data export capabilities

### Role-Based Security
- Granular permission control
- Protected API endpoints
- Session-based authorization
- Secure admin operations

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support & Contact

For technical support, feature requests, or questions:

- **Developer**: RyanWez
- **Telegram**: [@RyanWez](https://t.me/RyanWez)
- **Repository**: [GitHub](https://github.com/RyanWez/EMS)

---

**EMS** - Empowering HR teams with modern technology, security, and intuitive design.
