import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';
import { apiRateLimit } from '../middleware/rateLimit';
import db from '../config/database';
import { redisClient } from '../config/redis';
import { ApiResponse, User, UserSettings } from '../types';

const router = Router();

// Get user profile
router.get('/profile', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user: User = req.user!;
    
    const response: ApiResponse = {
      success: true,
      data: { user },
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch user profile',
    };
    res.status(500).json(response);
  }
});

// Get user settings
router.get('/settings', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cacheKey = `user_settings:${userId}`;
    
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const response: ApiResponse = {
        success: true,
        data: { settings: JSON.parse(cached) },
      };
      return res.json(response);
    }
    
    // Fetch from database
    let settings = await db('user_settings')
      .where({ userId })
      .first();
    
    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = {
        userId,
        notifications: {
          email: true,
          push: false,
          portfolio: true,
          news: true,
          alphaUpdates: true,
        },
        preferences: {
          theme: 'dark',
          currency: 'USD',
          riskTolerance: 'moderate',
        },
        updatedAt: new Date(),
      };
      
      await db('user_settings').insert(defaultSettings);
      settings = defaultSettings;
    }
    
    // Cache for 30 minutes
    await redisClient.set(cacheKey, JSON.stringify(settings), 1800);
    
    const response: ApiResponse = {
      success: true,
      data: { settings },
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch user settings',
    };
    res.status(500).json(response);
  }
});

// Update user settings
router.put('/settings', 
  authenticateToken, 
  apiRateLimit, 
  validateRequest(schemas.userSettings),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const updates = req.body;
      
      // Get existing settings
      let settings = await db('user_settings')
        .where({ userId })
        .first();
      
      if (settings) {
        // Update existing settings
        const updatedSettings = {
          ...settings,
          notifications: { ...settings.notifications, ...updates.notifications },
          preferences: { ...settings.preferences, ...updates.preferences },
          updatedAt: new Date(),
        };
        
        await db('user_settings')
          .where({ userId })
          .update(updatedSettings);
        
        settings = updatedSettings;
      } else {
        // Create new settings
        const newSettings = {
          userId,
          notifications: {
            email: true,
            push: false,
            portfolio: true,
            news: true,
            alphaUpdates: true,
            ...updates.notifications,
          },
          preferences: {
            theme: 'dark',
            currency: 'USD',
            riskTolerance: 'moderate',
            ...updates.preferences,
          },
          updatedAt: new Date(),
        };
        
        await db('user_settings').insert(newSettings);
        settings = newSettings;
      }
      
      // Update cache
      const cacheKey = `user_settings:${userId}`;
      await redisClient.set(cacheKey, JSON.stringify(settings), 1800);
      
      const response: ApiResponse = {
        success: true,
        data: { settings },
        message: 'Settings updated successfully',
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error updating user settings:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update user settings',
      };
      res.status(500).json(response);
    }
  }
);

// Delete user account
router.delete('/account', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Start a transaction to delete all user data
    await db.transaction(async (trx) => {
      // Delete user's chat messages
      await trx('chat_messages').where({ userId }).del();
      
      // Delete user's bias analyses
      await trx('bias_analyses').where({ userId }).del();
      
      // Delete user's alpha signals
      await trx('alpha_signals').where({ userId }).del();
      
      // Delete user's portfolio holdings
      const portfolios = await trx('portfolios').where({ userId });
      for (const portfolio of portfolios) {
        await trx('portfolio_holdings').where({ portfolioId: portfolio.id }).del();
      }
      
      // Delete user's portfolios
      await trx('portfolios').where({ userId }).del();
      
      // Delete user's settings
      await trx('user_settings').where({ userId }).del();
      
      // Delete user's watchlists
      await trx('watchlists').where({ userId }).del();
      
      // Delete user's alerts
      await trx('alerts').where({ userId }).del();
      
      // Note: We don't delete the user from Supabase auth here
      // That should be handled separately by the auth service
    });
    
    // Clear all user-related caches
    const cacheKeys = await redisClient.keys(`*:${userId}*`);
    if (cacheKeys.length > 0) {
      await Promise.all(cacheKeys.map(key => redisClient.del(key)));
    }
    
    const response: ApiResponse = {
      success: true,
      message: 'Account deleted successfully',
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error deleting user account:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete account',
    };
    res.status(500).json(response);
  }
});

// Get user statistics
router.get('/stats', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get portfolio stats
    const portfolio = await db('portfolios')
      .where({ userId })
      .first();
    
    let portfolioValue = 0;
    let holdingsCount = 0;
    
    if (portfolio) {
      const holdings = await db('portfolio_holdings')
        .where({ portfolioId: portfolio.id });
      
      holdingsCount = holdings.length;
      portfolioValue = holdings.reduce((sum, holding) => 
        sum + (holding.shares * (holding.current_price || holding.average_cost)), 0);
    }
    
    // Get bias analysis stats
    const biasStats = await db('bias_analyses')
      .where({ userId })
      .select('biasType', 'severity')
      .groupBy('biasType', 'severity')
      .count('* as count');
    
    // Get alpha signal stats
    const signalStats = await db('alpha_signals')
      .where({ userId })
      .where('timestamp', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      .count('* as count')
      .first();
    
    // Get chat activity stats
    const chatStats = await db('chat_messages')
      .where({ userId })
      .where('timestamp', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      .count('* as count')
      .first();
    
    const stats = {
      portfolio: {
        totalValue: portfolioValue,
        holdingsCount,
        portfoliosCount: portfolio ? 1 : 0,
      },
      biases: {
        totalDetected: biasStats.reduce((sum, stat) => sum + Number(stat.count), 0),
        byType: biasStats,
      },
      signals: {
        totalReceived: Number(signalStats?.count || 0),
      },
      chat: {
        totalMessages: Number(chatStats?.count || 0),
      },
    };
    
    const response: ApiResponse = {
      success: true,
      data: { stats },
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch user statistics',
    };
    res.status(500).json(response);
  }
});

export default router;
