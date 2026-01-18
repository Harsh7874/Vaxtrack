import express from 'express';
import { loginAdmin, appointmentCancel, addHospital, allHospitals, adminDashboard, addVaccine, allVaccines,changeAvailablity, appointmentAdmin, updateHospitalVaccine, listRequestsAdmin, approveRejectRequest } from '../controllers/adminController.js';
// import { changeAvailablity } from '../controllers/doctorController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';

const adminRouter = express.Router();


adminRouter.post("/login", loginAdmin)
adminRouter.post("/add-hospital", authAdmin, upload.single('image'), addHospital)
adminRouter.post("/add-vaccine", authAdmin, upload.single('image'), addVaccine)

adminRouter.patch("/edit-vaccine/:hospitalId", updateHospitalVaccine)
adminRouter.get("/appointments", appointmentAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)
adminRouter.get("/all-hospitals", authAdmin, allHospitals)
adminRouter.get("/all-vaccines", authAdmin, allVaccines)

adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.get("/dashboard", authAdmin, adminDashboard)
adminRouter.get("/hospital-requests", authAdmin, listRequestsAdmin)
adminRouter.post("/request-decision", authAdmin, approveRejectRequest)



export default adminRouter;