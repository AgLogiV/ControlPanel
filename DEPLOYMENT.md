# Deployment Guide for Control Panel

This guide provides instructions for deploying both the client and server components of the Control Panel application.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (for production database)
- A server or hosting platform (e.g., AWS, Heroku, Vercel, Netlify)

## Deploying the Server (Backend)

### Option 1: Traditional VPS/Dedicated Server

1. **Prepare your server**
   - Set up a Linux server (Ubuntu/Debian recommended)
   - Install Node.js, npm, and MongoDB
   - Set up a process manager like PM2
   - Configure Nginx as a reverse proxy (optional but recommended)

2. **Deploy the code**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/control-panel.git
   cd control-panel/server
   
   # Install dependencies
   npm install --production
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your production settings
   nano .env
   ```

3. **Configure environment variables**
   Make sure to set the following in your `.env` file:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb://your-production-mongodb-uri
   JWT_SECRET=your-secure-jwt-secret
   JWT_EXPIRE=30d
   ```

4. **Start the server with PM2**
   ```bash
   # Install PM2 if not already installed
   npm install -g pm2
   
   # Start the server
   pm2 start src/index.js --name control-panel-api
   
   # Make sure it starts on system reboot
   pm2 startup
   pm2 save
   ```

5. **Set up Nginx as a reverse proxy (recommended)**
   ```
   server {
       listen 80;
       server_name api.yourdomainname.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 2: Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create a new Heroku app**
   ```bash
   cd server
   heroku create control-panel-api
   ```

4. **Add MongoDB add-on or configure external MongoDB**
   ```bash
   # Using Heroku add-on
   heroku addons:create mongodb:sandbox
   
   # Or set environment variable for external MongoDB
   heroku config:set MONGO_URI=mongodb://your-production-mongodb-uri
   ```

5. **Set other environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secure-jwt-secret
   heroku config:set JWT_EXPIRE=30d
   ```

6. **Deploy to Heroku**
   ```bash
   git subtree push --prefix server heroku main
   ```

## Deploying the Client (Frontend)

### Option 1: Vercel (Recommended for React apps)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy the client**
   ```bash
   cd client
   vercel
   ```

4. **Configure environment variables**
   - Go to the Vercel dashboard
   - Navigate to your project
   - Go to Settings > Environment Variables
   - Add `VITE_API_URL` pointing to your deployed API

5. **For production deployment**
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Build the client**
   ```bash
   cd client
   npm run build
   ```

4. **Deploy to Netlify**
   ```bash
   netlify deploy --dir=dist
   ```

5. **For production deployment**
   ```bash
   netlify deploy --dir=dist --prod
   ```

### Option 3: Traditional VPS (same as backend)

1. **Build the client**
   ```bash
   cd client
   npm run build
   ```

2. **Configure Nginx to serve the static files**
   ```
   server {
       listen 80;
       server_name yourdomainname.com;
       
       root /path/to/control-panel/client/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## Continuous Integration/Continuous Deployment (CI/CD)

For automated deployments, consider setting up CI/CD pipelines:

1. **GitHub Actions** - Create workflows in `.github/workflows/`
2. **GitLab CI/CD** - Configure in `.gitlab-ci.yml`
3. **Jenkins** - Set up a Jenkinsfile

## SSL Configuration

For production deployments, always secure your application with SSL:

1. **Using Let's Encrypt with Certbot**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomainname.com -d api.yourdomainname.com
   ```

2. **On Heroku, Vercel, or Netlify** - SSL is typically provided automatically

## Monitoring and Logging

Consider setting up:

1. **Server monitoring** - PM2, New Relic, or Datadog
2. **Error tracking** - Sentry
3. **Log management** - ELK Stack or Papertrail

## Backup Strategy

1. **Database backups** - Set up automated MongoDB backups
2. **Application data backups** - Backup any file storage regularly 