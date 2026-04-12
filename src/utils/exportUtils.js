/**
 * MCMS Report Export Utilities
 * Supports JSON, CSV, and PDF export for all reports
 */

const PDFDocument = require('pdfkit');

/**
 * Detect format from request URL query params
 * @param {string} url 
 * @returns {'json'|'csv'|'pdf'}
 */
function getFormat(url) {
  try {
    const u = new URL(url, 'http://localhost');
    const fmt = (u.searchParams.get('format') || 'json').toLowerCase();
    if (['json', 'csv', 'pdf'].includes(fmt)) return fmt;
    return 'json';
  } catch { return 'json'; }
}

/**
 * Parse all query params from URL
 * @param {string} url 
 * @returns {Object}
 */
function parseReportQuery(url) {
  try {
    const u = new URL(url, 'http://localhost');
    const params = {};
    u.searchParams.forEach((value, key) => {
      if (key === 'format') return; // handled separately
      // Auto-parse numbers and booleans
      if (value === 'true') params[key] = true;
      else if (value === 'false') params[key] = false;
      else if (!isNaN(value) && value !== '') params[key] = Number(value);
      else params[key] = value;
    });
    return params;
  } catch { return {}; }
}

/**
 * Send report as JSON
 */
function sendJSON(res, data, reportName) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    report: reportName,
    generatedAt: new Date().toISOString(),
    data
  }));
}

/**
 * Convert data array to CSV string
 */
function toCSV(data, columns) {
  if (!Array.isArray(data) || data.length === 0) return '';
  
  const cols = columns || Object.keys(data[0]);
  const header = cols.join(',');
  
  const rows = data.map(row => {
    return cols.map(col => {
      let val = row[col];
      if (val === null || val === undefined) val = '';
      val = String(val);
      // Escape commas and quotes
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    }).join(',');
  });
  
  return header + '\n' + rows.join('\n');
}

/**
 * Send report as CSV download
 */
function sendCSV(res, data, reportName, columns) {
  const csv = toCSV(Array.isArray(data) ? data : (data.rows || data.items || [data]), columns);
  const filename = `${reportName}_${new Date().toISOString().split('T')[0]}.csv`;
  
  res.writeHead(200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  res.end(csv);
}

/**
 * Send report as PDF download
 */
function sendPDF(res, data, reportName, options = {}) {
  const filename = `${reportName}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    bufferPages: true,
    info: {
      Title: reportName,
      Author: 'MCMS - Mkaka Construction Management System',
      Creator: 'MCMS Report Engine'
    }
  });
  
  doc.pipe(res);
  
  // Header
  doc.fontSize(22).font('Helvetica-Bold')
     .fillColor('#0f1729')
     .text('MKAKA', 50, 50, { continued: true })
     .fillColor('#f97415')
     .text(' CONSTRUCTION');
  
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica')
     .fillColor('#64748b')
     .text('Construction Management System Report');
  
  // Orange divider
  doc.moveTo(50, doc.y + 10).lineTo(545, doc.y + 10).strokeColor('#f97415').lineWidth(3).stroke();
  doc.moveDown(1.5);
  
  // Report title
  const title = options.title || reportName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f1729').text(title);
  doc.moveDown(0.3);
  doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
     .text(`Generated: ${new Date().toLocaleString()} | Format: PDF`);
  doc.moveDown(1);
  
  // Summary stats if provided
  if (options.summary) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#334155').text('Summary');
    doc.moveDown(0.3);
    
    Object.entries(options.summary).forEach(([key, val]) => {
      doc.fontSize(9).font('Helvetica').fillColor('#64748b')
         .text(`${key}: `, { continued: true })
         .font('Helvetica-Bold').fillColor('#0f1729')
         .text(String(val));
    });
    doc.moveDown(1);
  }
  
  // Table data
  const rows = Array.isArray(data) ? data : (data.rows || data.items || []);
  if (rows.length > 0) {
    const columns = options.columns || Object.keys(rows[0]).slice(0, 6); // Max 6 cols for PDF
    const colWidth = (545 - 50) / columns.length;
    
    // Table header
    let y = doc.y;
    doc.rect(50, y, 495, 20).fill('#f8fafc');
    columns.forEach((col, i) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569')
         .text(col.replace(/([A-Z])/g, ' $1').toUpperCase(), 
               50 + i * colWidth + 4, y + 5, 
               { width: colWidth - 8, align: 'left' });
    });
    y += 22;
    
    // Table rows
    rows.forEach((row, idx) => {
      if (y > 750) { // New page
        doc.addPage();
        y = 50;
      }
      
      if (idx % 2 === 0) {
        doc.rect(50, y, 495, 18).fill('#fafafa');
      }
      
      columns.forEach((col, i) => {
        let val = row[col];
        if (val === null || val === undefined) val = '-';
        if (val instanceof Date) val = val.toLocaleDateString();
        if (typeof val === 'number') val = val.toLocaleString();
        
        doc.fontSize(8).font('Helvetica').fillColor('#334155')
           .text(String(val).substring(0, 30), 
                 50 + i * colWidth + 4, y + 4, 
                 { width: colWidth - 8, align: 'left' });
      });
      y += 18;
    });
    
    doc.moveDown(1);
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8')
       .text(`Total Records: ${rows.length}`, 50, y + 10);
  }
  
  // Footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.fontSize(7).font('Helvetica').fillColor('#94a3b8')
       .text(
         `© ${new Date().getFullYear()} Mkaka Construction | Page ${i + 1} of ${pageCount}`,
         50, 780, { align: 'center', width: 495 }
       );
  }
  
  doc.end();
}

/**
 * Universal report sender - detects format and sends appropriately
 * @param {Object} req - HTTP request
 * @param {Object} res - HTTP response
 * @param {Object|Array} data - Report data
 * @param {string} reportName - Name of the report
 * @param {Object} options - { columns, title, summary }
 */
function sendReport(req, res, data, reportName, options = {}) {
  const format = getFormat(req.url);
  
  switch (format) {
    case 'csv':
      sendCSV(res, data, reportName, options.columns);
      break;
    case 'pdf':
      sendPDF(res, data, reportName, options);
      break;
    default:
      sendJSON(res, data, reportName);
  }
}

module.exports = {
  getFormat,
  parseReportQuery,
  sendReport,
  sendJSON,
  sendCSV,
  sendPDF,
  toCSV,
};
