// Init script to create edulens_user in admin with readWrite on edulens
const passwd = "strong_password_here";
try {
  const admin = db.getSiblingDB('admin');
  admin.createUser({
    user: 'edulens_user',
    pwd: passwd,
    roles: [{ role: 'readWrite', db: 'edulens' }]
  });
  print('Created user edulens_user in admin DB');
} catch (err) {
  print('User creation skipped or failed:', err);
}
