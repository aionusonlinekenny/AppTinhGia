# Menu Cost Pro 🍴

App tính giá thành và gợi ý giá menu cho nhà hàng. Xây dựng bằng React Native (Expo).

---

## Yêu cầu

- [Android Studio](https://developer.android.com/studio) (Hedgehog trở lên)
- JDK 17+ (Android Studio tự cài)
- Android SDK API 33+
- Node.js 18+ và npm

---

## Clone và chạy (Android Studio)

```bash
# 1. Clone repo
git clone https://github.com/aionusonlinekenny/AppTinhGia.git
cd AppTinhGia

# 2. Cài dependencies
npm install

# 3. Mở Android Studio → File → Open → chọn thư mục android/
#    Chờ Gradle sync xong (~2-3 phút lần đầu)

# 4. Chạy Metro bundler (terminal riêng)
npx expo start

# 5. Trong Android Studio nhấn Run ▶ hoặc Shift+F10
```

---

## Chạy nhanh bằng Expo Go (không cần Android Studio)

```bash
npm install
npx expo start
# Quét QR bằng app Expo Go trên điện thoại
```

---

## Tính năng

| Module | Mô tả |
|---|---|
| 🏠 Tổng quan | Dashboard tài chính, insight giá thành |
| 🥕 Nguyên liệu | Quản lý giá nguyên liệu theo danh mục |
| 👥 Nhân viên | Lương theo giờ cho từng bộ phận |
| ⚡ Chi phí | Điện, nước, gas, thuê mặt bằng... |
| 🍽️ Món ăn | Công thức = nguyên liệu + nhân công |
| 💰 Tính giá | Giá thành + gợi ý giá menu theo % lợi nhuận |

## Công thức tính

```
Giá thành = Nguyên liệu + Nhân công + (Tổng chi phí cố định / Tổng món/tháng)

Giá menu gợi ý = Giá thành ÷ (1 - % lợi nhuận)
```
