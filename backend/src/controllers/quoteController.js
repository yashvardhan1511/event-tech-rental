const db = require('../config/db');
const nodemailer = require('nodemailer');

const createQuote = async (req, res) => {
  const { event_name, event_type, start_date, end_date, attendees, venue_size, budget, special_requirements, bundle_details, subtotal, discount, total } = req.body;
  const user_id = req.user.id;

  if (!event_name || !event_type || !start_date || !end_date || !attendees || !venue_size || !bundle_details) {
    return res.status(400).json({ message: 'Missing required event or quote details.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insert into events
    const [eventResult] = await connection.query(
      'INSERT INTO events (user_id, name, type, start_date, end_date, attendees, venue_size, budget, special_requirements) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, event_name, event_type, start_date, end_date, attendees, venue_size, budget || null, special_requirements || '']
    );
    const eventId = eventResult.insertId;

    // 2. Insert into quotes
    const [quoteResult] = await connection.query(
      'INSERT INTO quotes (event_id, user_id, bundle_details, subtotal, discount, total, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [eventId, user_id, JSON.stringify(bundle_details), subtotal, discount || 0.00, total, 'draft']
    );

    await connection.commit();
    res.status(201).json({
      message: 'Quote created successfully.',
      quoteId: quoteResult.insertId,
      eventId: eventId
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error generating quote.' });
  } finally {
    connection.release();
  }
};

const getAllQuotes = async (req, res) => {
  const { id, role } = req.user;

  try {
    let query = `
      SELECT q.*, e.name AS event_name, e.type AS event_type, e.start_date, e.end_date, u.username
      FROM quotes q
      JOIN events e ON q.event_id = e.id
      JOIN users u ON q.user_id = u.id
    `;
    let params = [];

    if (role === 'customer') {
      query += ' WHERE q.user_id = ?';
      params.push(id);
    }

    query += ' ORDER BY q.created_at DESC';

    const [quotes] = await db.query(query, params);
    
    const mapped = quotes.map(q => ({
      ...q,
      bundle_details: typeof q.bundle_details === 'string' ? JSON.parse(q.bundle_details) : q.bundle_details
    }));

    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving quotes.' });
  }
};

const getQuoteById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const query = `
      SELECT q.*, 
             e.name AS event_name, e.type AS event_type, e.start_date, e.end_date, e.attendees, e.venue_size, e.special_requirements,
             u.username, u.email AS user_email
      FROM quotes q
      JOIN events e ON q.event_id = e.id
      JOIN users u ON q.user_id = u.id
      WHERE q.id = ?
    `;
    const [quotes] = await db.query(query, [id]);

    if (quotes.length === 0) {
      return res.status(404).json({ message: 'Quote not found.' });
    }

    const quote = quotes[0];

    if (role === 'customer' && quote.user_id !== userId) {
      return res.status(403).json({ message: 'Forbidden. You do not own this quote.' });
    }

    quote.bundle_details = typeof quote.bundle_details === 'string' ? JSON.parse(quote.bundle_details) : quote.bundle_details;
    res.json(quote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving quote details.' });
  }
};

const updateQuoteStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (!['draft', 'sent', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM quotes WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Quote not found.' });
    }

    const quote = existing[0];
    if (role === 'customer' && quote.user_id !== userId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    await db.query('UPDATE quotes SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Quote status updated successfully.', status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating quote status.' });
  }
};

const sendQuoteEmail = async (req, res) => {
  const { id } = req.params;
  const { pdfBase64, fileName } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (!pdfBase64) {
    return res.status(400).json({ message: 'Missing PDF content.' });
  }

  try {
    // 1. Fetch quote details to get user_email and verification
    const query = `
      SELECT q.*, 
             e.name AS event_name, e.type AS event_type, e.start_date, e.end_date, e.attendees, e.venue_size,
             u.username, u.email AS user_email
      FROM quotes q
      JOIN events e ON q.event_id = e.id
      JOIN users u ON q.user_id = u.id
      WHERE q.id = ?
    `;
    const [quotes] = await db.query(query, [id]);

    if (quotes.length === 0) {
      return res.status(404).json({ message: 'Quote not found.' });
    }

    const quote = quotes[0];

    if (role === 'customer' && quote.user_id !== userId) {
      return res.status(403).json({ message: 'Forbidden. You do not own this quote.' });
    }

    // Get active logged-in user email
    const [currentUser] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);

    // Build the set of recipients
    const recipientsSet = new Set();
    if (quote.user_email) {
      recipientsSet.add(quote.user_email);
    }
    if (currentUser.length > 0 && currentUser[0].email) {
      recipientsSet.add(currentUser[0].email);
    }

    if (recipientsSet.size === 0) {
      recipientsSet.add('client@onepoint.com'); // default fallback
    }

    const recipientEmails = Array.from(recipientsSet).join(', ');

    // 2. Set up Nodemailer transporter
    let transporter;
    let isTestAccount = false;
    
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
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

    // 3. Compose email contents
    const subject = `Your Quotation Estimate from One Point Solutions: #OPS-2026-${quote.id}`;
    
    const items = typeof quote.bundle_details === 'string' ? JSON.parse(quote.bundle_details) : quote.bundle_details;
    const itemsListHtml = items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${parseFloat(item.daily_rate).toLocaleString('en-IN')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${parseFloat(item.total_price).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0f172a; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">ONE POINT SOLUTIONS</h1>
          <p style="margin: 5px 0 0 0; color: #6366f1; font-size: 12px; font-weight: bold;">EVENT TECHNOLOGY RENTAL ESTIMATE</p>
        </div>
        <div style="padding: 24px;">
          <p>Dear <strong>${quote.username}</strong>,</p>
          <p>Thank you for choosing One Point Solutions. We have prepared the quotation estimate for your upcoming event.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0f172a;">Event & Estimate Summary</h3>
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td><strong>Quote Reference:</strong></td>
                <td>#OPS-2026-${quote.id}</td>
              </tr>
              <tr>
                <td><strong>Event Name:</strong></td>
                <td>${quote.event_name} (${quote.event_type})</td>
              </tr>
              <tr>
                <td><strong>Dates:</strong></td>
                <td>${new Date(quote.start_date).toLocaleDateString()} to ${new Date(quote.end_date).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Attendees:</strong></td>
                <td>${quote.attendees} people</td>
              </tr>
              <tr>
                <td><strong>Subtotal:</strong></td>
                <td>₹${parseFloat(quote.subtotal).toLocaleString('en-IN')}</td>
              </tr>
              ${parseFloat(quote.discount) > 0 ? `
              <tr>
                <td style="color: #10b981;"><strong>Bundle Discount:</strong></td>
                <td style="color: #10b981;">-₹${parseFloat(quote.discount).toLocaleString('en-IN')}</td>
              </tr>
              ` : ''}
              <tr style="font-size: 16px; font-weight: bold; border-top: 1px solid #ddd;">
                <td style="padding-top: 8px;">Grand Total:</td>
                <td style="padding-top: 8px; color: #059669;">₹${parseFloat(quote.total).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <h3 style="color: #0f172a;">Itemized Breakdown</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 15px 0;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1;">Item</th>
                <th style="padding: 8px; text-align: center; border-bottom: 2px solid #cbd5e1;">Qty</th>
                <th style="padding: 8px; text-align: right; border-bottom: 2px solid #cbd5e1;">Rate/Day</th>
                <th style="padding: 8px; text-align: right; border-bottom: 2px solid #cbd5e1;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsListHtml}
            </tbody>
          </table>

          <p>Please find the official PDF quotation document attached to this email. You can approve and confirm this booking directly from your customer dashboard.</p>
          
          <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b; text-align: center;">
            <p>One Point Solutions LLC | Technology Rentals & Optimization</p>
            <p>support@onepoint.com | www.onepoint.com</p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"One Point Solutions" <${process.env.SMTP_USER || 'noreply@onepoint.com'}>`,
      to: recipientEmails,
      subject: subject,
      text: `Dear ${quote.username},\n\nPlease find attached the quotation estimate #OPS-2026-${quote.id} for your event: ${quote.event_name}.\n\nTotal Estimate: ₹${parseFloat(quote.total).toLocaleString('en-IN')}\n\nBest Regards,\nOne Point Solutions Support Team`,
      html: htmlContent,
      attachments: [
        {
          filename: fileName || `Quote_Estimate_OPS_${quote.id}.pdf`,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);

    let previewUrl = null;
    if (isTestAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('--------------------------------------------');
      console.log('📧 Ethereal Test Email Sent successfully!');
      console.log(`Recipient(s): ${recipientEmails}`);
      console.log('Preview URL: %s', previewUrl);
      console.log('--------------------------------------------');
    }

    res.json({
      message: 'Quotation email sent successfully.',
      recipient: recipientEmails,
      previewUrl: previewUrl
    });

  } catch (error) {
    console.error('Error sending quote email:', error);
    res.status(500).json({ message: 'Error sending quotation email.' });
  }
};

module.exports = {
  createQuote,
  getAllQuotes,
  getQuoteById,
  updateQuoteStatus,
  sendQuoteEmail
};
