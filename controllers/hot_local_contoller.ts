// localStores.ts
import { connectDB } from '../Database/database';

interface Store {
    Id: string;
    Name: string;
    StoreId: string;
    BrandId: string;
    CostumerId: string;
    needReset: boolean;
    isActive: boolean;
    lastRestart: Date;
}

let LocalStores: { [key: string]: Store } = {};

const fetchLocales = async (): Promise<{ [key: string]: Store }> => {
    const pool = await connectDB();
    const result = await pool.request().query(`
        SELECT 
            s.[Id], 
            s.[Name], 
            s.[StoreId], 
            e.[event_date], 
            s.BrandId, 
			b.CustomerId,
            ss.Estado AS isActive
        FROM 
            [statisticsST].[dbo].[stores] s
        LEFT JOIN 
            [statisticsST].[dbo].[event] e ON s.[Id] = e.[StoreId] AND e.[event_subtype] = 'Service Restart' AND e.[event_type] ='Notification'
        LEFT JOIN 
            [statisticsST].[dbo].[StoreStatus] ss ON ss.StoreId = s.Id
			LEFT JOIN 
            [statisticsST].[dbo].[brands]b ON b.Id = s.BrandId
        ORDER BY 
            s.[StoreId]
    `);
    
    const localesDict: { [key: string]: Store } = {};
    result.recordset.forEach((item: any) => {
        localesDict[item.Id] = {
            Id: item.Id,
            Name: item.Name,
            StoreId: item.StoreId,
            BrandId: item.BrandId,
            CostumerId: item.CustomerId, // Asegúrate de que esta columna esté en tu consulta si es necesaria
            needReset: false,
            isActive: item.isActive, // Mapeo de isActive desde ss.Estado
            lastRestart: new Date(item.event_date) 
        };
    });
    
    console.log("🚀 ~ fetchLocales ~ localesDict:", localesDict)
   // console.log("🚀 ~ fetchLocales ~ localesDict:", localesDict)
    return localesDict;
};

 const initializeTiendas = async () => {
    if (Object.keys(LocalStores).length === 0) {
        try {
            LocalStores = await fetchLocales();
        } catch (error) {
            console.error("Error al inicializar locales:", error);
        }
    } else {
        console.log("Tiendas ya están inicializadas.");
    }
};
export const updateTiendas = async (): Promise<void> => {
    if (Object.keys(LocalStores).length === 0) {
        console.log("LocalStores no está inicializado. No se puede actualizar lastRestart.");
        return;
    }

    const pool = await connectDB();
    const result = await pool.request().query(`
        SELECT s.[Id], e.[event_date], s.BrandId, ss.Estado AS isActive
        FROM [statisticsST].[dbo].[stores] s
        LEFT JOIN [statisticsST].[dbo].[event] e ON s.[Id] = e.[StoreId] AND e.[event_subtype] = 'Service Restart' AND e.[event_type] ='Notification'
        LEFT JOIN [statisticsST].[dbo].[StoreStatus] ss ON ss.StoreId = s.Id
    `);

    result.recordset.forEach((item: any) => {
        const store = LocalStores[item.Id];
        if (store) {
            store.lastRestart = new Date(item.event_date) ; // Asegúrate de convertir a Date si es necesario
            store.BrandId = item.BrandId;
            store.isActive = item.isActive; // Actualiza el estado isActive
        }
    });

    console.log("lastRestart e isActive actualizados para todas las tiendas.");
}
export const updateLocalNeedResetById = (id: string, needReset: boolean) => {
    if (LocalStores[id]) {
        // Actualiza el valor de needReset
        console.log("🚀 ~ updateLocalNeedResetById ~ LocalStores[id]:", LocalStores[id])
        LocalStores[id].needReset = needReset; // Asegúrate de acceder a la propiedad needReset
        console.log("🚀 ~ updateLocalNeedResetById Despues ~ LocalStores[id]:", LocalStores[id])
        return LocalStores[id]; // Devuelve el local actualizado
    } else {
        throw new Error("Local no encontrado."); // Lanza un error si no se encuentra el local
    }
};
export const updateByBrandId = (brandId: string, needReset: boolean) => {
    // Verificar si hay locales en LocalStores
    if (Object.keys(LocalStores).length === 0) {
        console.log("No hay locales para actualizar.");
        return;
    }

    let updatedCount = 0; // Contador para saber cuántos locales fueron actualizados

    // Iterar sobre cada local en LocalStores
    for (const id in LocalStores) {
        const store = LocalStores[id]; // Obtener el local actual

        // Verificar si el BrandId coincide
        if ( LocalStores[id].BrandId === brandId|| brandId ==="All") {
            LocalStores[id].needReset = needReset; // Actualizar el valor de needReset
            updatedCount++; // Incrementar el contador de actualizaciones
            console.log(`Actualizado local ${store.StoreId}: needReset = ${store.needReset}`);
        }
    }
    
    // Mensaje final sobre cuántos locales fueron actualizados
    
    if (updatedCount > 0) {
        console.log(`Se actualizaron ${updatedCount} locales con BrandId ${brandId}.`);
    } else {
        console.log(`No se encontraron locales con BrandId ${brandId}.`);
    }
};
export const NeedResetById = (id: string, ): boolean => {
    return LocalStores[id].needReset ; // Devuelve el local actualizado
    
};


initializeTiendas();
export { LocalStores };