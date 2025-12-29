import axios from 'axios';
import { redisClient } from '../config/redis';
import { StockQuote, CandleData, NewsItem } from '../types';

export class StockService {
  private finnhubApiKey: string;
  private alphaVantageApiKey: string;

  constructor() {
    this.finnhubApiKey = process.env.FINNHUB_API_KEY!;
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY!;
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    const cacheKey = `quote:${symbol}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }

    try {
      const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
        params: {
          symbol,
          token: this.finnhubApiKey,
        },
      });

      const data = response.data;
      
      if (!data.c || data.c === 0) {
        throw new Error('Invalid stock data received');
      }

      const quote: StockQuote = {
        symbol,
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        volume: this.formatVolume(data.h || 0),
        high: data.h,
        low: data.l,
        open: data.o,
        timestamp: new Date(),
      };

      await redisClient.set(cacheKey, JSON.stringify(quote), 60); // Cache for 1 minute
      
      return quote;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw new Error(`Failed to fetch stock quote for ${symbol}`);
    }
  }

  async getCandleData(symbol: string, interval: string = 'D', startDate?: Date, endDate?: Date): Promise<CandleData[]> {
    const cacheKey = `candles:${symbol}:${interval}:${startDate?.toISOString()}:${endDate?.toISOString()}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }

    try {
      const now = new Date();
      const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const defaultEnd = now;

      const response = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
        params: {
          symbol,
          resolution: interval,
          from: Math.floor((startDate || defaultStart).getTime() / 1000),
          to: Math.floor((endDate || defaultEnd).getTime() / 1000),
          token: this.finnhubApiKey,
        },
      });

      const data = response.data;
      
      if (data.s !== 'ok') {
        throw new Error('Invalid candle data received');
      }

      const candles: CandleData[] = data.t.map((timestamp: number, index: number) => ({
        timestamp: new Date(timestamp * 1000).toISOString(),
        open: data.o[index],
        high: data.h[index],
        low: data.l[index],
        close: data.c[index],
        volume: data.v[index],
      }));

      await redisClient.set(cacheKey, JSON.stringify(candles), 300); // Cache for 5 minutes
      
      return candles;
    } catch (error) {
      console.error(`Error fetching candle data for ${symbol}:`, error);
      throw new Error(`Failed to fetch candle data for ${symbol}`);
    }
  }

  async getMarketNews(category: string = 'general', minId: number = 0): Promise<NewsItem[]> {
    const cacheKey = `news:${category}:${minId}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }

    try {
      const response = await axios.get(`https://finnhub.io/api/v1/news`, {
        params: {
          category,
          minId,
          token: this.finnhubApiKey,
        },
      });

      const newsItems: NewsItem[] = response.data.map((item: any) => ({
        id: item.id.toString(),
        title: item.headline,
        summary: item.summary,
        url: item.url,
        source: item.source,
        publishedAt: new Date(item.datetime * 1000),
        sentiment: this.analyzeSentiment(item.summary),
        relevanceScore: Math.random() * 0.5 + 0.5, // Placeholder for actual relevance scoring
        symbols: this.extractSymbols(item.summary),
      }));

      await redisClient.set(cacheKey, JSON.stringify(newsItems), 600); // Cache for 10 minutes
      
      return newsItems;
    } catch (error) {
      console.error(`Error fetching market news:`, error);
      throw new Error('Failed to fetch market news');
    }
  }

  async searchSymbols(query: string): Promise<any[]> {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/search`, {
        params: {
          q: query,
          token: this.finnhubApiKey,
        },
      });

      return response.data.result || [];
    } catch (error) {
      console.error(`Error searching symbols:`, error);
      throw new Error('Failed to search symbols');
    }
  }

  private formatVolume(volume: number): string {
    if (volume >= 1000000000) {
      return (volume / 1000000000).toFixed(1) + 'B';
    } else if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(1) + 'K';
    }
    return volume.toString();
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    // Simple sentiment analysis - in production, use a proper NLP service
    const positiveWords = ['up', 'rise', 'gain', 'bullish', 'growth', 'profit', 'strong'];
    const negativeWords = ['down', 'fall', 'loss', 'bearish', 'decline', 'weak', 'drop'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractSymbols(text: string): string[] {
    // Simple symbol extraction - look for ticker patterns
    const symbolPattern = /\b[A-Z]{1,5}\b/g;
    const matches = text.match(symbolPattern) || [];
    const commonWords = /^(THE|AND|FOR|ARE|BUT|NOT|YOU|ALL|CAN|HAD|HER|WAS|ONE|OUR|OUT|DAY|GET|HAS|HIM|HIS|HOW|ITS|MAY|NEW|NOW|OLD|SEE|TWO|WAY|WHO|BOY|DID|ITS|LET|PUT|SAY|SHE|TOO|USE)$/;
    return matches.filter(match => 
      !commonWords.test(match)
    );
  }
}

export const stockService = new StockService();
