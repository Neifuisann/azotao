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

// === Test Bank API Endpoints ===

// NEW: Get All Tests (for Test Bank List)
// GET /api/tests
app.get('/api/tests', async (req, res) => {
  try {
    // TODO: Add filtering later (e.g., by user ID, status)
    const tests = await prisma.test.findMany({
      orderBy: { createdAt: 'desc' }, // Show newest first
      // Select only necessary fields for the list view
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        _count: { // Efficiently count related questions
          select: { questions: true }
        }
      }
    });
    res.json({ success: true, data: tests });
  } catch (error) {
    console.error('Error fetching all tests:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// A) Create a Test (Draft)
// POST /api/tests
app.post('/api/tests', async (req, res) => {
  try {
    const { title, questions, status } = req.body;

    if (!title || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ success: false, error: 'Missing title or questions array' });
    }

    const newTest = await prisma.test.create({
      data: {
        title,
        status: status || 'draft',
        questions: {
          create: questions.map(q => ({
            text: q.text,
            choices: {
              create: q.choices.map(c => ({
                text: c.text,
                isCorrect: c.isCorrect || false
              }))
            }
          }))
        }
      },
      include: { questions: { include: { choices: true } } }
    });

    res.status(201).json({ success: true, data: newTest });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// B) Publish a Test (Update from Draft)
// PUT /api/tests/:testId/publish
app.put('/api/tests/:testId/publish', async (req, res) => {
  try {
    const { testId } = req.params;

    const publishedTest = await prisma.test.update({
      where: { id: testId },
      data: { status: 'published' }
    });

    res.json({ success: true, data: publishedTest });
  } catch (error) {
    // Handle potential error if test not found
    if (error.code === 'P2025') { 
      return res.status(404).json({ success: false, error: 'Test not found' });
    }
    console.error('Error publishing test:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// C) Get a Single Test
// GET /api/tests/:testId
app.get('/api/tests/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            choices: true // We need choices to display the test
            // Optionally hide correct answer info for students
            // choices: { select: { id: true, text: true, questionId: true } } 
          }
        }
      }
    });

    if (!test) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }

    res.json({ success: true, data: test });
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// D) Submit Test Answers
// POST /api/tests/:testId/submit
app.post('/api/tests/:testId/submit', async (req, res) => {
  try {
    const { testId } = req.params;
    const { userId, answers } = req.body; 
    // answers expected: [ {questionId, chosenChoiceId}, ... ]

    if (!userId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: 'Missing userId or answers array' });
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: { choices: true } // Need choices to check correctness
        }
      }
    });

    if (!test) {
      return res.status(404).json({ success: false, error: 'Test not found' });
    }

    let correctCount = 0;
    const detailedAnswers = []; // For storing more info in the Submission

    test.questions.forEach((q) => {
      const userAnswer = answers.find(a => a.questionId === q.id);
      const correctChoice = q.choices.find(c => c.isCorrect);
      let isAnswerCorrect = false;

      if (correctChoice && userAnswer?.chosenChoiceId === correctChoice.id) {
        correctCount++;
        isAnswerCorrect = true;
      }
      
      detailedAnswers.push({
          questionId: q.id,
          chosenChoiceId: userAnswer?.chosenChoiceId || null,
          isCorrect: isAnswerCorrect,
          correctChoiceId: correctChoice?.id || null // Store correct choice ID for review
      });
    });

    const totalQuestions = test.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const submission = await prisma.submission.create({
      data: {
        userId: userId, // Make sure this ID exists in your User table if you have relations
        testId: testId,
        score: score,
        answers: detailedAnswers, // Store the detailed structure
      },
    });

    res.json({
      success: true,
      data: {
        submissionId: submission.id,
        correctCount,
        totalQuestions,
        score,
        detailedAnswers // Return detailed answers for immediate feedback
      }
    });
  } catch (error) {
    console.error('Error submitting answers:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// E) Fetch Statistics for a Test
// GET /api/tests/:testId/statistics
app.get('/api/tests/:testId/statistics', async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Ensure the test exists (optional but good practice)
    const testExists = await prisma.test.findUnique({ where: { id: testId } });
    if (!testExists) {
        return res.status(404).json({ success: false, error: 'Test not found' });
    }

    const submissions = await prisma.submission.findMany({
      where: { testId },
      orderBy: { createdAt: 'desc' } // Optional: order by most recent
    });

    const submissionCount = submissions.length;
    const averageScore = submissionCount > 0 
      ? submissions.reduce((sum, s) => sum + s.score, 0) / submissionCount 
      : 0;
    
    // More advanced stats could be calculated here, e.g., per-question success rate
    // For now, just return basic stats and the list of submissions

    res.json({
      success: true,
      data: {
        submissionCount,
        averageScore: Math.round(averageScore), // Round the average score
        submissions // Send all submissions for detailed view on frontend
      }
    });
  } catch (error) {
    console.error('Error fetching test statistics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// === End Test Bank API Endpoints ===

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/auth/login');
  console.log('- POST /api/auth/signup');
  console.log('- GET /api/auth/user');
  console.log('- GET /api/health');
  console.log('- GET /api/tests');
  console.log('- POST /api/tests');
  console.log('- PUT /api/tests/:testId/publish');
  console.log('- GET /api/tests/:testId');
  console.log('- POST /api/tests/:testId/submit');
  console.log('- GET /api/tests/:testId/statistics');
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