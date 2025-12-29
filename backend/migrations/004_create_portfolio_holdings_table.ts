import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('portfolio_holdings', (table) => {
    table.string('id').primary().notNullable();
    table.string('portfolio_id').references('id').inTable('portfolios').onDelete('CASCADE').notNullable();
    table.string('symbol').notNullable();
    table.decimal('shares', 15, 4).notNullable();
    table.decimal('average_cost', 15, 2).notNullable();
    table.decimal('current_price', 15, 2).nullable();
    table.decimal('value', 15, 2).nullable();
    table.decimal('gain_loss', 15, 2).nullable();
    table.decimal('gain_loss_percent', 8, 4).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes
    table.index(['portfolio_id']);
    table.index(['symbol']);
    table.unique(['portfolio_id', 'symbol']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('portfolio_holdings');
}
