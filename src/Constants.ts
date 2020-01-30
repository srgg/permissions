import * as dotenv from 'dotenv';
import * as fs from "fs";
import { Connection, getConnection } from 'typeorm';
import { createLogger, format, Logger, transports } from 'winston';

dotenv.config();

export const logger: Logger = createLogger({
  transports: [
    new transports.Console({
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.colorize({ colors: { info: 'blue', error: 'red' } }),
        format.errors({ stack: true }),
        format.splat(),
        format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
      )
    })
  ]
});

export const USER_GROUPS_SUB_QUERY: string =
  '(SELECT GROUP_CONCAT(ug.groupId) FROM users_groups ug WHERE ug.userId = prime.id) as groups';
export const CREATE_PERMISSION_CONFLICT: string = 'Can not create permission because of a data conflict';
export const CHARSET: string = 'utf8';
const DB_DDL_QUERY_PATH: string | undefined = process.env.DB_DDL_PATH;
const DB_DDL_QUERY: string | undefined = DB_DDL_QUERY_PATH && fs.readFileSync(DB_DDL_QUERY_PATH, CHARSET);

const DB_DML_QUERY_PATH: string | undefined = process.env.DB_DML_PATH;
const DB_DML_QUERY: string | undefined = DB_DML_QUERY_PATH && fs.readFileSync(DB_DML_QUERY_PATH, CHARSET);

export async function initDB(): Promise<void> {
  // create DB's stored procedures with the insertion of built-in data.
  const connection: Connection = await getConnection();
  try {
    logger.info('DDL: %s; %s', DB_DDL_QUERY_PATH, DB_DDL_QUERY);
    await connection.query(DB_DDL_QUERY as string);
  } catch (e) {
    if (e.code === 'ER_SP_ALREADY_EXISTS') {
      logger.info('Stored procedure already exists');
    } else {
      throw new Error(`Can not create stored procedure: ${e.toString()}`);
    }
  }
  try {
    // Built-in data
    await connection.query(DB_DML_QUERY as string);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      logger.info('Built-in data already exists');
    } else {
      throw new Error(`Can not insert built-in data: ${e.toString()}`);
    }
  }
}
