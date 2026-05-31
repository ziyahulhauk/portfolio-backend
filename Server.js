const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const Message = require("./models/Message");

dotenv.config();

// MongoDB Connect
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Twilio Client
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Home Route
app.get("/", (req, res) => {
  res.send("Portfolio Backend Running...");
});

// Contact Route
app.post("/send-message", async (req, res) => {
  try {
    const {
      name,
      email,
      subject,
      message,
    } = req.body;

    // Validation
    if (
      !name ||
      !email ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, Email and Message are required",
      });
    }

    // Save MongoDB
    const savedMessage =
      await Message.create({
        name,
        email,
        subject,
        message,
      });

    const msg = `
📩 New Contact Form Message

👤 Name: ${name}

📧 Email: ${email}

📌 Subject: ${
      subject || "No Subject"
    }

💬 Message:
${message}
`;

    // WhatsApp
    const whatsappPromise =
      client.messages.create({
        from:
          "whatsapp:+14155238886",
        to: process.env
          .MY_WHATSAPP_NUMBER,
        body: msg,
      });

    // SMS
    const smsPromise =
      client.messages.create({
        from:
          process.env
            .TWILIO_PHONE_NUMBER,
        to: process.env
          .MY_PHONE_NUMBER,
        body: msg,
      });

    await Promise.allSettled([
      whatsappPromise,
      smsPromise,
    ]);

    return res.status(200).json({
      success: true,
      message:
        "Message saved and sent successfully",
      data: savedMessage,
    });
  } catch (error) {
    console.error(
      "SERVER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Server Error",
    });
  }
});

// Start Server
const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});