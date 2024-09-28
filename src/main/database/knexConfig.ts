// release/app/knexConfig.ts
import { Knex } from 'knex';

const createKnexConfig = (dbFilePath: string): { [key: string]: Knex.Config } => {
  return {
    development: {
      client: 'better-sqlite3',
      connection: {
        filename: dbFilePath,  // Use the dynamic path passed as an argument
      },
      useNullAsDefault: true, // Required for SQLite
    },
    production: {
      client: 'better-sqlite3',
      connection: {
        filename: dbFilePath,  // Use the dynamic path passed as an argument
      },
      useNullAsDefault: true, // Required for SQLite
    },
  };
};

export default createKnexConfig;
