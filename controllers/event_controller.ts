import { Request, Response } from 'express';
import { connectDB } from '../Database/database';
import { NeedResetById, updateLocalNeedResetById } from './hot_local_contoller';
import LogedUsers from './auth_controller'

export const addEvent = async (req: Request, res: Response) => {
    
    
    try {
        const pool = await connectDB();
        const { event_type, event_subtype, event_detail, StoreId,DhubOrderId } = req.body;
        
       
       
       // Validación de campos
        if (!event_type || !event_subtype || !event_detail || !StoreId) {
            return res.status(400).json({ message: "Bad Request. Please fill all fields." });
        }
        
        if (event_type ==="Notification" && event_subtype ==="Service Restart" ) {
            updateLocalNeedResetById(StoreId,false);
           
        }

        // Insertar el evento en la base de datos
        const result = await pool.request()
            .input('event_type', event_type)
            .input('event_subtype', event_subtype)
            .input('event_detail', event_detail)
            .input('StoreId', StoreId) // Agregar StoreId
            .input('DhubOrderId', DhubOrderId) // Agregar DhubOrderId (puede ser nulo)
            .query('INSERT INTO event (event_type, event_subtype, event_detail, StoreId, DhubOrderId) VALUES (@event_type, @event_subtype, @event_detail, @StoreId, @DhubOrderId)');
        
            const needReset = NeedResetById(StoreId); // Usar optional chaining para obtener needReset
            console.log("🚀 ~ addEvent ~ needReset:", needReset ,StoreId)
           
           
           

            // Enviar la respuesta como un objeto JSON que incluye needReset
            res.status(201).json({ 
                message: "Event added successfully", 
                result:result,
                needReset: needReset 
                
            });
    } catch (error: any) {
        res.status(500).send(error.message);
    }
           
    return;
};


export const getEvents = async (_req: Request, res: Response) => {
    const token = _req.headers.authorization?.split(' ')[1]||'';
    const Costumer = LogedUsers.LogedUsers[token].CostumerId;
    console.log("🚀 ~ getHotLocalStores ~ Costumer:", Costumer)
   
    
    try {
        const pool = await connectDB();

        // Obtener todas las incidencias de la base de datos
        const result = await pool.request().input('Costumer', Costumer).query(`SELECT  
   e.*,
   b.CustomerId

FROM 
    [statisticsST].[dbo].[event] e
JOIN 
    [statisticsST].[dbo].[stores] s
    ON e.[StoreId] = s.[Id]
	JOIN 
    [statisticsST].[dbo].[brands] b
    ON b.[Id] = s.[BrandId]
   WHERE 
                    b.CustomerId = @Costumer
    `);

        res.json(result.recordset);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
    return;
};

// Función para obtener una incidencia por su ID
export const getEventsById = async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1]||'';
    const Costumer = LogedUsers.LogedUsers[token].CostumerId;
    console.log("🚀 ~ getHotLocalStores ~ Costumer:", Costumer)
   
    try {
        const pool = await connectDB();
        const { id } = req.params; // El StoreId que viene en los parámetros de la URL

        // Ejecutar la consulta para obtener los eventos relacionados con el StoreId
        const result = await pool.request()
            .input('id', id)
            .input('Costumer', Costumer)
            .query(`
                SELECT e.*, b.CustomerId FROM 
                [statisticsST].[dbo].[event] e
                JOIN 
                [statisticsST].[dbo].[stores] s
                ON e.[StoreId] = s.[Id]
	            JOIN 
                [statisticsST].[dbo].[brands] b
                ON b.[Id] = s.[BrandId]
                WHERE s.[StoreId] = @id and b.CustomerId = @Costumer
            `);

        // Si no se encontraron eventos, devolver un error 404
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Events not found for the given StoreId." });
        }

        // Devolver los eventos encontrados
        res.json(result.recordset);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
    return;
};



export const methods = {
    addEvent,
    getEvents,
    getEventsById    
};
