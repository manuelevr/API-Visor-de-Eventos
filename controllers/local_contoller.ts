import { Request, Response } from 'express';
import { connectDB } from '../Database/database';
import {LocalStores,updateLocalNeedResetById,updateTiendas,updateByBrandId} from './hot_local_contoller';
//import initializeTiendas from './hot_local_contoller';




export const getHotLocalStores = async (_req: Request, res: Response) => {
    await updateTiendas(); // Aseguramos que las tiendas estén inicializadas
    
    //console.log("🚀 ~ LocalStores:", LocalStores);

    try {
        // Mapeamos los datos de 'LocalStores' a un nuevo array con los campos requeridos
        const locales = Object.values(LocalStores)
            .filter(local => local.isActive) // Filtramos locales activos
            .map((local) => ({
                local_id: local.Id,
                numero_del_local: local.StoreId,
                local_nombre: local.Name,
                marcas: local.BrandId,  
                needReset: local.needReset, // Incluyendo el campo needReset
                lastRestart: local.lastRestart || null // Asignando un valor por defecto si está undefined
            }));

        // Respondemos con el array de locales activos
        //console.log("🚀 ~ getHotLocalStores ~ locales:", locales);
        res.json(locales);
    } catch (error: any) {
        console.error("Error al obtener tiendas desde memoria:", error);
        res.status(500).send(error.message);
    }
};
export const getHotLocalStoresByMarca = async (req: Request, res: Response) => {
    const { marcaId } = req.params; // Obtenemos el ID de la marca desde los parámetros de la URL

    await updateTiendas(); // Aseguramos que las tiendas estén inicializadas
    
    //console.log("🚀 ~ LocalStores:", LocalStores);

    try {
        // Filtramos los locales por la marca específica
        const locales = Object.values(LocalStores)
            .filter((local) => local.BrandId === marcaId) // Filtramos por ID de marca
            .map((local) => ({
                local_id: local.Id,
                numero_del_local: local.StoreId,
                local_nombre: local.Name,
                marcas: local.BrandId,
                needReset: local.needReset, // Incluyendo el campo needReset
                lastRestart: local.lastRestart || null // Asignando un valor por defecto si está undefined
            }));

        // Respondemos con el array de locales filtrados
       // console.log("🚀 ~ getHotLocalStoresByMarca ~ locales:", locales);
        res.json(locales);
    } catch (error: any) {
        console.error("Error al obtener tiendas desde memoria:", error);
        res.status(500).send(error.message);
    }
};

export const getNeedResetById = async (req: Request, res: Response) => {
    //await initializeTiendas(); // Asegúrate de que las tiendas estén inicializadas
    
    const { id } = req.body; // Obtiene el ID del cuerpo de la solicitud

    // Busca el local correspondiente en el diccionario de tiendas
    const local = LocalStores[id];

    if (local) {
        // Si se encuentra, devuelve el valor de needReset
        res.json({ needReset: local.needReset });
    } else {
        // Si no se encuentra, responde con un error 404
        res.status(404).json({ message: "Local no encontrado." });
    }
};
export const updateNeedResetById = async (req: Request, res: Response) => {
    const { id, needReset } = req.body; // Obtiene el ID y el nuevo valor de needReset del cuerpo de la solicitud

    try {
        const updatedLocal = updateLocalNeedResetById(id, needReset); // Llama a la función externa
        res.json({ message: "Local actualizado", local: updatedLocal });
    } catch (error:any) {
        // Maneja el error si no se encuentra el local
        res.status(404).json({ message: error.message });
    }
};
export const updateNeedResetByBrandId = async (req: Request, res: Response) => {
    const { brandId, needReset } = req.body; // Obtiene el ID y el nuevo valor de needReset del cuerpo de la solicitud
    
    try {
        updateByBrandId(brandId, needReset); // Llama a la función externa
        res.json({ message: "Locales actualizados"});
    } catch (error:any) {
        // Maneja el error si no se encuentra el local
        res.status(404).json({ message: error.message });
    }
};
export const getLocales = async (_req: Request, res: Response) => {
    
    
    try {
        const pool = await connectDB();
        const result = await pool.request().query('SELECT * FROM stores');
        res.json(result.recordset);
    } catch (error: any) {
        res.status(500).send(error.message);
    } 
};
export const getFullLocales = async (_req: Request, res: Response) => {
    //console.log("🚀 ~ tiendasLength:", LocalStores.length)
   
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
           SELECT 
    s.Id AS local_id,               -- Id del local (stores.Id)
    s.StoreId AS numero_del_local,  -- Número del local (stores.StoreId)
    s.Name AS local_nombre,          -- Nombre del local (stores.Name)
    b.Name AS marcas,             -- Marca del local (brands.Name)
	ss.Estado AS Operativa 
   

FROM 
    [statisticsST].[dbo].[stores] s
INNER JOIN 
    [statisticsST].[dbo].[brands] b ON s.BrandId = b.Id
INNER JOIN 
    [statisticsST].[dbo].[StoreStatus] ss ON ss.StoreId = s.Id -- Unir con StoreStatus



ORDER BY 
    s.StoreId ASC;

    
    
    `);
    res.json(result.recordset);
} catch (error: any) {
    res.status(500).send(error.message);
} 
};
export const getLocalesOpretivos = async (_req: Request, res: Response) => {
    //console.log("🚀 ~ tiendasLength:", LocalStores.length)
   
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
           SELECT 
    s.Id AS local_id,               -- Id del local (stores.Id)
    s.StoreId AS numero_del_local,  -- Número del local (stores.StoreId)
    s.Name AS local_nombre,          -- Nombre del local (stores.Name)
    b.Name AS marcas,                -- Marca del local (brands.Name)

    -- Determina el estado de la tienda como "Operativa" o "Fuera de Servicio" basado en keep alive.
    CASE 
        WHEN EXISTS (
            SELECT 1
            FROM [statisticsST].[dbo].[event] e
            WHERE e.StoreId = s.Id  
            AND e.event_subtype = 'keep alive' 
            AND e.event_date >= DATEADD(MINUTE, -15, GETDATE())
        ) THEN 'Operativa'
        ELSE 'Fuera de Servicio'
    END AS estado,

    -- Verifica si ha habido intentos fallidos de login SQL en los últimos 15 minutos.
    -- Si hay un fallo, concatena el mensaje con la última fecha del evento.
    CASE 
        WHEN EXISTS (
            SELECT 1
            FROM [statisticsST].[dbo].[event] e_sql
            WHERE e_sql.StoreId = s.Id  
            AND e_sql.event_subtype = 'SQL LOGIN'
            AND e_sql.event_date >= DATEADD(MINUTE, -6, GETDATE())
        ) THEN CONCAT('Fallo - ', (
            SELECT TOP 1 CONVERT(VARCHAR, e_sql.event_date, 120)
            FROM [statisticsST].[dbo].[event] e_sql
            WHERE e_sql.StoreId = s.Id
            AND e_sql.event_subtype = 'SQL LOGIN'
            AND e_sql.event_date >= DATEADD(MINUTE, -15, GETDATE())
            ORDER BY e_sql.event_date DESC
        ))
        ELSE 'Conectado'
    END AS estado_sql_login

FROM 
    [statisticsST].[dbo].[stores] s
INNER JOIN 
    [statisticsST].[dbo].[brands] b ON s.BrandId = b.Id
INNER JOIN 
    [statisticsST].[dbo].[StoreStatus] ss ON ss.StoreId = s.Id -- Unir con StoreStatus

WHERE 
    ss.Estado = 1  -- Filtrar por aquellos que tienen Estado = 1 (operativa)

ORDER BY 
    s.StoreId ASC;

    
    
    `);
    res.json(result.recordset);
} catch (error: any) {
    res.status(500).send(error.message);
} 
};

export const getLocalById = async (req: Request, res: Response) => {
    
    try {
        const pool = await connectDB();
        const { id } = req.params;
        const result = await pool.request()
        .input('id', id)
        .query('SELECT * FROM local WHERE id = @id');
        res.json(result.recordset);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
};

export const deleteLocal = async (req: Request, res: Response) => {
    try {
        const pool = await connectDB();
        const { id } = req.params;
        const result = await pool.request()
            .input('id', id)
            .query('DELETE FROM local WHERE id = @id');
        res.json(result);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
};

export const updateLocal = async (req: Request, res: Response) => {
    try {
        const pool = await connectDB();
        const { id } = req.params;
        const { numero_del_local, nombre, estado } = req.body;
        
        if (!numero_del_local || !nombre || !estado) {
            return res.status(400).json({ message: "Bad Request. Please fill all fields." });
        }

        const result = await pool.request()
            .input('numero_del_local', numero_del_local)
            .input('nombre', nombre)
            .input('estado', estado)
            .input('id', id)
            .query('UPDATE local SET numero_del_local = @numero_del_local, nombre = @nombre, estado = @estado WHERE id = @id');
        
        res.json(result);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
return;
};

export const addLocal = async (req: Request, res: Response) => {
    try {
        const pool = await connectDB();
        const { id, numero_del_local, nombre, estado } = req.body;

        if (!id || !numero_del_local || !nombre || !estado) {
            return res.status(400).json({ message: "Bad Request. Please fill all fields." });
        }

        const result = await pool.request()
            .input('id', id)
            .input('numero_del_local', numero_del_local)
            .input('nombre', nombre)
            .input('estado', estado)
            .query('INSERT INTO local (id, numero_del_local, nombre, estado) VALUES (@id, @numero_del_local, @nombre, @estado)');
        
        res.json(result);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
    return;
};
export const setOperativa = async (req: Request, res: Response) => {
    try {
        const pool = await connectDB();
        const { id, Operativo } = req.body;
        //console.log("🚀 ~ setOperativa ~ Operativo:", Operativo)
        //console.log("🚀 ~ setOperativa ~ id:", id)
       

        // Realizamos el UPDATE a la tabla StoreStatus
        const result = await pool.request()
            .input('StoreId', id)                    // StoreId del local
            .input('Estado', Operativo)              // Estado que quieres establecer (true o false)
            .query(`
                UPDATE [statisticsST].[dbo].[StoreStatus]
                SET [Estado] = @Estado
                WHERE [StoreId] = @StoreId
            `);

        // Si la actualización no afectó ninguna fila
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // Enviar respuesta exitosa al cliente
        return res.json({ message: 'Store status updated successfully', result });
    } catch (error: any) {
        // Manejo de errores
        //console.log("🚀 ~ setOperativa ~ error.message:", error.message)
        return res.status(500).json({ message: error.message });
    }
};


export const methods = {setOperativa, getLocales, getHotLocalStores ,getHotLocalStoresByMarca,updateNeedResetByBrandId, updateNeedResetById, getNeedResetById,addLocal, getLocalById, deleteLocal, updateLocal, getFullLocales,getLocalesOpretivos };
