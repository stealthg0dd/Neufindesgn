import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_settings', (table) => {
    table.string('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.jsonb('notifications').notNullable().defaultTo({
      email: true,
      push: false,
      portfolio: true,
      news: true,
      alphaUpdates: true,
    });
    table.jsonb('preferences').notNullable().defaultTo({
      theme: 'dark',
      currency: 'USD',
      riskTolerance: 'moderate',
    });
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes
    table.index(['user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_settings');
}
