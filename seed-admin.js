import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js';

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const email = 'admin@cook.com';
  const password = 'admin@123';

  let user = await User.findOne({ email });
  if (user) {
    console.log('Admin đã tồn tại:', email);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await User.create({
      name: 'Admin',
      email,
      passwordHash,
      role: 'admin',
    });
    console.log('Tạo admin ok:', email, 'pass:', password);
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
