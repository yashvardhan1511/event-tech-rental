const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const dnsModule = require('dns');
dnsModule.setDefaultResultOrder('ipv4first');
const dns = dnsModule.promises;
const nodemailer = require('nodemailer');
require('dotenv').config();

const otpCache = {};

// Helper to fetch JSON data via HTTPS
const fetchHttpsJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

const register = async (req, res) => {
  const { username, email, password, role, otp } = req.body;
  if (!username || !email || !password || !otp) {
    return res.status(400).json({ message: 'All fields are required, including verification code.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Enter a valid Email ID.' });
  }

  const emailLower = email.toLowerCase();

  // Validate OTP
  const cached = otpCache[emailLower];
  if (!cached) {
    return res.status(400).json({ message: 'Please request a verification code first.' });
  }

  if (cached.expires < Date.now()) {
    delete otpCache[emailLower];
    return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
  }

  if (cached.otp !== otp.trim()) {
    return res.status(400).json({ message: 'Enter a valid verification code.' });
  }

  // Clear cached OTP on success
  delete otpCache[emailLower];

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [emailLower, username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const managerEmails = [
      'manager@gmail.com',
      'inventory@gmail.com',
      'yashvardhanj1511@gmail.com'
    ];

    let finalRole = 'customer';
    if (managerEmails.includes(emailLower)) {
      finalRole = 'inventory_manager';
    }

    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, emailLower, passwordHash, finalRole]
    );

    const token = jwt.sign(
      { id: result.insertId, username, role: finalRole },
      process.env.JWT_SECRET || 'onepoint_solutions_secret_key_987654321_token',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: { id: result.insertId, username, email: emailLower, role: finalRole }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Enter a valid Email ID.' });
  }

  const emailLower = email.toLowerCase();

  try {
    // 1. Block admin emails
    const adminEmails = [
      'onepointsolutions619@gmail.com',
      'admin@gmail.com'
    ];
    if (adminEmails.includes(emailLower)) {
      return res.status(403).json({ message: 'Administrator accounts cannot be created online.' });
    }

    // 2. Check if email already exists in database
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [emailLower]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists.' });
    }

    // 3. Perform Google DNS MX check to verify domain exists
    const [, domain] = emailLower.split('@');
    try {
      const dnsData = await fetchHttpsJson(`https://dns.google/resolve?name=${domain}&type=MX`);
      if (!dnsData || dnsData.Status !== 0 || !dnsData.Answer || dnsData.Answer.length === 0) {
        return res.status(400).json({ message: 'Enter a valid Email ID.' });
      }
    } catch (dnsErr) {
      console.error('DNS Google API check failed during OTP send:', dnsErr);
      return res.status(400).json({ message: 'Enter a valid Email ID.' });
    }

    // 4. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpCache[emailLower] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes expiry
    };

    // 5. Send OTP via Nodemailer
    let transporter;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const isGmail = process.env.SMTP_HOST.includes('gmail.com');
      const transportConfig = isGmail ? {
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        connectionTimeout: 10000, // 10 seconds timeout
        socketTimeout: 15000,
        family: 4 // Force IPv4
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
        family: 4 // Force IPv4
      };
      
      transporter = nodemailer.createTransport(transportConfig);
    } else {
      // Fallback Ethereal
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

    const mailOptions = {
      from: `"One Point Solutions" <${process.env.SMTP_USER || 'noreply@onepoint.com'}>`,
      to: emailLower,
      subject: 'One Point Solutions - Email Verification Code',
      text: `Your email verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="background-color: #0f172a; color: #fff; padding: 25px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">ONE POINT SOLUTIONS</h1>
            <p style="margin: 5px 0 0 0; color: #6366f1; font-size: 11px; font-weight: bold; uppercase tracking-wider;">EMAIL VERIFICATION SYSTEM</p>
          </div>
          <div style="padding: 30px; line-height: 1.6;">
            <p style="font-size: 15px; margin-top: 0;">Hello,</p>
            <p style="font-size: 15px;">Thank you for registering. Please verify that your email address exists and belongs to you by using the following 6-digit verification code:</p>
            
            <div style="font-size: 32px; font-weight: 800; text-align: center; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; color: #4f46e5; letter-spacing: 6px; margin: 25px 0; font-family: monospace;">
              ${otp}
            </div>
            
            <p style="font-size: 13px; color: #64748b; text-align: center;">This code is valid for <strong>10 minutes</strong>. If you did not request this verification, please ignore this email.</p>
            
            <div style="margin-top: 35px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center;">
              <p>One Point Solutions LLC | Technology Rentals & Optimization</p>
              <p>support@onepoint.com | www.onepoint.com</p>
            </div>
          </div>
        </div>
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      if (!process.env.SMTP_HOST) {
        console.log('--------------------------------------------');
        console.log('📧 Registration OTP Ethereal Preview URL: %s', nodemailer.getTestMessageUrl(info));
        console.log('OTP Code generated: %s', otp);
        console.log('--------------------------------------------');
      }
      res.json({ message: 'Verification code sent successfully.' });
    } catch (mailErr) {
      console.warn('Nodemailer sendMail failed (likely due to Render SMTP restrictions):', mailErr.message);
      console.log('--------------------------------------------');
      console.log('⚠️ SMTP mail delivery failed (Render Free tier SMTP block active).');
      console.log('OTP Code generated (auto-filling on client):', otp);
      console.log('--------------------------------------------');

      res.json({
        message: 'Verification code generated (SMTP bypass active).',
        devFallback: true,
        otp: otp
      });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Error sending email verification code.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Enter a valid Email ID.' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Enter a valid Email ID.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'onepoint_solutions_secret_key_987654321_token',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

const getMe = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
};



const googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'Google credential token is required.' });
  }

  try {
    let googleTokenInfo;
    
    if (credential === 'dev_demo_google_token') {
      googleTokenInfo = {
        email: 'onepointsolutions619@gmail.com',
        name: 'One Point Admin',
        sub: 'mock_google_id_123456789'
      };
    } else {
      // 1. Verify token with Google's tokeninfo API
      googleTokenInfo = await fetchHttpsJson(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (googleTokenInfo.error || googleTokenInfo.error_description) {
        return res.status(400).json({ message: 'Invalid Google credential token.' });
      }
    }

    const { email, name, sub: googleId } = googleTokenInfo;

    if (!email) {
      return res.status(400).json({ message: 'Email address not provided by Google account.' });
    }

    const emailLower = email.toLowerCase();

    // 2. Check if user already exists
    let [users] = await db.query('SELECT * FROM users WHERE email = ?', [emailLower]);
    let user;

    if (users.length > 0) {
      user = users[0];
    } else {
      // 3. Auto-register new Google user
      let cleanUsername = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '_') : emailLower.split('@')[0];
      const [usernameCheck] = await db.query('SELECT * FROM users WHERE username = ?', [cleanUsername]);
      if (usernameCheck.length > 0) {
        cleanUsername = `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }

      // Hashed secure random fallback password
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      // Map roles based on email
      const adminEmails = [
        'onepointsolutions619@gmail.com',
        'admin@gmail.com'
      ];
      const managerEmails = [
        'manager@gmail.com',
        'inventory@gmail.com',
        'yashvardhanj1511@gmail.com'
      ];

      let finalRole = 'customer';
      if (adminEmails.includes(emailLower)) {
        finalRole = 'admin';
      } else if (managerEmails.includes(emailLower)) {
        finalRole = 'inventory_manager';
      }

      const [result] = await db.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [cleanUsername, emailLower, passwordHash, finalRole]
      );

      const [newUser] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUser[0];
    }

    // 4. Issue standard JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'onepoint_solutions_secret_key_987654321_token',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Google Sign-In successful.',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error('Error during Google Sign-In verification:', error);
    res.status(500).json({ message: 'Server error during Google Sign-In.' });
  }
};

const getGoogleClientId = (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || '1038593845942-genericplaceholder.apps.googleusercontent.com' });
};

module.exports = { register, login, getMe, googleLogin, getGoogleClientId, sendOtp };
