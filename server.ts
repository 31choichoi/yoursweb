import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/robots.txt", (req, res) => {
    res.sendFile(path.join(process.cwd(), "robots.txt"));
  });

  app.get("/sitemap.xml", (req, res) => {
    res.sendFile(path.join(process.cwd(), "sitemap.xml"));
  });

  // API Route for Inquiry Notification
  app.post("/api/notify", async (req, res) => {
    const { name, company, email, phone, type, content } = req.body;

    if (!name || !email || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Check if SMTP credentials are provided
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("⚠️ SMTP Credentials (SMTP_USER, SMTP_PASS) are missing. Email notification skipped.");
        console.warn("Please set these in the Settings menu to receive email alerts.");
        return res.status(200).json({ 
          success: false, 
          message: "Database saved, but email service not configured." 
        });
      }

      // Setup Nodemailer
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: (process.env.SMTP_PORT === "465" || !process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const recipient = "999c@kakao.com";
      const mailOptions = {
        from: `"Yours Web Inquiry" <${process.env.SMTP_USER}>`,
        to: recipient,
        subject: `[Yours Web Inquiry] ${company} - From ${name}`, // Keep subject fixed
        text: `
A new project inquiry has been received.

Name: ${name}
Company: ${company}
Email: ${email}
Phone: ${phone}
Type: ${type}
Message:
${content}
        `,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e9f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #0A2540; color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">New Project Inquiry</h1>
            </div>
            <div style="padding: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #4a5468;"><strong>Name:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #1e293b;">${name}</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #4a5468;"><strong>Company:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #1e293b;">${company}</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #4a5468;"><strong>Email:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #1e293b;"><a href="mailto:${email}" style="color: #3B6EFF; text-decoration: none;">${email}</a></td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #4a5468;"><strong>Phone:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #1e293b;">${phone}</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #4a5468;"><strong>Type:</strong></td><td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #3B6EFF; font-weight: bold;">${type}</td></tr>
              </table>
              <div style="margin-top: 24px; padding: 20px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #3B6EFF;">
                <p style="margin: 0; font-weight: bold; color: #0A2540; margin-bottom: 10px;">Project Description:</p>
                <div style="color: #1e293b; line-height: 1.6; font-size: 15px;">${content.replace(/\n/g, "<br>")}</div>
              </div>
            </div>
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e9f0;">
              <p style="margin: 0; font-size: 13px; color: #8a94a6;">This notification was sent via Yours Web Admin System.</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Inquiry email notification sent successfully to", recipient);
      res.json({ success: true });
    } catch (error) {
      console.error("❌ Failed to send inquiry email notification.");
      console.error("Recipient:", "999c@kakao.com");
      console.error("Error Details:", error);
      res.status(500).json({ error: "Email service failed", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
