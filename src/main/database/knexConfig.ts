// // release/app/knexConfig.ts
// import { Knex } from 'knex';

// const createKnexConfig = (dbFilePath: string): { [key: string]: Knex.Config } => {
//   return {
//     development: {
//       client: 'better-sqlite3',
//       connection: {
//         filename: dbFilePath,  // Use the dynamic path passed as an argument
//       },
//       useNullAsDefault: true, // Required for SQLite
//     },
//     production: {
//       client: 'better-sqlite3',
//       connection: {
//         filename: dbFilePath,  // Use the dynamic path passed as an argument
//       },
//       useNullAsDefault: true, // Required for SQLite
//     },
//   };
// };

// export default createKnexConfig;
// release/app/knexConfig.ts
// release/app/knexConfig.ts
import { Knex } from 'knex';
import path from 'path';

// Set the base path for migrations

// const migrationsDir = path.join(__dirname, 'main/database/migrations');
// console.log({migrationsDir});

const createKnexConfig = (
  dbFilePath: string,
  migrationPath: any = '',
): { [key: string]: Knex.Config } => {
  return {
    development: {
      client: 'better-sqlite3',
      connection: {
        filename: dbFilePath,
      },
      useNullAsDefault: true,
      migrations: {
        directory: migrationPath, // Fixed path to migrations
      },
    },
    production: {
      client: 'better-sqlite3',
      connection: {
        filename: dbFilePath,
      },
      useNullAsDefault: true,
      migrations: {
        directory: migrationPath, // Fixed path to migrations
      },
    },
  };
};

export default createKnexConfig;
