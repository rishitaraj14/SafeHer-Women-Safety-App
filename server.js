const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiter for SOS
const sosLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many SOS requests. Please wait.' }
});

// Serve static files from the workspace root
app.use(express.static(__dirname));

// In-memory storage (replace with DB in production)
let contacts = [];
let incidents = [];
let sosLogs = [];

// ── ROUTES ──────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'SafeHer API running', timestamp: new Date().toISOString() });
});

// SOS Alert
app.post('/api/sos', sosLimiter, (req, res) => {
  const { latitude, longitude, userId, message } = req.body;
  const sosEntry = {
    id: uuidv4(),
    userId: userId || 'anonymous',
    location: { latitude, longitude },
    message: message || 'EMERGENCY SOS TRIGGERED',
    timestamp: new Date().toISOString(),
    status: 'active',
    notified: contacts.filter(c => c.userId === (userId || 'anonymous')).length
  };
  sosLogs.push(sosEntry);

  // Simulate notifying trusted contacts
  const userContacts = contacts.filter(c => c.userId === (userId || 'anonymous'));
  const mapsLink = latitude && longitude
    ? `https://maps.google.com/?q=${latitude},${longitude}`
    : 'Location unavailable';

  console.log(`🚨 SOS ALERT! ID: ${sosEntry.id}`);
  console.log(`   Location: ${mapsLink}`);
  console.log(`   Notified ${userContacts.length} contact(s)`);

  res.json({
    success: true,
    alertId: sosEntry.id,
    message: `SOS alert sent! ${userContacts.length} contact(s) notified.`,
    locationLink: mapsLink,
    timestamp: sosEntry.timestamp
  });
});

// Trusted Contacts
app.get('/api/contacts', (req, res) => {
  const { userId } = req.query;
  const userContacts = contacts.filter(c => c.userId === (userId || 'anonymous'));
  res.json({ success: true, contacts: userContacts });
});

app.post('/api/contacts', (req, res) => {
  const { name, phone, email, relation, userId } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
  const contact = { id: uuidv4(), name, phone, email, relation, userId: userId || 'anonymous', addedAt: new Date().toISOString() };
  contacts.push(contact);
  res.json({ success: true, contact, message: `${name} added as trusted contact` });
});

app.delete('/api/contacts/:id', (req, res) => {
  const idx = contacts.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Contact not found' });
  const removed = contacts.splice(idx, 1)[0];
  res.json({ success: true, message: `${removed.name} removed` });
});

// Incident Reports
app.post('/api/incidents', (req, res) => {
  const { type, description, location, anonymous, userId } = req.body;
  if (!type || !description) return res.status(400).json({ success: false, message: 'Type and description required' });
  const incident = {
    id: uuidv4(),
    type, description, location,
    anonymous: anonymous !== false,
    userId: anonymous !== false ? 'anonymous' : (userId || 'anonymous'),
    reportedAt: new Date().toISOString(),
    status: 'submitted'
  };
  incidents.push(incident);
  res.json({ success: true, incidentId: incident.id, message: 'Incident reported. Authorities will be notified.' });
});

app.get('/api/incidents', (req, res) => {
  const publicIncidents = incidents.map(i => ({
    id: i.id, type: i.type, location: i.location,
    reportedAt: i.reportedAt, status: i.status
  }));
  res.json({ success: true, incidents: publicIncidents, total: incidents.length });
});

// SOS Logs (admin)
app.get('/api/sos/logs', (req, res) => {
  res.json({ success: true, logs: sosLogs, total: sosLogs.length });
});

// Helplines data
app.get('/api/helplines', (req, res) => {
  res.json({
    success: true,
    helplines: [
      { name: "Women Helpline", number: "1091", description: "24/7 women in distress", icon: "🆘" },
      { name: "Police", number: "100", description: "Emergency police assistance", icon: "👮" },
      { name: "Ambulance", number: "108", description: "Medical emergency", icon: "🚑" },
      { name: "National Commission for Women", number: "7217735372", description: "NCW complaints", icon: "⚖️" },
      { name: "Cyber Crime", number: "1930", description: "Online harassment & cyber crime", icon: "💻" },
      { name: "Childline", number: "1098", description: "Child in danger", icon: "🧒" },
      { name: "Domestic Violence", number: "181", description: "Domestic abuse support", icon: "🏠" },
      { name: "PCRA Helpline", number: "1800-180-4334", description: "Anti-trafficking helpline", icon: "🔒" }
    ]
  });
});

// Stats
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      sosAlerts: sosLogs.length,
      incidentsReported: incidents.length,
      trustedContacts: contacts.length,
      helplinesCovered: 8
    }
  });
});

// Serve main app for all other routes
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🌸 SafeHer Server running on http://localhost:${PORT}`);
  console.log(`   API ready at http://localhost:${PORT}/api/health\n`);
});
