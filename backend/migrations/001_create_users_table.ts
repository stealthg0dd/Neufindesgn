import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.string('id').primary().notNullable();
    table.string('email').unique().notNullable();
    table.string('name').nullable();
    table.string('avatar').nullable();
    table.string('provider').defaultTo('google').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes
    table.index(['email']);
    table.index(['provider']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}
