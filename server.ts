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

  // API Route for Inquiry Notification
  app.post("/api/notify", async (req, res) => {
    const { name, company, email, phone, type, content } = req.body;

    if (!name || !email || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Setup Nodemailer
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"Yours Web Inquirer" <${process.env.SMTP_USER}>`,
        to: process.env.NOTIFICATION_EMAIL || "999c@kakao.com",
        subject: `[프로젝트 문의] ${company} - ${name}님`,
        text: `
새로운 프로젝트 문의가 접수되었습니다.

성함: ${name}
회사명: ${company}
이메일: ${email}
연락처: ${phone}
유형: ${type}
내용:
${content}
        `,
        html: `
          <h3>새로운 프로젝트 문의가 접수되었습니다.</h3>
          <p><strong>성함:</strong> ${name}</p>
          <p><strong>회사명:</strong> ${company}</p>
          <p><strong>이메일:</strong> ${email}</p>
          <p><strong>연락처:</strong> ${phone}</p>
          <p><strong>유형:</strong> ${type}</p>
          <p><strong>내용:</strong></p>
          <div style="background: #f4f6fa; padding: 15px; border-radius: 4px;">
            ${content.replace(/\n/g, "<br>")}
          </div>
        `,
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to", process.env.NOTIFICATION_EMAIL);
      } else {
        console.error("SMTP credentials missing! Please set SMTP_USER and SMTP_PASS in Settings.");
        return res.status(500).json({ error: "SMTP configuration missing" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email notification" });
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
