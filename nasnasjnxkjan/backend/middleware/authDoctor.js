import jwt from 'jsonwebtoken'

// hospital authentication middleware
const authHospital = async (req, res, next) => {
    const { htoken } = req.headers
    if (!htoken) {
        return res.json({ success: false, message: 'Not Authorized Login Again' })
    }
    try {
        const token_decode = jwt.verify(htoken, process.env.JWT_SECRET)
        req.body.hospitalId = token_decode.id
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authHospital;