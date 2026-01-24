import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || "magicsub_db");
  }
  return db;
}

export async function GET(req) {
  // Lấy query từ URL (ví dụ: /api/users/search?q=abc)
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  // Kiểm tra nếu không có query hoặc query quá ngắn để tìm kiếm
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const database = await connectDB();

    // Thực hiện tìm kiếm trong collection "users"
    const users = await database
      .collection("users")
      .find({
        email: { $regex: query, $options: "i" }, // Tìm email chứa chuỗi query, không phân biệt hoa thường
      })
      .project({
        email: 1,
        image: 1,
        name: 1,
      }) // Chỉ lấy các trường cần thiết (giống .select() bên Mongoose)
      .limit(10) // Giới hạn số lượng kết quả
      .toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users!" },
      { status: 500 },
    );
  }
}
