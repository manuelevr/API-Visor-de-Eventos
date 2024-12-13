import express from 'express';
import cors from 'cors';
import languageRoutes from "../routes/routes";

const app = express();
const PORT = 3000;

// Habilita el uso de JSON en las solicitudes
app.use(express.json());

// Configura el middleware CORS
app.use(cors());

// Configura las rutas de la aplicación
app.use(languageRoutes);

// Ruta de prueba
app.get('/ping', (_req, res) => {
    console.log("Recibí Ping");
    res.send("OK");
});

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`La aplicación está escuchando en el puerto ${PORT}`);
});
