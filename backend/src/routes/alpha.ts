import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';
import { alphaScoreService } from '../services/alphaScoreService';
import { ApiResponse, AlphaScore, BiasAnalysis, AlphaSignal } from '../types';

const router = Router();

// Get alpha score
router.get('/score', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const alphaScore = await alphaScoreService.calculateAlphaScore(userId);
    
    const response: ApiResponse<AlphaScore> = {
      success: true,
      data: alphaScore,
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error calculating alpha score:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to calculate alpha score',
    };
    return res.status(500).json(response);
  }
});

// Get bias analyses
router.get('/biases', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const biases = await alphaScoreService.getBiasAnalyses(userId);
    
    const response: ApiResponse<BiasAnalysis[]> = {
      success: true,
      data: biases,
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching bias analyses:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch bias analyses',
    };
    return res.status(500).json(response);
  }
});

// Run bias detection
router.post('/biases/detect', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get user's portfolio for analysis
    const portfolio = await alphaScoreService.getUserPortfolio(userId);
    
    // Detect biases
    const biases = await alphaScoreService.detectBiases(userId, portfolio);
    
    const response: ApiResponse<BiasAnalysis[]> = {
      success: true,
      data: biases,
      message: `Detected ${biases.length} potential biases`,
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error detecting biases:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to detect biases',
    };
    return res.status(500).json(response);
  }
});

// Get alpha signals
router.get('/signals', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const signals = await alphaScoreService.getAlphaSignals(userId);
    
    const response: ApiResponse<AlphaSignal[]> = {
      success: true,
      data: signals,
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error fetching alpha signals:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch alpha signals',
    };
    return res.status(500).json(response);
  }
});

// Generate alpha signals
router.post('/signals/generate', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const signals = await alphaScoreService.generateAlphaSignals(userId);
    
    const response: ApiResponse<AlphaSignal[]> = {
      success: true,
      data: signals,
      message: `Generated ${signals.length} new alpha signals`,
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error generating alpha signals:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to generate alpha signals',
    };
    return res.status(500).json(response);
  }
});

// Get alpha insights summary
router.get('/insights', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get alpha score
    const alphaScore = await alphaScoreService.calculateAlphaScore(userId);
    
    // Get recent biases
    const recentBiases = await alphaScoreService.getBiasAnalyses(userId);
    const recentBiasesCount = recentBiases.filter(b => 
      (Date.now() - b.detectedAt.getTime()) < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    ).length;
    
    // Get recent signals
    const recentSignals = await alphaScoreService.getAlphaSignals(userId);
    const recentSignalsCount = recentSignals.filter(s => 
      (Date.now() - s.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    ).length;
    
    // Calculate bias breakdown
    const biasBreakdown: Record<string, number> = recentBiases.reduce((acc, bias) => {
      acc[bias.biasType] = (acc[bias.biasType] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate signal distribution
    const signalDistribution: Record<string, number> = recentSignals.reduce((acc, signal) => {
      acc[signal.direction] = (acc[signal.direction] || 0) + 1;
      return acc;
    }, {});
    
    const insights = {
      alphaScore: alphaScore.score,
      improvement: alphaScore.improvement,
      period: alphaScore.period,
      recentActivity: {
        biasesDetected: recentBiasesCount,
        signalsGenerated: recentSignalsCount,
        biasesCorrected: alphaScore.biasesCorrected,
        opportunitiesMissed: alphaScore.opportunitiesMissed,
      },
      breakdowns: {
        byBiasType: biasBreakdown,
        bySignalDirection: signalDistribution,
      },
      recommendations: generateRecommendations(alphaScore, recentBiases, recentSignals),
    };
    
    const response: ApiResponse = {
      success: true,
      data: { insights },
    };
    
    return res.json(response);
  } catch (error) {
    console.error('Error generating alpha insights:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to generate alpha insights',
    };
    return res.status(500).json(response);
  }
});

function generateRecommendations(alphaScore: AlphaScore, biases: BiasAnalysis[], signals: AlphaSignal[]): string[] {
  const recommendations: string[] = [];
  
  // Alpha score recommendations
  if (alphaScore.score < 50) {
    recommendations.push('Your alpha score is below average. Focus on addressing cognitive biases and following data-driven signals.');
  } else if (alphaScore.score > 80) {
    recommendations.push('Excellent alpha score! Continue your current strategy and consider sharing your insights with the community.');
  }
  
  // Bias-based recommendations
  const highSeverityBiases = biases.filter(b => b.severity === 'high');
  if (highSeverityBiases.length > 0) {
    recommendations.push(`You have ${highSeverityBiases.length} high-severity biases requiring immediate attention.`);
  }
  
  // Signal-based recommendations
  const highConfidenceSignals = signals.filter(s => s.confidence > 0.8);
  if (highConfidenceSignals.length > 5) {
    recommendations.push('You have multiple high-confidence signals available. Consider reviewing them for potential action.');
  }
  
  // Improvement-based recommendations
  if (alphaScore.improvement > 5) {
    recommendations.push('Great improvement! Your bias correction efforts are paying off.');
  } else if (alphaScore.improvement < 0) {
    recommendations.push('Your alpha score has declined. Review recent decisions and consider adjusting your strategy.');
  }
  
  // Default recommendation
  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring your portfolio and stay alert for potential cognitive biases.');
  }
  
  return recommendations;
}

export default router;
