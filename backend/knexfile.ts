import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || 'postgresql://localhost:5432/neufin',
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
  
  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
    acquireConnectionTimeout: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
  },
  
  test: {
    client: 'postgresql',
    connection: process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/neufin_test',
    pool: {
      min: 1,
      max: 5,
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};

export default config;
