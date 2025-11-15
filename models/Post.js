// models/Post.js (ESM)
import mongoose from 'mongoose';

const AuthorSchema = new mongoose.Schema({
  id: String,
  name: String,
  avatar: String,
}, { _id: false });

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  ingredients: String,
  steps: String,
  imageUrl: String,
  author: { type: AuthorSchema, required: true },
}, { timestamps: true });

export const Post = mongoose.model('Post', PostSchema);
