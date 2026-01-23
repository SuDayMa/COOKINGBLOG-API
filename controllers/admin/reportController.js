const Report = require("../../models/Report");
const Post = require("../../models/Post");
const User = require("../../models/User");
const { toPublicUrl } = require("../../utils/imageHelper");

exports.getAllReports = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const status = (req.query.status || "").trim();

    const filter = {};
    if (["pending", "resolved", "dismissed"].includes(status)) {
      filter.status = status;
    }

    const [total, reports] = await Promise.all([
      Report.countDocuments(filter),
      Report.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);
    
    const postIds = [...new Set(reports.map(r => r.post_id).filter(Boolean))];
    const userIds = [...new Set(reports.map(r => r.reporter_id).filter(Boolean))];

    const [posts, users] = await Promise.all([
      Post.find({ id: { $in: postIds } }).select("id title image status").lean(),
      User.find({ id: { $in: userIds } }).select("id name email").lean()
    ]);

    const postMap = new Map(posts.map(p => [p.id, p]));
    const userMap = new Map(users.map(u => [u.id, u]));

    const items = reports.map(report => {
      const post = postMap.get(report.post_id);
      const user = userMap.get(report.reporter_id);

      return {
        ...report,
        id: report.id || report._id.toString(),
        post_info: post ? {
          id: post.id,
          title: post.title,
          current_status: post.status, 
          image: toPublicUrl(req, post.image) 
        } : { title: "Bài viết đã bị xóa", image: null },
        reporter_info: user ? {
          id: user.id,
          name: user.name,
          email: user.email
        } : { name: "N/A", email: "N/A" }
      };
    });

    res.status(200).json({ 
      success: true, 
      data: { total, page, limit, items } 
    });
  } catch (e) {
    console.error("REPORT LIST ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy danh sách báo cáo" });
  }
};

exports.handleReport = async (req, res) => {
  try {
    const { status } = req.body; 
    const { id } = req.params;

    if (!["resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái xử lý không hợp lệ" });
    }

    const report = await Report.findOneAndUpdate(
      { id: id },
      { 
        $set: {
          status: status, 
          processed_by: req.user.id,
          processed_at: new Date()
        }
      },
      { new: true }
    );

    if (!report) return res.status(404).json({ success: false, message: "Không tìm thấy thông tin báo cáo" });

    

    res.status(200).json({ 
      success: true, 
      message: status === "resolved" ? "Báo cáo đã được xử lý" : "Đã bỏ qua báo cáo",
      data: report 
    });
  } catch (e) {
    console.error("HANDLE REPORT ERROR:", e);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi xử lý báo cáo" });
  }
};