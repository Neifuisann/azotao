require('dotenv').config();

// Set environment variables directly if not loaded from .env
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres.skfboquqkcznojtkmpfi:Suicasuicao02@@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  console.log('DATABASE_URL set manually');
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = "postgresql://postgres.skfboquqkcznojtkmpfi:Suicasuicao02@@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";
  console.log('DIRECT_URL set manually');
}

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "b48de3f9b80a8fb6ee6112a5695e7ccb";
  console.log('AUTH_SECRET set manually');
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "zaMJ8e7dak1E935HCjTUNdXWFHJfB6S9E/Q3yAC5h7dowrUHnhgqLrl6FOJw9sMc1nV82GBoRIFSU3QfV4jp5g==";
  console.log('JWT_SECRET set manually');
}

// Debug: Log environment variables
console.log('Environment variables loaded:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set',
  DIRECT_URL: process.env.DIRECT_URL ? 'Set (hidden)' : 'Not set',
  AUTH_SECRET: process.env.AUTH_SECRET ? 'Set (hidden)' : 'Not set',
  JWT_SECRET: process.env.JWT_SECRET ? 'Set (hidden)' : 'Not set'
});

const express = require('express');
const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Initialize Prisma with direct instantiation
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(bodyParser.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    // console.log('Login request received:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Don't send the password to the client
    const { password: _, ...userWithoutPassword } = user;

    //console.log('User logged in successfully:', userWithoutPassword);
    return res.status(200).json({ 
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    //console.log('Signup request received:', req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    //console.log('User created successfully:', { id: newUser.id, email: newUser.email });
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get user endpoint
app.get('/api/auth/user', async (req, res) => {
  try {
    const { id } = req.query;
    //console.log('User info request received for ID:', id);

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        // Don't include the password
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    //console.log('User info retrieved successfully:', user);
    return res.status(200).json({ 
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/auth/login');
  console.log('- POST /api/auth/signup');
  console.log('- GET /api/auth/user');
  console.log('- GET /api/health');
});

// Error handling for Prisma
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('Server shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Server shutting down...');
  await prisma.$disconnect();
  process.exit(0);
}); 