# Restaurant Admin Dashboard

A comprehensive restaurant management admin application built with React.js, Vite, TypeScript, and Tailwind CSS. Features a modern orange-themed UI with full CRUD operations, authentication, role-based permissions, and detailed analytics.

## Features

### 🎯 Core Features
- **Authentication System**: Secure login with role-based access control
- **Dashboard**: Real-time stats, charts, and quick actions
- **Tables Management**: Complete CRUD for restaurant tables
- **QR Code Generation**: Multiple design templates for table QR codes
- **Order Management**: Create, view, and manage customer orders
- **Menu Management**: Categories and items with image support
- **User Management**: Role-based user administration
- **Reports & Analytics**: Sales reports with interactive charts
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### 🎨 Design Features
- Modern orange-themed UI (#FFB74D, #FF9800, #E65100)
- Gradient backgrounds and smooth animations
- Interactive charts with Recharts
- Mobile-responsive layout
- Loading states and error handling
- Toast notifications for user feedback

### 🔐 Authentication & Roles
- **Super Admin**: Full access to all features
- **Admin**: Access to tables, menu, orders, reports
- **User**: Limited access to orders and dashboard

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Routing**: React Router DOM
- **Charts**: Recharts
- **QR Codes**: qrcode.react
- **Forms**: React Hook Form with Zod validation
- **Icons**: Custom SVG icons
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd restaurant-admin
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Demo Credentials

- **Super Admin**: `super@admin.com` / `admin123`
- **Admin**: `admin@admin.com` / `admin123`
- **User**: `user@admin.com` / `admin123`

## Project Structure

```
src/
├── components/
│   ├── common/          # Shared components (Layout, ProtectedRoute)
│   ├── forms/           # Form components
│   └── ui/              # UI components and icons
├── pages/               # Page components
│   ├── Orders/          # Order-related pages
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Tables.tsx       # Tables management
│   ├── QRCodes.tsx      # QR code generation
│   └── ...
├── store/               # Redux store and slices
│   ├── slices/          # Feature slices
│   └── index.ts         # Store configuration
├── hooks/               # Custom hooks
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── data/                # Mock data
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Features Implementation

### Authentication
- Mock authentication with localStorage
- JWT-like token storage
- Role-based permission system
- Protected routes with access control

### Tables Management
- Full CRUD operations
- Bulk selection and deletion
- Status toggle (Available/Occupied)
- Search and pagination
- Table types: Dining Table, Sofa, Bar Stool, Booth

### QR Code Generation
- 5 design templates: Minimal, Branded, Elegant, Fun, Compact
- Table-specific QR codes
- Print functionality
- QR generation history
- Customizable designs

### Dashboard Analytics
- Real-time statistics with animations
- Interactive charts (Bar, Line, Pie)
- Recent orders table
- Quick action buttons
- Daily and weekly sales data

### State Management
- Redux Toolkit for global state
- Persistent mock data
- Optimistic updates
- Error handling and loading states

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Future Enhancements

- [ ] Real database integration
- [ ] WebSocket for real-time updates
- [ ] Advanced reporting features
- [ ] Multi-restaurant support
- [ ] Mobile app companion
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Advanced user permissions
- [ ] API documentation
- [ ] Unit and integration tests

---

Built with ❤️ using React, TypeScript, and Tailwind CSS