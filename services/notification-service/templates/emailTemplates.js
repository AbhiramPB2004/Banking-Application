const getEmailTemplate = (type, data) => {
  switch (type) {
    case "REGISTER":
      return {
        subject: "Welcome to Banking App 🎉",
        html: `
          <h2>Welcome ${data.name}</h2>
          <p>Your account has been created successfully.</p>
        `,
        text: `Welcome ${data.name}, your account has been created.`,
      };

    case "LOGIN":
      return {
        subject: "Login Alert 🔐",
        html: `
          <h2>Login Successful</h2>
          <p>Hello ${data.name}, you have logged in successfully.</p>
        `,
        text: `Hello ${data.name}, login successful.`,
      };

    case "DEBIT":
      return {
        subject: "Debit Alert 💸",
        html: `
          <h2>Amount Debited</h2>
          <p>₹${data.amount} has been debited from your account.</p>
        `,
        text: `₹${data.amount} debited.`,
      };

    case "CREDIT":
      return {
        subject: "Credit Alert 💰",
        html: `
          <h2>Amount Credited</h2>
          <p>₹${data.amount} has been credited to your account.</p>
        `,
        text: `₹${data.amount} credited.`,
      };

    default:
      return {
        subject: "Bank Notification",
        html: `<p>${data?.message || "Notification"}</p>`,
        text: data?.message || "Notification",
      };
  }
};

module.exports = { getEmailTemplate };