import nodemailer from "nodemailer";

// Create SMTP Transporter using .env configuration
export function getMailTransporter() {
  const host = process.env.SMTP_SERVER_URL || "localhost";
  const port = Number(process.env.SMTP_SERVER_PORT) || 587;
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: false, // Allows self-signed certificates in local/internal networks
    },
  });
}

/**
 * Send OTP verification email to user
 * @param to - Recipient email
 * @param otp - 6-digit numeric OTP string
 */
export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const transporter = getMailTransporter();
  const senderEmail = process.env.SMTP_USERNAME || "no-reply@saensukcity.go.th";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>รหัสยืนยันตัวตน (OTP) สำหรับการลงทะเบียน</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .container { max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { text-align: center; margin-bottom: 24px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
        .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
        .desc { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px 0; }
        .otp-box { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e40af; }
        .warning { font-size: 13px; color: #ef4444; background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px; margin-bottom: 24px; }
        .footer { text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="badge">Korjong : ระบบจองห้องประชุมออนไลน์ เทศบาลเมืองแสนสุข</span>
          <h1 class="title">รหัสยืนยันอีเมลสำหรับการลงทะเบียน</h1>
          <p class="desc">ท่านได้ทำรายการขอลงทะเบียนบัญชีผู้ใช้งานระบบ Korjong : ระบบจองห้องประชุมออนไลน์ เทศบาลเมืองแสนสุข กรุณานำรหัส OTP ด้านล่างนี้ไปกรอกเพื่อยืนยันอีเมลของท่าน</p>
        </div>

        <div class="otp-box">
          <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px;">รหัสยืนยันตัวตน (OTP)</div>
          <div class="otp-code">${otp}</div>
        </div>

        <div class="warning">
          <strong>สำคัญ:</strong> รหัส OTP นี้มีอายุการใช้งาน <strong>5 นาที</strong> นับจากเวลาที่ส่ง โปรดอย่าเปิดเผยรหัสนี้แก่ผู้อื่นเพื่อความปลอดภัยของข้อมูล
        </div>

        <div class="footer">
          หากท่านไม่ได้เป็นผู้ทำรายการนี้ โปรดเพิกเฉยต่ออีเมลฉบับนี้<br>
          &copy; ${new Date().getFullYear()} เทศบาลเมืองแสนสุข จังหวัดชลบุรี
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Korjong : ระบบจองห้องประชุมออนไลน์" <${senderEmail}>`,
    to,
    subject: `[Korjong : ระบบจองห้องประชุมออนไลน์] รหัสยืนยันอีเมลของคุณคือ ${otp}`,
    html: htmlContent,
    text: `รหัสยืนยันอีเมลของคุณสำหรับการลงทะเบียน Korjong : ระบบจองห้องประชุมออนไลน์ คือ: ${otp} (รหัสมีอายุ 5 นาที)`,
  });
}

/**
 * Send password reset OTP email to user
 * @param to - Recipient email
 * @param otp - 6-digit numeric OTP string
 */
export async function sendPasswordResetOtpEmail(to: string, otp: string): Promise<void> {
  const transporter = getMailTransporter();
  const senderEmail = process.env.SMTP_USERNAME || "no-reply@saensukcity.go.th";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>รหัสยืนยันตัวตน (OTP) สำหรับการรีเซ็ตรหัสผ่าน</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .container { max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { text-align: center; margin-bottom: 24px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
        .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
        .desc { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px 0; }
        .otp-box { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e40af; }
        .warning { font-size: 13px; color: #ef4444; background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px; margin-bottom: 24px; }
        .footer { text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="badge">Korjong : ระบบจองห้องประชุมออนไลน์</span>
          <h1 class="title">รหัสสำหรับรีเซ็ตรหัสผ่าน</h1>
          <p class="desc">ท่านได้ทำรายการขอรีเซ็ตรหัสผ่านบัญชีผู้ใช้งานระบบ Korjong : ระบบจองห้องประชุมออนไลน์ กรุณานำรหัส OTP ด้านล่างนี้ไปกรอกเพื่อตั้งรหัสผ่านใหม่</p>
        </div>

        <div class="otp-box">
          <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px;">รหัสยืนยันตัวตน (OTP)</div>
          <div class="otp-code">${otp}</div>
        </div>

        <div class="warning">
          <strong>สำคัญ:</strong> รหัส OTP นี้มีอายุการใช้งาน <strong>5 นาที</strong> นับจากเวลาที่ส่ง หากท่านไม่ได้เป็นผู้ทำรายการนี้ โปรดติดต่อผู้ดูแลระบบโดยด่วน
        </div>

        <div class="footer">
          หากท่านไม่ได้เป็นผู้ทำรายการขอรีเซ็ตรหัสผ่าน โปรดเพิกเฉยต่ออีเมลฉบับนี้<br>
          &copy; ${new Date().getFullYear()} เทศบาลเมืองแสนสุข จังหวัดชลบุรี
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Korjong : ระบบจองห้องประชุมออนไลน์" <${senderEmail}>`,
    to,
    subject: `[Korjong : ระบบจองห้องประชุมออนไลน์] รหัส OTP สำหรับรีเซ็ตรหัสผ่านของคุณคือ ${otp}`,
    html: htmlContent,
    text: `รหัส OTP สำหรับรีเซ็ตรหัสผ่านของคุณคือ: ${otp} (รหัสมีอายุ 5 นาที)`,
  });
}

