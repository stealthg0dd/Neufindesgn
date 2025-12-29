import { createClient } from 'redis';
import { config } from 'dotenv';

config();

class RedisClient {
  private client: any;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err: any) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    await this.connect();
    if (expireInSeconds) {
      await this.client.setEx(key, expireInSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    await this.connect();
    return await this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.connect();
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    await this.connect();
    return await this.client.exists(key);
  }

  async keys(pattern: string): Promise<string[]> {
    await this.connect();
    return await this.client.keys(pattern);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.connect();
    await this.client.hSet(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | undefined> {
    await this.connect();
    return await this.client.hGet(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    await this.connect();
    return await this.client.hGetAll(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.connect();
    await this.client.expire(key, seconds);
  }
}

export const redisClient = new RedisClient();
