const https = require('https');
const nodemailer = require('nodemailer');
const dnsModule = require('dns');
dnsModule.setDefaultResultOrder('ipv4first');

const sendEmail = async ({ to, subject, text, html, attachments }) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    console.log('Sending email via Resend API...');
    
    // Map attachments to Resend format:
    // Nodemailer uses: { filename, content: Buffer }
    // Resend expects: { filename, content: Base64String }
    const resendAttachments = attachments ? attachments.map(att => {
      let base64Content = '';
      if (Buffer.isBuffer(att.content)) {
        base64Content = att.content.toString('base64');
      } else if (typeof att.content === 'string') {
        base64Content = att.content;
      }
      return {
        filename: att.filename,
        content: base64Content
      };
    }) : [];

    // Extract raw email addresses (Resend expects array of strings or comma-separated string)
    const recipientList = typeof to === 'string' ? to.split(',').map(s => s.trim()) : to;

    // Use onboarding@resend.dev unless a custom domain is verified
    const fromEmail = process.env.SMTP_USER && process.env.SMTP_USER.includes('@') && !process.env.SMTP_USER.includes('gmail.com')
      ? process.env.SMTP_USER 
      : 'onboarding@resend.dev';

    const payload = JSON.stringify({
      from: `One Point Solutions <${fromEmail}>`,
      to: recipientList,
      subject,
      text,
      html,
      attachments: resendAttachments
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('Email sent successfully via Resend API:', responseBody);
            resolve(JSON.parse(responseBody));
          } else {
            console.error('Resend API failed:', res.statusCode, responseBody);
            reject(new Error(`Resend API failed with status ${res.statusCode}: ${responseBody}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(payload);
      req.end();
    });
  }

  // Fallback to Nodemailer SMTP
  console.log('Sending email via Nodemailer SMTP...');
  let transporter;
  let isTestAccount = false;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const isGmail = process.env.SMTP_HOST.includes('gmail.com');
    transporter = nodemailer.createTransport(isGmail ? {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 10000,
      socketTimeout: 15000,
      family: 4
    } : {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 10000,
      socketTimeout: 15000,
      family: 4
    });
  } else {
    isTestAccount = true;
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  const from = `"One Point Solutions" <${process.env.SMTP_USER || 'noreply@onepoint.com'}>`;
  
  // Format attachments for Nodemailer
  const nodemailerAttachments = attachments ? attachments.map(att => ({
    filename: att.filename,
    content: typeof att.content === 'string' && !Buffer.isBuffer(att.content) ? Buffer.from(att.content, 'base64') : att.content,
    contentType: att.contentType
  })) : [];

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
    attachments: nodemailerAttachments
  });

  if (isTestAccount) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('--------------------------------------------');
    console.log('📧 Ethereal Test Email Sent successfully!');
    console.log('Preview URL: %s', previewUrl);
    console.log('--------------------------------------------');
    return { previewUrl };
  }

  return info;
};

module.exports = { sendEmail };
