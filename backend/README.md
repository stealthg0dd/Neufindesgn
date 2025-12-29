# Neufin Backend API

Backend API for the Neufin financial platform - AI-powered bias detection and trading analytics.

## 🚀 Features

- **User Management**: Profile, settings, authentication via Supabase
- **Portfolio Management**: Create, update, track investment portfolios
- **Bias Detection**: AI-powered cognitive bias analysis and correction
- **Alpha Score**: Quantification of trading performance and bias correction
- **Stock Data**: Real-time quotes, historical data, market news
- **AI Chat**: Intelligent financial assistant with bias-aware insights
- **Real-time Updates**: WebSocket support for live data
- **Rate Limiting**: Comprehensive API protection
- **Caching**: Redis-based performance optimization

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Supabase account (for authentication)
- External API keys (Finnhub, Alpha Vantage, OpenAI)

## 🛠️ Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

4. Set up the database:
   \`\`\`bash
   npm run migrate
   \`\`\`

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## 📡 API Endpoints

### User Management
- \`GET /api/user/profile\` - Get user profile
- \`GET /api/user/settings\` - Get user settings
- \`PUT /api/user/settings\` - Update user settings
- \`DELETE /api/user/account\` - Delete user account
- \`GET /api/user/stats\` - Get user statistics

### Portfolio Management
- \`GET /api/portfolio\` - Get all portfolios
- \`POST /api/portfolio\` - Create new portfolio
- \`GET /api/portfolio/:id\` - Get specific portfolio
- \`PUT /api/portfolio/:id\` - Update portfolio
- \`DELETE /api/portfolio/:id\` - Delete portfolio
- \`GET /api/portfolio/:id/performance\` - Get portfolio performance

### Alpha Score & Bias Analysis
- \`GET /api/alpha/score\` - Get alpha score
- \`GET /api/alpha/biases\` - Get bias analyses
- \`POST /api/alpha/biases/detect\` - Run bias detection
- \`GET /api/alpha/signals\` - Get alpha signals
- \`POST /api/alpha/signals/generate\` - Generate alpha signals
- \`GET /api/alpha/insights\` - Get alpha insights

### Stock Data
- \`GET /api/stocks/quote/:symbol\` - Get stock quote
- \`GET /api/stocks/candles/:symbol\` - Get candle data
- \`GET /api/stocks/news\` - Get market news
- \`GET /api/stocks/search\` - Search symbols
- \`POST /api/stocks/quotes\` - Get batch quotes
- \`GET /api/stocks/market/overview\` - Get market overview
- \`GET /api/stocks/fundamentals/:symbol\` - Get stock fundamentals

### AI Chat
- \`POST /api/chat/message\` - Send chat message
- \`GET /api/chat/history\` - Get conversation history
- \`DELETE /api/chat/history\` - Clear conversation history
- \`GET /api/chat/insights\` - Get chat insights

## 🔐 Authentication

Authentication is handled via Supabase Auth. Include the access token in the Authorization header:

\`\`\`
Authorization: Bearer <your_supabase_access_token>
\`\`\`

## 📊 Database Schema

The backend uses PostgreSQL with the following main tables:
- \`users\` - User profiles
- \`user_settings\` - User preferences and notifications
- \`portfolios\` - Investment portfolios
- \`portfolio_holdings\` - Individual portfolio holdings
- \`bias_analyses\` - Detected cognitive biases
- \`alpha_signals\` - AI-generated trading signals
- \`chat_messages\` - AI chat conversations
- \`watchlists\` - Stock watchlists
- \`alerts\` - Price and event alerts

## 🚦 Rate Limiting

The API implements rate limiting to ensure fair usage:
- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- API endpoints: 60 requests per minute per user

## 🔄 Real-time Updates

WebSocket connections are supported for real-time data:
- Stock price updates
- Portfolio value changes
- Alpha signal notifications
- Bias detection alerts

Connect to: \`ws://localhost:3001\`

## 🧪 Testing

Run the test suite:
\`\`\`bash
npm test
\`\`\`

## 📦 Deployment

### Production Build
\`\`\`bash
npm run build
npm start
\`\`\`

### Environment Variables
See \`.env.example\` for all required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Contact the development team
- Check the API documentation at \`/api\`

## 📈 Performance

- Redis caching for frequently accessed data
- Database connection pooling
- Efficient query optimization
- CDN-ready static assets
- Horizontal scaling support

## 🔒 Security

- JWT token validation
- Rate limiting
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- SQL injection prevention
