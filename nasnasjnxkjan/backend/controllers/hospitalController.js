import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import hospitalModel from "../models/hospitalModel.js";
import appointmentModel from "../models/appointmentModel.js";
import quantityModel from "../models/hospitalQuantModel.js";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";


//---------------------------------------------------------------------Nodemailertreansport--------------//
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const generateCertificate = async (appointment) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Certificate content
        doc.fontSize(20).text('Vaccination Certificate', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`User: ${appointment.userData.name}`);
        doc.text(`Hospital: ${appointment.hospitalData.name}`);

        // Format the date from "dd_mm_yyyy" to "DD Month YYYY"
        const [day, month, year] = appointment.slotDate.split('_');
        const date = new Date(year, month - 1, day);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(`Date: ${formattedDate}`);
        doc.text(`Time: ${appointment.slotTime}`);
        doc.text(`Vaccine: ${appointment.vaccineName}`);

        doc.end();
    });
};


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
const quantityHospital = async (req, res) => {
    try {

        const { hospitalId } = req.body
        const quantity = await quantityModel.find({ hospitalId })

        res.json({ success: true, quantity })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {

        const { hospitalId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.hospitalId === hospitalId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

const appointmentComplete = async (req, res) => {
    try {
        const { hospitalId, appointmentId } = req.body;

        // Find the appointment
        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData || appointmentData.hospitalId !== hospitalId) {
            return res.json({ success: false, message: 'Appointment not found or unauthorized' });
        }

        // Mark the appointment as complete
        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });

        // Feature 1: Generate and email the certificate
        const pdfBuffer = await generateCertificate(appointmentData);

        const userEmail = appointmentData.userData.email;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Your Vaccination Certificate',
            text: 'Dear ' + appointmentData.userData.name + ',\n\nPlease find attached your vaccination certificate.\n\nBest regards,\nYour Hospital Team',
            attachments: [
                {
                    filename: 'certificate.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Certificate emailed to ${userEmail}`);

        // Feature 2: Deduct vaccine quantity
        const vaccineQuantity = await quantityModel.findOne({
            hospital: appointmentData.hospitalId,
            vaccine: appointmentData.vaccineId
        });

        if (vaccineQuantity && vaccineQuantity.quantity > 0) {
            vaccineQuantity.quantity -= 1;
            await vaccineQuantity.save();
            console.log(`Vaccine quantity updated for vaccineId: ${appointmentData.vaccine}`);
        } else {
            console.log('Vaccine quantity not available or insufficient');
            // Proceed even if quantity is zero, as booking already confirmed availability
        }

        return res.json({ success: true, message: 'Appointment Completed' });
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
        const profileData = await hospitalModel.findById(hospitalId).select('-password')

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

        await hospitalModel.findByIdAndUpdate(hospitalId, {address, available })

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

export {
    loginHospital,
    appointmentHospital,
    appointmentCancel,
    hospitalList,
    changeAvailablity,
    appointmentComplete,
    hospitalDashboard,
    hospitalProfile,
    updateHospitalProfile,
    quantityHospital
}