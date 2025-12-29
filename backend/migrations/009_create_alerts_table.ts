import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('alerts', (table) => {
    table.string('id').primary().notNullable();
    table.string('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('symbol').notNullable();
    table.string('type').notNullable(); // 'price_above', 'price_below', 'volume_spike', 'news_sentiment'
    table.decimal('threshold', 15, 2).notNullable();
    table.boolean('is_active').defaultTo(true).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('triggered_at').nullable();
    
    // Indexes
    table.index(['user_id']);
    table.index(['symbol']);
    table.index(['type']);
    table.index(['is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('alerts');
}
