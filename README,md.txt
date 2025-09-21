Synapse - Smart Campus Control Platform
A comprehensive platform for students to share, find, and access academic resources including question papers, notes, and study materials.

Architecture
Frontend: React.js with Tailwind CSS
Backend: Node.js with Express.js
Database: MongoDB
Deployment: Render
Features
User authentication and authorization
File upload and download functionality
Advanced search and filtering
Resource categorization
Download statistics
Responsive design
Project Structure
synapse/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   └── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── backend/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── render.yaml
├── README.md
└── .gitignore
Local Development
Prerequisites
Node.js 18+
MongoDB
Git
Backend Setup
bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
Frontend Setup
bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
Environment Variables
Backend (.env)
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/synapse
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
Frontend (.env)
REACT_APP_API_URL=http://localhost:5000/api
Deployment on Render
Method 1: Automatic (Recommended)
Push your code to GitHub
Connect your GitHub repository to Render
Render will automatically use the render.yaml configuration
Set up environment variables in Render dashboard if needed
Method 2: Manual Setup
Create Backend Service:
Type: Web Service
Build Command: cd backend && npm install
Start Command: cd backend && npm start
Environment Variables:
     NODE_ENV=production
     PORT=10000
     MONGODB_URI=<your-mongodb-uri>
     JWT_SECRET=<random-secret>
     FRONTEND_URL=<your-frontend-url>
Create Frontend Service:
Type: Static Site
Build Command: cd frontend && npm install && npm run build
Publish Directory: frontend/build
Environment Variables:
     REACT_APP_API_URL=<your-backend-url>/api
Create MongoDB Database (if using Render's database):
Type: MongoDB
Note the connection string
API Endpoints
Authentication
POST /api/auth/register - User registration
POST /api/auth/login - User login
GET /api/auth/profile - Get user profile (protected)
Resources
GET /api/resources - Get all resources with filtering
POST /api/resources/upload - Upload new resource (protected)
GET /api/resources/:id/download - Download resource
Statistics & Filters
GET /api/stats - Get platform statistics
GET /api/filters - Get available filter options
Git Setup & Deployment
Initialize Git Repository:
bash
   git init
   git add .
   git commit -m "Initial commit: Synapse platform"
   git branch -M main
   git remote add origin https://github.com/yourusername/synapse.git
   git push -u origin main
Connect to Render:
Create account at render.com
Connect your GitHub repository
The render.yaml will handle automatic deployment
Environment Configuration:
Backend will need MongoDB URI and JWT secret
Frontend will automatically use the backend URL from render.yaml
File Structure Notes
Frontend: Complete React application with Tailwind CSS
Backend: Express.js API with file upload capabilities
Database: MongoDB with proper schemas and indexes
Uploads: File storage handled by Multer (10MB limit)
Features Implemented
✅ User registration and login
✅ JWT authentication
✅ File upload (PDF, DOC, DOCX)
✅ Resource search and filtering
✅ Download tracking
✅ Responsive UI
✅ Error handling
✅ Input validation
Contributing
Fork the repository
Create a feature branch (git checkout -b feature/new-feature)
Commit your changes (git commit -m 'Add new feature')
Push to the branch (git push origin feature/new-feature)
Create a Pull Request
License
MIT License - see LICENSE file for details

Support
For deployment issues or questions, check:

Render Documentation
React Documentation
Express.js Documentation
MongoDB Documentation
