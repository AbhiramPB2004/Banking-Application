const baseTemplate = (title, content, color = "#4CAF50") => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @media only screen and (max-width: 600px) {
        .container { width: 100% !important; }
        .inner-padding { padding: 20px !important; }
        h2 { font-size: 20px !important; }
        h3 { font-size: 18px !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5;">
    <div style="max-width: 560px; margin: 40px auto; background: transparent;">
      
      <!-- Main Container -->
      <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); animation: fadeIn 0.4s ease-out;">
        
        <!-- Header -->
        <div style="background: ${color}; padding: 28px 32px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 24px;">🏦</span>
            <h2 style="margin: 0; color: white; font-size: 22px; font-weight: 600;">Banking App</h2>
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <h3 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: #1a1a2e;">${title}</h3>
          <div style="color: #333333; line-height: 1.5; font-size: 15px;">
            ${content}
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #fafafa; padding: 20px 32px; border-top: 1px solid #e8e8e8;">
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #888888;">This is an automated message. Please do not reply.</p>
          <p style="margin: 0; font-size: 12px; color: #888888;">© ${new Date().getFullYear()} Banking App. All rights reserved.</p>
        </div>

      </div>
      
    </div>
  </body>
  </html>
  `;
};

const getEmailTemplate = (type, data) => {
  switch (type) {
    case "REGISTER":
      return {
        subject: "Welcome to Banking App",
        html: baseTemplate(
          "Welcome",
          `<p style="margin: 0 0 16px 0;">Hello <strong>${data.name}</strong>,</p>
           <p style="margin: 0 0 16px 0;">Your account has been created successfully. You can now log in to access all banking services.</p>
           <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 8px 0;">
             <p style="margin: 0; font-size: 13px; color: #666666;">Account Type: Savings Account</p>
           </div>
           <p style="margin: 16px 0 0 0; color: #666666;">We're excited to have you on board.</p>`
        ),
        text: `Welcome ${data.name}, your account has been created successfully.`,
      };

    case "EMAIL_VERIFICATION_OTP":
      return {
        subject: "Verify your email address",
        html: baseTemplate(
          "Email Verification",
          `<p style="margin: 0 0 16px 0;">Hello <strong>${data.name}</strong>,</p>
           <p style="margin: 0 0 16px 0;">Use this OTP to verify your email and activate your bank account.</p>
           <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 8px 0;">
             <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">Verification OTP</p>
             <p style="margin: 0; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e;">${data.otp}</p>
           </div>
           <p style="margin: 16px 0 0 0; font-size: 13px; color: #888888;">This OTP expires in ${data.expiresInMinutes || 10} minutes.</p>`,
          "#4CAF50"
        ),
        text: `Your email verification OTP is ${data.otp}. It expires in ${data.expiresInMinutes || 10} minutes.`,
      };

    case "PASSWORD_RESET_OTP":
      return {
        subject: "Reset your password",
        html: baseTemplate(
          "Password Reset",
          `<p style="margin: 0 0 16px 0;">Hello <strong>${data.name}</strong>,</p>
           <p style="margin: 0 0 16px 0;">Use this OTP to reset your password.</p>
           <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 8px 0;">
             <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">Password Reset OTP</p>
             <p style="margin: 0; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e;">${data.otp}</p>
           </div>
           <p style="margin: 16px 0 0 0; font-size: 13px; color: #888888;">This OTP expires in ${data.expiresInMinutes || 10} minutes. If you did not request this, please ignore this email.</p>`,
          "#FF9800"
        ),
        text: `Your password reset OTP is ${data.otp}. It expires in ${data.expiresInMinutes || 10} minutes.`,
      };

    case "LOGIN":
      return {
        subject: "Login Alert",
        html: baseTemplate(
          "Login Successful",
          `<p style="margin: 0 0 16px 0;">Hello <strong>${data.name}</strong>,</p>
           <p style="margin: 0 0 16px 0;">We noticed a new login to your account.</p>
           <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 8px 0;">
             <p style="margin: 0 0 8px 0; font-size: 13px;"> ${new Date().toLocaleDateString()}</p>
             <p style="margin: 0; font-size: 13px;"> ${new Date().toLocaleTimeString()}</p>
             <p style="margin: 0; font-size: 13px;">IP: ${data.ip} </p>
           </div>
           <p style="margin: 16px 0 0 0; font-size: 13px; color: #888888;">If this wasn't you, please contact our support team immediately.</p>`,
          "#2196F3"
        ),
        text: `Hello ${data.name}, a login was detected to your account.`,
      };

    case "DEBIT":
      return {
        subject: "Debit Alert",
        html: baseTemplate(
          "Debit Transaction",
          `<p style="margin: 0 0 16px 0;">Dear customer,</p>
           <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 8px 0;">
             <p style="margin: 0 0 8px 0; font-size: 14px; color: #666666;">Amount Debited</p>
             <p style="margin: 0; font-size: 32px; font-weight: 600; color: #d32f2f;">₹${data.amount}</p>
           </div>
           <div style="margin: 20px 0 0 0; padding-top: 16px; border-top: 1px solid #e8e8e8;">
             <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">📅 Date: ${new Date().toLocaleDateString()}</p>
             <p style="margin: 0; font-size: 13px; color: #666666;">🕐 Time: ${new Date().toLocaleTimeString()}</p>
           </div>
           <p style="margin: 16px 0 0 0; font-size: 13px; color: #888888;">If you did not authorize this transaction, please contact support.</p>`,
          "#F44336"
        ),
        text: `₹${data.amount} has been debited from your account.`,
      };

    case "CREDIT":
      return {
        subject: "Credit Alert",
        html: baseTemplate(
          "Credit Transaction",
          `<p style="margin: 0 0 16px 0;">Dear customer,</p>
           <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 8px 0;">
             <p style="margin: 0 0 8px 0; font-size: 14px; color: #666666;">Amount Credited</p>
             <p style="margin: 0; font-size: 32px; font-weight: 600; color: #2e7d32;">₹${data.amount}</p>
           </div>
           <div style="margin: 20px 0 0 0; padding-top: 16px; border-top: 1px solid #e8e8e8;">
             <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">📅 Date: ${new Date().toLocaleDateString()}</p>
             <p style="margin: 0; font-size: 13px; color: #666666;">🕐 Time: ${new Date().toLocaleTimeString()}</p>
           </div>
           <p style="margin: 16px 0 0 0; font-size: 13px; color: #888888;">Thank you for banking with us.</p>`,
          "#4CAF50"
        ),
        text: `₹${data.amount} has been credited to your account.`,
      };

    default:
      return {
        subject: "Bank Notification",
        html: baseTemplate(
          "Notification",
          `<p style="margin: 0;">${data?.message || "You have a new notification from Banking App."}</p>`,
          "#607D8B"
        ),
        text: data?.message || "Notification",
      };
  }
};

module.exports = { getEmailTemplate };
