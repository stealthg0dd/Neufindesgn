import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('bias_analyses', (table) => {
    table.string('id').primary().notNullable();
    table.string('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('bias_type').notNullable();
    table.string('severity').notNullable(); // 'low', 'medium', 'high'
    table.text('description').notNullable();
    table.text('recommendation').notNullable();
    table.timestamp('detected_at').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes
    table.index(['user_id']);
    table.index(['bias_type']);
    table.index(['severity']);
    table.index(['detected_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('bias_analyses');
}
