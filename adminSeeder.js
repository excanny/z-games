// adminSeeder.js
import bcrypt from 'bcryptjs';
// Adjust the import path according to your project structure
import User from './src/infrastructure/models/User.js'; // or wherever your User model is located

const ADMIN_EMAIL = 'excanny@yahoo.com';
const ADMIN_PASSWORD = 'excanny@yahoo.com';
const SALT_ROUNDS = 12;

async function seedAdmin(forceReseed = false) {
  console.log('👑 Starting admin seeding...');
  
  const results = {
    new: 0,
    updated: 0,
    restored: 0,
    skipped: 0,
    errors: []
  };

  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: ADMIN_EMAIL 
    });

    if (existingAdmin && !forceReseed) {
      console.log('👑 Admin user already exists, skipping...');
      results.skipped = 1;
      return results;
    }

    // Hash the password
    console.log('🔒 Hashing admin password...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    const adminData = {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (existingAdmin && forceReseed) {
      // Update existing admin
      console.log('👑 Updating existing admin user...');
      
      await User.findByIdAndUpdate(existingAdmin._id, {
        ...adminData,
        updatedAt: new Date()
      });
      
      results.updated = 1;
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin
      console.log('👑 Creating new admin user...');
      
      const newAdmin = new User(adminData);
      await newAdmin.save();
      
      results.new = 1;
      console.log('✅ Admin user created successfully');
    }

    return results;

  } catch (error) {
    console.error('❌ Admin seeding failed:', error.message);
    results.errors.push({
      email: ADMIN_EMAIL,
      error: error.message
    });
    throw error;
  }
}

export default seedAdmin;