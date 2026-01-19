import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import hospitalModel from "../models/hospitalModel.js";
import appointmentModel from "../models/appointmentModel.js";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import requestModel from "../models/requestModel.js";
import { createVaccinationCertificate } from '../utils/createCerti.js'
import { sendEmail } from "../utils/sendEmail.js";
//---------------------------------------------------------------------Nodemailertreansport--------------//
import { vaccinationEmailTemplate } from "../utils/sendEmail.js";




// API for doctor Login 
const loginHospital = async (req, res) => {

  try {

    const { email, password } = req.body
    const user = await hospitalModel.findOne({ email })

    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
      res.json({ success: true, token })
    } else {
      res.json({ success: false, message: "Invalid credentials" })
    }


  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get doctor appointments for doctor panel
const appointmentHospital = async (req, res) => {
  try {

    const { hospitalId } = req.body
    const appointments = await appointmentModel.find({ hospitalId })

    res.json({ success: true, appointments })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

//API TO SHOW HOSPITAL INVENTORY


// API to cancel appointment for Hospital Panel
const appointmentCancel = async (req, res) => {
  try {
    const { hospitalId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId).lean();

    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Verify hospital ownership
    if (appointmentData.hospitalId.toString() !== hospitalId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }

    // 1️⃣ Mark cancelled
    await appointmentModel.updateOne(
      { _id: appointmentId },
      { $set: { cancelled: true } }
    );

    // 2️⃣ Reduce slot count
    const { slotDate, slotTime } = appointmentData;

    const dateKey = new Date(slotDate).toISOString();

    const hospital = await hospitalModel.findById(hospitalId).lean();

    if (!hospital) {
      return res.json({ success: false, message: "Hospital not found" });
    }

    let slots = hospital.slots_booked || {};

    if (slots[dateKey]) {
      slots[dateKey] = slots[dateKey]
        .map(s => {
          if (s.time.trim().toLowerCase() === slotTime.trim().toLowerCase()) {
            return { ...s, nuser: s.nuser - 1 };
          }
          return s;
        })
        .filter(s => s.nuser > 0);
    }

    await hospitalModel.updateOne(
      { _id: hospitalId },
      { $set: { slots_booked: slots } }
    );

    return res.json({
      success: true,
      message: "Appointment Cancelled",
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


const appointmentComplete = async (req, res) => {
  try {
    const { hospitalId, appointmentId } = req.body;

    // 1️⃣ Find appointment
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData || appointmentData.hospitalId.toString() !== hospitalId) {
      return res.json({
        success: false,
        message: "Appointment not found or Unauthorized",
      });
    }
    const certResult = await createVaccinationCertificate(appointmentData);

    if (!certResult.success) {
      return res.json({
        success: false,
        message: "Certificate generation failed",
        error: certResult.error
      });
    }

    // 2️⃣ Mark as completed
    await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { isCompleted: true }
    );

    if (certResult.success) {

      const emailHtml = vaccinationEmailTemplate({
        name: appointmentData.userData.name,
        vaccine: appointmentData.vaccineName,
        downloadUrl: certResult.url,
      });
      let email = appointmentData?.userData.email || "null"
      await sendEmail({
        to: email,
        subject: "Your Vaccination Certificate",
        html: emailHtml,
      }).then((info)=>{console.log("Email Send ",info)});
    }



    // ===============================
    // ✅ FEATURE 2: DEDUCT VACCINE
    // ===============================

    const vaccineId = appointmentData.vaccineId;

    const hospital = await hospitalModel.findById(hospitalId);

    if (!hospital) {
      return res.json({
        success: false,
        message: "Hospital not found",
      });
    }

    let updated = false;

    hospital.vaccines = hospital.vaccines.map(v => {
      if (v.vaccineId.toString() === vaccineId.toString()) {
        if (v.quantity > 0) {
          updated = true;
          return { ...v, quantity: v.quantity - 1 };
        }
      }
      return v;
    });

    if (updated) {
      await hospital.save();
      console.log("Vaccine quantity deducted for:", vaccineId);
    } else {
      console.log("Vaccine not found or quantity already 0");
    }

    return res.json({
      success: true,
      message: "Appointment Completed",
    });

  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};


// API to get all hospitals list for Frontend
const hospitalList = async (req, res) => {
  try {

    const hospitals = await hospitalModel.find({}).select(['-password', '-email'])
    res.json({ success: true, hospitals })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }

}

// API to change doctor availablity for Admin and Doctor Panel
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

// API to get doctor profile for  Doctor Panel
const hospitalProfile = async (req, res) => {
  try {

    const { hospitalId } = req.body
    const profileData = await hospitalModel.findById(hospitalId).select('-password -vaccines')

    res.json({ success: true, profileData })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to update doctor profile data from  Doctor Panel
const updateHospitalProfile = async (req, res) => {
  try {

    const { hospitalId, address, available } = req.body

    await hospitalModel.findByIdAndUpdate(hospitalId, { address, available })

    res.json({ success: true, message: 'Profile Updated' })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// API to get dashboard data for doctor panel
const hospitalDashboard = async (req, res) => {
  try {

    const { hospitalId } = req.body

    const appointments = await appointmentModel.find({ hospitalId })

    let earnings = 0

    appointments.map((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.vaccinePrice
      }
    })

    let patients = []

    appointments.map((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId)
      }
    })



    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse()
    }

    res.json({ success: true, dashData })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}


const gethospitalbyHospitalId = async (req, res) => {
  try {
    const { hospitalId } = req.params
    const hospitalData = await hospitalModel.findById(hospitalId).select('-password').lean()
    res.json({ success: true, hospitalData })
  }
  catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}


const inventory = async (req, res) => {
  try {
    const { hospitalId } = req.body;

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        message: "hospitalId required",
      });
    }

    const inventory = await hospitalModel
      .findById(hospitalId)
      .select("vaccines name")
      .lean();

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    return res.json({
      success: true,
      inventory,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const createInventoryRequest = async (req, res) => {
  try {
    const { hospitalId, vaccines } = req.body;

    if (!hospitalId || !vaccines || vaccines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "hospitalId and vaccines required",
      });
    }

    // 1️⃣ Get hospital inventory
    const hospital = await hospitalModel.findById(hospitalId);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const finalVaccines = [];

    // 2️⃣ Process each requested vaccine
    for (let item of vaccines) {
      const { vaccineId, vaccineName, quantity, price } = item;

      if (!vaccineId || !quantity) {
        return res.status(400).json({
          success: false,
          message: "vaccineId and quantity required",
        });
      }

      // Check if vaccine already in inventory
      const existing = hospital.vaccines.find(
        (v) => v.vaccineId.toString() === vaccineId
      );

      // 🔐 CORE LOGIC
      if (existing) {
        // 👉 EXISTING VACCINE → FORCE OLD PRICE
        finalVaccines.push({
          vaccineName: existing.vaccineName,
          vaccineId,
          quantity: Number(quantity),
          price: existing.price,   // <-- IGNORE FRONTEND PRICE
        });
      } else {
        // 👉 NEW VACCINE → PRICE REQUIRED
        if (!price) {
          return res.status(400).json({
            success: false,
            message: `Price required for new vaccine: ${vaccineName}`,
          });
        }

        finalVaccines.push({
          vaccineName,
          vaccineId,
          quantity: Number(quantity),
          price: Number(price),
        });
      }
    }

    // 3️⃣ Create request document
    const newRequest = new requestModel({
      hospitalId,
      hospitalName: hospital.name,
      status: false, // pending
      vaccines: finalVaccines,
    });

    await newRequest.save();

    res.json({
      success: true,
      message: "Inventory request created",
      data: newRequest,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const listRequestsHospital = async (req, res) => {
  try {
    let { page = 1, limit = 10, status } = req.query;
    let { hospitalId } = req.body
    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        message: "hospitalId required",
      });
    }

    page = parseInt(page);
    limit = parseInt(limit);

    const query = { hospitalId };

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
  inventory,
  loginHospital,
  appointmentHospital,
  appointmentCancel,
  hospitalList,
  changeAvailablity,
  appointmentComplete,
  hospitalDashboard,
  hospitalProfile,
  updateHospitalProfile,
  gethospitalbyHospitalId,
  createInventoryRequest
}