import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('alpha_signals', (table) => {
    table.string('id').primary().notNullable();
    table.string('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('asset').notNullable();
    table.string('direction').notNullable(); // 'bullish', 'bearish', 'neutral'
    table.decimal('confidence', 3, 2).notNullable(); // 0.00-1.00
    table.string('time_horizon').notNullable(); // 'short', 'medium', 'long'
    table.text('insight').notNullable();
    table.integer('sources').notNullable();
    table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
    table.string('category').notNullable();
    
    // Indexes
    table.index(['user_id']);
    table.index(['asset']);
    table.index(['direction']);
    table.index(['timestamp']);
    table.index(['confidence']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('alpha_signals');
}
