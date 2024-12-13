import * as sql from 'mssql';
import { dbConfig } from '../configuration/db_config';

let pool: sql.ConnectionPool;

export const connectDB = async () => {
    
        pool = await sql.connect(dbConfig);
        await pool.request().query('SELECT * FROM local')
    return pool;
};

// Exportar pool directamente
export { pool };
