import { ChatMessage, User } from '../types';
import { redisClient } from '../config/redis';
import db from '../config/database';

export class AiChatService {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY!;
  }

  async processMessage(userId: string, message: string, user: User): Promise<string> {
    try {
      // Get conversation history
      const history = await this.getConversationHistory(userId);
      
      // Get user context (portfolio, settings, recent analyses)
      const userContext = await this.getUserContext(userId);
      
      // Build prompt with context
      const prompt = this.buildPrompt(message, history, userContext, user);
      
      // Get AI response
      const response = await this.getAiResponse(prompt);
      
      // Store conversation
      await this.storeConversation(userId, message, response);
      
      return response;
    } catch (error) {
      console.error('Error processing chat message:', error);
      throw new Error('Failed to process message');
    }
  }

  async getConversationHistory(userId: string, limit: number = 10): Promise<ChatMessage[]> {
    try {
      const cacheKey = `chat_history:${userId}`;
      
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Fetch from database
      const messages = await db('chat_messages')
        .where({ userId })
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .select('*');
      
      // Format and reverse to get chronological order
      const formattedMessages = messages.reverse().map(msg => ({
        id: msg.id,
        userId: msg.userId,
        message: msg.message,
        response: msg.response,
        timestamp: new Date(msg.timestamp),
        type: msg.type,
      }));
      
      // Cache for 30 minutes
      await redisClient.set(cacheKey, JSON.stringify(formattedMessages), 1800);
      
      return formattedMessages;
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  async clearConversationHistory(userId: string): Promise<void> {
    try {
      await db('chat_messages').where({ userId }).del();
      await redisClient.del(`chat_history:${userId}`);
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      throw new Error('Failed to clear conversation history');
    }
  }

  private async getUserContext(userId: string): Promise<any> {
    try {
      // Get user's portfolio
      const portfolio = await db('portfolios')
        .where({ userId })
        .first();
      
      let holdings: any[] = [];
      if (portfolio) {
        holdings = await db('portfolio_holdings')
          .where({ portfolioId: portfolio.id });
      }
      
      // Get recent bias analyses
      const recentBiases = await db('bias_analyses')
        .where({ userId })
        .orderBy('detectedAt', 'desc')
        .limit(5);
      
      // Get recent alpha signals
      const recentSignals = await db('alpha_signals')
        .where({ userId })
        .orderBy('timestamp', 'desc')
        .limit(5);
      
      // Get user settings
      const settings = await db('user_settings')
        .where({ userId })
        .first();
      
      return {
        portfolio: portfolio ? { ...portfolio, holdings } : null,
        recentBiases,
        recentSignals,
        settings,
      };
    } catch (error) {
      console.error('Error fetching user context:', error);
      return {};
    }
  }

  private buildPrompt(message: string, history: ChatMessage[], context: any, user: User): string {
    const systemPrompt = `You are Neufin AI, an intelligent financial assistant specializing in behavioral finance and bias-aware trading. You help users make better investment decisions by identifying cognitive biases and providing objective, data-driven insights.

Your expertise includes:
- Detecting and explaining cognitive biases in trading decisions
- Providing portfolio analysis with bias correction recommendations
- Offering market insights without emotional influence
- Helping users understand their alpha score and improvement opportunities
- Suggesting strategies to overcome common investment biases

Current user context:
- Name: ${user.name || 'User'}
- Email: ${user.email}
- Portfolio: ${context.portfolio ? `${context.portfolio.holdings?.length || 0} holdings, total value $${context.portfolio.totalValue || 0}` : 'No portfolio set up'}
- Recent biases detected: ${context.recentBiases?.length || 0}
- Risk tolerance: ${context.settings?.preferences?.riskTolerance || 'moderate'}

Recent conversation:
${history.map(msg => `${msg.type === 'user' ? 'User' : 'Neufin AI'}: ${msg.type === 'user' ? msg.message : msg.response}`).join('\n')}

Current user message: ${message}

Please provide a helpful, insightful response that:
1. Addresses the user's specific question or concern
2. Incorporates relevant context about their portfolio and recent analyses
3. Identifies any potential biases if relevant
4. Provides actionable, data-driven advice
5. Maintains a professional yet approachable tone
6. Avoids making specific stock predictions or guarantees

Response:`;

    return systemPrompt;
  }

  private async getAiResponse(prompt: string): Promise<string> {
    try {
      // In a real implementation, you would use OpenAI API
      // For now, return a mock response based on common patterns
      
      const responses = [
        "Based on your portfolio analysis, I notice you might be experiencing some confirmation bias. Consider diversifying your information sources and seeking contrarian viewpoints to ensure you're getting a balanced perspective on your investments.",
        "Your recent trading activity suggests potential loss aversion - you may be holding onto losing positions longer than optimal. Setting predefined stop-loss levels could help mitigate this bias.",
        "I see you have a moderate risk tolerance profile. Given your current portfolio allocation, you might benefit from rebalancing to better align with your long-term investment goals while managing behavioral risks.",
        "Your alpha score has improved by 3.2% this month, largely due to addressing overconfidence bias. Keep maintaining your trading journal and regularly reviewing your decisions against objective criteria.",
        "The market sentiment data suggests your current holdings are experiencing some volatility. Rather than making emotional decisions, consider whether your original investment thesis still holds true.",
      ];
      
      // Simple pattern matching for more contextual responses
      if (prompt.toLowerCase().includes('bias')) {
        return responses[0];
      } else if (prompt.toLowerCase().includes('loss') || prompt.toLowerCase().includes('losing')) {
        return responses[1];
      } else if (prompt.toLowerCase().includes('risk') || prompt.toLowerCase().includes('portfolio')) {
        return responses[2];
      } else if (prompt.toLowerCase().includes('alpha') || prompt.toLowerCase().includes('score')) {
        return responses[3];
      } else if (prompt.toLowerCase().includes('market') || prompt.toLowerCase().includes('volatility')) {
        return responses[4];
      }
      
      // Default response
      return "I'm here to help you make better, bias-aware investment decisions. Based on your current portfolio and recent analyses, I recommend focusing on objective data-driven strategies rather than emotional reactions. Would you like me to analyze any specific aspect of your portfolio or discuss potential behavioral biases that might be affecting your trading decisions?";
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private async storeConversation(userId: string, message: string, response: string): Promise<void> {
    try {
      // Store user message
      await db('chat_messages').insert({
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        message,
        response: null,
        type: 'user',
        timestamp: new Date(),
      });
      
      // Store AI response
      await db('chat_messages').insert({
        id: `msg_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        message: null,
        response,
        type: 'assistant',
        timestamp: new Date(),
      });
      
      // Invalidate cache
      await redisClient.del(`chat_history:${userId}`);
    } catch (error) {
      console.error('Error storing conversation:', error);
    }
  }

  async getChatInsights(userId: string): Promise<any> {
    try {
      // Analyze conversation patterns
      const messages = await db('chat_messages')
        .where({ userId })
        .orderBy('timestamp', 'desc')
        .limit(50);
      
      const topics = this.extractTopics(messages);
      const sentiment = this.analyzeSentiment(messages);
      const engagement = this.calculateEngagement(messages);
      
      return {
        totalMessages: messages.length,
        topics,
        sentiment,
        engagement,
        lastInteraction: messages[0]?.timestamp || null,
      };
    } catch (error) {
      console.error('Error getting chat insights:', error);
      return {};
    }
  }

  private extractTopics(messages: any[]): string[] {
    // Simple topic extraction based on keywords
    const topics = new Set<string>();
    const topicKeywords = {
      'bias': ['bias', 'biases', 'behavioral', 'psychology'],
      'portfolio': ['portfolio', 'holdings', 'allocation', 'diversification'],
      'risk': ['risk', 'risky', 'conservative', 'aggressive', 'tolerance'],
      'market': ['market', 'markets', 'stock', 'stocks', 'trading'],
      'performance': ['performance', 'returns', 'gain', 'loss', 'profit'],
      'strategy': ['strategy', 'strategies', 'plan', 'approach'],
    };
    
    for (const msg of messages) {
      const text = (msg.message || msg.response || '').toLowerCase();
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => text.includes(keyword))) {
          topics.add(topic);
        }
      }
    }
    
    return Array.from(topics);
  }

  private analyzeSentiment(messages: any[]): string {
    // Simple sentiment analysis
    let positive = 0, negative = 0, neutral = 0;
    
    for (const msg of messages) {
      const text = (msg.message || msg.response || '').toLowerCase();
      const positiveWords = ['good', 'great', 'excellent', 'positive', 'helpful', 'useful'];
      const negativeWords = ['bad', 'terrible', 'negative', 'unhelpful', 'difficult', 'confusing'];
      
      const positiveCount = positiveWords.filter(word => text.includes(word)).length;
      const negativeCount = negativeWords.filter(word => text.includes(word)).length;
      
      if (positiveCount > negativeCount) positive++;
      else if (negativeCount > positiveCount) negative++;
      else neutral++;
    }
    
    if (positive > negative && positive > neutral) return 'positive';
    if (negative > positive && negative > neutral) return 'negative';
    return 'neutral';
  }

  private calculateEngagement(messages: any[]): any {
    if (messages.length === 0) return { score: 0, frequency: 0 };
    
    // Calculate engagement based on message length and frequency
    const avgMessageLength = messages.reduce((sum, msg) => 
      sum + (msg.message || msg.response || '').length, 0) / messages.length;
    
    // Calculate frequency (messages per day)
    const now = new Date();
    const oldestMessage = new Date(messages[messages.length - 1]?.timestamp || now);
    const daysDiff = Math.max(1, (now.getTime() - oldestMessage.getTime()) / (1000 * 60 * 60 * 24));
    const frequency = messages.length / daysDiff;
    
    // Engagement score (0-100)
    const score = Math.min(100, (avgMessageLength / 100) * 50 + (frequency / 10) * 50);
    
    return {
      score: Math.round(score),
      frequency: Math.round(frequency * 10) / 10,
    };
  }
}

export const aiChatService = new AiChatService();
