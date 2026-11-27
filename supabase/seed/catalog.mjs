// Seed catalog built from the owner's photos in /products.
// Photo numbers refer to the files in /products sorted by name (1-based).
// Names/descriptions are DRAFTS — the owner reviews them in admin.
// Products with price 0 are seeded hidden (owner adds price, then turns them on).

export const categories = [
  { slug: "xe-dieu-khien", name: "Xe & Điều khiển", cover: 1 },
  { slug: "khung-long", name: "Khủng long", cover: 4 },
  { slug: "lap-rap", name: "Lắp ráp", cover: 30 },
  { slug: "giao-duc", name: "Giáo dục", cover: 13 },
  { slug: "sung-hoa-trang", name: "Súng & Hoá trang", cover: 14 },
  { slug: "be-gai-am-nhac", name: "Bé gái & Âm nhạc", cover: 33 },
];

export const products = [
  {
    slug: "xe-dua-f1-drift-dieu-khien", name: "Xe đua F1 drift điều khiển từ xa", category: "xe-dieu-khien",
    age: "6-12", price: 0, photos: [1, 25, 32, 34], options: ["Xanh dương", "Đỏ", "Xanh lá", "Tím", "Cam"],
    description: "Xe đua F1 bánh drift xoay 360°, điều khiển từ xa, pin sạc USB. Kích thước 36 × 16,5 × 9 cm. Bộ gồm xe, tay điều khiển, cáp sạc, pin và tua vít.",
  },
  {
    slug: "khung-long-cao-su-co-tieng", name: "Khủng long cao su có tiếng kêu", category: "khung-long",
    age: "3-6", price: 0, photos: [4, 2, 3, 5, 11], options: ["Rồng 3 đầu", "Rồng cánh xanh", "Khủng long cam"],
    description: "Khủng long cao su mềm, phát tiếng gầm khi bấm. Kích thước lớn, an toàn cho bé, chơi cực đã.",
  },
  {
    slug: "khung-long-can-tay-mini", name: "Khủng long cắn tay mini (combo 2 con)", category: "khung-long",
    age: "3-6", price: 15000, photos: [8], options: [], featured: true,
    description: "Khủng long nhồi ngón tay, miệng mở đóng như đang cắn. Combo 2 con ngẫu nhiên. Bộ sưu tập 20 mẫu cho bé sưu tầm.",
  },
  {
    slug: "bo-cau-ca-nam-cham", name: "Bộ câu cá nam châm cho bé", category: "giao-duc",
    age: "1-3", price: 0, photos: [6], options: [],
    description: "Bộ câu cá nam châm nhiều màu, giúp bé luyện khéo tay và nhận biết con vật biển.",
  },
  {
    slug: "xe-container-dieu-khien", name: "Xe container điều khiển từ xa", category: "xe-dieu-khien",
    age: "3-6", price: 0, photos: [7], options: [],
    description: "Xe đầu kéo container cỡ lớn, điều khiển từ xa, pin sạc USB.",
  },
  {
    slug: "xe-may-xuc-dieu-khien", name: "Xe máy xúc điều khiển từ xa", category: "xe-dieu-khien",
    age: "3-6", price: 0, photos: [9], options: [],
    description: "Xe máy xúc bánh xích, cần gầu nâng hạ bằng điều khiển, pin sạc USB.",
  },
  {
    slug: "bang-chu-cai-tieng-viet", name: "Bảng chữ cái tiếng Việt kèm hình", category: "giao-duc",
    age: "3-6", price: 0, photos: [10], options: [],
    description: "Bảng chữ cái và số có hình minh hoạ sinh động, giúp bé làm quen mặt chữ và dấu.",
  },
  {
    slug: "may-bay-truc-thang-den-led", name: "Trực thăng đèn LED chạy pin", category: "xe-dieu-khien",
    age: "1-3", price: 0, photos: [12], options: [],
    description: "Trực thăng chạy pin, đèn LED nhiều màu, cánh quạt xoay, tự đổi hướng khi chạm vật cản.",
  },
  {
    slug: "hop-ghep-hinh-giao-duc", name: "Hộp ghép hình giáo dục", category: "giao-duc",
    age: "3-6", price: 0, photos: [13], options: ["Số đếm", "Hình khối", "Con vật", "Màu sắc"],
    description: "Hộp thiếc ghép hình gỗ theo chủ đề: số, hình khối, con vật, màu sắc. Giúp bé tư duy và nhận biết.",
  },
  {
    slug: "sung-ban-bong-bong", name: "Súng bắn bong bóng hoạt hình", category: "sung-hoa-trang",
    age: "3-6", price: 0, photos: [14], options: Array.from({ length: 19 }, (_, i) => `Mẫu ${String(i + 1).padStart(2, "0")}`),
    description: "Súng bắn bong bóng chạy pin, 19 mẫu nhân vật hoạt hình. Ghi số mẫu (CX935-01 → 19) khi chọn.",
  },
  {
    slug: "dien-thoai-do-choi-puzzle-mobile", name: "Điện thoại đồ chơi Puzzle Mobile", category: "giao-duc",
    age: "1-3", price: 0, photos: [15], options: [],
    description: "Điện thoại đồ chơi có âm thanh, giúp bé học chữ, số và bài hát.",
  },
  {
    slug: "bo-lap-ghep-banh-rang", name: "Bộ lắp ghép bánh răng xoay", category: "lap-rap",
    age: "3-6", price: 0, photos: [16], options: [],
    description: "Bộ lắp ghép bánh răng nhiều màu, có mô-tơ xoay, phát triển tư duy kỹ thuật cho bé.",
  },
  {
    slug: "micro-hat-cho-be", name: "Micro hát karaoke cho bé", category: "be-gai-am-nhac",
    age: "1-3", price: 0, photos: [17], options: ["Gà vàng", "Hồng"],
    description: "Micro đồ chơi có nhạc và đèn, bé hát vui cả ngày.",
  },
  {
    slug: "sung-nhac-phun-suong-1080", name: "Súng nhạc phun sương 1080", category: "sung-hoa-trang",
    age: "6-12", price: 0, photos: [18], options: [],
    description: "Súng đồ chơi có nhạc, đèn và phun sương. Dài 44 cm, chạy pin.",
  },
  {
    slug: "xe-o-to-mini", name: "Xe ô tô mini (combo 10 chiếc)", category: "xe-dieu-khien",
    age: "3-6", price: 19000, photos: [19], options: [], featured: true,
    description: "Xe ô tô mini nhiều mẫu, màu sắc ngẫu nhiên. Combo 10 chiếc.",
  },
  {
    slug: "xe-tang-bien-hinh-robot", name: "Xe tăng biến hình robot", category: "xe-dieu-khien",
    age: "3-6", price: 0, photos: [20], options: [],
    description: "Xe tăng tự biến hình thành robot, có đèn và nhạc.",
  },
  {
    slug: "mat-na-nguoi-nhen", name: "Mặt nạ người nhện", category: "sung-hoa-trang",
    age: "3-6", price: 0, photos: [21], options: [],
    description: "Mặt nạ siêu anh hùng cho bé hoá trang.",
  },
  {
    slug: "truc-thang-dieu-khien-cam-ung", name: "Trực thăng điều khiển cảm ứng", category: "xe-dieu-khien",
    age: "6-12", price: 0, photos: [22], options: [],
    description: "Trực thăng bay trong nhà, điều khiển bằng tay cầm hoặc cảm ứng tay, sạc USB.",
  },
  {
    slug: "sung-ban-nuoc-may-bay", name: "Súng bắn nước hình máy bay", category: "sung-hoa-trang",
    age: "3-6", price: 0, photos: [23], options: [],
    description: "Súng bắn nước hình máy bay cỡ lớn, pin to, bắn xa.",
  },
  {
    slug: "lap-rap-xe-f1-racing", name: "Lắp ráp xe đua F1 Racing", category: "lap-rap",
    age: "6-12", price: 0, photos: [24], options: ["Đen", "Đỏ"],
    description: "Bộ lắp ráp mô hình xe đua F1, chi tiết sắc nét.",
  },
  {
    slug: "lap-rap-may-bay-chien-dau", name: "Lắp ráp máy bay chiến đấu", category: "lap-rap",
    age: "6-12", price: 0, photos: [26], options: ["Mẫu 1", "Mẫu 2", "Mẫu 3"],
    description: "Bộ lắp ráp máy bay chiến đấu, nhiều mẫu.",
  },
  {
    slug: "lap-rap-sieu-xe-dieu-khien", name: "Lắp ráp siêu xe điều khiển", category: "lap-rap",
    age: "6-12", price: 0, photos: [30, 27, 28, 29, 31, 35], options: ["Xanh lá", "Xanh dương", "Hồng đen", "Xanh ngọc", "Đỏ"],
    description: "Bộ lắp ráp siêu xe có động cơ, điều khiển từ xa sau khi lắp xong. Rèn tính kiên nhẫn và tư duy kỹ thuật.",
  },
  {
    slug: "bo-bep-do-choi-dream-kitchen", name: "Bộ bếp đồ chơi Dream Kitchen", category: "be-gai-am-nhac",
    age: "3-6", price: 135000, photos: [33], options: [], featured: true,
    description: "Bộ bếp đồ chơi nhiều phụ kiện: nồi, chảo, thức ăn, có tủ và bồn rửa. Kích thước khoảng 36 × 23 cm.",
  },
  {
    slug: "robot-cho-bien-hinh-dieu-khien", name: "Robot chó biến hình điều khiển", category: "xe-dieu-khien",
    age: "6-12", price: 339000, oldPrice: 525000, photos: [36], options: [], featured: true,
    description: "Xe robot chó biến hình, điều khiển từ xa, nhiều động tác nhào lộn, có đèn LED, pin sạc.",
  },
  {
    slug: "dan-piano-kem-micro", name: "Đàn piano kèm micro cho bé", category: "be-gai-am-nhac",
    age: "3-6", price: 225000, photos: [37], options: ["Hồng", "Xanh"],
    description: "Đàn organ cho bé kèm micro và giá nhạc, nhiều tiếng nhạc cụ.",
    featured: true,
  },
  {
    slug: "xe-dieu-khien-bien-hinh-robot", name: "Xe điều khiển biến hình robot", category: "xe-dieu-khien",
    age: "6-12", price: 125000, photos: [38], options: [], featured: true,
    description: "Siêu xe điều khiển biến hình robot, xoay 360°, có nhạc và đèn.",
  },
];

// Videos in /products sorted by name (1-based). Not linked to products yet — owner links them in admin.
export const videoCount = 8;
