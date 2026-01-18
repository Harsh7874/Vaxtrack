import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import hospitalModel from "../models/hospitalModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import razorpay from 'razorpay';

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        // checking for all data to register user
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
export const searchSuggestion = async (req, res) => {
  try {

    const { query = "", limit = "20" } = req.query;

    const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10)));

    if (!query.trim()) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const pipeline = [
      {
        $search: {
          index: "default",
          compound: {
            should: [
              {
                autocomplete: {
                  query: query,
                  path: "name"
                }
              },
              {
                autocomplete: {
                  query: query,
                  path: "about"
                }
              },
              {
                autocomplete: {
                  query: query,
                  path: "address.line1"
                }
              },
              {
                autocomplete: {
                  query: query,
                  path: "address.line2"
                }
              },
              {
                autocomplete: {
                  query: query,
                  path: "vaccines.vaccineName"
                }
              }
            ]
          }
        }
      },

      { $limit: limitNum },

      {
        $project: {
          name: 1,
          about: 1,
          "address.line1": 1,
          "address.line2": 1,
          "vaccines.vaccineName": 1
        }
      }
    ];

    const results = await hospitalModel.aggregate(pipeline);

    // ----- FLATTEN LOGIC -----
    let suggestions = [];

    results.forEach(h => {
      if (h.name) suggestions.push(h.name);
      if (h.about) suggestions.push(h.about);
      if (h.address?.line1) suggestions.push(h.address.line1);
      if (h.address?.line2) suggestions.push(h.address.line2);

      if (Array.isArray(h.vaccines)) {
        h.vaccines.forEach(v => {
          if (v.vaccineName) suggestions.push(v.vaccineName);
        });
      }
    });

    // ----- CLEANUP -----
    suggestions = [...new Set(suggestions)]   // unique
      .filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limitNum);

    return res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error("autocomplete error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {

    try {

        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {

            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
const MAX_USERS_PER_SLOT = 10;

// API to book appointment 
const bookAppointment = async (req, res) => {

    try {

        const { userId, hospitalId, vaccineId, vaccineName, vaccinePrice, slotDate, slotTime } = req.body
        const hospitalData = await hospitalModel.findById(hospitalId).select("-password")

        if (!userId) {
            return res.json({ success: false, message: 'User ID Missing' })
        }
        if (!hospitalData.available) {
            return res.json({ success: false, message: 'Hospital Not Available' })
        }


        // checking for slot availablity 
        let slots_booked = hospitalData.slots_booked || {};

        // If date does not exist, create it
        if (!slots_booked[slotDate]) {
            slots_booked[slotDate] = [];
        }

        // Find slot by time
        let slot = slots_booked[slotDate].find(s => s.time === slotTime);

        if (slot) {
            // Slot exists → check capacity
            if (slot.nuser >= MAX_USERS_PER_SLOT) {
                return res.json({ success: false, message: "Slot Full" });
            }

            // Increase user count
            slot.nuser += 1;
        } else {
            // New slot → create with first booking
            slots_booked[slotDate].push({
                time: slotTime,
                nuser: 1
            });
        }


        const userData = await userModel.findById(userId).select("-password").lean()

        delete hospitalData.slots_booked

        const appointmentData = {
            userId,
            hospitalId,
            userData,
            hospitalData,
            vaccineId,
            vaccinePrice,
            vaccineName,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // save new slots data in docData
        await hospitalModel.findByIdAndUpdate(hospitalId, { slots_booked })

        res.json({ success: true, message: 'Appointment Booked' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId).lean();

        if (!appointmentData) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        if (appointmentData.userId.toString() !== userId) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        await appointmentModel.updateOne(
            { _id: appointmentId },
            { $set: { cancelled: true } }
        );

        const { hospitalId, slotDate, slotTime } = appointmentData;

        const dateKey = new Date(slotDate).toISOString();

        const hospital = await hospitalModel.findById(hospitalId).lean();

        let slots = hospital.slots_booked || {};

        slots[dateKey] = slots[dateKey]
            .map(s => {
                if (s.time.trim().toLowerCase() === slotTime.trim().toLowerCase()) {
                    return { ...s, nuser: s.nuser - 1 };
                }
                return s;
            })
            .filter(s => s.nuser > 0);

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





// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export const searchHospitals = async (req, res) => {
    try {
        // ----- QUERY PARAMS -----
        const {
            query = "",
            page = "1",
            limit = "10",
            sortBy = "",
            lat,
            lon
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        const hasCoords =
            lat !== undefined &&
            lon !== undefined &&
            !isNaN(parseFloat(lat)) &&
            !isNaN(parseFloat(lon));

        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        // ----- ATLAS SEARCH STAGE -----
        const searchStage = {
            $search: {
                index: "hospital-text",
                compound: {
                    must: []
                }
            }
        };

        // TEXT SEARCH
        if (query.trim()) {
            searchStage.$search.compound.must.push({
                text: {
                    query: query.trim(),
                    path: [
                        "name",
                        "address.line1",
                        "address.line2",
                        "vaccines.vaccineName",
                        "about",
                        "email"
                    ],
                    fuzzy: {
                        maxEdits: 1,
                        maxExpansions: 50
                    }
                }
            });
        }

        // DISTANCE BOOST (ranking only)
        if (hasCoords) {
            searchStage.$search.compound.filter = [{ geoWithin: { circle: { center: { type: "Point", coordinates: [lonNum, latNum] }, radius: 10000 }, path: "location" } }];
        }

        // ----- CRITICAL FIX: Fallback when no query -----
        if (
            searchStage.$search.compound.must.length === 0 &&
            !searchStage.$search.compound.should
        ) {
            searchStage.$search.compound.must.push({
                exists: { path: "name" }
            });
        }

        // ----- SORT STAGES -----
        const sortStages = [];

        if (sortBy === "price_low") {
            sortStages.push({ $sort: { "vaccines.price": 1 } });
        } else if (sortBy === "price_high") {``
            sortStages.push({ $sort: { "vaccines.price": -1 } });
        } else if (sortBy === "distance" && hasCoords) {
            sortStages.push({ $sort: { distance: 1 } });
        }

        // ----- PIPELINE -----
        const pipeline = [
            searchStage,

            // Distance calculation (Haversine)
            ...(hasCoords
                ? [
                    {
                        $addFields: {
                            distance: {
                                $let: {
                                    vars: {
                                        lat1: { $multiply: [latNum, Math.PI / 180] },
                                        lon1: { $multiply: [lonNum, Math.PI / 180] },

                                        lat2: {
                                            $multiply: [
                                                { $arrayElemAt: ["$location.coordinates", 1] },
                                                Math.PI / 180
                                            ]
                                        },

                                        lon2: {
                                            $multiply: [
                                                { $arrayElemAt: ["$location.coordinates", 0] },
                                                Math.PI / 180
                                            ]
                                        }
                                    },

                                    in: {
                                        $let: {
                                            vars: {
                                                dLat: { $subtract: ["$$lat2", "$$lat1"] },
                                                dLon: { $subtract: ["$$lon2", "$$lon1"] }
                                            },

                                            in: {
                                                $multiply: [
                                                    6371000,
                                                    {
                                                        $multiply: [
                                                            2,
                                                            {
                                                                $atan2: [
                                                                    {
                                                                        $sqrt: {
                                                                            $add: [
                                                                                {
                                                                                    $pow: [
                                                                                        { $sin: { $divide: ["$$dLat", 2] } },
                                                                                        2
                                                                                    ]
                                                                                },
                                                                                {
                                                                                    $multiply: [
                                                                                        { $cos: "$$lat1" },
                                                                                        { $cos: "$$lat2" },
                                                                                        {
                                                                                            $pow: [
                                                                                                { $sin: { $divide: ["$$dLon", 2] } },
                                                                                                2
                                                                                            ]
                                                                                        }
                                                                                    ]
                                                                                }
                                                                            ]
                                                                        }
                                                                    },
                                                                    {
                                                                        $sqrt: {
                                                                            $subtract: [
                                                                                1,
                                                                                {
                                                                                    $add: [
                                                                                        {
                                                                                            $pow: [
                                                                                                { $sin: { $divide: ["$$dLat", 2] } },
                                                                                                2
                                                                                            ]
                                                                                        },
                                                                                        {
                                                                                            $multiply: [
                                                                                                { $cos: "$$lat1" },
                                                                                                { $cos: "$$lat2" },
                                                                                                {
                                                                                                    $pow: [
                                                                                                        { $sin: { $divide: ["$$dLon", 2] } },
                                                                                                        2
                                                                                                    ]
                                                                                                }
                                                                                            ]
                                                                                        }
                                                                                    ]
                                                                                }
                                                                            ]
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                ]
                : []),

            // Projection
            {
                $project: {
                    name: 1,
                    about: 1,
                    image: 1,
                    available: 1,
                    location: 1,

                    "address.line1": 1,
                    "address.line2": 1,

                    vaccines: {
                        $map: {
                            input: "$vaccines",
                            as: "v",
                            in: {
                                vaccineName: "$$v.vaccineName",
                                price: "$$v.price"
                            }
                        }
                    },

                    distance: 1,
                    score: { $meta: "searchScore" }
                }
            },

            ...sortStages,

            { $skip: skip },
            { $limit: limitNum }
        ];

        // EXECUTE
        const results = await hospitalModel.aggregate(pipeline);

        // COUNT (NO geoNear here)
        const countPipeline = [
            searchStage,
            { $count: "total" }
        ];

        const totalResult = await hospitalModel.aggregate(countPipeline);
        const total = totalResult[0]?.total || 0;

        return res.status(200).json({
            success: true,
            data: results,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            limit: limitNum
        });

    } catch (error) {
        console.error("searchHospitals error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }
};





// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        // creating options for razorpay payment
        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY,
            receipt: appointmentId,
        }

        // creation of an order
        const order = await razorpayInstance.orders.create(options)

        res.json({ success: true, order })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if (orderInfo.status === 'paid') {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true })
            res.json({ success: true, message: "Payment Successful" })
        }
        else {
            res.json({ success: false, message: 'Payment Failed' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const { origin } = req.headers

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: appointmentData.amount * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items: line_items,
            mode: 'payment',
        })

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const verifyStripe = async (req, res) => {
    try {

        const { appointmentId, success } = req.body

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true })
            return res.json({ success: true, message: 'Payment Successful' })
        }

        res.json({ success: false, message: 'Payment Failed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

export {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe
}