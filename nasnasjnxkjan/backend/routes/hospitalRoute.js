import express from 'express';
import { loginHospital, appointmentHospital, appointmentCancel, hospitalList, changeAvailablity, appointmentComplete, hospitalDashboard, hospitalProfile, updateHospitalProfile, quantityHospital } from '../controllers/hospitalController.js';
import authHospital from '../middleware/authDoctor.js';
const hospitalRouter = express.Router();

hospitalRouter.post("/cancel-appointment", authHospital, appointmentCancel)
hospitalRouter.post("/login", loginHospital)
hospitalRouter.get("/appointments", authHospital, appointmentHospital)
hospitalRouter.get("/list", hospitalList)
hospitalRouter.post("/change-availability", authHospital, changeAvailablity)
hospitalRouter.post("/complete-appointment", authHospital, appointmentComplete)
hospitalRouter.get("/dashboard", authHospital, hospitalDashboard)
hospitalRouter.get("/profile", authHospital, hospitalProfile)
hospitalRouter.post("/update-profile", authHospital, updateHospitalProfile)
hospitalRouter.get("/vaccinelist/:id", quantityHospital)



export default hospitalRouter;