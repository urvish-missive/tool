import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import { Resend } from 'resend'

/**
 * Get configured nodemailer transporter or return null if SMTP is not configured.
 */
function getTransporter() {
  dotenv.config()
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT, 10) || 587
  const secure = process.env.SMTP_SECURE === 'true'
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })
  }

  return null
}

/**
 * Generate a clean, standard, reliable HTML email without complex formats that trigger spam filters
 */
function generateEmailHtml({ name, reportTitle, filename }) {
  const recipientName = name && name.trim() ? name.trim() : 'there'
  const cleanTitle = reportTitle || 'Technical SEO & Content Report'
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
  <div style="border-bottom: 2px solid #0C81F3; padding-bottom: 12px; margin-bottom: 20px;">
    <h2 style="color: #0C81F3; margin: 0; font-size: 20px; font-weight: 700;">Missive Digital &bull; Report Ready</h2>
  </div>

  <p style="margin: 0 0 16px 0; font-size: 15px;">Hello <strong>${recipientName}</strong>,</p>

  <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155;">
    Thank you for using Missive Digital tools. Your requested <strong>${cleanTitle}</strong> has been generated and is attached to this email as a PDF document.
  </p>

  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <div style="font-size: 13px; margin-bottom: 8px; color: #475569;">
      <strong style="color: #0f172a;">Report:</strong> ${cleanTitle}
    </div>
    <div style="font-size: 13px; margin-bottom: 8px; color: #475569;">
      <strong style="color: #0f172a;">Date:</strong> ${dateStr}
    </div>
    <div style="font-size: 13px; color: #475569;">
      <strong style="color: #0f172a;">Attachment:</strong> ${filename}
    </div>
  </div>

  <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155;">
    You can open, print, or share the attached PDF file directly with your team.
  </p>

  <p style="margin: 0 0 24px 0; font-size: 14px; color: #334155;">
    If you have any questions or need assistance implementing these recommendations, feel free to reply to this email or visit our website.
  </p>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #64748b;">
    <p style="margin: 0 0 4px 0;"><strong>Missive Digital</strong> &bull; Organic Growth & Search Intelligence</p>
    <p style="margin: 0;"><a href="https://missivedigital.com" style="color: #0C81F3; text-decoration: none;">https://missivedigital.com</a></p>
  </div>
</div>
  `.trim()
}

/**
 * Send a PDF report via email using Resend (or fallback to SMTP)
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} [options.name] - Recipient name
 * @param {string} [options.reportTitle] - Title of the report
 * @param {Buffer} options.pdfBuffer - PDF file buffer
 * @param {string} [options.filename] - Filename for attachment
 * @returns {Promise<{ success: boolean, messageId?: string, simulated?: boolean }>}
 */
export async function sendPdfEmail({ to, name, reportTitle, pdfBuffer, filename }) {
  // Always reload .env so changes are picked up immediately
  dotenv.config()

  if (!to || !to.includes('@')) {
    throw new Error('A valid recipient email address is required.')
  }

  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    throw new Error('A valid PDF buffer attachment is required.')
  }

  const cleanFilename = filename || `missive-report-${Date.now()}.pdf`
  const subject = `Your ${reportTitle || 'Technical SEO Report'} is ready — Missive Digital`
  const html = generateEmailHtml({ name, reportTitle, filename: cleanFilename })
  const recipientName = name && name.trim() ? name.trim() : 'there'
  const text = `Hello ${recipientName},\n\nYour requested report "${reportTitle || 'Report'}" is attached as "${cleanFilename}".\n\nMissive Digital\nhttps://missivedigital.com`

  // 1. Primary: Resend API
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim()
  if (resendApiKey) {
    const resend = new Resend(resendApiKey)
    const rawFrom = process.env.RESEND_FROM || 'onboarding@resend.dev'
    const fromAddress = rawFrom.replace(/^"|"$/g, '').trim()

    console.log(`[EmailService] Sending email via Resend to: ${to} (From: ${fromAddress})...`)

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html,
      text,
      attachments: [
        {
          filename: cleanFilename,
          content: pdfBuffer,
        },
      ],
    })

    if (error) {
      console.error('[EmailService] Resend API error:', error)
      throw new Error(error.message || 'Resend error')
    }

    console.log(`[EmailService] [OK] Email successfully sent via Resend! ID: ${data?.id}`)
    return {
      success: true,
      provider: 'resend',
      messageId: data?.id,
      message: `Report successfully emailed to ${to}!`,
    }
  }

  // 2. Secondary: Nodemailer SMTP
  const transporter = getTransporter()
  if (transporter) {
    const rawFrom = process.env.SMTP_FROM || 'Missive Digital <reports@missivedigital.com>'
    const fromAddress = rawFrom.replace(/^"|"$/g, '').trim()

    console.log(`[EmailService] Sending email via SMTP to: ${to}...`)
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text,
      attachments: [
        {
          filename: cleanFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    console.log(`[EmailService] [OK] Email sent via SMTP to ${to} (Message ID: ${info.messageId})`)
    return {
      success: true,
      provider: 'smtp',
      messageId: info.messageId,
      message: `Report successfully emailed to ${to}!`,
    }
  }

  // 3. Fallback: Simulation when no provider credentials are set yet
  console.log(`\n================== [EMAIL SERVICE] ==================`)
  console.log(`[EmailService] [SIMULATION] EMAIL DELIVERY:`)
  console.log(`  To: ${to} (${name || 'Visitor'})`)
  console.log(`  Subject: ${subject}`)
  console.log(`  Attachment: ${cleanFilename} (${Math.round(pdfBuffer.length / 1024)} KB)`)
  console.log(`[EmailService] Set RESEND_API_KEY in server/.env to enable live email delivery.`)
  console.log(`====================================================\n`)

  return {
    success: true,
    simulated: true,
    provider: 'simulated',
    message: `Report prepared for ${to} (Simulation — add RESEND_API_KEY to server/.env).`,
  }
}
