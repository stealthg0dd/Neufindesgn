import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

// Import routes
import userRoutes from './routes/user';
import portfolioRoutes from './routes/portfolio';
import alphaRoutes from './routes/alpha';
import stockRoutes from './routes/stocks';
import chatRoutes from './routes/chat';

// Import middleware
import { generalRateLimit } from './middleware/rateLimit';

// Load environment variables
config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

const app = express();
const server = createServer(app);

// Get CORS origins - support multiple origins in production
const getAllowedOrigins = (): string[] => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const origins = [frontendUrl];
  
  // Add additional origins if specified
  if (process.env.ADDITIONAL_ORIGINS) {
    origins.push(...process.env.ADDITIONAL_ORIGINS.split(',').map(o => o.trim()));
  }
  
  return origins;
};

const allowedOrigins = getAllowedOrigins();

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", ...allowedOrigins],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalRateLimit);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Neufin Backend API is running',
    timestamp: new Date(),
    version: '1.0.0',
  });
});

// API routes
app.use('/api/user', userRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/alpha', alphaRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/chat', chatRoutes);

// API documentation endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Neufin Backend API',
    version: '1.0.0',
    endpoints: {
      user: {
        'GET /api/user/profile': 'Get user profile',
        'GET /api/user/settings': 'Get user settings',
        'PUT /api/user/settings': 'Update user settings',
        'DELETE /api/user/account': 'Delete user account',
        'GET /api/user/stats': 'Get user statistics',
      },
      portfolio: {
        'GET /api/portfolio': 'Get all portfolios',
        'POST /api/portfolio': 'Create new portfolio',
        'GET /api/portfolio/:id': 'Get specific portfolio',
        'PUT /api/portfolio/:id': 'Update portfolio',
        'DELETE /api/portfolio/:id': 'Delete portfolio',
        'GET /api/portfolio/:id/performance': 'Get portfolio performance',
      },
      alpha: {
        'GET /api/alpha/score': 'Get alpha score',
        'GET /api/alpha/biases': 'Get bias analyses',
        'POST /api/alpha/biases/detect': 'Run bias detection',
        'GET /api/alpha/signals': 'Get alpha signals',
        'POST /api/alpha/signals/generate': 'Generate alpha signals',
        'GET /api/alpha/insights': 'Get alpha insights',
      },
      stocks: {
        'GET /api/stocks/quote/:symbol': 'Get stock quote',
        'GET /api/stocks/candles/:symbol': 'Get candle data',
        'GET /api/stocks/news': 'Get market news',
        'GET /api/stocks/search': 'Search symbols',
        'POST /api/stocks/quotes': 'Get batch quotes',
        'GET /api/stocks/market/overview': 'Get market overview',
        'GET /api/stocks/fundamentals/:symbol': 'Get stock fundamentals',
      },
      chat: {
        'POST /api/chat/message': 'Send chat message',
        'GET /api/chat/history': 'Get conversation history',
        'DELETE /api/chat/history': 'Clear conversation history',
        'GET /api/chat/insights': 'Get chat insights',
      },
    },
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// WebSocket connection handling
io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id);
  
  // Join user to their personal room for real-time updates
  socket.on('authenticate', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} authenticated for real-time updates`);
  });
  
  // Handle real-time stock price updates
  socket.on('subscribe:stocks', (symbols: string[]) => {
    if (Array.isArray(symbols)) {
      symbols.forEach(symbol => {
        socket.join(`stock:${symbol}`);
      });
      console.log(`Client ${socket.id} subscribed to stocks:`, symbols);
    }
  });
  
  socket.on('unsubscribe:stocks', (symbols: string[]) => {
    if (Array.isArray(symbols)) {
      symbols.forEach(symbol => {
        socket.leave(`stock:${symbol}`);
      });
      console.log(`Client ${socket.id} unsubscribed from stocks:`, symbols);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Neufin Backend API server running on port ${PORT}`);
  console.log(`📚 API documentation available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket server ready for real-time connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
