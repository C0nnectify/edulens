import * as fs from 'fs';
import * as path from 'path';
import { MongoClient } from 'mongodb';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) process.env[trimmed.substring(0, eqIndex)] = trimmed.substring(eqIndex + 1);
  }
});

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db();
  const users = await db.collection('user').find({}).limit(5).toArray();
  users.forEach(u => console.log('id:', u.id, '| _id:', u._id?.toString(), '| Email:', u.email, '| Role:', u.role));
  await client.close();
}
main();
