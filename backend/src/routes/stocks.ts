import { Router, Response } from 'express';
import { optionalAuthentication } from '../middleware/auth';
import { validateQuery, querySchemas } from '../middleware/validation';
import { apiRateLimit, generalRateLimit } from '../middleware/rateLimit';
import { stockService } from '../services/stockService';
import { ApiResponse, StockQuote, CandleData, NewsItem } from '../types';

const router = Router();

// Get stock quote
router.get('/quote/:symbol', 
  optionalAuthentication, 
  generalRateLimit,
  async (req: any, res: Response) => {
    try {
      const { symbol } = req.params;
      const quote = await stockService.getQuote(symbol.toUpperCase());
      
      const response: ApiResponse<StockQuote> = {
        success: true,
        data: quote,
      };
      
      res.json(response);
    } catch (error) {
      console.error(`Error fetching quote for ${req.params.symbol}:`, error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stock quote',
      };
      res.status(500).json(response);
    }
  }
);

// Get candle data
router.get('/candles/:symbol', 
  optionalAuthentication, 
  generalRateLimit,
  validateQuery(querySchemas.stockData),
  async (req: any, res: Response) => {
    try {
      const { symbol } = req.params;
      const { interval, start, end } = req.query;
      
      const startDate = start ? new Date(start as string) : undefined;
      const endDate = end ? new Date(end as string) : undefined;
      
      const candleData = await stockService.getCandleData(
        symbol.toUpperCase(), 
        interval as string, 
        startDate, 
        endDate
      );
      
      const response: ApiResponse<CandleData[]> = {
        success: true,
        data: candleData,
      };
      
      res.json(response);
    } catch (error) {
      console.error(`Error fetching candle data for ${req.params.symbol}:`, error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch candle data',
      };
      res.status(500).json(response);
    }
  }
);

// Get market news
router.get('/news', 
  optionalAuthentication, 
  generalRateLimit,
  async (req: any, res: Response) => {
    try {
      const { category = 'general', minId = 0 } = req.query;
      
      const news = await stockService.getMarketNews(category as string, Number(minId));
      
      const response: ApiResponse<NewsItem[]> = {
        success: true,
        data: news,
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching market news:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch market news',
      };
      res.status(500).json(response);
    }
  }
);

// Search symbols
router.get('/search', 
  optionalAuthentication, 
  generalRateLimit,
  async (req: any, res: Response) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        const response: ApiResponse = {
          success: false,
          error: 'Search query is required',
        };
        return res.status(400).json(response);
      }
      
      const results = await stockService.searchSymbols(q);
      
      const response: ApiResponse = {
        success: true,
        data: { results },
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error searching symbols:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search symbols',
      };
      res.status(500).json(response);
    }
  }
);

// Get multiple quotes (batch)
router.post('/quotes', 
  optionalAuthentication, 
  apiRateLimit,
  async (req: any, res: Response) => {
    try {
      const { symbols } = req.body;
      
      if (!Array.isArray(symbols) || symbols.length === 0) {
        const response: ApiResponse = {
          success: false,
          error: 'Symbols array is required',
        };
        return res.status(400).json(response);
      }
      
      if (symbols.length > 50) {
        const response: ApiResponse = {
          success: false,
          error: 'Maximum 50 symbols allowed per request',
        };
        return res.status(400).json(response);
      }
      
      // Fetch quotes in parallel
      const quotePromises = symbols.map(symbol => 
        stockService.getQuote(symbol.toUpperCase()).catch(error => ({
          symbol,
          error: error.message,
        }))
      );
      
      const results = await Promise.all(quotePromises);
      
      // Separate successful and failed quotes
      const quotes = [];
      const errors = [];
      
      for (const result of results) {
        if (result instanceof Error || 'error' in result) {
          errors.push(result);
        } else {
          quotes.push(result);
        }
      }
      
      const response: ApiResponse = {
        success: true,
        data: { 
          quotes,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching batch quotes:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch batch quotes',
      };
      res.status(500).json(response);
    }
  }
);

// Get market overview
router.get('/market/overview', 
  optionalAuthentication, 
  generalRateLimit,
  async (req: any, res: Response) => {
    try {
      // Get major indices
      const indices = ['^GSPC', '^DJI', '^IXIC', '^RUT']; // S&P 500, Dow, Nasdaq, Russell 2000
      
      const indexPromises = indices.map(symbol => 
        stockService.getQuote(symbol).catch(error => ({ symbol, error: error.message }))
      );
      
      const indexResults = await Promise.all(indexPromises);
      
      // Get market movers (top gainers and losers)
      const movers = await getMarketMovers();
      
      // Get recent news
      const news = await stockService.getMarketNews('market', 0);
      
      const overview = {
        indices: indexResults.filter(result => !('error' in result)),
        marketMovers: movers,
        recentNews: news.slice(0, 5), // Top 5 news items
        timestamp: new Date(),
      };
      
      const response: ApiResponse = {
        success: true,
        data: { overview },
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching market overview:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch market overview',
      };
      res.status(500).json(response);
    }
  }
);

// Get stock fundamentals
router.get('/fundamentals/:symbol', 
  optionalAuthentication, 
  generalRateLimit,
  async (req: any, res: Response) => {
    try {
      const { symbol } = req.params;
      
      // This would integrate with a financial data API
      // For now, return mock fundamentals data
      const fundamentals = {
        symbol: symbol.toUpperCase(),
        company: {
          name: `${symbol.toUpperCase()} Corporation`,
          sector: 'Technology',
          industry: 'Software',
          marketCap: 500000000000, // $500B
          employees: 100000,
        },
        financials: {
          revenue: 100000000000, // $100B
          netIncome: 25000000000, // $25B
          eps: 5.25,
          pe: 25.5,
          ps: 5.0,
          pb: 10.2,
          debtToEquity: 0.3,
          roe: 0.25,
          roa: 0.15,
        },
        dividends: {
          yield: 0.015, // 1.5%
          payoutRatio: 0.3,
          frequency: 'quarterly',
        },
        growth: {
          revenueGrowth: 0.15, // 15%
          earningsGrowth: 0.20, // 20%
          epsGrowth: 0.18, // 18%
        },
        lastUpdated: new Date(),
      };
      
      const response: ApiResponse = {
        success: true,
        data: { fundamentals },
      };
      
      res.json(response);
    } catch (error) {
      console.error(`Error fetching fundamentals for ${req.params.symbol}:`, error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stock fundamentals',
      };
      res.status(500).json(response);
    }
  }
);

// Helper function to get market movers
async function getMarketMovers(): Promise<any> {
  // This would integrate with a financial data API
  // For now, return mock data
  return {
    gainers: [
      { symbol: 'AAPL', change: 2.5, changePercent: 3.2, price: 185.50 },
      { symbol: 'MSFT', change: 1.8, changePercent: 2.1, price: 87.25 },
      { symbol: 'GOOGL', change: 1.2, changePercent: 1.8, price: 68.40 },
    ],
    losers: [
      { symbol: 'TSLA', change: -3.2, changePercent: -4.5, price: 68.15 },
      { symbol: 'META', change: -2.1, changePercent: -3.1, price: 65.80 },
      { symbol: 'NVDA', change: -1.5, changePercent: -2.2, price: 66.45 },
    ],
  };
}

export default router;
