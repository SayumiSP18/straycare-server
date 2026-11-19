import nodemailer from "nodemailer";

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || `StrayCare <${SMTP_USER || "noreply@straycare.lk"}>`;

const isMailerConfigured = Boolean(SMTP_USER && SMTP_PASS);

const transporter = isMailerConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

export const sendEmail = async ({ to, subject, html, text }: SendMailOptions): Promise<void> => {
  if (!transporter) {
    console.warn(`[Mailer skipped] SMTP not configured. Would send "${subject}" to ${to}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      html,
    });
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
};

export const sendWelcomeEmail = async (params: {
  to: string;
  name: string;
  role: string;
}): Promise<void> => {
  const { to, name, role } = params;
  const isRescuer = role === "RESCUER";

  await sendEmail({
    to,
    subject: isRescuer
      ? "Rescuer Registration Received (Pending Approval) — StrayCare"
      : "Welcome to StrayCare!",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2>Welcome to StrayCare, ${name}!</h2>
        ${
          isRescuer
            ? `<p>Thank you for registering as a <strong>Rescuer</strong> on StrayCare.</p>
               <p>Your account is currently <strong>pending admin approval</strong>. Once an administrator reviews and verifies your account, you will be able to access rescuer features.</p>`
            : `<p>Thank you for joining <strong>StrayCare</strong> as a Citizen!</p>
               <p>You can now report stray animals in need, browse pets waiting for a home, and submit adoption requests.</p>`
        }
        <p>Warm regards,<br/><strong>StrayCare Team</strong></p>
      </div>
    `,
  });
};

export const sendAdoptionSubmittedEmail = async (params: {
  to: string;
  adopterName: string;
  animalName: string;
  requestId: string;
}): Promise<void> => {
  const { to, adopterName, animalName, requestId } = params;
  await sendEmail({
    to,
    subject: `Adoption Request Received for ${animalName} — StrayCare`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2>Adoption Request Received</h2>
        <p>Hi ${adopterName},</p>
        <p>We have received your adoption request for <strong>${animalName}</strong>.</p>
        <p><strong>Request ID:</strong> ${requestId}<br/>
        <strong>Status:</strong> PENDING</p>
        <p>Our team will review your request and notify you as soon as a decision is made.</p>
        <p>Thank you for supporting stray rescue in Sri Lanka.<br/><strong>StrayCare Team</strong></p>
      </div>
    `,
  });
};

export const sendAdoptionDecisionEmail = async (params: {
  to: string;
  adopterName: string;
  animalName: string;
  decision: "APPROVED" | "REJECTED";
  requestId: string;
}): Promise<void> => {
  const { to, adopterName, animalName, decision, requestId } = params;
  const approved = decision === "APPROVED";

  await sendEmail({
    to,
    subject: approved
      ? `Congratulations! Your Adoption Request for ${animalName} is Approved`
      : `Update on Your Adoption Request for ${animalName} — StrayCare`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2>${approved ? "Adoption Approved!" : "Adoption Request Update"}</h2>
        <p>Hi ${adopterName},</p>
        ${
          approved
            ? `<p>Great news! Your adoption request for <strong>${animalName}</strong> has been <strong>APPROVED</strong>.</p>
               <p>You can now view your adoption details and download your adoption certificate from your StrayCare account.</p>`
            : `<p>Thank you for your interest in adopting <strong>${animalName}</strong>. After reviewing your request, it was not approved at this time.</p>
               <p>Other wonderful animals are still waiting for a home on StrayCare.</p>`
        }
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p>Warm regards,<br/><strong>StrayCare Team</strong></p>
      </div>
    `,
  });
};

export const sendNewReportAlertEmail = async (params: {
  to: string;
  species: string;
  location: string;
  condition: string;
  reportId: string;
}): Promise<void> => {
  const { to, species, location, condition, reportId } = params;
  await sendEmail({
    to,
    subject: `[${condition}] New ${species} Stray Report at ${location} — StrayCare`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2>New Stray Report Submitted</h2>
        <p><strong>Species:</strong> ${species}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Condition:</strong> ${condition}</p>
        <p><strong>Report ID:</strong> ${reportId}</p>
        <p>Please check the StrayCare dashboard to coordinate rescue or care.</p>
      </div>
    `,
  });
};