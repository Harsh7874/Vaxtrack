import express from "express"
import cors from 'cors'
import 'dotenv/config'
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import hospitalRouter from "./routes/hospitalRoute.js"
import vaccineRouter from "./routes/vaccineRoute.js"
import quantityRouter from "./routes/quantityRouter.js"

// app config
const app = express()
const port = process.env.PORT || 4000
await connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(cors())

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
// app.use("/api/doctor", doctorRouter)
app.use("/api/hospital", hospitalRouter)
app.use("/api/vaccine", vaccineRouter)
app.use("/api/hospitalb/",quantityRouter)



app.get("/", (req, res) => {
  res.send("API Working")
});

app.listen(port, () => console.log(`Server started on PORT:${port}`))