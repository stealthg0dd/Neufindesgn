import knex from 'knex';
import { config } from 'dotenv';

config();

const db = knex({
  client: 'pg',
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
});

export default db;
