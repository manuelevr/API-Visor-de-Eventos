import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { connectDB } from '../Database/database';

interface CustomRequest extends Request {
    decodedToken?: any; // Agregar la propiedad decodedToken opcional al objeto Request
}

const loginController = async (req: Request, res: Response) => {
    try {
        // Recibir datos de la solicitud (por ejemplo, nombre de usuario y contraseña)
        const { username, password } = req.body;
        console.log('Intento de inicio de sesión con contraseña: ' + password);

        // Verificar si el nombre de usuario y la contraseña son válidos
        if (!username || !password) {
            return res.status(400).json({ message: "Nombre de usuario y contraseña requeridos" });
        }

        // Conectar a la base de datos
        const pool = await connectDB();

        // Consultar la base de datos para verificar las credenciales
        const result = await pool
        .request()
        .input('username', username)
        .query('SELECT * FROM [user] WHERE [User] = @username');
        
        console.log("🚀 ~ loginController ~ result:", result)
        // Verificar si se encontraron resultados
        if (result.recordset.length === 0) {
            return res.status(401).json({ message: "Nombre de usuario o contraseña incorrectos" });
        }

        // Verificar la contraseña utilizando bcrypt
        const usuario = result.recordset[0];
        console.log(usuario.Password); // Cambiado de "contraseña" a "Password"
        const passwordMatch = await bcrypt.compare(password, usuario.Password); // Cambiado de "contraseña" a "Password"

        if (!passwordMatch) {
           return res.status(401).json({ message: "Nombre de usuario o contraseña incorrectos" });
        }

        // Si las credenciales son válidas, generar un token JWT
        const token = jwt.sign({ id: usuario.UserID, username: usuario.User }, process.env.JWT_SECRET || '', { expiresIn: '24h' });
        console.log("🚀 ~ loginController ~ token:", token)

        // Devolver el token JWT como respuesta
        return res.status(200).json({ token,CustomerId:usuario.CustomerId });

    } catch (error: any) {
        console.error('Error en el controlador de inicio de sesión:', error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};


const verifyToken = (req: CustomRequest, res: Response) => {
    // Obtener el token JWT del encabezado de autorización
    const token = req.headers.authorization?.split(' ')[1];

    // Verificar si el token existe
    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó un token JWT' });
    }

    try {
        // Verificar y decodificar el token JWT
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'a');

        // Agregar el token decodificado a la solicitud para que esté disponible en rutas posteriores si es necesario
        req.decodedToken = decodedToken;

        // Devolver un mensaje indicando que el token es válido
        return res.status(200).json({ message: 'Token JWT válido' });
    } catch (error) {
        // Si hay algún error al verificar el token, devolver un código de estado 401 (No autorizado)
        return res.status(401).json({ message: 'Token JWT inválido' });
    }
};

export const methods = { loginController, verifyToken };