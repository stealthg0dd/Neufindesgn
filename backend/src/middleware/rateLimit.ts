import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { ApiResponse } from '../types';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req: Request) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return `rate_limit:${ip}`;
    },
    skipSuccessfulRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      const current = await redisClient.get(key);
      const requests = current ? parseInt(current, 10) : 0;

      if (requests >= maxRequests) {
        await redisClient.expire(key, Math.ceil(windowMs / 1000));
        
        const response: ApiResponse = {
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
        };
        
        return res.status(429).json(response);
      }

      await redisClient.set(key, (requests + 1).toString(), Math.ceil(windowMs / 1000));

      if (skipSuccessfulRequests) {
        res.on('finish', async () => {
          if (res.statusCode < 400) {
            await redisClient.del(key);
          }
        });
      }

      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - requests - 1).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString(),
      });

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next();
    }
  };
}

export const generalRateLimit = createRateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
});

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
});

export const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user ? `api_limit:${user.id}` : `api_limit:${req.ip}`;
  },
});
