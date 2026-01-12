import mongoose from "mongoose";

const vaccineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: {type: String, required: true },
}, { minimize: false })

const vaccineModel = mongoose.models.vaccine || mongoose.model("vaccine", vaccineSchema);
export default vaccineModel; 