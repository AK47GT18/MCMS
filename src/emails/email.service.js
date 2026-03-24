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
 * Send password reset email
 */
async function sendPasswordReset(user, resetToken) {
  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const { html, text } = loadTemplate('password-reset', {
    name: user.name,
    resetLink,
    expiryTime: '10 minutes',
    year: new Date().getFullYear(),
  });
  
  return send({
    to: user.email,
    subject: 'MCMS: Reset Your Password',
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

/**
 * Send tailored road project budget approved emails
 * @param {Object} project - The Project object
 * @param {Object} spec - The RoadSpecification object
 * @param {Array} layers - Array of approved RoadLayer objects
 * @param {Array} accessories - Array of approved RoadAccessory objects
 * @param {Object} recipients - { fs, fms: [], ecs: [] } containing User objects
 */
async function sendRoadBudgetApproved(project, spec, layers, accessories, recipients) {
  const promises = [];
  const formatter = new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK', minimumFractionDigits: 0 });

  // 1. FS Email (Project Spec + Timeline)
  if (recipients.fs) {
    const fsHtml = `
      <h2>Road Construction Spec Approved</h2>
      <p>Hello ${recipients.fs.name},</p>
      <p>The road specification for <strong>${project.name}</strong> (${project.code}) has been approved and budget is locked. You are the assigned Field Supervisor.</p>
      
      <h3>Project Spec</h3>
      <ul>
        <li><strong>Road Type:</strong> ${spec.roadType}</li>
        <li><strong>Length:</strong> ${spec.lengthKm} km</li>
        <li><strong>Width:</strong> ${spec.widthM} m</li>
        <li><strong>Terrain:</strong> ${spec.terrain}</li>
        <li><strong>Zone:</strong> ${spec.geographicZone || 'N/A'}</li>
      </ul>

      <h3>Confirmed Phases</h3>
      <ul>
        ${layers.reduce((acc, l) => acc.includes(l.phaseName) ? acc : [...acc, l.phaseName], []).map(p => `<li>${p}</li>`).join('')}
      </ul>
      <p>Procurement is now underway. Await equipment assignment from the EC.</p>
    `;

    promises.push(send({
      to: recipients.fs.email,
      subject: `Project Ready: ${project.code} Road Spec Approved`,
      html: fsHtml,
      text: `Project ${project.code} Road Spec Approved. Check MCMS dashboard for details.`
    }));
  }

  // 2. FM Email (Full Procurement Brief)
  if (recipients.fms && recipients.fms.length > 0) {
    // Group all items (layers + accessories)
    const allItems = [
      ...layers.map(l => ({ phase: `Ph ${l.phaseNumber}`, name: l.materialType, unit: l.unit, qty: l.totalQuantity, unitCost: l.unitCostHigh, totalCost: l.totalCostHigh })),
      ...accessories.map(a => ({ phase: 'Accessories', name: a.itemName, unit: a.unit, qty: a.totalQuantity, unitCost: a.unitCostHigh, totalCost: a.totalCostHigh }))
    ];

    const tableRows = allItems.map(item => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.phase}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.qty} ${item.unit}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${formatter.format(item.unitCost)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;"><strong>${formatter.format(item.totalCost)}</strong></td>
      </tr>
    `).join('');

    const fmHtml = `
      <h2>Road Project Procurement Brief</h2>
      <p>The budget for road project <strong>${project.name}</strong> (${project.code}) has been locked at <strong>${formatter.format(project.budgetTotal)}</strong>.</p>
      <p>Please review the approved materials below and begin creating Vendor Contracts.</p>
      
      <table style="border-collapse: collapse; width: 100%; text-align: left;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px;">Phase</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Material / Item</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Total Qty</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Unit Cost</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Total Cost</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #0056b3;">
        <h3>Vendor Contract Guidance</h3>
        <p>For each material above, please create a new Contract record linked to project <strong>${project.code}</strong>. Ensure you capture:</p>
        <ul>
          <li><strong>Vendor Name</strong></li>
          <li><strong>Contract Type</strong> (Supply Only / Supply & Install / Hire / Labour Only)</li>
          <li><strong>Materials Being Purchased</strong> (paste from table above)</li>
          <li><strong>Total Contract Value</strong></li>
          <li><strong>Delivery Start & End Dates</strong></li>
        </ul>
        <p>Remember to upload the signed vendor document PDF to the contract record.</p>
      </div>
    `;

    promises.push(...recipients.fms.map(fm => send({
      to: fm.email,
      subject: `Action Required: Procurement Brief for ${project.code}`,
      html: fmHtml,
      text: `Procurement Brief for ${project.code}. Please check MCMS for the materials table.`
    })));
  }

  // 3. EC Email (Equipment List)
  if (recipients.ecs && recipients.ecs.length > 0) {
    const ecHtml = `
      <h2>Road Project Equipment Assignment</h2>
      <p>The road specification for <strong>${project.name}</strong> (${project.code}) has been approved.</p>
      <p><strong>Project Target Start:</strong> ${new Date(project.startDate).toLocaleDateString()}</p>
      
      <h3>Required Equipment Planner</h3>
      <p>Please review the requested phases and begin assigning available heavy machinery from the Asset pool to this project.</p>
      <ul>
        ${layers.reduce((acc, l) => acc.includes(l.phaseName) ? acc : [...acc, l.phaseName], []).map(p => `<li>${p}</li>`).join('')}
      </ul>
      <p>The system will suggest specific equipment (Pavers, Graders, Rollers) based on the active phases in the dashboard.</p>
    `;

    promises.push(...recipients.ecs.map(ec => send({
      to: ec.email,
      subject: `Asset Planning: Equipment requested for ${project.code}`,
      html: ecHtml,
      text: `Equipment requested for ${project.code}. Check active phases in MCMS.`
    })));
  }

  await Promise.all(promises);
}

module.exports = {
  init,
  send,
  loadTemplate,
  sendWelcome,
  sendNotification,
  sendConfirmation,
  sendPasswordReset,
  sendRoadBudgetApproved,
  getStatus,
};
