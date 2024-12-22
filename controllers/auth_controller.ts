import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { connectDB } from '../Database/database';
import { User } from '../interfaces/User';
import { LogedUsersType } from '../interfaces/LogedUsersType';

interface CustomRequest extends Request {
    decodedToken?: any; // Agregar la propiedad decodedToken opcional al objeto Request
}

let LogedUsers: LogedUsersType = {}; // la llave es el JWT

// Controlador de inicio de sesión
const loginController = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        console.log('Intento de inicio de sesión con contraseña: ' + password);

        if (!username || !password) {
            return res.status(400).json({ message: "Nombre de usuario y contraseña requeridos" });
        }

        const pool = await connectDB();
        const result = await pool
            .request()
            .input('username', username)
            .query('SELECT * FROM [user] WHERE [User] = @username');

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: "Nombre de usuario o contraseña incorrectos" });
        }

        const usuario = result.recordset[0];
        const passwordMatch = await bcrypt.compare(password, usuario.Password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Nombre de usuario o contraseña incorrectos" });
        }

        const token = jwt.sign(
            { id: usuario.UserID, username: usuario.User },
            process.env.JWT_SECRET || '',
            { expiresIn: '24h' }
        );

        addLogin(token, username, usuario.CustomerId);

        return res.status(200).json({ token, CustomerId: usuario.CustomerId });

    } catch (error: any) {
        console.error('Error en el controlador de inicio de sesión:', error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};

// Función para agregar un usuario a los registrados
const addLogin = (token: string, username: string, CostumerId: string) => {
    const newUser: User = {
        username: username,
        CostumerId: CostumerId
    };
    LogedUsers[token] = newUser;

    console.log("🚀 ~ LogedUsers:", LogedUsers);
};
// funcion para borrar incioas de secion caducos
const clearLogedUsers = () => {
    const secret = process.env.JWT_SECRET || '';
    let hasDeleted = false; // Flag para rastrear si se eliminó algún LogedUser
    
    for (const token in LogedUsers) {
        try {
            // Intentar verificar el token
            jwt.verify(token, secret);
        } catch (error) {
            // Si el token no es válido, eliminarlo de LogedUsers
            console.log(`Token inválido eliminado: ${token}`);
            delete LogedUsers[token];
            hasDeleted = true; // Actualizar el flag
        }
    }
    
    if (hasDeleted) {
        console.log("Se eliminaron uno o más tokens inválidos de LogedUsers.");
    } else {
        console.log("Todos los tokens fueron validados correctamente. No se realizaron eliminaciones.");
    }
};


// Controlador para verificar el token
const verifyToken = (req: CustomRequest, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó un token JWT' });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || '');
        req.decodedToken = decodedToken;

        return res.status(200).json({ message: 'Token JWT válido' });
    } catch (error) {
        return res.status(401).json({ message: 'Token JWT inválido' });
    }
};

const createUserController = async (req: Request, res: Response) => {
    try {
        const { username, password, CostumerId } = req.body;

        // Validar que se reciban los datos necesarios
        if (!username || !password) {
            return res.status(400).json({ message: "Nombre de usuario y contraseña son requeridos" });
        }

        // Conectar a la base de datos
        const pool = await connectDB();

        // Verificar si el nombre de usuario ya existe
        const userExistsResult = await pool
            .request()
            .input('username', username)
            .query('SELECT * FROM [dbo].[user] WHERE [User] = @username');

        if (userExistsResult.recordset.length > 0) {
            return res.status(400).json({ message: "El nombre de usuario ya existe" });
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el nuevo usuario en la base de datos
        const insertResult = await pool
            .request()
            .input('username', username)
            .input('password', hashedPassword)
            .input('CostumerId', CostumerId || '6557a042-e394-40a4-9147-1edf361b02dc') // Si no se proporciona CostumerId, se usa el valor por defecto
            .query('INSERT INTO [dbo].[user] ([User], [Password], [CustomerId]) VALUES (@username, @password, @CostumerId)');

        // Retornar respuesta exitosa
        return res.status(201).json({ message:insertResult });

    } catch (error: any) {
        console.error('Error en el controlador de creación de usuario:', error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};



// Función para Limpiar LogedUsers cada 24H
const ClearLogedUsersEvery24Hours = () => {
    setInterval(() => {
        console.log('Ejecutando limpieza diaria de LogedUsers...');
        clearLogedUsers();
    }, 86400000); // 86,400,000 milisegundos = 24 horas
};

// Llamar a la función para iniciar la limpieza periódica
ClearLogedUsersEvery24Hours();

export const methods = { loginController, verifyToken,createUserController  };
export default  { LogedUsers};
