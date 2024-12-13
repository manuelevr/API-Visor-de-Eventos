import { Router } from "express";
import { methods as localController } from "../controllers/local_contoller";

import { methods as eventController } from "../controllers/event_controller"; // Importar métodos del controlador de incidencias


import { methods as authController } from "../controllers/auth_controller"; // Importar métodos del controlador de marcas
//import { methods as eventController } from "../controllers/"; // Importar métodos del controlador de marcas

import { verifyTokenMiddleware } from "../middleware/session";
const router = Router();

// Locales
router.get("/local/", localController.getLocales);
router.get("/fulllocal/", verifyTokenMiddleware, localController.getFullLocales);
router.get("/localoperativo/", verifyTokenMiddleware, localController.getLocalesOpretivos);
router.get("/localbyid/:id", verifyTokenMiddleware, localController.getLocalById);
router.post("/local/", verifyTokenMiddleware, localController.addLocal);
router.post("/visivilidadlocal/",  localController.setOperativa);
router.delete("/localbyid/:id", verifyTokenMiddleware, localController.deleteLocal);
router.put("/localbyid/:id", verifyTokenMiddleware, localController.updateLocal);
//control de reinicio
router.get("/NeedResetSotres/",  localController.getHotLocalStores);
router.get("/NeedResetSotresByMarca/:marcaId", localController.getHotLocalStoresByMarca);
router.post("/updateNeedResetByBrandId/", localController.updateNeedResetByBrandId);
router.get("/NeedResetById/",localController.getNeedResetById);
router.post("/updateNeedResetById/", localController.updateNeedResetById);


// 
router.get("/events/",eventController.getEvents);
router.get("/eventsbyid/:id",eventController.getEventsById);
router.post("/event/", eventController.addEvent);




//rutas de autenticacion
router.post("/login/", authController.loginController);
router.post("/logincheck/", authController.verifyToken);
//router.post("/register/", authController.registerController);

export default router;

