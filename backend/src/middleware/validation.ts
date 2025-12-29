import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '../types';

export function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => detail.message);
      const response: ApiResponse = {
        success: false,
        error: 'Validation failed',
        message: details.join(', '),
      };
      return res.status(400).json(response);
    }

    req.body = value;
    next();
  };
}

export const schemas = {
  userSettings: Joi.object({
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      push: Joi.boolean().optional(),
      portfolio: Joi.boolean().optional(),
      news: Joi.boolean().optional(),
      alphaUpdates: Joi.boolean().optional(),
    }).optional(),
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark').optional(),
      currency: Joi.string().valid('USD', 'EUR', 'GBP').optional(),
      riskTolerance: Joi.string().valid('conservative', 'moderate', 'aggressive').optional(),
    }).optional(),
  }),

  portfolio: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    holdings: Joi.array().items(
      Joi.object({
        symbol: Joi.string().required(),
        shares: Joi.number().positive().required(),
        averageCost: Joi.number().positive().required(),
      })
    ).min(1).required(),
  }),

  portfolioUpdate: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    holdings: Joi.array().items(
      Joi.object({
        symbol: Joi.string().required(),
        shares: Joi.number().positive().required(),
        averageCost: Joi.number().positive().required(),
      })
    ).optional(),
  }),

  chatMessage: Joi.object({
    message: Joi.string().min(1).max(1000).required(),
  }),

  watchlist: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    symbols: Joi.array().items(Joi.string()).min(1).max(50).required(),
  }),

  alert: Joi.object({
    symbol: Joi.string().required(),
    type: Joi.string().valid('price_above', 'price_below', 'volume_spike', 'news_sentiment').required(),
    threshold: Joi.number().required(),
    isActive: Joi.boolean().optional(),
  }),
};

export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => detail.message);
      const response: ApiResponse = {
        success: false,
        error: 'Query validation failed',
        message: details.join(', '),
      };
      return res.status(400).json(response);
    }

    req.query = value;
    next();
  };
}

export const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  stockData: Joi.object({
    symbol: Joi.string().required(),
    interval: Joi.string().valid('1m', '5m', '15m', '1h', '1d', '1w', '1M').default('1d'),
    start: Joi.date().optional(),
    end: Joi.date().optional(),
  }),

  dateRange: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
  }),
};
