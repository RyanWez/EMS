# EMS (Employee Management System)

A comprehensive Employee Management System built with Next.js, featuring secure authentication, role-based access control, and advanced employee data management capabilities.

## 🚀 Features

### 🔐 Authentication & Security
- **Secure JWT Authentication** with 7-day auto-logout
- **Role-based Access Control (RBAC)** with granular permissions
- **Password Encryption** using bcrypt
- **Session Management** with HTTP-only cookies
- **Auto-generated Admin Account** with full system access

### 📊 Dashboard & Analytics
- **Interactive Dashboard** with animated statistics
- **Real-time Employee Metrics**:
  - Total employee count
  - New hires this month
  - Birthday celebrations
  - 6-month service anniversaries
- **Visual Charts**:
  - Employee distribution by position (Bar Chart)
  - New hires over time (Monthly/Yearly view)
- **Responsive Design** with dark/light theme support

### 👥 Employee Management
- **Complete Employee CRUD Operations**
- **Advanced Employee Listing** with search and filtering
- **Employee Data Fields**:
  - Personal information (Name, DOB, Gender, Phone, NRC)
  - Professional details (Position, Join Date, Address)
  - Calculated service years
- **Special Views**:
  - Birthday tracking page
  - 6+ months service employees page
- **Data Export** to CSV format
- **Employee Details Modal** with comprehensive information

### 🔧 User & Role Management
- **User Account Management**:
  - Create, edit, delete user accounts
  - Username and role assignment
  - Protected admin account
- **Role Management System**:
  - Create custom roles with specific permissions
  - Edit role names and permissions
  - Delete unused roles
- **Granular Permissions** across 4 categories:
  - Dashboard access
  - Employee management operations
  - User & role administration
  - Profile management

### 🎨 User Interface
- **Modern UI** with Tailwind CSS and Radix UI components
- **Responsive Design** for all device sizes
- **Dark/Light Theme Toggle**
- **Toast Notifications** for user feedback
- **Loading States** and error handling
- **Accessibility Compliant** forms and navigation

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Authentication**: JWT, bcrypt
- **Database**: MongoDB with native driver
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Context API
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB database
- npm or yarn package manager

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ems
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_APP_NAME=EMS
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GOOGLE_GENAI_API_KEY=your_google_ai_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:9002](http://localhost:9002) in your browser

## 🔑 Default Login Credentials

- **Username**: `Admin`
- **Password**: `ems137245`

*Note: The Admin account is automatically created on first login with full system permissions.*

## 📁 Project Structure

```
src/
├── actions/           # Server actions for data operations
├── app/              # Next.js app router pages
│   ├── (app)/        # Protected app routes
│   │   ├── dashboard/
│   │   ├── employee-management/
│   │   └── user-management/
│   ├── api/          # API routes
│   └── login/        # Authentication pages
├── components/       # Reusable UI components
├── config/          # Application configuration
├── contexts/        # React context providers
├── hooks/           # Custom React hooks
└── lib/             # Utility functions and database
```

## 🔒 Permission System

The system includes 4 main permission categories:

### Dashboard
- View dashboard overview and analytics

### Employee Management
- View employee lists and details
- Add, edit, delete employee records
- Access birthday and service anniversary pages
- Export employee data
- Control field visibility (position, gender, DOB, etc.)

### User & Role Management
- Manage user accounts and roles
- Create and modify permission sets
- Control system access levels

### Profile
- Change global profile images

## 🚀 Available Scripts

- `npm run dev` - Start development server on port 9002
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## 🔧 Key Features in Detail

### Auto-Logout Security
- JWT tokens expire after 7 days
- Automatic session cleanup
- Secure cookie management

### Responsive Dashboard
- Animated number counters
- Interactive date navigation
- Real-time data updates
- Mobile-optimized layout

### Advanced Employee Tracking
- Service anniversary calculations
- Birthday reminders
- Position-based analytics
- Export capabilities

### Role-Based Security
- Granular permission control
- Protected admin functions
- Secure API endpoints
- Session-based authorization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For technical support or questions, please contact the development team. => [RyanWez](https://t.me/RyanWez)

---

**EMS** - Streamlining employee management with modern technology and security.
