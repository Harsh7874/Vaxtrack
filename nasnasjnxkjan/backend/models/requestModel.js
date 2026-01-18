import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
    hospitalId: { type: String, required: true },
    hospitalName:{ type: String, required: true },
    status: { type: Boolean, required: true },
      processed: { type: Boolean, default: false },   // 👈 ADD THIS
     vaccines:[{
            vaccineName: { type: String, required: true },
            vaccineId: { type: mongoose.Schema.Types.ObjectId, ref: 'vaccine' },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true},
            _id:false
        }]
},{ timestamps: true }
)

const requestModel = mongoose.models.inventoryrequest || mongoose.model("inventoryrequest", requestSchema);
export default requestModel;