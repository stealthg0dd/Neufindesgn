import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest, schemas, validateQuery, querySchemas } from '../middleware/validation';
import { apiRateLimit } from '../middleware/rateLimit';
import db from '../config/database';
import { redisClient } from '../config/redis';
import { stockService } from '../services/stockService';
import { ApiResponse, Portfolio, PortfolioHolding } from '../types';

const router = Router();

// Get user's portfolios
router.get('/', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cacheKey = `portfolios:${userId}`;
    
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const response: ApiResponse = {
        success: true,
        data: { portfolios: JSON.parse(cached) },
      };
      return res.json(response);
    }
    
    // Fetch portfolios with holdings
    const portfolios = await db('portfolios')
      .where({ userId })
      .orderBy('updatedAt', 'desc');
    
    // Get holdings for each portfolio
    for (const portfolio of portfolios) {
      portfolio.holdings = await db('portfolio_holdings')
        .where({ portfolioId: portfolio.id });
      
      // Calculate current values
      let totalValue = 0;
      for (const holding of portfolio.holdings) {
        try {
          const quote = await stockService.getQuote(holding.symbol);
          holding.currentPrice = quote.price;
          holding.value = holding.shares * quote.price;
          holding.gainLoss = holding.value - (holding.shares * holding.averageCost);
          holding.gainLossPercent = (holding.gainLoss / (holding.shares * holding.averageCost)) * 100;
          totalValue += holding.value;
        } catch (error) {
          // If we can't get current price, use average cost
          holding.currentPrice = holding.averageCost;
          holding.value = holding.shares * holding.averageCost;
          holding.gainLoss = 0;
          holding.gainLossPercent = 0;
          totalValue += holding.value;
        }
      }
      
      portfolio.totalValue = totalValue;
    }
    
    // Cache for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(portfolios), 300);
    
    const response: ApiResponse = {
      success: true,
      data: { portfolios },
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch portfolios',
    };
    return res.status(500).json(response);
  }
});

// Create new portfolio
router.post('/', 
  authenticateToken, 
  apiRateLimit, 
  validateRequest(schemas.portfolio),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { name, holdings } = req.body;
      
      // Create portfolio
      const [portfolio] = await db('portfolios').insert({
        id: `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        name,
        totalValue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning('*');
      
      // Add holdings
      const holdingsWithIds = holdings.map((holding: PortfolioHolding) => ({
        id: `holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        portfolioId: portfolio.id,
        symbol: holding.symbol,
        shares: holding.shares,
        averageCost: holding.averageCost,
      }));
      
      await db('portfolio_holdings').insert(holdingsWithIds);
      
      // Calculate total value
      let totalValue = 0;
      for (const holding of holdings) {
        try {
          const quote = await stockService.getQuote(holding.symbol);
          totalValue += holding.shares * quote.price;
        } catch (error) {
          totalValue += holding.shares * holding.averageCost;
        }
      }
      
      // Update portfolio total value
      await db('portfolios')
        .where({ id: portfolio.id })
        .update({ totalValue, updatedAt: new Date() });
      
      // Clear cache
      await redisClient.del(`portfolios:${userId}`);
      
      const response: ApiResponse = {
        success: true,
        data: { portfolio: { ...portfolio, holdings } },
        message: 'Portfolio created successfully',
      };
      
      return res.status(201).json(response);
    } catch (error) {
      console.error('Error creating portfolio:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create portfolio',
      };
      return res.status(500).json(response);
    }
  }
);

// Get specific portfolio
router.get('/:id', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const portfolioId = req.params.id;
    const cacheKey = `portfolio:${portfolioId}`;
    
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const portfolio = JSON.parse(cached);
      if (portfolio.userId === userId) {
        const response: ApiResponse = {
          success: true,
          data: { portfolio },
        };
        return res.json(response);
      }
    }
    
    // Fetch portfolio
    const portfolio = await db('portfolios')
      .where({ id: portfolioId, userId })
      .first();
    
    if (!portfolio) {
      const response: ApiResponse = {
        success: false,
        error: 'Portfolio not found',
      };
      return res.status(404).json(response);
    }
    
    // Get holdings
    portfolio.holdings = await db('portfolio_holdings')
      .where({ portfolioId: portfolio.id });
    
    // Calculate current values
    let totalValue = 0;
    for (const holding of portfolio.holdings) {
      try {
        const quote = await stockService.getQuote(holding.symbol);
        holding.currentPrice = quote.price;
        holding.value = holding.shares * quote.price;
        holding.gainLoss = holding.value - (holding.shares * holding.averageCost);
        holding.gainLossPercent = (holding.gainLoss / (holding.shares * holding.averageCost)) * 100;
        totalValue += holding.value;
      } catch (error) {
        holding.currentPrice = holding.averageCost;
        holding.value = holding.shares * holding.averageCost;
        holding.gainLoss = 0;
        holding.gainLossPercent = 0;
        totalValue += holding.value;
      }
    }
    
    portfolio.totalValue = totalValue;
    
    // Cache for 2 minutes
    await redisClient.set(cacheKey, JSON.stringify(portfolio), 120);
    
    const response: ApiResponse = {
      success: true,
      data: { portfolio },
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch portfolio',
    };
    return res.status(500).json(response);
  }
});

// Update portfolio
router.put('/:id', 
  authenticateToken, 
  apiRateLimit, 
  validateRequest(schemas.portfolioUpdate),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const portfolioId = req.params.id;
      const updates = req.body;
      
      // Check if portfolio exists and belongs to user
      const portfolio = await db('portfolios')
        .where({ id: portfolioId, userId })
        .first();
      
      if (!portfolio) {
        const response: ApiResponse = {
          success: false,
          error: 'Portfolio not found',
        };
        return res.status(404).json(response);
      }
      
      // Update portfolio
      const updatedPortfolio = {
        ...portfolio,
        ...updates,
        updatedAt: new Date(),
      };
      
      await db('portfolios')
        .where({ id: portfolioId })
        .update(updatedPortfolio);
      
      // Update holdings if provided
      if (updates.holdings) {
        // Delete existing holdings
        await db('portfolio_holdings')
          .where({ portfolioId })
          .del();
        
        // Add new holdings
        const holdingsWithIds = updates.holdings.map((holding: PortfolioHolding) => ({
          id: `holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          portfolioId,
          symbol: holding.symbol,
          shares: holding.shares,
          averageCost: holding.averageCost,
        }));
        
        await db('portfolio_holdings').insert(holdingsWithIds);
        
        // Recalculate total value
        let totalValue = 0;
        for (const holding of updates.holdings) {
          try {
            const quote = await stockService.getQuote(holding.symbol);
            totalValue += holding.shares * quote.price;
          } catch (error) {
            totalValue += holding.shares * holding.averageCost;
          }
        }
        
        updatedPortfolio.totalValue = totalValue;
        
        await db('portfolios')
          .where({ id: portfolioId })
          .update({ totalValue: totalValue, updatedAt: new Date() });
      }
      
      // Clear caches
      await redisClient.del(`portfolio:${portfolioId}`);
      await redisClient.del(`portfolios:${userId}`);
      
      const response: ApiResponse = {
        success: true,
        data: { portfolio: updatedPortfolio },
        message: 'Portfolio updated successfully',
      };
      
      return res.json(response);
    } catch (error) {
      console.error('Error updating portfolio:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update portfolio',
      };
      return res.status(500).json(response);
    }
  }
);

// Delete portfolio
router.delete('/:id', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const portfolioId = req.params.id;
    
    // Check if portfolio exists and belongs to user
    const portfolio = await db('portfolios')
      .where({ id: portfolioId, userId })
      .first();
    
    if (!portfolio) {
      const response: ApiResponse = {
        success: false,
        error: 'Portfolio not found',
      };
      return res.status(404).json(response);
    }
    
    // Delete holdings first
    await db('portfolio_holdings')
      .where({ portfolioId })
      .del();
    
    // Delete portfolio
    await db('portfolios')
      .where({ id: portfolioId })
      .del();
    
    // Clear caches
    await redisClient.del(`portfolio:${portfolioId}`);
    await redisClient.del(`portfolios:${userId}`);
    
    const response: ApiResponse = {
      success: true,
      message: 'Portfolio deleted successfully',
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete portfolio',
    };
    return res.status(500).json(response);
  }
});

// Get portfolio performance
router.get('/:id/performance', 
  authenticateToken, 
  apiRateLimit,
  validateQuery(querySchemas.dateRange),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const portfolioId = req.params.id;
      const { startDate, endDate } = req.query;
      
      // Check if portfolio exists and belongs to user
      const portfolio = await db('portfolios')
        .where({ id: portfolioId, userId })
        .first();
      
      if (!portfolio) {
        const response: ApiResponse = {
          success: false,
          error: 'Portfolio not found',
        };
        return res.status(404).json(response);
      }
      
      // Get holdings
      const holdings = await db('portfolio_holdings')
        .where({ portfolioId: portfolio.id });
      
      // Convert query params to Date objects safely
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      // Calculate performance metrics
      const performance = await calculatePortfolioPerformance(holdings, start, end);
      
      const response: ApiResponse = {
        success: true,
        data: { performance },
      };
      
      return res.json(response);
    } catch (error) {
      console.error('Error calculating portfolio performance:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to calculate portfolio performance',
      };
      return res.status(500).json(response);
    }
  }
);

async function calculatePortfolioPerformance(holdings: any[], startDate?: Date, endDate?: Date) {
  // This would integrate with historical data APIs
  // For now, return mock performance data
  const totalValue = holdings.reduce((sum, holding) => 
    sum + (holding.shares * (holding.current_price || holding.average_cost)), 0);
  
  const totalCost = holdings.reduce((sum, holding) => 
    sum + (holding.shares * holding.average_cost), 0);
  
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  
  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    dailyChange: Math.random() * 4 - 2, // Mock daily change
    weeklyChange: Math.random() * 10 - 5, // Mock weekly change
    monthlyChange: Math.random() * 20 - 10, // Mock monthly change
    yearlyChange: Math.random() * 40 - 20, // Mock yearly change
  };
}

export default router;
