import mongoose from "mongoose"

const appointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    hospitalId: { type: String, required: true },
    vaccineId:{ type: String, required: true },
    vaccinePrice:{ type: String, required: true },
    vaccineName:{ type: String, required: true },
    slotDate: { type: Date, required: true },
    slotTime: { type: String, required: true },
    userData: { type: Object, required: true },
    hospitalData: { type: Object, required: true },
    date: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false }
})

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema)
export default appointmentModel