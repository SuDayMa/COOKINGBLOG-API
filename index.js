// index.js (ESM)
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import postsRouter from './routes/posts.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';


dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/posts', postsRouter);

app.use('/auth', authRouter);
app.use('/posts', postsRouter);
app.use('/users', usersRouter); 

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGODB_URI).then(() => {
  app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
}).catch(err => {
  console.error('MongoDB connect error:', err);
  process.exit(1);
});
