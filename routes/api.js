// routes/api.js
const express = require("express");
const auth = require("../middleware/auth");

const authRoutes = require("./auth");
const userRoutes = require("./users");
const postRoutes = require("./posts");
const commentRoutes = require("./comments");
const savedRoutes = require("./saved");

const router = express.Router();

/**
 * AUTH
 * POST /api/register
 * POST /api/login
 * GET  /api/me
 */
router.use("/", authRoutes);

/**
 * USERS
 * PUT /api/users/profile
 * PUT /api/users/change-password
 * GET /api/users/:id
 * GET /api/users/:id/posts
 */
router.use("/users", userRoutes);

/**
 * POSTS
 * POST /api/posts
 * PUT /api/posts/:id
 * DELETE /api/posts/:id
 * GET /api/posts/:id
 * GET /api/posts
 * GET /api/posts/:id/comments
 * GET /api/posts/:id/saved-count
 */
router.use("/posts", postRoutes);

/**
 * COMMENTS
 * POST /api/comments
 * DELETE /api/comments/:id
 */
router.use("/comments", commentRoutes);

/**
 * SAVED
 * POST /api/saved/toggle
 * GET /api/saved
 * GET /api/saved/check/:postId
 * DELETE /api/saved/:postId
 */
router.use("/saved", savedRoutes);

module.exports = router;
