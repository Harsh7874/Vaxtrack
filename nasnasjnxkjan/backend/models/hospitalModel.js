import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    about: { type: String, required: true },
    slots_booked: { type: Object, default: {} },
    date: { type: Number, required: true },
    available: { type: Boolean, default: true },
    address: {
        line1: { type: String, required: true },
        line2: { type: String }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    vaccines:[{
        vaccineName: { type: String, required: true },
        vaccineId: { type: mongoose.Schema.Types.ObjectId, ref: 'vaccine' },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true},
        _id:false
    }],

}, 

{ minimize: false })
hospitalSchema.index({ location: "2dsphere" });
const hospitalModel = mongoose.model("hospital", hospitalSchema);
export default hospitalModel;



  
