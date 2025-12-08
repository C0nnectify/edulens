const Database = require('better-sqlite3');
const fs = require('fs');

// Remove old database if exists
if (fs.existsSync('edulens.db')) {
  console.log('Removing old database...');
  fs.unlinkSync('edulens.db');
}

// Create new database
console.log('Creating new database...');
const db = new Database('edulens.db');

// Better Auth will create these tables automatically
// We just need to ensure the database file exists
console.log('Database initialized successfully!');
console.log('Better Auth will create tables on first API call.');

db.close();
