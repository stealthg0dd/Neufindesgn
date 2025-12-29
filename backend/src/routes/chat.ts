import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';
import { apiRateLimit } from '../middleware/rateLimit';
import { aiChatService } from '../services/aiChatService';
import { ApiResponse, ChatMessage } from '../types';

const router = Router();

// Send chat message
router.post('/message', 
  authenticateToken, 
  apiRateLimit, 
  validateRequest(schemas.chatMessage),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { message } = req.body;
      
      const response = await aiChatService.processMessage(userId, message, req.user!);
      
      const apiResponse: ApiResponse = {
        success: true,
        data: { 
          message,
          response,
          timestamp: new Date(),
        },
      };
      
      res.json(apiResponse);
    } catch (error) {
      console.error('Error processing chat message:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message',
      };
      res.status(500).json(response);
    }
  }
);

// Get conversation history
router.get('/history', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 50 } = req.query;
    
    const history = await aiChatService.getConversationHistory(userId, Number(limit));
    
    const response: ApiResponse<ChatMessage[]> = {
      success: true,
      data: history,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch chat history',
    };
    res.status(500).json(response);
  }
});

// Clear conversation history
router.delete('/history', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    await aiChatService.clearConversationHistory(userId);
    
    const response: ApiResponse = {
      success: true,
      message: 'Conversation history cleared successfully',
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error clearing chat history:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to clear conversation history',
    };
    res.status(500).json(response);
  }
});

// Get chat insights
router.get('/insights', authenticateToken, apiRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const insights = await aiChatService.getChatInsights(userId);
    
    const response: ApiResponse = {
      success: true,
      data: { insights },
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching chat insights:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch chat insights',
    };
    res.status(500).json(response);
  }
});

export default router;
