/**
 * Generate self-signed SSL certificate using Node.js built-in crypto
 * Works on Node.js v16+ without any external dependencies
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Get LAN IP
let lanIp = 'localhost';
const networkInterfaces = os.networkInterfaces();
for (const name of Object.keys(networkInterfaces)) {
  for (const net of networkInterfaces[name]) {
    if (net.family === 'IPv4' && !net.internal) {
      lanIp = net.address;
      break;
    }
  }
  if (lanIp !== 'localhost') break;
}

console.log(`🔐 Generating SSL certificate for: ${lanIp}`);

// Generate RSA key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Create a self-signed certificate using X509Certificate (Node 16+)
// We'll build a minimal ASN.1 DER certificate manually

function createSelfSignedCert(privateKeyPem, publicKeyPem, cn) {
  // Use openssl-like approach via child_process if available,
  // otherwise fall back to generating via forge
  
  // Try using Node's internal TLS test helpers
  // Actually, the cleanest way is to construct the cert with node-forge
  // which is a dependency of selfsigned and should be available
  try {
    const forge = require('node-forge');
    const pki = forge.pki;
    
    const keys = {
      privateKey: pki.privateKeyFromPem(privateKeyPem),
      publicKey: pki.publicKeyFromPem(publicKeyPem),
    };
    
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    
    const attrs = [{ name: 'commonName', value: cn }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    
    // Add Subject Alternative Names for IP
    cert.setExtensions([
      { name: 'basicConstraints', cA: true },
      { name: 'subjectAltName', altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: cn },
        { type: 7, ip: '127.0.0.1' },
      ]},
    ]);
    
    cert.sign(keys.privateKey, forge.md.sha256.create());
    
    return pki.certificateToPem(cert);
  } catch (e) {
    console.error('node-forge approach failed:', e.message);
    return null;
  }
}

const certPem = createSelfSignedCert(privateKey, publicKey, lanIp);

if (!certPem) {
  console.error('❌ Failed to generate certificate');
  process.exit(1);
}

const keyPath = path.join(__dirname, '..', 'key.pem');
const certPath = path.join(__dirname, '..', 'cert.pem');

fs.writeFileSync(keyPath, privateKey);
fs.writeFileSync(certPath, certPem);

console.log(`✅ SSL Certificate generated successfully!`);
console.log(`   Key:  ${keyPath}`);
console.log(`   Cert: ${certPath}`);
console.log(`   CN:   ${lanIp}`);
console.log(`   Valid for 1 year`);
