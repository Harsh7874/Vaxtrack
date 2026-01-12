import express from 'express';
import { vaccineList, vaccineProfile } from '../controllers/vaccineController.js';
const vaccineRouter = express.Router();
vaccineRouter.get("/list", vaccineList)
vaccineRouter.get("/profile", vaccineProfile)
export default vaccineRouter;