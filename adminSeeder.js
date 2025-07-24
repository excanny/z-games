// adminSeeder.js - Fixed version
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'excanny@yahoo.com';
const ADMIN_PASSWORD = 'excanny@yahoo.com';
const SALT_ROUNDS = 12;

// Create users table if it doesn't exist
const createUsersTable = async (connection) => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`name\` varchar(255) DEFAULT NULL,
      \`email\` varchar(255) NOT NULL,
      \`password\` varchar(255) DEFAULT NULL,
      \`role\` varchar(50) DEFAULT 'user',
      \`isActive\` tinyint(1) DEFAULT 1,
      \`isVerified\` tinyint(1) DEFAULT 0,
      \`createdAt\` datetime NOT NULL,
      \`updatedAt\` datetime NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`email\` (\`email\`),
      KEY \`idx_email\` (\`email\`),
      KEY \`idx_role\` (\`role\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  await connection.execute(createTableSQL);
  console.log('✅ Users table created or already exists');
};

// Fixed seeder function with better parameter handling
async function seedAdmin(connection, forceReseedOrOptions = false) {
  console.log('👑 Starting admin seeding...');
  console.log('👑 Parameters received:', {
    hasConnection: !!connection,
    forceReseedOrOptions: forceReseedOrOptions,
    typeOfSecondParam: typeof forceReseedOrOptions
  });
  
  // Handle different parameter patterns
  let forceReseed = false;
  
  if (typeof forceReseedOrOptions === 'boolean') {
    forceReseed = forceReseedOrOptions;
  } else if (typeof forceReseedOrOptions === 'object' && forceReseedOrOptions !== null) {
    forceReseed = forceReseedOrOptions.forceReseed || false;
  }
  
  console.log(`👑 Force reseed: ${forceReseed}`);
  
  const results = {
    new: 0,
    updated: 0,
    restored: 0,
    skipped: 0,
    errors: [],
    success: true
  };

  try {
    // Validate connection
    if (!connection) {
      throw new Error('Database connection is required');
    }
    
    console.log('👑 Testing connection...');
    await connection.execute('SELECT 1');
    console.log('👑 Connection test passed');

    // Create users table first
    console.log('👑 Creating/checking users table...');
    await createUsersTable(connection);
    
    // Check if admin already exists
    console.log('👑 Checking for existing admin...');
    const [existingAdmins] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [ADMIN_EMAIL]
    );

    const existingAdmin = existingAdmins[0];
    console.log(`👑 Existing admin found: ${!!existingAdmin}`);

    if (existingAdmin && !forceReseed) {
      console.log('👑 Admin user already exists, skipping...');
      results.skipped = 1;
      return results;
    }

    // Hash the password
    console.log('🔒 Hashing admin password...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (existingAdmin && forceReseed) {
      // Update existing admin
      console.log('👑 Updating existing admin user...');
      
      await connection.execute(
        `UPDATE users 
         SET password = ?, role = 'admin', isActive = 1, isVerified = 1, updatedAt = ?
         WHERE id = ?`,
        [hashedPassword, now, existingAdmin.id]
      );
      
      results.updated = 1;
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin
      console.log('👑 Creating new admin user...');
      
      const [insertResult] = await connection.execute(
        `INSERT INTO users (email, password, role, isActive, isVerified, createdAt, updatedAt)
         VALUES (?, ?, 'admin', 1, 1, ?, ?)`,
        [ADMIN_EMAIL, hashedPassword, now, now]
      );
      
      results.new = 1;
      results.insertId = insertResult.insertId;
      console.log('✅ Admin user created successfully with ID:', insertResult.insertId);
    }

    // Verify the seeding worked
    console.log('👑 Verifying admin creation...');
    const [verification] = await connection.execute(
      'SELECT id, email, role, isActive, isVerified FROM users WHERE email = ?',
      [ADMIN_EMAIL]
    );
    
    if (verification.length > 0) {
      console.log('✅ Admin verification passed:', verification[0]);
      results.verified = true;
    } else {
      console.log('⚠️  Admin verification failed - no admin found after seeding');
      results.verified = false;
    }

    console.log('👑 Admin seeding completed successfully');
    console.log('👑 Final results:', results);
    
    return results;

  } catch (error) {
    console.error('❌ Admin seeding failed:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    results.success = false;
    results.errors.push({
      email: ADMIN_EMAIL,
      error: error.message,
      code: error.code,
      errno: error.errno
    });
    
    throw error;
  }
}

export default seedAdmin;