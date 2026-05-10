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
async function sendWelcome(user, password) {
  const { html, text } = loadTemplate('welcome', {
    name: user.name,
    email: user.email,
    role: (user.role || '').replace(/_/g, ' '),
    password: password || '(Set by administrator)',
    loginUrl: `${env.FRONTEND_URL}/login`,
    year: new Date().getFullYear(),
  });
  
  return send({
    to: user.email,
    subject: 'Welcome to MCMS — Your Account Credentials',
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
async function sendRoadBudgetApproved(project, spec, layers, accessories, recipients, changes = null) {
  const promises = [];
  const formatter = new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK', minimumFractionDigits: 0 });

  const renderChanges = (list, title, color) => {
    if (!list || list.length === 0) return '';
    return `
      <div style="background-color: ${color}10; border-left: 4px solid ${color}; padding: 16px; margin: 15px 0; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: ${color}; font-size: 13px; text-transform: uppercase;">${title}</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155;">
          ${list.map(c => `<li style="margin-bottom: 4px;">${c}</li>`).join('')}
        </ul>
      </div>
    `;
  };

  const getWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 650px; border-collapse: separate; border-spacing: 0; background-color: #ffffff; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0;">
                    <!-- Header -->
                    <tr>
                        <td style="background: #ffffff; padding: 40px 0; text-align: center; border-bottom: 4px solid #f97415;">
                            <div style="font-size: 56px; line-height: 1; margin-bottom: 12px;">🏗️</div>
                            <h1 style="color: #0f1729; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Mkaka <span style="color: #f97415;">Construction</span></h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px; color: #334155; font-size: 15px; line-height: 1.6;">
                            ${content}
                            
                            <!-- Action Button -->
                            <table role="presentation" style="width: 100%; margin: 40px 0 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${env.FRONTEND_URL}/login" style="background: #f97415; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">View Details / Login</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 32px 48px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-size: 13px; margin: 0 0 6px; font-weight: 700; text-transform: uppercase;">MCMS Portal</p>
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Mkaka Construction. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;

  // 1. FS Email (Project Spec + Timeline)
  if (recipients.fs) {
    const fsHtml = getWrapper(`
      <h2 style="color: #0f1729; margin-top: 0; font-size: 20px;">Road Construction Spec Approved</h2>
      <p>Hello <strong>${recipients.fs.name}</strong>,</p>
      <p>The road specification for <strong>${project.name}</strong> (${project.code}) has been approved and the budget is locked. You are the assigned Field Supervisor.</p>
      
      ${renderChanges(changes?.universal, 'Universal Changes', '#64748b')}

      <div style="background-color: #f8fafc; border-left: 4px solid #f97415; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <h3 style="color: #0f1729; margin: 0 0 15px 0; font-size: 16px; text-transform: uppercase;">Project Specification</h3>
        <ul style="margin: 0; padding-left: 20px; color: #475569;">
          <li style="margin-bottom: 8px;"><strong>Road Type:</strong> ${spec.roadType}</li>
          <li style="margin-bottom: 8px;"><strong>Length:</strong> ${spec.lengthKm} km</li>
          <li style="margin-bottom: 8px;"><strong>Width:</strong> ${spec.widthM} m</li>
          <li style="margin-bottom: 8px;"><strong>Terrain:</strong> ${spec.terrain}</li>
          <li><strong>Zone:</strong> ${spec.geographicZone || 'N/A'}</li>
        </ul>
      </div>

      <h3 style="color: #0f1729; font-size: 16px; margin-bottom: 15px; text-transform: uppercase;">Confirmed Phases</h3>
      <ul style="padding-left: 20px; color: #475569;">
        ${layers.reduce((acc, l) => acc.includes(l.phaseName) ? acc : [...acc, l.phaseName], []).map(p => `<li style="margin-bottom: 6px;">${p}</li>`).join('')}
      </ul>
      <p style="margin-top: 25px;">Procurement is now underway. Await equipment assignment from the Equipment Coordinator (EC).</p>
    `);

    promises.push(send({
      to: recipients.fs.email,
      subject: `Project Ready: ${project.code} Road Spec Approved`,
      html: fsHtml,
      text: `Project ${project.code} Road Spec Approved. Login to MCMS for details.`
    }));
  }

  // 2. FM Email (Full Procurement Brief)
  if (recipients.fms && recipients.fms.length > 0) {
    const allItems = [
      ...layers.map(l => ({ phase: `Ph ${l.phaseNumber}`, name: l.materialType, unit: l.unit, qty: l.totalQuantity, unitCost: l.unitCostHigh, totalCost: l.totalCostHigh })),
      ...accessories.map(a => ({ phase: 'Accessories', name: a.itemName, unit: a.unit, qty: a.totalQuantity, unitCost: a.unitCostHigh, totalCost: a.totalCostHigh }))
    ];

    const tableRows = allItems.map(item => `
      <tr>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; color: #64748b;">${item.phase}</td>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; font-weight: 500;">${item.name}</td>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: center;">${item.qty} ${item.unit}</td>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: right; color: #64748b;">${formatter.format(item.unitCost)}</td>
        <td style="border-bottom: 1px solid #e2e8f0; padding: 12px; text-align: right; font-weight: 700; color: #0f1729;">${formatter.format(item.totalCost)}</td>
      </tr>
    `).join('');

    const fmHtml = getWrapper(`
      <h2 style="color: #0f1729; margin-top: 0; font-size: 20px;">Road Project Procurement Brief</h2>
      <p>The budget for road project <strong>${project.name}</strong> (${project.code}) has been locked at <strong style="color: #f97415; font-size: 16px;">${formatter.format(project.budgetTotal)}</strong>.</p>
      
      ${renderChanges(changes?.universal, 'Universal Changes', '#64748b')}
      ${renderChanges(changes?.finance, 'Budget Variance (Finance)', '#ef4444')}

      <p style="margin-bottom: 30px;">Please review the approved materials below and begin creating Vendor Contracts.</p>
      
      <div style="overflow-x: auto;">
        <table style="border-collapse: collapse; width: 100%; text-align: left; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="border-bottom: 2px solid #e2e8f0; padding: 14px 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px;">Phase</th>
              <th style="border-bottom: 2px solid #e2e8f0; padding: 14px 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px;">Material / Item</th>
              <th style="border-bottom: 2px solid #e2e8f0; padding: 14px 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; text-align: center;">Total Qty</th>
              <th style="border-bottom: 2px solid #e2e8f0; padding: 14px 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; text-align: right;">Unit Cost</th>
              <th style="border-bottom: 2px solid #e2e8f0; padding: 14px 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; text-align: right;">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 35px; padding: 25px; background-color: #fffaf5; border: 1px solid #fed7aa; border-radius: 8px;">
        <h3 style="color: #f97415; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">📝</span> Vendor Contract Guidance
        </h3>
        <p style="margin-bottom: 15px;">For each material above, please create a new Contract record linked to project <strong>${project.code}</strong>. Ensure you capture:</p>
        <ul style="margin: 0; padding-left: 20px; color: #475569;">
          <li style="margin-bottom: 8px;"><strong>Vendor Name</strong></li>
          <li style="margin-bottom: 8px;"><strong>Contract Type</strong> (Supply Only / Supply & Install / Hire / Labour Only)</li>
          <li style="margin-bottom: 8px;"><strong>Materials Being Purchased</strong> (paste from table above)</li>
          <li style="margin-bottom: 8px;"><strong>Total Contract Value</strong></li>
          <li><strong>Delivery Start & End Dates</strong></li>
        </ul>
        <p style="margin-top: 15px; margin-bottom: 0; font-style: italic; color: #64748b;">*Remember to upload the signed vendor document PDF to the contract record.</p>
      </div>
    `);

    promises.push(...recipients.fms.map(fm => send({
      to: fm.email,
      subject: `Action Required: Procurement Brief for ${project.code}`,
      html: fmHtml,
      text: `Procurement Brief for ${project.code}. Please login to MCMS.`
    })));
  }

  // 3. EC Email (Equipment List)
  if (recipients.ecs && recipients.ecs.length > 0) {
    const ecHtml = getWrapper(`
      <h2 style="color: #0f1729; margin-top: 0; font-size: 20px;">Road Project Equipment Assignment</h2>
      <p>The road specification for <strong>${project.name}</strong> (${project.code}) has been approved.</p>
      
      ${renderChanges(changes?.universal, 'Universal Changes', '#64748b')}
      ${renderChanges(changes?.equipment, 'Material/Asset Adjustments (Logistics)', '#3b82f6')}

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px 20px; margin: 20px 0; display: inline-block;">
        <span style="color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 5px;">Project Target Start</span>
        <span style="color: #0f1729; font-size: 16px; font-weight: 600;">${new Date(project.startDate).toLocaleDateString()}</span>
      </div>
      
      <h3 style="color: #0f1729; font-size: 16px; margin-bottom: 15px; margin-top: 10px; text-transform: uppercase;">Required Equipment Planner</h3>
      <p style="margin-bottom: 15px;">Please review the requested phases and begin assigning available heavy machinery from the Asset pool to this project.</p>
      
      <ul style="padding-left: 20px; color: #475569; margin-bottom: 25px;">
        ${layers.reduce((acc, l) => acc.includes(l.phaseName) ? acc : [...acc, l.phaseName], []).map(p => `<li style="margin-bottom: 6px;">${p}</li>`).join('')}
      </ul>
      
      <div style="background-color: #e0f2fe; border: 1px solid #bae6fd; padding: 15px 20px; border-radius: 8px; color: #0369a1; font-size: 14px;">
        💡 <strong>System Tip:</strong> The system will suggest specific equipment (Pavers, Graders, Rollers) based on the active phases in the dashboard.
      </div>
    `);

    promises.push(...recipients.ecs.map(ec => send({
      to: ec.email,
      subject: `Asset Planning: Equipment requested for ${project.code}`,
      html: ecHtml,
      text: `Equipment requested for ${project.code}. Login to MCMS to assign assets.`
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
