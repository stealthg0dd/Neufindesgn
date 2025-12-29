import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('chat_messages', (table) => {
    table.string('id').primary().notNullable();
    table.string('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.text('message').nullable(); // User message
    table.text('response').nullable(); // AI response
    table.string('type').notNullable(); // 'user' or 'assistant'
    table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes
    table.index(['user_id']);
    table.index(['timestamp']);
    table.index(['type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('chat_messages');
}
