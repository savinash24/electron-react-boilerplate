exports.up = function(knex) {
    return knex.schema.createTable('users', function(table) {
      table.increments('id').primary();  // Auto-incrementing primary key
      table.string('name').notNullable(); // User name
      table.string('email').notNullable().unique(); // Unique email address
      table.string('password').notNullable(); // Password field
      table.timestamp('created_at').defaultTo(knex.fn.now()); // Timestamp of when the user is created
      table.timestamp('updated_at').defaultTo(knex.fn.now()); // Timestamp of the last update
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('users');
  };
  