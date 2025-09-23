# Event Check-In Interface

A responsive web application for checking in attendees at community event. Built with vanilla HTML, CSS, and JavaScript.

## Features

- **Responsive Design**: Works on desktop and mobile devices
- **Email Validation**: Built-in email format validation
- **Real-time Feedback**: Immediate validation feedback and loading states
- **API Integration**: Connects to check-in lookup and update endpoints
- **Status Handling**: Handles three main response types:
  - `NOT_FOUND`: Attendee not found
  - `ALREADY_CHECKED_IN`: Attendee already checked in
  - `CAN_CHECK_IN`: Attendee ready to check in

## File Structure

```
├── public/                    # Static files served to browser
│   ├── index.html            # Main HTML file
│   ├── test-responses.html   # Test response examples
│   ├── css/
│   │   └── styles.css        # CSS styling and responsive design
│   └── js/
│       ├── script.js         # Main JavaScript functionality
│       └── config.js         # Client-side configuration fallback
├── src/                      # Server-side source code
│   ├── server.js            # Node.js server for environment variables
│   └── config/
│       └── config.js        # Server-side configuration
├── package.json              # Node.js dependencies and scripts
├── .env.example              # Environment variables template
├── .env                      # Your environment variables (create this)
├── env.production            # Production environment template
├── Dockerfile                # Docker configuration
├── docker-compose.yml        # Docker Compose configuration
├── nginx.conf                # Nginx reverse proxy configuration
├── deploy.sh                 # Deployment script
├── .github/workflows/        # GitHub Actions CI/CD
│   └── deploy.yml            # Deployment workflow
├── .gitignore               # Git ignore rules
└── README.md                # This documentation
```

## Folder Structure Benefits

This project follows web development best practices:

- **`public/`** - Contains all static files that are served directly to the browser
- **`src/`** - Contains server-side source code and configuration
- **Separation of concerns** - Client and server code are clearly separated
- **Scalability** - Easy to add new features, tests, and build processes
- **Security** - Environment variables and server code are isolated from client access
- **Maintainability** - Clear organization makes the codebase easier to understand and modify

## Setup Instructions

### 1. Create Environment File

Create a `.env` file in the project root and add your JWT secret:

```bash
# Copy the example file
cp .env.example .env


### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

### 4. JWT Token Generation (Secure)

JWT tokens are generated securely on the server-side using the `jsonwebtoken` library:

- **JWT_SECRET** never leaves the server
- **Client requests** tokens from `/api/generate-jwt` endpoint
- **Server generates** tokens using the secret from `.env` file
- **No secrets** are exposed to the browser

The `jsonwebtoken` library is already included in the dependencies.

### 5. API Endpoints

The application connects to these endpoints:

- **Lookup**: `POST your-lookup-webhook`
- **Update**: `POST your-update-webhook`

## API Request/Response Format

### Lookup Request
```json
{
    "Email": "user@example.com"
}
```

### Lookup Response Examples

#### NOT_FOUND
```json
{
    "status": "NOT_FOUND",
    "message": "No attendee found with this email address"
}
```

#### ALREADY_CHECKED_IN
```json
{
    "status": "ALREADY_CHECKED_IN",
    "message": "This attendee has already been checked in",
    "attendee": {
        "Name": "John Doe",
        "Email": "john@example.com",
        "CheckInTime": "2024-01-15T10:30:00Z"
    }
}
```

#### CAN_CHECK_IN
```json
{
    "status": "CAN_CHECK_IN",
    "message": "This attendee is ready to be checked in",
    "attendee": {
        "Name": "Jane Smith",
        "Email": "jane@example.com",
        "CheckInTime": null
    }
}
```

### Update Request
```json
{
    "Email": "user@example.com",
    "CheckIn": true,
    "CheckInTime": "2024-01-15T14:30:00.000Z"
}
```

## How It Works

1. **User Input**: User enters an email address
2. **Validation**: Email format is validated in real-time
3. **API Call**: POST request sent to lookup endpoint with JWT authorization
4. **Response Handling**: UI updates based on response status:
   - Red message for NOT_FOUND
   - Orange message for ALREADY_CHECKED_IN
   - Green message for CAN_CHECK_IN with update button
5. **Update Flow**: If CAN_CHECK_IN, user can click "Update Attendee Status" to check them in

## Styling

- **Primary Color**: `#4582ED` (blue)
- **Responsive**: Mobile-first design with breakpoints at 600px and 400px
- **Accessibility**: Proper contrast ratios and keyboard navigation
- **Loading States**: Spinner animation during API calls

## Browser Compatibility

- Modern browsers supporting ES6+ features
- Fetch API support required
- CSS Grid and Flexbox support recommended

## Security Features

### **Secure JWT Implementation**
- **JWT_SECRET** never exposed to browser
- **Server-side token generation** using `jsonwebtoken` library
- **Client requests tokens** from secure endpoint
- **1-hour token expiration** for security

### **Environment Variable Protection**
- **`.env` file** contains sensitive configuration
- **`.gitignore`** prevents accidental commits of secrets
- **Server-only access** to JWT_SECRET

### **Best Practices**
- **Separation of concerns** - client and server code isolated
- **No secrets in public files** - all sensitive data server-side
- **Proper error handling** - no sensitive data in error messages
- **CORS ready** - can be configured for production deployment

## Security Considerations

- JWT secret should be kept secure and not committed to version control
- Consider using environment variables in production
- Implement proper CORS handling on the API endpoints
- Validate all inputs on both client and server side

## Deployment Options

### Docker Deployment (Recommended)

#### Quick Start
```bash
# 1. Clone the repository
git clone <your-repo-url>
cd event-checkin

# 2. Set up environment
cp env.production .env
# Edit .env with your production values

# 3. Deploy with one command
./deploy.sh
```

#### Manual Docker Commands
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Update application
docker-compose pull
docker-compose up -d --remove-orphans
```

#### Docker Features
- **Multi-stage build** for optimized image size
- **Health checks** for container monitoring
- **Nginx reverse proxy** with SSL support
- **Automatic restarts** on failure
- **Persistent logging** with volume mounts

### GitHub Actions CI/CD

#### Setup Requirements
1. **Server with SSH access** - for deployment
2. **GitHub Secrets** - for secure deployment


#### Workflow Features
- **Automated testing** on every push/PR
- **Automatic deployment** to production server
- **Health checks** and rollback on failure
- **Security scanning** and vulnerability checks

### Production Configuration


#### Nginx Configuration
- **Rate limiting** for API endpoints
- **Security headers** for protection
- **Gzip compression** for performance
- **SSL/TLS support** (configure certificates)
- **Health check endpoints**

#### Server Requirements
- **Docker** and **Docker Compose**
- **2GB RAM** minimum (4GB recommended)
- **10GB disk space** for logs and images
- **Port 80/443** for web traffic
- **Port 3000** for direct app access (optional)

### Monitoring & Maintenance

#### Health Checks
```bash
# Application health
curl http://localhost:3000/api/config

# Nginx health
curl http://localhost/health

# Docker container status
docker-compose ps
```

#### Logs
```bash
# Application logs
docker-compose logs -f event-checkin

# All services logs
docker-compose logs -f

# Nginx logs
docker-compose logs -f nginx
```

#### Updates
```bash
# Manual update
git pull
docker-compose build --no-cache
docker-compose up -d

# Or use deployment script
./deploy.sh
```

## Development Notes

- All code is vanilla JavaScript (no frameworks)
- Uses modern CSS features (Grid, Flexbox, Custom Properties)
- Includes comprehensive error handling
- Real-time email validation with user feedback
- Consistent attendee information display across all states
- Production-ready with Docker and CI/CD
