const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/synapse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  college: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Resource Schema
const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String,
    required: true
  },
  college: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Question Paper', 'Notes', 'Solutions', 'Syllabus']
  },
  description: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedByName: {
    type: String,
    required: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better search performance
resourceSchema.index({ title: 'text', subject: 'text', college: 'text' });
resourceSchema.index({ subject: 1, year: 1, college: 1, type: 1 });

const User = mongoose.model('User', userSchema);
const Resource = mongoose.model('Resource', resourceSchema);

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'synapse-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
    }
  }
});

// Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Synapse API is running' });
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, college } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      college: college || ''
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'synapse-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'synapse-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Resources with Filtering and Search
app.get('/api/resources', async (req, res) => {
  try {
    const { search, subject, year, college, type, page = 1, limit = 10 } = req.query;
    
    // Build query
    let query = {};
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filters
    if (subject) query.subject = subject;
    if (year) query.year = year;
    if (college) query.college = college;
    if (type) query.type = type;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const resources = await Resource.find(query)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Resource.countDocuments(query);

    // Format response
    const formattedResources = resources.map(resource => ({
      id: resource._id,
      title: resource.title,
      subject: resource.subject,
      year: resource.year,
      college: resource.college,
      type: resource.type,
      description: resource.description,
      uploadedBy: resource.uploadedByName,
      downloadCount: resource.downloadCount,
      uploadDate: resource.createdAt.toISOString().split('T')[0]
    }));

    res.json({
      resources: formattedResources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Resources fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload Resource
app.post('/api/resources/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { title, subject, year, college, type, description } = req.body;

    // Validation
    if (!title || !subject || !year || !college || !type) {
      return res.status(400).json({ error: 'Title, subject, year, college, and type are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Get user info
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create resource
    const resource = new Resource({
      title,
      subject,
      year,
      college,
      type,
      description: description || '',
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      uploadedBy: user._id,
      uploadedByName: user.name
    });

    await resource.save();

    res.status(201).json({
      message: 'Resource uploaded successfully',
      resource: {
        id: resource._id,
        title: resource.title,
        subject: resource.subject,
        year: resource.year,
        college: resource.college,
        type: resource.type,
        description: resource.description,
        uploadedBy: resource.uploadedByName,
        downloadCount: resource.downloadCount,
        uploadDate: resource.createdAt.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up uploaded file if resource creation failed
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('File cleanup error:', err);
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download Resource
app.get('/api/resources/:id/download', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Check if file exists
    if (!fs.existsSync(resource.filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Increment download count
    resource.downloadCount += 1;
    await resource.save();

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${resource.fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream file to response
    const fileStream = fs.createReadStream(resource.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Resource Statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalResources = await Resource.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalDownloads = await Resource.aggregate([
      { $group: { _id: null, total: { $sum: '$downloadCount' } } }
    ]);

    // Get top subjects
    const topSubjects = await Resource.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get recent uploads
    const recentUploads = await Resource.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title subject uploadedByName createdAt');

    res.json({
      stats: {
        totalResources,
        totalUsers,
        totalDownloads: totalDownloads[0]?.total || 0,
        topSubjects: topSubjects.map(s => ({ subject: s._id, count: s.count })),
        recentUploads: recentUploads.map(r => ({
          title: r.title,
          subject: r.subject,
          uploadedBy: r.uploadedByName,
          uploadDate: r.createdAt.toISOString().split('T')[0]
        }))
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Unique Filter Values
app.get('/api/filters', async (req, res) => {
  try {
    const subjects = await Resource.distinct('subject');
    const years = await Resource.distinct('year');
    const colleges = await Resource.distinct('college');
    const types = await Resource.distinct('type');

    res.json({
      subjects: subjects.sort(),
      years: years.sort((a, b) => b - a),
      colleges: colleges.sort(),
      types: types.sort()
    });
  } catch (error) {
    console.error('Filters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
    }
  }
  
  if (error.message === 'Only PDF, DOC, and DOCX files are allowed') {
    return res.status(400).json({ error: error.message });
  }

  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});