# Sports Community Frontend

A modern React frontend for Sports and Martial Arts Community platform. The application is inspired by [ClickAndPlay](https://clickandplay.bg/) in design and functionality.

## Features

- User authentication (login/register)
- Club browsing and discovery
- User dashboard
- Club management (for club owners)
- Responsive design for all device sizes

## Technology Stack

- React 18
- React Router v6
- TailwindCSS
- Custom hooks and utilities

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   cd app/frontend-react
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Build for production:
   ```
   npm run build
   ```

## Project Structure

- `src/components/` - React components
- `src/utils/` - Utility functions, including auth helpers
- `src/App.js` - Main application component with routing setup
- `tailwind.config.js` - TailwindCSS configuration

## API Integration

The frontend connects to the following API endpoints:

- `/api/v1/auth/login` - User login
- `/api/v1/auth/register` - User registration
- `/api/v1/clubs` - Get list of clubs
- `/api/v1/clubs/{id}` - Get club details
- `/api/v1/auth/me` - Get current user data

## Authentication

Authentication is handled using JWT tokens stored in both cookies (for API requests) and localStorage (for UI state management). Protected routes require authentication. 