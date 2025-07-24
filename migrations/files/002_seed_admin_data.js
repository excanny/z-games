// Seed initial admin data
// export async function up(connection) {
//     console.log('   🔑 Seeding admin data...');
    
//     // Create default super admin
//     const adminData = {
//         email: 'admin@zgames.com',
//         username: 'superadmin',
//         password_hash: '$2y$10$VDQmdwtJ.cil4EfK/shRG.7mc1SRT2C5GXbDvj93EG71cE6G9TRPS', 
//         full_name: 'Super Administrator',
//         role: 'super_admin',
//         permissions: JSON.stringify({
//             users: ['read', 'write', 'delete'],
//             games: ['read', 'write', 'delete'],
//             tournaments: ['read', 'write', 'delete'],
//             admin: ['read', 'write', 'delete']
//         })
//     };
    
//     // Check if admin already exists
//     const [existing] = await connection.execute(
//         'SELECT id FROM users WHERE email = ? OR username = ?',
//         [adminData.email, adminData.username]
//     );
    
//     if (existing.length === 0) {
//         await connection.execute(`
//             INSERT INTO users (email, username, password_hash, full_name, role, permissions)
//             VALUES (?, ?, ?, ?, ?, ?)
//         `, [
//             adminData.email,
//             adminData.username,
//             adminData.password_hash,
//             adminData.full_name,
//             adminData.role,
//             adminData.permissions
//         ]);
        
//         console.log('   ✅ Default admin created');
//     } else {
//         console.log('   ⏭️  Admin already exists, skipping');
//     }
// }

export async function up(connection) {
  console.log('Seeding admin data...');
  
  // Insert admin user
  await connection.execute(`
    INSERT INTO users (username, email, password, role, created_at) 
    VALUES (?, ?, ?, ?, NOW())
  `, ['admin', 'admin@zgames.com', '$2y$10$VDQmdwtJ.cil4EfK/shRG.7mc1SRT2C5GXbDvj93EG71cE6G9TRPS', 'admin']);
  
  // Insert default settings
  await connection.execute(`
    INSERT INTO settings (key_name, value, created_at) 
    VALUES 
      ('site_name', 'ZGames', NOW()),
      ('maintenance_mode', 'false', NOW()),
      ('max_users', '1000', NOW())
  `);
  
  console.log('Admin data seeded successfully');
}

// Optional: Add down function for rollbacks (future use)
export async function down(connection) {
  console.log('Rolling back admin data...');
  
  await connection.execute(`DELETE FROM users WHERE username = 'admin'`);
  await connection.execute(`DELETE FROM settings WHERE key_name IN ('site_name', 'maintenance_mode', 'max_users')`);
  
  console.log('Admin data rollback completed');
}