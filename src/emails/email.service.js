/**
 * MCMS Email Service
 * Nodemailer configuration and email sending utilities
 */

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const logger = require('../utils/logger');

// Create transporter
let transporter = null;

/**
 * Initialize email transporter
 */
function init() {
  if (!env.SMTP_HOST || !env.SMTP_USERNAME) {
    logger.warn('Email service not configured - SMTP credentials missing');
    return null;
  }
  
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USERNAME,
      pass: env.SMTP_PASSWORD,
    },
  });
  
  logger.info('Email service initialized');
  return transporter;
}

/**
 * Send an email
 * @param {Object} options - Email options
 */
async function send({ to, subject, html, text, attachments }) {
  if (!transporter) {
    init();
  }
  
  if (!transporter) {
    logger.error('Cannot send email - transporter not configured');
    return { success: false, error: 'Email service not configured' };
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"MCMS" <${env.SMTP_USERNAME}>`,
      to,
      subject,
      html,
      text,
      attachments,
    });
    
    logger.info('Email sent', { to, subject, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email send failed', { to, subject, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Load email template
 * @param {string} name - Template name (without extension)
 * @param {Object} variables - Template variables
 * @returns {Object} { html, text }
 */
function loadTemplate(name, variables = {}) {
  const templatesDir = path.join(__dirname, 'templates');
  
  let html = '';
  let text = '';
  
  try {
    const htmlPath = path.join(templatesDir, `${name}.html`);
    if (fs.existsSync(htmlPath)) {
      html = fs.readFileSync(htmlPath, 'utf8');
    }
    
    const textPath = path.join(templatesDir, `${name}.txt`);
    if (fs.existsSync(textPath)) {
      text = fs.readFileSync(textPath, 'utf8');
    }
    
    // Replace variables in templates
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
      text = text.replace(regex, value);
    });
    
    return { html, text };
  } catch (error) {
    logger.error('Template load error', { name, error: error.message });
    return { html: '', text: '' };
  }
}

/**
 * Send welcome email to new user
 */
async function sendWelcome(user) {
  const { html, text } = loadTemplate('welcome', {
    name: user.name,
    email: user.email,
    role: user.role,
    loginUrl: `${env.FRONTEND_URL}/login`,
  });
  
  return send({
    to: user.email,
    subject: 'Welcome to MCMS',
    html,
    text,
  });
}

/**
 * Send notification email
 */
async function sendNotification(user, title, message, actionUrl = '') {
  const { html, text } = loadTemplate('notification', {
    name: user.name,
    title,
    message,
    actionUrl: actionUrl || env.FRONTEND_URL,
    year: new Date().getFullYear(),
  });
  
  return send({
    to: user.email,
    subject: `MCMS: ${title}`,
    html,
    text,
  });
}

/**
 * Send confirmation email (for approvals, etc.)
 */
async function sendConfirmation(user, action, details) {
  const { html, text } = loadTemplate('confirmation', {
    name: user.name,
    action,
    details,
    timestamp: new Date().toLocaleString(),
    year: new Date().getFullYear(),
  });
  
  return send({
    to: user.email,
    subject: `MCMS: ${action} Confirmed`,
    html,
    text,
  });
}

/**
 * Get email service status
 */
function getStatus() {
  return {
    configured: !!transporter,
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
  };
}

module.exports = {
  init,
  send,
  loadTemplate,
  sendWelcome,
  sendNotification,
  sendConfirmation,
  getStatus,
};
