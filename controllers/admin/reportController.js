const Report = require("../../models/Report");
const Post = require("../../models/Post");
const User = require("../../models/User");
const { toPublicUrl } = require("../../utils/imageHelper");

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ created_at: -1 }).lean();
    
    const postIds = reports.map(r => r.post_id).filter(Boolean);
    const userIds = reports.map(r => r.reporter_id).filter(Boolean);

    const [posts, users] = await Promise.all([
      Post.find({ id: { $in: postIds } }).select("id title image").lean(),
      User.find({ id: { $in: userIds } }).select("id name email").lean()
    ]);

    const postMap = new Map(posts.map(p => [p.id, p]));
    const userMap = new Map(users.map(u => [u.id, u]));

    const items = reports.map(report => {
      const post = postMap.get(report.post_id);
      const user = userMap.get(report.reporter_id);

      return {
        ...report,
        post_info: post ? {
          title: post.title,
          image: toPublicUrl(req, post.image) 
        } : null,
        reporter_info: user ? {
          name: user.name,
          email: user.email
        } : null
      };
    });

    res.status(200).json({ success: true, data: items });
  } catch (e) {
    console.error("REPORT LIST ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách báo cáo" });
  }
};