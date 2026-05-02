import express from 'express';
import { forgotPassword, resetPassword, searchHospitals, searchSuggestion, verifyCerti } from '../controllers/userController.js';

const publicRoutes = express.Router();

publicRoutes.get("/hospital-search", searchHospitals)
publicRoutes.get("/hospital-suggestion", searchSuggestion)
publicRoutes.get("/verify-vaccine", verifyCerti)
publicRoutes.post("/reset-password/:token", resetPassword)
publicRoutes.post("/reset-password-email", forgotPassword)

export default publicRoutes;