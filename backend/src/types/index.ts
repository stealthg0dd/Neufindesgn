export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider?: 'google' | 'email';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  userId: string;
  notifications: {
    email: boolean;
    push: boolean;
    portfolio: boolean;
    news: boolean;
    alphaUpdates: boolean;
  };
  preferences: {
    theme: 'light' | 'dark';
    currency: 'USD' | 'EUR' | 'GBP';
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  };
  updatedAt: Date;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  holdings: PortfolioHolding[];
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  averageCost: number;
  currentPrice?: number;
  value?: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

export interface AlphaSignal {
  id: string;
  userId: string;
  asset: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timeHorizon: 'short' | 'medium' | 'long';
  insight: string;
  sources: number;
  timestamp: Date;
  category: string;
}

export interface BiasAnalysis {
  id: string;
  userId: string;
  biasType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  detectedAt: Date;
}

export interface AlphaScore {
  userId: string;
  score: number;
  improvement: number;
  period: string;
  biasesCorrected: number;
  opportunitiesMissed: number;
  calculatedAt: Date;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  high: number;
  low: number;
  open: number;
  timestamp: Date;
}

export interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  symbols: string[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  response: string;
  timestamp: Date;
  type: 'user' | 'assistant';
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
