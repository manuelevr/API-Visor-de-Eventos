import * as sql from 'mssql';
import { config } from "dotenv";
config();
const params ={
    server: process.env.HOST || 'localhost\\SQLEXPRESS',
    database: process.env.DATABASE || 'api',
    user: process.env.USER || 'Admin',
    password: process.env.PASSWORD || 'a',
    options: {
        trustedConnection: true,
        encrypt: true,
        trustServerCertificate: true
    }
};
export const dbConfig: sql.config = params;



