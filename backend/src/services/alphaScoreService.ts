import { AlphaScore, BiasAnalysis, AlphaSignal, User } from '../types';
import db from '../config/database';
import { redisClient } from '../config/redis';

export class AlphaScoreService {
  async calculateAlphaScore(userId: string): Promise<AlphaScore> {
    const cacheKey = `alpha_score:${userId}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }

    try {
      // Get user's portfolio performance
      const portfolio = await this.getUserPortfolio(userId);
      const biasAnalyses = await this.getBiasAnalyses(userId);
      const alphaSignals = await this.getAlphaSignals(userId);

      // Calculate base score from portfolio performance
      const portfolioScore = this.calculatePortfolioScore(portfolio);
      
      // Calculate bias correction score
      const biasScore = this.calculateBiasScore(biasAnalyses);
      
      // Calculate signal utilization score
      const signalScore = this.calculateSignalScore(alphaSignals);
      
      // Calculate overall alpha score (0-100)
      const baseScore = (portfolioScore + biasScore + signalScore) / 3;
      
      // Apply improvement factor based on bias corrections
      const improvementFactor = 1 + (biasAnalyses.length * 0.02); // 2% improvement per bias corrected
      
      const finalScore = Math.min(100, baseScore * improvementFactor);
      
      const alphaScore: AlphaScore = {
        userId,
        score: Math.round(finalScore * 100) / 100,
        improvement: Math.round((finalScore - baseScore) * 100) / 100,
        period: '30d',
        biasesCorrected: biasAnalyses.length,
        opportunitiesMissed: this.calculateMissedOpportunities(alphaSignals),
        calculatedAt: new Date(),
      };

      await redisClient.set(cacheKey, JSON.stringify(alphaScore), 3600); // Cache for 1 hour
      
      return alphaScore;
    } catch (error) {
      console.error('Error calculating alpha score:', error);
      throw new Error('Failed to calculate alpha score');
    }
  }

  async detectBiases(userId: string, portfolioData: any): Promise<BiasAnalysis[]> {
    const biases: BiasAnalysis[] = [];
    
    // Detect various cognitive biases
    const biasesToCheck = [
      { type: 'Loss Aversion', pattern: this.detectLossAersion },
      { type: 'Confirmation Bias', pattern: this.detectConfirmationBias },
      { type: 'Overconfidence Bias', pattern: this.detectOverconfidenceBias },
      { type: 'Anchoring Bias', pattern: this.detectAnchoringBias },
      { type: 'Herding Bias', pattern: this.detectHerdingBias },
    ];

    for (const bias of biasesToCheck) {
      try {
        const result = await bias.pattern(portfolioData);
        if (result.detected) {
          biases.push({
            id: `bias_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            biasType: bias.type,
            severity: result.severity,
            description: result.description,
            recommendation: result.recommendation,
            detectedAt: new Date(),
          });
        }
      } catch (error) {
        console.error(`Error detecting ${bias.type}:`, error);
      }
    }

    // Store detected biases
    if (biases.length > 0) {
      await this.storeBiasAnalyses(biases);
    }

    return biases;
  }

  async generateAlphaSignals(userId: string): Promise<AlphaSignal[]> {
    const signals: AlphaSignal[] = [];
    
    try {
      // Get user's portfolio and preferences
      const portfolio = await this.getUserPortfolio(userId);
      const settings = await this.getUserSettings(userId);
      
      // Generate signals based on portfolio holdings
      for (const holding of portfolio.holdings) {
        try {
          const signal = await this.generateSignalForAsset(holding.symbol, settings);
          if (signal) {
            signals.push(signal);
          }
        } catch (error) {
          console.error(`Error generating signal for ${holding.symbol}:`, error);
        }
      }

      // Store signals
      if (signals.length > 0) {
        await this.storeAlphaSignals(signals);
      }

      return signals;
    } catch (error) {
      console.error('Error generating alpha signals:', error);
      throw new Error('Failed to generate alpha signals');
    }
  }

  public async getUserPortfolio(userId: string): Promise<any> {
    try {
      const portfolio = await db('portfolios')
        .where({ userId })
        .first();
      
      if (!portfolio) {
        return { holdings: [], totalValue: 0 };
      }

      const holdings = await db('portfolio_holdings')
        .where({ portfolioId: portfolio.id });

      return {
        ...portfolio,
        holdings,
      };
    } catch (error) {
      console.error('Error fetching user portfolio:', error);
      return { holdings: [], totalValue: 0 };
    }
  }

  public async getBiasAnalyses(userId: string): Promise<BiasAnalysis[]> {
    try {
      return await db('bias_analyses')
        .where({ userId })
        .orderBy('detectedAt', 'desc')
        .limit(50);
    } catch (error) {
      console.error('Error fetching bias analyses:', error);
      return [];
    }
  }

  public async getAlphaSignals(userId: string): Promise<AlphaSignal[]> {
    try {
      return await db('alpha_signals')
        .where({ userId })
        .orderBy('timestamp', 'desc')
        .limit(100);
    } catch (error) {
      console.error('Error fetching alpha signals:', error);
      return [];
    }
  }

  private async getUserSettings(userId: string): Promise<any> {
    try {
      return await db('user_settings')
        .where({ userId })
        .first();
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return { preferences: { riskTolerance: 'moderate' } };
    }
  }

  private calculatePortfolioScore(portfolio: any): number {
    if (!portfolio.holdings || portfolio.holdings.length === 0) {
      return 50; // Neutral score for empty portfolio
    }

    // Calculate portfolio performance metrics
    let totalGainLoss = 0;
    let totalValue = 0;

    for (const holding of portfolio.holdings) {
      const currentValue = holding.shares * (holding.currentPrice || holding.averageCost);
      const costBasis = holding.shares * holding.averageCost;
      const gainLoss = currentValue - costBasis;
      
      totalGainLoss += gainLoss;
      totalValue += currentValue;
    }

    const returnPercentage = totalValue > 0 ? (totalGainLoss / totalValue) * 100 : 0;
    
    // Convert return percentage to score (0-100)
    // Assuming market average is around 8-10% annually
    const marketAverage = 8; // 8% annual return
    const score = Math.min(100, Math.max(0, 50 + (returnPercentage - marketAverage) * 2));
    
    return score;
  }

  private calculateBiasScore(biases: BiasAnalysis[]): number {
    if (biases.length === 0) {
      return 100; // Perfect score if no biases detected
    }

    // Calculate bias score based on severity and recency
    let totalScore = 100;
    const now = new Date();
    
    for (const bias of biases) {
      const daysSinceDetection = (now.getTime() - bias.detectedAt.getTime()) / (1000 * 60 * 60 * 24);
      const recencyWeight = Math.max(0.1, 1 - (daysSinceDetection / 30)); // Decay over 30 days
      
      const severityPenalty = bias.severity === 'high' ? 15 : bias.severity === 'medium' ? 10 : 5;
      totalScore -= severityPenalty * recencyWeight;
    }

    return Math.max(0, Math.min(100, totalScore));
  }

  private calculateSignalScore(signals: AlphaSignal[]): number {
    if (signals.length === 0) {
      return 50; // Neutral score if no signals
    }

    // Calculate signal utilization score
    const recentSignals = signals.filter(s => 
      (Date.now() - s.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );

    if (recentSignals.length === 0) {
      return 50;
    }

    // Score based on confidence and actionability
    let totalScore = 0;
    for (const signal of recentSignals) {
      totalScore += signal.confidence * 100;
    }

    return Math.min(100, totalScore / recentSignals.length);
  }

  private calculateMissedOpportunities(signals: AlphaSignal[]): number {
    // Count high-confidence signals that weren't acted upon
    const highConfidenceSignals = signals.filter(s => s.confidence > 0.8);
    return highConfidenceSignals.length;
  }

  private async storeBiasAnalyses(biases: BiasAnalysis[]): Promise<void> {
    try {
      await db('bias_analyses').insert(biases);
    } catch (error) {
      console.error('Error storing bias analyses:', error);
    }
  }

  private async storeAlphaSignals(signals: AlphaSignal[]): Promise<void> {
    try {
      await db('alpha_signals').insert(signals);
    } catch (error) {
      console.error('Error storing alpha signals:', error);
    }
  }

  private async generateSignalForAsset(symbol: string, settings: any): Promise<AlphaSignal | null> {
    // This would integrate with external APIs and AI models
    // For now, return a mock signal
    const directions = ['bullish', 'bearish', 'neutral'];
    const categories = ['technical', 'fundamental', 'sentiment', 'options'];
    
    return {
      id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: '', // Will be set by caller
      asset: symbol,
      direction: directions[Math.floor(Math.random() * directions.length)] as any,
      confidence: Math.random() * 0.5 + 0.5, // 0.5-1.0
      timeHorizon: ['short', 'medium', 'long'][Math.floor(Math.random() * 3)] as any,
      insight: `AI analysis suggests ${symbol} shows ${directions[Math.floor(Math.random() * directions.length)]} momentum based on recent market data.`,
      sources: Math.floor(Math.random() * 100) + 10,
      timestamp: new Date(),
      category: categories[Math.floor(Math.random() * categories.length)],
    };
  }

  // Bias detection methods
  private async detectLossAersion(portfolioData: any): Promise<any> {
    // Implement loss aversion detection logic
    return {
      detected: Math.random() > 0.7, // 30% chance
      severity: 'medium' as const,
      description: 'Tendency to hold losing positions too long hoping for recovery',
      recommendation: 'Consider setting stop-loss orders and taking small losses regularly',
    };
  }

  private async detectConfirmationBias(portfolioData: any): Promise<any> {
    return {
      detected: Math.random() > 0.8, // 20% chance
      severity: 'high' as const,
      description: 'Seeking information that confirms existing beliefs',
      recommendation: 'Actively seek contrarian viewpoints and challenge your assumptions',
    };
  }

  private async detectOverconfidenceBias(portfolioData: any): Promise<any> {
    return {
      detected: Math.random() > 0.75, // 25% chance
      severity: 'medium' as const,
      description: 'Excessive confidence in trading abilities',
      recommendation: 'Keep detailed trading records and regularly review performance objectively',
    };
  }

  private async detectAnchoringBias(portfolioData: any): Promise<any> {
    return {
      detected: Math.random() > 0.85, // 15% chance
      severity: 'low' as const,
      description: 'Relying too heavily on the first piece of information',
      recommendation: 'Use multiple data points and regularly update your reference points',
    };
  }

  private async detectHerdingBias(portfolioData: any): Promise<any> {
    return {
      detected: Math.random() > 0.9, // 10% chance
      severity: 'medium' as const,
      description: 'Following market trends without independent analysis',
      recommendation: 'Conduct your own research before following market trends',
    };
  }
}

export const alphaScoreService = new AlphaScoreService();
