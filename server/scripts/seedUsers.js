
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const requiredEnv = [
  'ADMIN_NAME',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'OWNER_NAME',
  'OWNER_USERNAME',
  'OWNER_PASSWORD',
];

async function seedUsers() {
  try {
    // Check configuration before connecting.
    const missing = requiredEnv.filter(
      (key) => !process.env[key]
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      );
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured');
    }

    if (
      process.env.ADMIN_USERNAME.trim().toLowerCase() ===
      process.env.OWNER_USERNAME.trim().toLowerCase()
    ) {
      throw new Error('Admin and Owner usernames must be different');
    }

    for (const key of ['ADMIN_PASSWORD', 'OWNER_PASSWORD']) {
      if (process.env[key].length < 12) {
        throw new Error(`${key} must be at least 12 characters`);
      }
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'd_shawarma_station',
    });

    const accounts = [
      {
        name: process.env.ADMIN_NAME.trim(),
        username: process.env.ADMIN_USERNAME.trim().toLowerCase(),
        password: process.env.ADMIN_PASSWORD,
        role: 'ADMIN',
      },
      {
        name: process.env.OWNER_NAME.trim(),
        username: process.env.OWNER_USERNAME.trim().toLowerCase(),
        password: process.env.OWNER_PASSWORD,
        role: 'SHOP_OWNER',
      },
    ];

    for (const account of accounts) {
      // Never overwrite an existing account's credentials.
      const existingUser = await User.findOne({
        username: account.username,
      });

      if (existingUser) {
        console.log(
          `Skipped ${account.role}: username "${account.username}" already exists.`
        );
        continue;
      }

      const passwordHash = await bcrypt.hash(account.password, 12);

      await User.create({
        name: account.name,
        username: account.username,
        passwordHash,
        role: account.role,
        isActive: true,
        tokenVersion: 0,
      });

      console.log(
        `Created ${account.role} account: ${account.username}`
      );
    }

    console.log('User seeding completed.');
  } catch (error) {
    console.error('User seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

seedUsers();
