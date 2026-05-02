import express from "express";
import { sendPendingAppointmentEmails } from "../controllers/cronController.js";

const cronRouter = express.Router();

cronRouter.get("/send-pending-email", sendPendingAppointmentEmails);

export default cronRouter;
