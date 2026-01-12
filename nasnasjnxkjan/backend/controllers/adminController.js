import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import hospitalModel from "../models/hospitalModel.js";
import vaccineModel from "../models/vaccineModel.js";
import quantityModel from "../models/hospitalQuantModel.js";
import appointmentModel from "../models/appointmentModel.js";

// API for admin login
const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}



// API to get all appointments list
const appointmentAdmin = async (req, res) => {
    try {

        const appointment = await appointmentModel.find({})
        res.json({ success: true, appointment })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}


const addHospital = async (req, res) => {
    try {
        const { name, email, password, about, address, longitude, latitude } = req.body;
        const imageFile = req.file;

        // Check for all required data
        if (!name || !email || !password || !about || !address || !longitude || !latitude || !imageFile) {
            return res.json({ success: false, message: 'Missing Details' });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: 'Please enter a valid email' });
        }

        // Validate strong password
        if (password.length < 8) {
            return res.json({ success: false, message: 'Please enter a strong password' });
        }

        // Validate latitude and longitude
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lon)) {
            return res.json({ success: false, message: 'Invalid latitude or longitude' });
        }

        // Hash user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Upload image to Cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
        const imageUrl = imageUpload.secure_url;

        // Parse address (assuming it’s sent as JSON string)
        let parsedAddress;
        try {
            parsedAddress = JSON.parse(address);
        } catch (error) {
            return res.json({ success: false, message: 'Invalid address format' });
        }

        // Construct hospital data with GeoJSON location
        const hospitalData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            about,
            address: parsedAddress,
            location: {
                type: 'Point',
                coordinates: [lon, lat] // [longitude, latitude]
            },
            date: Date.now()
        };

        const newHospital = new hospitalModel(hospitalData);
        await newHospital.save();
        res.json({ success: true, message: 'Hospital Added' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//API FOR ADDING VACCINE
const addVaccine = async (req, res) => {

    try {

        const { name, description} = req.body

        // checking for all data to add doctor
        if (!name || !description) {
            return res.json({ success: false, message: "Missing Details" })
        }

        

       
       

        // upload image to cloudinary
        

        const vaccineData = {
            name,
            description,
            date: Date.now()
        }

        const newVaccine = new vaccineModel(vaccineData)
        await newVaccine.save()
        res.json({ success: true, message: 'Vacine Added' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all hospital list for admin panel
const allHospitals = async (req, res) => {
    try {

        const hospitals = await hospitalModel.find({}).select('-password')
        res.json({ success: true, hospitals })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}



// API to change hospitam availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {

        const { hospitalId } = req.body

        const hospitalData = await hospitalModel.findById(hospitalId)
        await hospitalModel.findByIdAndUpdate(hospitalId, { available: !hospitalData.available })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all vaccine list for admin panel
const allVaccines = async (req, res) => {
    try {

        const vaccines = await vaccineModel.find({})
        res.json({ success: true, vaccines })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {

        const hospitals = await hospitalModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            hospitals: hospitals.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}



//--------------------------------------------------------Vaccine Quantity selection------------------------------------------------------------//

const newquantity = async (req, res) => {
  const { hospital, vaccine, price, quantity } = req.body;
  try {
    const hospitalVaccines = new quantityModel({ hospital, vaccine, price, quantity });
    await hospitalVaccines.save();
    res.status(201).json(hospitalVaccines);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const hospitalVaccine = async (req, res) => {
  try {
    const hospitalVaccines = await quantityModel.find({ hospital: req.params.hospitalId }).populate('vaccine');
    res.json(hospitalVaccines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const vaccineupdate =async (req, res) => {
  const { price, quantity } = req.body;
  try {
    const HospitalQuantityUpdate = await quantityModel.findByIdAndUpdate(req.params.id, { price, quantity }, { new: true });
    res.json(HospitalQuantityUpdate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export {
    loginAdmin,
    appointmentAdmin,
    appointmentCancel,
    addHospital,
    allHospitals,
    addVaccine,
    allVaccines,
    adminDashboard,
   newquantity,
   vaccineupdate,
   hospitalVaccine,
   changeAvailablity
}