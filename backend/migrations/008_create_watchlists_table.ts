import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('watchlists', (table) => {
    table.string('id').primary().notNullable();
    table.string('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('name').notNullable();
    table.jsonb('symbols').notNullable(); // Array of stock symbols
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes
    table.index(['user_id']);
    table.index(['updated_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('watchlists');
}
