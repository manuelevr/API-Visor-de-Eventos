import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';

// Definir una interfaz que extienda la interfaz Request de Express
interface CustomRequest extends Request {
    decodedToken?: any; // La propiedad decodedToken es opcional y puede contener cualquier tipo de valor
}

const verifyTokenMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
    // Obtener el token JWT del encabezado de autorización
   
    const token = req.headers.authorization?.split(' ')[1];
    //console.log("🚀 ~ verifyTokenMiddleware ~ token:", token)

    // Verificar si el token existe
    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó un token JWT' });
    }

    try {
        // Verificar y decodificar el token JWT
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'a');

        // Agregar el token decodificado a la solicitud para que esté disponible en rutas posteriores si es necesario
        req.decodedToken = decodedToken;

        // Continuar con la siguiente función de middleware
        next();
    } catch (error) {
        // Si hay algún error al verificar el token, devolver un código de estado 401 (No autorizado)
        return res.status(401).json({ message: 'Token JWT inválido' });
    }
    return;
};

export { verifyTokenMiddleware };
