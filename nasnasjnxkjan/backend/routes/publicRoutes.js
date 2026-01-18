import express from 'express';
import { searchHospitals, searchSuggestion } from '../controllers/userController.js';

const publicRoutes = express.Router();

publicRoutes.get("/hospital-search", searchHospitals)
publicRoutes.get("/hospital-suggestion", searchSuggestion)

export default publicRoutes;