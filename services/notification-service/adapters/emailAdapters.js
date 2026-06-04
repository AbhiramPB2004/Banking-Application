const SibApiV3Sdk = require("sib-api-v3-sdk");

const brevoApiKey = process.env.BREVO_API_KEY;
const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || "abhirampb9@gmail.com";
const brevoSenderName = process.env.BREVO_SENDER_NAME || "Banking App";

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = brevoApiKey;

const transactionalEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (to, subject, message) => {
  if (!brevoApiKey) {
    throw new Error("BREVO_API_KEY is missing from environment variables");
  }

  if (!brevoSenderEmail) {
    throw new Error("BREVO_SENDER_EMAIL or EMAIL_USER is required for Brevo sender");
  }

  try {
    console.log("Sending email to:", to);

    const email = {
      to: [{ email: to }],
      sender: { email: brevoSenderEmail, name: brevoSenderName },
      subject,
      htmlContent: message,
    };

    const response = await transactionalEmailApi.sendTransacEmail(email);

    console.log("Email sent:", response && response.messageId);
    return response;
  } catch (error) {
    console.error("Email Error:", error.response ? error.response.body : error.message || error);
    throw error;
  }
};

module.exports = { sendEmail };
