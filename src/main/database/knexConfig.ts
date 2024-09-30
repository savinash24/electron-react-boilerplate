import { Knex } from 'knex';
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
