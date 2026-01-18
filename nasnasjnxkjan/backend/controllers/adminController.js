import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import hospitalModel from "../models/hospitalModel.js";
import vaccineModel from "../models/vaccineModel.js";
import appointmentModel from "../models/appointmentModel.js";
import requestModel from "../models/requestModel.js";

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
    const {
      pageNo = 1,
      limit = 10,
      startDate,
      endDate,
      isCompleted,
      cancelled,
    } = req.query;

    const page = parseInt(pageNo);
    const pageLimit = parseInt(limit);
    const skip = (page - 1) * pageLimit;

    const filter = {};

    // ===============================
    // 1️⃣ DATE FILTER (CORRECT)
    // ===============================
    if (startDate || endDate) {
  filter.slotDate = {};

  if (startDate) {
    const start = new Date(startDate);
    
    // 👉 Convert to UTC start of day
    const utcStart = new Date(
      Date.UTC(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        0, 0, 0, 0
      )
    );

    filter.slotDate.$gte = utcStart;
  }

  if (endDate) {
    const end = new Date(endDate);

    // 👉 Convert to UTC end of day
    const utcEnd = new Date(
      Date.UTC(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
        23, 59, 59, 999
      )
    );

    filter.slotDate.$lte = utcEnd;
  }
}


    // ===============================
    // 2️⃣ BOOLEAN FIX (MAIN BUG)
    // ===============================

    if (isCompleted !== undefined) {
      filter.isCompleted = isCompleted === "true";
    }

    if (cancelled !== undefined) {
      filter.cancelled = cancelled === "true";
    }

    console.log("FINAL FILTER:", filter);   // 👈 debug

    // ===============================
    // 3️⃣ QUERY
    // ===============================

    const totalAppointments =
      await appointmentModel.countDocuments(filter);

    const totalPages = Math.ceil(
      totalAppointments / pageLimit
    );

    const appointments = await appointmentModel
      .find(filter)
      .sort({ slotDate: 1 })
      .skip(skip)
      .limit(pageLimit)
      .lean();

    res.json({
      success: true,
      appointments,

      pagination: {
        currentPage: page,
        totalPages,
        totalAppointments,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit: pageLimit,
      },

      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        isCompleted:
          isCompleted !== undefined
            ? isCompleted === "true"
            : null,
        cancelled:
          cancelled !== undefined
            ? cancelled === "true"
            : null,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};


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
        const { name, email, password, about, address, longitude, latitude,vaccineData } = req.body;
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
            vaccines:JSON.parse( vaccineData),
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
    const { date, page = 1, limit = 10 } = req.body;

    // Validate and prepare date filter
    let dateFilter = {};
    if (date && typeof date === 'string') {
      // Assuming input date format is also "DD_MM_YYYY" like "17_1_2026"
      // We want appointments where slotDate > given date
      dateFilter.slotDate = { $gt: date };
    }

    // Get total counts (unchanged)
    const hospitalsCount = await hospitalModel.countDocuments({});
    const usersCount = await userModel.countDocuments({});

    // Get total number of future/relevant appointments for pagination info
    const totalAppointments = await appointmentModel.countDocuments({isCompleted:true});

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch paginated appointments - newest first
    // Assuming you want latest created/booked appointments first
    // (If you want to sort by slotDate instead, see alternative below)
    const appointments = await appointmentModel
      .find(dateFilter).sort({ slotDate: -1 })   // ← uncomment if you want newest date first
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const dashData = {
      hospitals: hospitalsCount,
      patients: usersCount,
      totalAppointments,           // total matching the filter (for pagination)
      currentPage: Number(page),
      totalPages: Math.ceil(totalAppointments / limit),
      limit: Number(limit),
      latestAppointments: appointments,
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};



//--------------------------------------------------------Vaccine Quantity selection------------------------------------------------------------//



// Update vaccine details & availability






export const updateHospitalVaccine = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { vaccineId, quantity, price, available, remove } = req.body;

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        message: "Hospital ID is required",
      });
    }

    // ---- Handle remove vaccine ----
    if (vaccineId && remove === true) {
      const hospital = await hospitalModel.findByIdAndUpdate(
        hospitalId,
        {
          $pull: { vaccines: { vaccineId } },
        },
        { new: true }
      );
      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: "Hospital not found",
        });
      }
      return res.json({
        success: true,
        message: "Vaccine removed successfully",
        data: hospital,
      });
    }

    // ---- Update availability only ----
    if (available !== undefined && !vaccineId) {
      const hospital = await hospitalModel.findByIdAndUpdate(
        hospitalId,
        { available },
        { new: true }
      );
      return res.json({
        success: true,
        message: "Availability updated",
        data: hospital,
      });
    }

    // ---- Update or add vaccine ----
    if (!vaccineId) {
      return res.status(400).json({
        success: false,
        message: "Vaccine ID is required for vaccine operations",
      });
    }

    const updateResult = await hospitalModel.updateOne(
      {
        _id: hospitalId,
        "vaccines.vaccineId": vaccineId,
      },
      {
        $set: {
          "vaccines.$.quantity": quantity,
          "vaccines.$.price": price,
        },
      }
    );

    if (updateResult.modifiedCount > 0) {
      const hospital = await hospitalModel.findById(hospitalId);
      return res.json({
        success: true,
        message: "Vaccine updated successfully",
        data: hospital,
      });
    } else {
      // Add new vaccine
      const vaccine = await vaccineModel.findById(vaccineId);
      if (!vaccine) {
        return res.status(404).json({
          success: false,
          message: "Vaccine not found",
        });
      }
      const hospital = await hospitalModel.findByIdAndUpdate(
        hospitalId,
        {
          $push: {
            vaccines: {
              vaccineName: vaccine.name,
              vaccineId: vaccine._id,
              quantity,
              price,
            },
          },
        },
        { new: true }
      );
      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: "Hospital not found",
        });
      }
      res.json({
        success: true,
        message: "Vaccine added successfully",
        data: hospital,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const approveRejectRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    // status: true = approve , false = reject

    if (!requestId || typeof status !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "requestId and status required",
      });
    }

    // 1️⃣ Get request
    const request = await requestModel.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // If already processed
    if (request.processed) {
      return res.status(400).json({
        success: false,
        message: "Request already processed",
      });
    }

    // =========================
    // ❌ REJECT FLOW
    // =========================
    if (status === false) {
      request.status = false;
      request.processed = true;
      await request.save();

      return res.json({
        success: true,
        message: "Request rejected",
      });
    }

    // =========================
    // ✅ APPROVE FLOW
    // =========================

    const hospital = await hospitalModel.findById(request.hospitalId);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    // 2️⃣ Update hospital inventory
    for (let item of request.vaccines) {
      const existingIndex = hospital.vaccines.findIndex(
        (v) => v.vaccineId.toString() === item.vaccineId.toString()
      );

      if (existingIndex > -1) {
        // 👉 Vaccine exists → ADD quantity only
        hospital.vaccines[existingIndex].quantity += Number(item.quantity);

      } else {
        // 👉 New vaccine → PUSH
        hospital.vaccines.push({
          vaccineName: item.vaccineName,
          vaccineId: item.vaccineId,
          quantity: Number(item.quantity),
          price: Number(item.price),
        });
      }
    }

    await hospital.save();

    // 3️⃣ Update request status
    request.status = true;
    request.processed = true;
    await request.save();

    res.json({
      success: true,
      message: "Request approved & inventory updated",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const listRequestsAdmin = async (req, res) => {
  try {
    let { page = 1, limit = 10, status } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    // status filter: true / false / pending
    if (status === "approved") query.status = true;
    if (status === "rejected") query.status = false;
    if (status === "pending") query.processed = false;

    const requests = await requestModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await requestModel.countDocuments(query);

    res.json({
      success: true,
      data: requests,

      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
   changeAvailablity
}