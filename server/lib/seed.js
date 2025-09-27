const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

async function ensureDefaultAdmin() {
  const username = process.env.ADMIN_USERNAME || 'aurccadmin';
  const password = process.env.ADMIN_PASSWORD || 'placementaurcc';
  let admin = await Admin.findOne({ username });
  if (!admin) {
    const passwordHash = await bcrypt.hash(password, 10);
    await Admin.create({ username, passwordHash });
    console.log('Default admin created');
  } else {
    // keep existing
    console.log('Default admin present');
  }
}

module.exports = { ensureDefaultAdmin };



