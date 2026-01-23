const SavedPost = require("../../models/SavedPost");
const Post = require("../../models/Post");
const { toPublicUrl } = require("../../utils/imageHelper");

exports.toggleSave = async (req, res) => {
  try {
    const { postId } = req.body; 
    if (!postId) return res.status(400).json({ success: false, message: "Thiếu postId" });

    const post = await Post.findOne({ id: postId });

    if (!post) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    const userId = String(req.user.id);
    const finalPostId = String(post.id);

    const exists = await SavedPost.findOne({ 
      user_id: userId, 
      post_id: finalPostId 
    });

    let updatedPost;

    if (exists) {
      await SavedPost.deleteOne({ _id: exists._id });
      
      updatedPost = await Post.findOneAndUpdate(
        { id: finalPostId },
        { $inc: { likes: -1 } },
        { new: true }
      );
    } else {
      await SavedPost.create({ 
        user_id: userId, 
        post_id: finalPostId 
      });

      updatedPost = await Post.findOneAndUpdate(
        { id: finalPostId },
        { $inc: { likes: 1 } },
        { new: true }
      );
    }

    const finalLikes = updatedPost && updatedPost.likes ? Math.max(0, updatedPost.likes) : 0;

    return res.json({ 
      success: true, 
      message: exists ? "Đã bỏ lưu" : "Đã lưu bài viết", 
      data: { 
        postId: finalPostId,
        saved: !exists, 
        likes: finalLikes
      } 
    });

  } catch (e) {
    console.error("Lỗi Toggle Save:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống xử lý bài viết" });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const userId = String(req.user.id);
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10"), 1), 50);

    const total = await SavedPost.countDocuments({ user_id: userId });
    const savedRecords = await SavedPost.find({ user_id: userId })
      .sort({ saved_at: -1 }) 
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const postIds = savedRecords.map(s => s.post_id);
    
    const posts = await Post.find({ id: { $in: postIds } })
      .select("id title image video post_type likes status")
      .lean();

    const postMap = new Map(posts.map(p => [p.id, p]));

    const items = savedRecords
      .map(s => {
        const p = postMap.get(s.post_id);
        if (!p) return null;
        return {
          ...p,
          image: toPublicUrl(req, p.image),
          video: p.video || null,
          saved: true 
        };
      })
      .filter(Boolean);

    res.json({ success: true, data: { page, limit, total, items } });
  } catch (e) {
    console.error("Lỗi getSavedPosts:", e);
    res.status(500).json({ success: false, message: "Lỗi tải danh sách bài đã lưu" });
  }
};

exports.checkSaved = async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { postId } = req.params;

    const exists = await SavedPost.findOne({ 
      user_id: userId, 
      post_id: String(postId) 
    });

    res.json({ 
      success: true, 
      data: { postId, saved: !!exists } 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi kiểm tra trạng thái lưu" });
  }
};