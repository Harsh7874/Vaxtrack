import vaccineModel from "../models/vaccineModel.js";

// API for doctor Login 


// API to get doctor appointments for doctor panel


// API to cancel appointment for doctor panel


// API to mark appointment completed for doctor panel


// API to get all vaccines list for Frontend
const vaccineList = async (req, res) => {
    try {

        const vaccines = await vaccineModel.find({})
        res.json({ success: true, vaccines })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}


const vaccineProfile = async (req, res) => {
    try {

        const { vaxId } = req.body
        const profileData = await doctorModel.findById(vaxId)

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    vaccineList,
    vaccineProfile
}