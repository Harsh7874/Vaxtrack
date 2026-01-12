import mongoose from "mongoose";

const hospitalquantitySchema = new mongoose.Schema({
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'hospital' },
    vaccine: { type: mongoose.Schema.Types.ObjectId, ref: 'vaccine' },
    price: { type: String, required: true },
    quantity: { type: String, required: true },
})

const quantityModel = mongoose.models.hospitalquantity || mongoose.model("hospitalquantity", hospitalquantitySchema);
export default quantityModel;