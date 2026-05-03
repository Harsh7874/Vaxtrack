import appointmentModel from "../models/appointmentModel.js";
import hospitalModel from "../models/hospitalModel.js";
import { sendEmail } from "../utils/sendEmail.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeBaseUrl = (url = "") => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return "";
    return trimmedUrl.endsWith("/") ? trimmedUrl : `${trimmedUrl}/`;
};

const buildMissedAppointmentEmail = ({
    name,
    vaccineName,
    hospitalName,
    slotDate,
    slotTime,
    bookNewUrl,
}) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #1f2937;">
    <h2 style="color: #b91c1c;">Appointment Missed</h2>
    <p>Dear <b>${name}</b>,</p>
    <p>
      You missed your vaccination appointment for <b>${vaccineName}</b> at
      <b>${hospitalName}</b> on <b>${slotDate}</b> at <b>${slotTime}</b>.
    </p>
    <p>
      This appointment has been marked as cancelled. Please book a new appointment
      if you still want to receive the vaccine.
    </p>
    ${bookNewUrl ? `
    <a href="${bookNewUrl}"
       style="
         background: #0b5ed7;
         color: white;
         padding: 12px 18px;
         text-decoration: none;
         border-radius: 6px;
         display: inline-block;
         margin: 10px 0;
       ">
       Book New
    </a>
    <p style="font-size: 13px; color: #6b7280;">
      If the button does not work, use this link:<br />
      ${bookNewUrl}
    </p>` : ""}
    <hr />
    <p>Regards,<br />Pikwaxin Team</p>
  </div>
`;

const releaseBookedSlot = async ({ hospitalId, slotDate, slotTime }) => {
    const hospital = await hospitalModel.findById(hospitalId).lean();

    if (!hospital) {
        return;
    }

    const dateKey = new Date(slotDate).toISOString();
    const slots = hospital.slots_booked || {};

    if (!slots[dateKey]) {
        return;
    }

    slots[dateKey] = slots[dateKey]
        .map((slot) => {
            if (slot.time.trim().toLowerCase() === slotTime.trim().toLowerCase()) {
                return { ...slot, nuser: slot.nuser - 1 };
            }
            return slot;
        })
        .filter((slot) => slot.nuser > 0);

    if (slots[dateKey].length === 0) {
        delete slots[dateKey];
    }

    await hospitalModel.updateOne(
        { _id: hospitalId },
        { $set: { slots_booked: slots } }
    );
};

export const sendPendingAppointmentEmails = async (req, res) => {
    try {
        const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
        const frontendBaseUrl = normalizeBaseUrl(process.env.FRONTEND_URL || "");
        const dateFormatter = new Intl.DateTimeFormat("en-IN", {
            timeZone: timezone,
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
        const yesterdayKey = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date(Date.now() - DAY_IN_MS));

        const appointments = await appointmentModel.find({
            cancelled: false,
            isCompleted: false,
            missedEmailSent: false,
            $expr: {
                $eq: [
                    {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$slotDate",
                            timezone,
                        },
                    },
                    yesterdayKey,
                ],
            },
        }).lean();

        let processedCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        const failures = [];

        for (const appointment of appointments) {
            try {
                const recipientEmail = appointment.userData?.email;

                if (!recipientEmail) {
                    throw new Error("User email missing");
                }

                const bookNewUrl = frontendBaseUrl
                    ? `${frontendBaseUrl}appointment/${appointment.hospitalId}`
                    : "";

                const emailHtml = buildMissedAppointmentEmail({
                    name: appointment.userData?.name || "User",
                    vaccineName: appointment.vaccineName,
                    hospitalName: appointment.hospitalData?.name || "the hospital",
                    slotDate: dateFormatter.format(new Date(appointment.slotDate)),
                    slotTime: appointment.slotTime,
                    bookNewUrl,
                });

                const emailResult = await sendEmail({
                    to: recipientEmail,
                    subject: "Missed Vaccination Appointment",
                    html: emailHtml,
                });

                if (!emailResult.success) {
                    throw new Error(emailResult.error || "Email sending failed");
                }

                const updateResult = await appointmentModel.updateOne(
                    {
                        _id: appointment._id,
                        cancelled: false,
                        isCompleted: false,
                        missedEmailSent: false,
                    },
                    {
                        $set: {
                            cancelled: true,
                            missedEmailSent: true,
                        },
                    }
                );

                if (updateResult.modifiedCount === 0) {
                    skippedCount += 1;
                    continue;
                }

                await releaseBookedSlot({
                    hospitalId: appointment.hospitalId,
                    slotDate: appointment.slotDate,
                    slotTime: appointment.slotTime,
                });

                processedCount += 1;
            } catch (error) {
                failedCount += 1;
                failures.push({
                    appointmentId: appointment._id.toString(),
                    email: appointment.userData?.email || null,
                    message: error.message,
                });
            }
        }

        res.json({
            success: true,
            message: "Pending appointment email job completed",
            targetDate: yesterdayKey,
            totalFound: appointments.length,
            processedCount,
            skippedCount,
            failedCount,
            failures,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
