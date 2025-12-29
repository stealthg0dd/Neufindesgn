# Backend API Endpoints - Production Implementation

## Overview
These are the required endpoints to connect frontend and backend for the strategic redesign. All endpoints require JWT authentication via Bearer token.

---

## 1. PORTFOLIO MANAGEMENT

### GET /api/portfolio/check
**Purpose**: Check if user has an existing portfolio (used during OAuth callback)

**Request**:
```bash
GET /api/portfolio/check HTTP/1.1
Authorization: Bearer {accessToken}
```

**Response** (Success - 200):
```json
{
  "hasPortfolio": true,
  "portfolio": {
    "id": "port_123abc",
    "userId": "user_456def",
    "name": "My Portfolio",
    "createdAt": "2025-01-15T10:30:00Z",
    "totalValue": 250000,
    "holdings": [
      {
        "id": "hold_1",
        "ticker": "AAPL",
        "quantity": 100,
        "costBasis": 150,
        "currentPrice": 195,
        "unrealizedGain": 4500
      }
    ]
  }
}
```

**Response** (No Portfolio - 200):
```json
{
  "hasPortfolio": false,
  "portfolio": null
}
```

---

### POST /api/portfolio
**Purpose**: Create a new portfolio for authenticated user

**Request**:
```bash
POST /api/portfolio HTTP/1.1
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "name": "My Portfolio",
  "description": "Primary investment portfolio"
}
```

**Response** (201):
```json
{
  "id": "port_123abc",
  "userId": "user_456def",
  "name": "My Portfolio",
  "description": "Primary investment portfolio",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

---

### GET /api/portfolio/:portfolioId
**Purpose**: Get complete portfolio details with holdings and performance

**Request**:
```bash
GET /api/portfolio/port_123abc HTTP/1.1
Authorization: Bearer {accessToken}
```

**Response** (200):
```json
{
  "id": "port_123abc",
  "userId": "user_456def",
  "name": "My Portfolio",
  "totalValue": 250000,
  "totalCost": 220000,
  "unrealizedGain": 30000,
  "gainPercentage": 13.6,
  "holdings": [...],
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-20T14:22:00Z"
}
```

---

## 2. HOLDINGS MANAGEMENT

### POST /api/holdings
**Purpose**: Add a holding to a portfolio (or bulk add during onboarding)

**Request** (Single):
```bash
POST /api/holdings HTTP/1.1
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "portfolioId": "port_123abc",
  "ticker": "AAPL",
  "quantity": 100,
  "costBasis": 150,
  "purchaseDate": "2024-01-15"
}
```

**Request** (Bulk - for onboarding):
```bash
POST /api/holdings/bulk HTTP/1.1
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "portfolioId": "port_123abc",
  "holdings": [
    { "ticker": "AAPL", "quantity": 100, "costBasis": 150 },
    { "ticker": "MSFT", "quantity": 50, "costBasis": 320 },
    { "ticker": "GOOGL", "quantity": 25, "costBasis": 140 }
  ]
}
```

**Response** (201):
```json
{
  "success": true,
  "created": 3,
  "holdings": [
    {
      "id": "hold_1",
      "portfolioId": "port_123abc",
      "ticker": "AAPL",
      "quantity": 100,
      "costBasis": 150,
      "currentPrice": 195,
      "unrealizedGain": 4500
    }
    // ... more holdings
  ]
}
```

---

### GET /api/holdings/:portfolioId
**Purpose**: Get all holdings for a portfolio with real-time prices

**Request**:
```bash
GET /api/holdings/port_123abc HTTP/1.1
Authorization: Bearer {accessToken}
```

**Response** (200):
```json
{
  "portfolioId": "port_123abc",
  "count": 3,
  "holdings": [
    {
      "id": "hold_1",
      "ticker": "AAPL",
      "quantity": 100,
      "costBasis": 150,
      "currentPrice": 195,
      "change": 45,
      "changePercent": 30,
      "unrealizedGain": 4500,
      "lastUpdated": "2025-01-20T14:22:00Z"
    }
    // ... more holdings
  ]
}
```

---

### PUT /api/holdings/:holdingId
**Purpose**: Update a holding's quantity or cost basis

**Request**:
```bash
PUT /api/holdings/hold_1 HTTP/1.1
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "quantity": 150,
  "costBasis": 155
}
```

**Response** (200):
```json
{
  "id": "hold_1",
  "ticker": "AAPL",
  "quantity": 150,
  "costBasis": 155,
  "currentPrice": 195,
  "unrealizedGain": 6000
}
```

---

### DELETE /api/holdings/:holdingId
**Purpose**: Remove a holding from portfolio

**Request**:
```bash
DELETE /api/holdings/hold_1 HTTP/1.1
Authorization: Bearer {accessToken}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Holding removed"
}
```

---

## 3. ANALYSIS & SCORING

### POST /api/analysis/alpha-score
**Purpose**: Calculate alpha score based on portfolio holdings

**Request**:
```bash
POST /api/analysis/alpha-score HTTP/1.1
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "portfolioId": "port_123abc"
}
```

**Response** (200):
```json
{
  "portfolioId": "port_123abc",
  "alphaScore": 7.3,
  "annualOpportunityCost": 18250,
  "breakdown": {
    "lossAversion": 68,
    "dispositionEffect": 42,
    "herding": 35,
    "anchoringBias": 55,
    "confirmationBias": 48
  },
  "signals": [
    {
      "ticker": "TSLA",
      "direction": "bearish",
      "confidence": 0.85,
      "reason": "Negative sentiment + technical breakdown"
    }
  ],
  "calculatedAt": "2025-01-20T14:22:00Z"
}
```

---

### GET /api/analysis/bias-breakdown/:portfolioId
**Purpose**: Detailed bias analysis for portfolio

**Request**:
```bash
GET /api/analysis/bias-breakdown/port_123abc HTTP/1.1
Authorization: Bearer {accessToken}
```

**Response** (200):
```json
{
  "portfolioId": "port_123abc",
  "biases": [
    {
      "id": "bias_1",
      "type": "Loss Aversion",
      "severity": "high",
      "score": 68,
      "costPerYear": 5200,
      "affectedHoldings": ["TSLA"],
      "recommendation": "Set stop-loss or dollar-cost average out",
      "impact": "You're holding losers 3x longer than winners"
    },
    {
      "id": "bias_2",
      "type": "Disposition Effect",
      "severity": "medium",
      "score": 42,
      "costPerYear": 3800,
      "affectedHoldings": ["NVDA", "MSFT"],
      "recommendation": "Focus on fundamentals, not short-term gains",
      "impact": "Selling winners too early"
    }
  ],
  "totalAnnualCost": 18250
}
```

---

### GET /api/analysis/signals/:portfolioId
**Purpose**: Get AI-generated trading signals for holdings

**Request**:
```bash
GET /api/analysis/signals/port_123abc HTTP/1.1
Authorization: Bearer {accessToken}
```

**Response** (200):
```json
{
  "portfolioId": "port_123abc",
  "signals": [
    {
      "id": "sig_1",
      "ticker": "TSLA",
      "direction": "bearish",
      "confidence": 0.85,
      "timeHorizon": "1-3 months",
      "sources": [
        "technical_bearish_engulfing",
        "sentiment_negative",
        "earnings_miss"
      ],
      "reasoning": "Bearish engulfing pattern confirmed with negative sentiment",
      "recommendation": "SELL",
      "expectedImpact": "+4.2%",
      "timestamp": "2025-01-20T14:22:00Z"
    },
    {
      "id": "sig_2",
      "ticker": "MSFT",
      "direction": "bullish",
      "confidence": 0.72,
      "timeHorizon": "1-2 months",
      "sources": ["sentiment_positive", "earnings_beat", "technicals_support"],
      "recommendation": "HOLD/ACCUMULATE",
      "expectedImpact": "+2.1%",
      "timestamp": "2025-01-20T14:22:00Z"
    }
  ]
}
```

---

### POST /api/analysis/digital-twin
**Purpose**: Run digital twin simulator on portfolio

**Request**:
```bash
POST /api/analysis/digital-twin HTTP/1.1
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "portfolioId": "port_123abc",
  "scenarios": ["baseline", "crash", "stagflation"]
}
```

**Response** (200):
```json
{
  "portfolioId": "port_123abc",
  "yourReturns": -8.4,
  "twinReturns": 4.2,
  "improvement": 12.6,
  "scenarios": [
    {
      "name": "baseline",
      "yourPerformance": -8.4,
      "twinPerformance": 4.2
    },
    {
      "name": "crash",
      "yourPerformance": -22.1,
      "twinPerformance": -4.8
    },
    {
      "name": "stagflation",
      "yourPerformance": -5.2,
      "twinPerformance": 3.1
    }
  ]
}
```

---

## 4. REAL-TIME DATA

### GET /api/data/prices
**Purpose**: Get current prices for list of tickers

**Request**:
```bash
GET /api/data/prices?tickers=AAPL,MSFT,GOOGL HTTP/1.1
Authorization: Bearer {accessToken}
```

**Response** (200):
```json
{
  "prices": [
    {
      "ticker": "AAPL",
      "price": 195.50,
      "change": 2.30,
      "changePercent": 1.19,
      "timestamp": "2025-01-20T14:22:00Z"
    }
  ]
}
```

---

### GET /api/data/sentiment/:ticker
**Purpose**: Get real-time sentiment for a ticker

**Request**:
```bash
GET /api/data/sentiment/AAPL HTTP/1.1
Authorization: Bearer {accessToken}
```

**Response** (200):
```json
{
  "ticker": "AAPL",
  "sentiment": {
    "score": 0.72,
    "label": "positive",
    "sources": 254,
    "news": [
      {
        "headline": "Apple beats Q1 earnings expectations",
        "sentiment": 0.85,
        "source": "Reuters",
        "timestamp": "2025-01-20T12:00:00Z"
      }
    ]
  },
  "timestamp": "2025-01-20T14:22:00Z"
}
```

---

## 5. USER PROFILE

### GET /api/user/profile
**Purpose**: Get authenticated user's profile

**Request**:
```bash
GET /api/user/profile HTTP/1.1
Authorization: Bearer {accessToken}
```

**Response** (200):
```json
{
  "id": "user_456def",
  "email": "user@example.com",
  "name": "John Investor",
  "avatar": "https://...",
  "createdAt": "2025-01-10T10:30:00Z",
  "preferences": {
    "theme": "dark",
    "emailNotifications": true
  }
}
```

---

### PUT /api/user/profile
**Purpose**: Update user profile

**Request**:
```bash
PUT /api/user/profile HTTP/1.1
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "name": "John Investor Updated",
  "preferences": {
    "emailNotifications": false
  }
}
```

**Response** (200):
```json
{
  "id": "user_456def",
  "email": "user@example.com",
  "name": "John Investor Updated"
}
```

---

## 6. ERROR RESPONSES

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have access to this portfolio"
}
```

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid ticker symbol",
  "details": {
    "ticker": "INVALID"
  }
}
```

### 500 Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

---

## Implementation Priority

### Phase 1 (Critical - Required for onboarding):
1. ✅ Portfolio CRUD (/api/portfolio/check, POST /api/portfolio)
2. ✅ Holdings CRUD (/api/holdings)
3. ⏳ Alpha score calculation (/api/analysis/alpha-score)

### Phase 2 (Important - Required for dashboard):
4. ⏳ Bias breakdown analysis (/api/analysis/bias-breakdown)
5. ⏳ Real-time prices (/api/data/prices)
6. ⏳ Trading signals (/api/analysis/signals)

### Phase 3 (Enhancement - For full feature set):
7. ⏳ Digital twin simulator (/api/analysis/digital-twin)
8. ⏳ Sentiment data (/api/data/sentiment)
9. ⏳ User profile endpoints

---

## Authentication

All endpoints require JWT Bearer token in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token obtained from Supabase Auth after OAuth login.

---

## Rate Limiting

- Standard: 100 requests/minute per user
- Analysis endpoints: 10 requests/minute per user
- Real-time data: 60 requests/minute per user

---

## Testing Checklist

- [ ] Portfolio creation works end-to-end
- [ ] Holdings saved to database correctly
- [ ] Alpha score calculated accurately
- [ ] Real-time prices from Finnhub working
- [ ] Sentiment data from OpenAI/NewsAPI working
- [ ] JWT validation working on all endpoints
- [ ] Error responses formatted correctly
- [ ] CORS headers set properly
- [ ] Rate limiting functioning

