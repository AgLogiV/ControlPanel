# Control Panel

A modern web-based control panel for managing servers, scripts, and backups.

## Features

- **User Authentication**: Secure login and registration system with role-based access control
- **Server Management**: Monitor and control your servers with ease
- **Script Management**: Create, edit, and run scripts on your servers
- **Backup Management**: Schedule and manage backups for your servers
- **Admin Panel**: Manage users and monitor system status
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

### Frontend
- React
- TypeScript
- Mantine UI
- React Router
- Axios

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/control-panel.git
   cd control-panel
   ```

2. Install dependencies
   ```bash
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. Set up environment variables
   - Create a `.env` file in the server directory
   - Create a `.env` file in the client directory

4. Start the development servers
   ```bash
   # Start the backend server
   cd server
   npm run dev
   
   # In a new terminal, start the frontend
   cd client
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Deployment

### Docker Deployment (Recommended)

The easiest way to deploy the Control Panel is using Docker:

1. Make sure Docker and Docker Compose are installed on your system
2. Clone the repository and navigate to the project root
3. Run the deployment:
   ```bash
   # Build and start all services
   docker-compose up -d
   ```
4. Access the application:
   - Frontend: http://localhost
   - API: http://localhost:5000

### Manual Deployment

#### Server (Backend)

1. Build the server for production:
   ```bash
   cd server
   npm install --production
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values for production

3. Start the server:
   ```bash
   # Using Node directly
   node src/index.js
   
   # Or using PM2 (recommended for production)
   pm2 start src/index.js --name control-panel-api
   ```

#### Client (Frontend)

1. Build the client for production:
   ```bash
   cd client
   npm install
   npm run build
   ```

2. Deploy the built files:
   - The production-ready files will be in the `dist` directory
   - Serve these files using Nginx, Apache, or any static file server

### Continuous Integration/Deployment

This project includes GitHub Actions workflows for CI/CD. To use them:

1. Push your code to GitHub
2. Configure the necessary secrets in your GitHub repository settings
3. The workflow will automatically test, build, and deploy your application

For more detailed deployment instructions, see the [DEPLOYMENT.md](DEPLOYMENT.md) file.

## Project Structure

```
control-panel/
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   ├── src/                # Source files
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── styles/         # CSS and theme files
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Main App component
│   │   └── main.tsx        # Entry point
│   ├── .env                # Environment variables
│   └── package.json        # Dependencies and scripts
│
├── server/                 # Backend Node.js application
│   ├── src/                # Source files
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── app.js          # Express app
│   ├── .env                # Environment variables
│   └── package.json        # Dependencies and scripts
│
└── README.md               # Project documentation
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Mantine](https://mantine.dev/) - React components library
- [React Router](https://reactrouter.com/) - Routing library for React
- [Axios](https://axios-http.com/) - Promise based HTTP client
- [Express](https://expressjs.com/) - Web framework for Node.js
- [MongoDB](https://www.mongodb.com/) - NoSQL database 