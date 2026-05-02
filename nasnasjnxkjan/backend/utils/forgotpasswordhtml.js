export const forgotHtml = (resetUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset</title>
</head>

<body style="margin:0; padding:0; background-color:#0f172a; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 16px; background-color:#0f172a;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px; width:100%; background-color:#1e293b; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.45); overflow:hidden;">

          <tr>
            <td style="padding:36px; text-align:center; background:linear-gradient(135deg,#3b82f6,#8b5cf6);">
              <h1 style="margin:0; font-size:26px; font-weight:700; color:#ffffff;">
                Reset Your Password
              </h1>
              <p style="margin-top:10px; font-size:14px; color:#e0e7ff;">
                Secure password reset for your Vaxtrack account
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px; color:#cbd5e1; font-size:15px; line-height:1.7;">
              <p>Hello,</p>

              <p>
                We received a request to reset the password for your
                <strong style="color:#e5e7eb;">Vaxtrack</strong> account.
                Click the button below to set a new password.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}"
                      style="
                        display:inline-block;
                        padding:15px 48px;
                        font-size:16px;
                        font-weight:700;
                        color:#ffffff;
                        text-decoration:none;
                        border-radius:10px;
                        background:linear-gradient(135deg,#3b82f6,#8b5cf6);
                        box-shadow:0 8px 24px rgba(59,130,246,0.45);
                      ">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#422006; border-left:4px solid #f59e0b; border-radius:8px; margin:24px 0;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0; font-size:14px; color:#fde68a;">
                      ⏳ <strong>Security notice:</strong>
                      This link expires in <strong>10 minutes</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:14px; color:#94a3b8;">
                If you didn’t request this reset, ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 36px; background-color:#0f172a; border-top:1px solid #334155;">
              <table width="100%">
                <tr>
                  <td>
                    <p style="margin:0; font-size:14px; color:#cbd5e1;">Regards,</p>
                    <p style="margin:6px 0 0; font-size:20px; font-weight:700; color:#3b82f6;">
                      Vaxtrack Team
                    </p>
                  </td>
                  <td align="right">
                    <a href="https://vaxtrack-eta.vercel.app" style="text-decoration:none;">
                      <span style="
                        display:inline-block;
                        padding:10px 18px;
                        border-radius:8px;
                        background:linear-gradient(135deg,#3b82f6,#8b5cf6);
                        color:#ffffff;
                        font-weight:800;
                        font-size:16px;
                      ">
                        VAXTRACK
                      </span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <table width="600" style="margin-top:18px;">
          <tr>
            <td align="center" style="padding:14px; font-size:12px; color:#64748b;">
              This is an automated email. Please do not reply.<br />
              © 2026 Vaxtrack. All rights reserved.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
