const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Settings = require('./models/Settings');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/littlebeadsbeads');
  const existing = await Settings.findOne();
  if (!existing) {
    await Settings.create({});
    console.log('Default settings created');
  } else {
    console.log('Settings already exist');
  }
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
