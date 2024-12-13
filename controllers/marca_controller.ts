import { Request, Response } from 'express';
import { connectDB } from '../Database/database';

export const addMarca = async (req: Request, res: Response) => {
    try {
        const pool = await connectDB();
        const { nombre, cliente_id } = req.body;

        // Validación de campos
        if (!nombre || !cliente_id) {
            return res.status(400).json({ message: "Bad Request. Please fill all fields." });
        }

        // Verificar si el cliente existe
        const cliente = await pool.request()
            .input('cliente_id', cliente_id)
            .query('SELECT * FROM cliente WHERE id = @cliente_id');

        if (cliente.recordset.length === 0) {
            return res.status(404).json({ message: "Client not found." });
        }

        // Insertar la marca en la base de datos
        const result = await pool.request()
            .input('nombre', nombre)
            .input('cliente_id', cliente_id)
            .query('INSERT INTO marca (nombre, cliente_id) VALUES (@nombre, @cliente_id)');

        res.json(result);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
    return;
};

export const getMarca = async (req: Request, res: Response) => {
    try {
        const pool = await connectDB();
        const { id } = req.params;
        const result = await pool.request()
            .input('id', id)
            .query('SELECT * FROM marca WHERE id = @id');
        res.json(result.recordset);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
};

export const getMarcas = async (_req: Request, res: Response) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query('SELECT * FROM marca');
        res.json(result.recordset);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
};

export const updateMarca = async (req: Request, res: Response) => {
    try {
        const pool = await connectDB();
        const { nombre, cliente_id } = req.body;
        const { id } = req.params;

        // Validación de campos
        if (!nombre || !cliente_id) {
            return res.status(400).json({ message: "Bad Request. Please fill all fields." });
        }

        // Verificar si el cliente existe
        const cliente = await pool.request()
            .input('cliente_id', cliente_id)
            .query('SELECT * FROM cliente WHERE id = @cliente_id');

        if (cliente.recordset.length === 0) {
            return res.status(404).json({ message: "Client not found." });
        }

        // Actualizar la marca en la base de datos
        const result = await pool.request()
            .input('nombre', nombre)
            .input('cliente_id', cliente_id)
            .input('id', id)
            .query('UPDATE marca SET nombre = @nombre, cliente_id = @cliente_id WHERE id = @id');

        res.json(result);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
    return;
};

export const deleteMarca = async (req: Request, res: Response) => {
    try {
        const pool = await connectDB();
        const { id } = req.params;
        const result = await pool.request()
            .input('id', id)
            .query('DELETE FROM marca WHERE id = @id');
        res.json(result);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
};

export const methods = { addMarca, getMarca, getMarcas, updateMarca, deleteMarca };
