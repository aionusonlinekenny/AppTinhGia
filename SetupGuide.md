# Menu Cost Pro — Setup & User Guide

> **Version 1.0** · Supported Languages: English & Tiếng Việt  
> For support, contact: support@stonephovaldosta.com

---

## Table of Contents

1. [Overview](#1-overview)
2. [Cost Calculation Formulas](#2-cost-calculation-formulas)
3. [Initial Setup — Step by Step](#3-initial-setup--step-by-step)
4. [Language & Currency Settings](#4-language--currency-settings)
5. [Trial Period & Licensing](#5-trial-period--licensing)
6. [Purchasing a License Key](#6-purchasing-a-license-key)
7. [Activating Your License](#7-activating-your-license)
8. [Admin Guide — Managing Keys](#8-admin-guide--managing-keys)
9. [Frequently Asked Questions](#9-frequently-asked-questions)

---

# 🇺🇸 ENGLISH

---

## 1. Overview

**Menu Cost Pro** is a mobile application designed for restaurant owners and kitchen managers to accurately calculate the true cost of every dish on their menu. By combining ingredient prices, staff labor rates, and fixed overhead costs, the app gives you a complete picture of your food cost percentage and recommends profitable menu prices.

### Key Features

| Feature | Description |
|--------|-------------|
| 🥕 **Ingredient Costing** | Track prices per unit (lb, oz, kg, gram, box, bag) |
| 📦 **Box / Bag Pricing** | Auto-calculate per-oz or per-gram cost from bulk purchases |
| 🍜 **Stock & Broth Costing** | Define batch recipes (e.g., pho broth) and allocate cost per oz |
| 👥 **Staff & Payroll** | Manage employee schedules, calculate weighted labor rates |
| ⚡ **Overhead Allocation** | Spread fixed monthly costs (rent, electricity) across dishes |
| 🍽️ **Dish Recipes** | Build recipes and see real-time total food cost per dish |
| 📊 **Menu Pricing** | Get suggested menu prices at 30%–70% profit margins |
| 🌐 **Bilingual** | Full English / Vietnamese interface |
| 💱 **Dual Currency** | US Dollar ($, lb/oz) or Vietnamese Đồng (₫, kg/gram) |
| 📶 **Offline Ready** | Works without internet after initial activation |

---

## 2. Cost Calculation Formulas

Understanding how the app calculates costs helps you enter data accurately and trust the results.

### 2.1 Ingredient Unit Price

The app normalizes all ingredient prices to a **per-dish unit** (oz, gram, or piece) regardless of how you purchase them.

#### Standard units

| Purchase Unit | Dish Unit | Formula |
|--------------|-----------|---------|
| per lb | per oz | `price_per_oz = price_per_lb ÷ 16` |
| per oz | per oz | `price_per_oz = price_per_oz` |
| per kg | per gram | `price_per_gram = price_per_kg ÷ 1,000` |
| per gram | per gram | `price_per_gram = price_per_gram` |
| per lạng (100g) | per gram | `price_per_gram = price_per_lạng ÷ 100` |

#### Box / Bag / Pack pricing

When an ingredient is purchased by the box or bag, the app uses the **sub-unit** breakdown:

```
price_per_dish_unit = (price_per_box ÷ units_per_box) ÷ 16   [if sub-unit = lb]
price_per_dish_unit = (price_per_box ÷ units_per_box)          [if sub-unit = oz / piece]
price_per_dish_unit = (price_per_box ÷ units_per_box) ÷ 1000  [if sub-unit = kg]
price_per_dish_unit = (price_per_box ÷ units_per_box)          [if sub-unit = gram]
```

**Example:** A 40 lb box of beef costs $180.
- Units per box = 40, sub-unit = lb
- Price per oz = $180 ÷ 40 ÷ 16 = **$0.28 / oz**

---

### 2.2 Stock & Broth Batch Cost

A stock recipe (e.g., pho broth) is costed as a batch, then allocated per oz/gram used in each dish.

```
batch_ingredient_cost = Σ (price_per_dish_unit × quantity_used)

labor_cost = (weighted_hourly_rate ÷ 60) × labor_minutes

cost_per_oz = (batch_ingredient_cost + labor_cost) ÷ yield_oz
```

**Example:** Pho broth batch
- Seasonings cost: $12.50
- Labor: 4 hours × kitchen weighted rate $14.20/hr = $56.80
- Yield: 400 oz
- **Cost per oz = ($12.50 + $56.80) ÷ 400 = $0.17 / oz**

Each pho bowl using 30 oz of broth gets allocated: `30 × $0.17 = $5.10`

---

### 2.3 Labor Cost per Dish

The app uses a **weighted average hourly rate** per staff group (Kitchen / Waiters), calculated from each employee's actual scheduled hours and pay rate.

```
weighted_rate = Σ(hourly_rate × weekly_hours) ÷ Σ(weekly_hours)

labor_cost_per_dish = (weighted_rate ÷ 60) × prep_minutes
```

**Example:** Kitchen group has 3 cooks:
- Cook A: $14/hr × 44 hrs/week
- Cook B: $13.50/hr × 38 hrs/week
- Cook C: $13.50/hr × 44 hrs/week

`weighted_rate = (14×44 + 13.5×38 + 13.5×44) ÷ (44+38+44) = $13.82 / hr`

A dish with 12 minutes of kitchen prep = `($13.82 ÷ 60) × 12 = **$2.76**`

---

### 2.4 Overhead Allocation per Dish

Fixed monthly costs (rent, electricity, water, gas, etc.) are spread evenly across all dishes served.

```
total_monthly_overhead = Σ all overhead costs

dishes_per_month = working_days_per_month × dishes_sold_per_day

overhead_per_dish = total_monthly_overhead ÷ dishes_per_month
```

**Example:**
- Total overhead: $6,350/month
- Working days: 26, dishes/day: 100
- **Overhead per dish = $6,350 ÷ (26 × 100) = $2.44**

---

### 2.5 Total Food Cost per Dish

```
total_food_cost = ingredient_cost + labor_cost + overhead_per_dish
```

### 2.6 Suggested Menu Price

```
menu_price = total_food_cost ÷ (1 - profit_margin)
```

| Profit Target | Formula | Example (cost = $8.50) |
|--------------|---------|----------------------|
| 30% | cost ÷ 0.70 | $12.14 |
| 40% | cost ÷ 0.60 | $14.17 |
| 50% | cost ÷ 0.50 | $17.00 |
| 60% | cost ÷ 0.40 | $21.25 |
| 70% | cost ÷ 0.30 | $28.33 |

> **Industry standard:** Most restaurants target 28–35% food cost (65–72% margin).

---

## 3. Initial Setup — Step by Step

Follow these four steps in order for accurate results.

---

### Step 1 — Add Staff & Schedules

**Tab: Staff → Employees**

1. Tap **+ Add** to create each employee.
2. Enter name, role (Kitchen / Waiter), and hourly rate.
3. Set the **Weekly Schedule** — tap each day and set start/end times.  
   The app uses actual hours to compute the weighted labor rate.
4. Enable **Tip Share Eligible** for staff who share tips.

> ⚠️ **Important:** Without schedules, the labor rate defaults to a simple average. Setting accurate schedules ensures the weighted rate reflects who actually works the most.

---

### Step 2 — Add Ingredients & Prices

**Tab: Ingredients → Ingredients**

1. Tap **+** to add each ingredient.
2. Enter the name, price, and purchase unit.
3. **For box/bag items** (e.g., a 40-lb box of beef):
   - Select unit = `box`
   - Enable Box Breakdown
   - Enter quantity per box (e.g., `40`) and sub-unit (`lb`)
   - The app displays the derived $/oz automatically.
4. Assign a category (Meat, Produce, Spices, etc.) for filtering.

---

### Step 3 — Define Stock & Broth Recipes *(optional)*

**Tab: Ingredients → Stocks & Bases**

1. Tap **+ Add Stock / Broth**.
2. Name the stock (e.g., "Pho Broth").
3. Add only the **seasonings and spices** used in the batch  
   *(if the meat becomes a topping served in the dish, do NOT include it here — cost it as a separate dish ingredient).*
4. Enter kitchen labor minutes and the labor group.
5. Enter the batch yield in oz (or gram in VND mode).
6. The app calculates and displays **cost per oz** in real time.

---

### Step 4 — Enter Overhead Costs

**Tab: Overhead**

1. Tap **+ Add** for each fixed monthly cost.
2. Select the type (Electricity, Rent, etc.) and enter the monthly amount.
3. Tap **Edit (⚙️)** in the summary bar to set:
   - **Working Days / Month** (default: 26)
   - **Dishes Sold / Day** (default: 100)
4. The overhead per dish is recalculated automatically.

---

### Step 5 — Create Dish Recipes

**Tab: Dishes → (+)**

**Step 1 of 3 — Info:** Enter dish name, category, and notes.

**Step 2 of 3 — Ingredients:**
- Tap **Add ingredients** to open the ingredient picker.
- Select each ingredient and enter the quantity used (in oz, gram, or pieces).
- Scroll down to **Stocks & Broths** to add a broth component (e.g., 30 oz of pho broth).
- The ingredient subtotal updates in real time.

**Step 3 of 3 — Labor:**
- Enter prep time in minutes for Kitchen and/or Waiters.
- The weighted rate is displayed automatically.

Tap **Save Dish** — the total food cost is now visible on the dish card.

---

### Step 6 — View Menu Pricing

**Tab: Overview → (dish card) → Calculator icon**  
or directly via the **Calculator** stack screen.

- Select a dish to see the full cost breakdown.
- View suggested prices at 5 profit levels.
- Use the **Custom Profit %** slider for any target margin.
- Tap **Share Price Report** to export.

---

## 4. Language & Currency Settings

Tap the **⚙️ Settings** button on the Overview screen.

### Language

| Option | Effect |
|--------|--------|
| 🇺🇸 English | All UI text displays in English |
| 🇻🇳 Tiếng Việt | All UI text displays in Vietnamese |

> Language and currency are **independent** settings — you can use English with VND or Vietnamese with USD.

### Currency & Units

| Mode | Currency | Weight | Volume | Container |
|------|----------|--------|--------|-----------|
| 🇺🇸 US | $ (USD) | lb, oz | fl oz, gal, qt, pt | box, bag, pack |
| 🇻🇳 Vietnam | ₫ (VND) | kg, gram, lạng | lít, ml, chai | hộp, túi, gói |

> Switching currency changes the unit dropdowns throughout the app. Existing ingredient data is preserved — only new entries use the new unit list.

---

## 5. Trial Period & Licensing

### Free Trial

- The app grants a **7-day free trial** from the first launch.
- All features are fully available during the trial.
- A banner at the top of the app shows remaining trial days.
- After 7 days, the app locks and requires a valid license key to continue.

### Offline Grace Period

If you have an active license but lose internet access:
- The app re-validates online every **30 days**.
- If it cannot reach the server, a **60-day offline grace period** applies.
- After 60 days offline, the app will request re-validation.

---

## 6. Purchasing a License Key

### Option A — In-App

1. Tap the orange trial banner at the top of the app.
2. The pricing screen appears — **$4.99 / month** per restaurant.
3. Tap **Buy Now**.
4. Fill in the order form: name, restaurant name, email, phone, number of devices.
5. Copy your **Device ID** from the bottom of the screen and paste it into the form.
6. Submit the form.
7. Complete payment via **PayPal** on the next screen.
8. You will receive your license key by email within **24 hours**.

### Option B — Web Browser

Visit: `https://stonephovaldosta.com/license-api/store.html`

The process is identical to the in-app flow.

### Pricing

| Devices | Monthly Price |
|---------|--------------|
| 1 device | $4.99 / month |
| 2 devices | $8.00 / month |
| 3 devices | $10.00 / month |

---

## 7. Activating Your License

Once you receive your license key (format: `XXXX-XXXX-XXXX-XXXX`):

1. Open Menu Cost Pro.
2. Tap the orange trial banner **or** the **Enter Key** button on the lock screen.
3. Select the **Enter Key** tab.
4. Type or paste your license key.
5. Tap **Activate**.
6. The app connects to the server to verify the key and register your device.
7. On success, the app unlocks immediately and the banner disappears.

> ✅ **Your data is preserved** — activation never erases existing ingredients, dishes, or payroll records.

---

## 8. Admin Guide — Managing Keys

*This section is for the app owner / operator managing the licensing system.*

### Accessing the Admin Panel

URL: `https://stonephovaldosta.com/license-api/admin.html`  
Password: *(your configured `ADMIN_SECRET`)*

### Processing an Order

When a customer submits an order:

1. You receive an **email notification** with the customer's details.
2. Log in to the Admin Panel.
3. Click the **📦 Orders** tab — a red badge shows pending orders.
4. Find the order and click **💳 Mark Paid** after confirming PayPal payment.
5. Click **🗝️ Create & Send Key** — the key form is pre-filled with the customer's name and email.
6. Confirm the number of devices matches the order.
7. Click **Add Key** — the key is created and **automatically emailed** to the customer with activation instructions.

### Managing Keys

From the **🗝️ Keys** tab you can:

| Action | Description |
|--------|-------------|
| 🎲 Generate | Auto-generate a random XXXX-XXXX-XXXX-XXXX key |
| ✓ Activate | Re-enable a deactivated key |
| 🚫 Deactivate | Block a key from being used (e.g., non-payment) |
| 🔄 Reset Devices | Remove all registered devices (customer changed phones) |
| 📋 Copy Key | Copy key to clipboard for manual sharing |

### Server Files

All server files should be uploaded to: `public_html/license-api/`

| File | Purpose |
|------|---------|
| `config.php` | Database credentials & admin secret |
| `validate.php` | App calls this to verify/activate a key |
| `admin-keys.php` | Lists and creates keys (admin only) |
| `admin-manage.php` | Activate / deactivate / reset keys (admin only) |
| `admin-orders.php` | Lists and fulfills orders (admin only) |
| `order.php` | Handles customer order form submissions |
| `health.php` | Database connectivity test |
| `admin.html` | Admin web panel |
| `store.html` | Customer-facing purchase page |

### Database Schema

Two tables are required. Import `server/schema.sql` via phpMyAdmin:

```
license_keys       — stores license key records
device_activations — tracks which devices have activated each key
license_orders     — stores customer purchase orders
```

---

## 9. Frequently Asked Questions

**Q: Can I use one key on multiple devices?**  
A: Yes. Choose the correct device count when ordering. Each device activates separately using the same key, up to the purchased limit.

**Q: What happens if I get a new phone?**  
A: Contact support. The admin can reset the device registrations on your key so you can activate on the new device.

**Q: Does the app work without internet?**  
A: Yes. After activation, the app works fully offline. It re-validates online every 30 days (or up to 60 days grace period).

**Q: Can I change my language or currency after setup?**  
A: Yes, at any time via ⚙️ Settings. Changing language or currency does not affect your saved data.

**Q: The cost per dish seems too high / too low — why?**  
A: Check: (1) ingredient prices are entered per purchase unit, not per dish portion; (2) working days and dishes/day in Overhead settings are realistic; (3) employee schedules are filled in for accurate weighted labor rates.

---
---
---

# 🇻🇳 TIẾNG VIỆT

---

## Mục Lục

1. [Tổng quan](#1-tổng-quan)
2. [Công thức tính giá thành](#2-công-thức-tính-giá-thành)
3. [Hướng dẫn cài đặt ban đầu](#3-hướng-dẫn-cài-đặt-ban-đầu)
4. [Cài đặt ngôn ngữ & tiền tệ](#4-cài-đặt-ngôn-ngữ--tiền-tệ)
5. [Thời gian dùng thử & bản quyền](#5-thời-gian-dùng-thử--bản-quyền)
6. [Mua key bản quyền](#6-mua-key-bản-quyền)
7. [Kích hoạt bản quyền](#7-kích-hoạt-bản-quyền)
8. [Hướng dẫn quản trị — Quản lý key](#8-hướng-dẫn-quản-trị--quản-lý-key)
9. [Câu hỏi thường gặp](#9-câu-hỏi-thường-gặp)

---

## 1. Tổng quan

**Menu Cost Pro** là ứng dụng di động dành cho chủ nhà hàng và quản lý bếp, giúp tính chính xác giá thành thực tế của từng món ăn trên thực đơn. Bằng cách kết hợp giá nguyên liệu, chi phí nhân công và chi phí cố định hàng tháng, ứng dụng cung cấp bức tranh toàn cảnh về tỷ lệ giá vốn và đề xuất giá bán có lợi nhuận.

### Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| 🥕 **Giá nguyên liệu** | Theo dõi giá theo đơn vị (lb, oz, kg, gram, thùng, túi) |
| 📦 **Giá thùng / túi** | Tự tính giá/oz hoặc giá/gram từ mua sỉ |
| 🍜 **Nước dùng & cốt** | Định nghĩa công thức nấu theo mẻ, phân bổ giá/oz cho từng bát |
| 👥 **Nhân viên & bảng lương** | Quản lý lịch làm, tính lương bình quân gia quyền |
| ⚡ **Chi phí cố định** | Phân bổ chi phí tháng (thuê mặt bằng, điện) cho từng món |
| 🍽️ **Công thức món ăn** | Xây dựng công thức và xem giá thành theo thời gian thực |
| 📊 **Định giá thực đơn** | Gợi ý giá bán với lợi nhuận 30%–70% |
| 🌐 **Song ngữ** | Giao diện đầy đủ tiếng Anh / Tiếng Việt |
| 💱 **Hai loại tiền tệ** | Đô la Mỹ ($, lb/oz) hoặc Việt Nam Đồng (₫, kg/gram) |
| 📶 **Hoạt động offline** | Không cần internet sau khi kích hoạt |

---

## 2. Công thức tính giá thành

Hiểu rõ cách tính giúp bạn nhập dữ liệu chính xác và tin tưởng kết quả.

### 2.1 Giá nguyên liệu theo đơn vị

Ứng dụng chuẩn hóa tất cả giá nguyên liệu về **đơn vị dùng cho món ăn** (oz, gram hoặc cái), bất kể bạn mua theo đơn vị nào.

#### Đơn vị tiêu chuẩn

| Đơn vị mua | Đơn vị tính | Công thức |
|-----------|-------------|----------|
| per lb | per oz | `giá/oz = giá/lb ÷ 16` |
| per oz | per oz | `giá/oz = giá/oz` |
| per kg | per gram | `giá/gram = giá/kg ÷ 1.000` |
| per gram | per gram | `giá/gram = giá/gram` |
| per lạng (100g) | per gram | `giá/gram = giá/lạng ÷ 100` |

#### Giá thùng / túi / gói

Khi nguyên liệu mua theo thùng hoặc túi, ứng dụng sử dụng phân tích **đơn vị phụ**:

```
giá/đơn vị = (giá/thùng ÷ số đơn vị trong thùng) ÷ 16      [nếu đơn vị phụ = lb]
giá/đơn vị = (giá/thùng ÷ số đơn vị trong thùng)             [nếu đơn vị phụ = oz / cái]
giá/đơn vị = (giá/thùng ÷ số đơn vị trong thùng) ÷ 1.000   [nếu đơn vị phụ = kg]
giá/đơn vị = (giá/thùng ÷ số đơn vị trong thùng)             [nếu đơn vị phụ = gram]
```

**Ví dụ:** Thùng thịt bò 40 lb giá $180.
- Số đơn vị trong thùng = 40, đơn vị phụ = lb
- Giá/oz = $180 ÷ 40 ÷ 16 = **$0,28 / oz**

---

### 2.2 Giá thành nước dùng / cốt theo mẻ

Công thức nước dùng (ví dụ: nước dùng phở) được tính theo mẻ, sau đó phân bổ giá/oz cho từng bát dùng.

```
chi_phí_nguyên_liệu_mẻ = Σ (giá/đơn vị × số lượng sử dụng)

chi_phí_nhân_công = (lương_giờ_bình_quân ÷ 60) × số_phút_nấu

giá_mỗi_oz = (chi_phí_nguyên_liệu_mẻ + chi_phí_nhân_công) ÷ sản_lượng_oz
```

**Ví dụ:** Mẻ nước dùng phở
- Gia vị, nêm: $12,50
- Nhân công: 4 giờ × lương bình quân bếp $14,20/giờ = $56,80
- Sản lượng: 400 oz
- **Giá/oz = ($12,50 + $56,80) ÷ 400 = $0,17 / oz**

Mỗi bát phở dùng 30 oz nước dùng được phân bổ: `30 × $0,17 = $5,10`

---

### 2.3 Chi phí nhân công cho mỗi món

Ứng dụng sử dụng **lương bình quân gia quyền** theo nhóm nhân viên (Bếp / Phục vụ), tính từ số giờ làm việc thực tế và lương của từng người.

```
lương_bình_quân = Σ(lương_giờ × giờ_tuần) ÷ Σ(giờ_tuần)

chi_phí_nhân_công/món = (lương_bình_quân ÷ 60) × phút_chuẩn_bị
```

**Ví dụ:** Nhóm bếp có 3 đầu bếp:
- Đầu bếp A: $14/giờ × 44 giờ/tuần
- Đầu bếp B: $13,50/giờ × 38 giờ/tuần
- Đầu bếp C: $13,50/giờ × 44 giờ/tuần

`lương_bình_quân = (14×44 + 13,5×38 + 13,5×44) ÷ (44+38+44) = $13,82 / giờ`

Món ăn cần 12 phút chuẩn bị = `($13,82 ÷ 60) × 12 = **$2,76**`

---

### 2.4 Phân bổ chi phí cố định cho mỗi món

Chi phí cố định hàng tháng (thuê mặt bằng, điện, nước, gas, v.v.) được phân bổ đều cho tất cả các món phục vụ.

```
tổng_chi_phí_tháng = Σ tất cả chi phí cố định

món_mỗi_tháng = ngày_làm_việc_tháng × số_món_bán_ngày

chi_phí/món = tổng_chi_phí_tháng ÷ món_mỗi_tháng
```

**Ví dụ:**
- Tổng chi phí: $6.350/tháng
- Ngày làm: 26, số món/ngày: 100
- **Chi phí/món = $6.350 ÷ (26 × 100) = $2,44**

---

### 2.5 Tổng giá thành mỗi món

```
tổng_giá_thành = chi_phí_nguyên_liệu + chi_phí_nhân_công + chi_phí_cố_định/món
```

### 2.6 Giá bán đề xuất

```
giá_bán = tổng_giá_thành ÷ (1 - tỷ_lệ_lợi_nhuận)
```

| Mục tiêu lợi nhuận | Công thức | Ví dụ (giá thành = $8,50) |
|-------------------|----------|--------------------------|
| 30% | giá ÷ 0,70 | $12,14 |
| 40% | giá ÷ 0,60 | $14,17 |
| 50% | giá ÷ 0,50 | $17,00 |
| 60% | giá ÷ 0,40 | $21,25 |
| 70% | giá ÷ 0,30 | $28,33 |

> **Tiêu chuẩn ngành:** Hầu hết nhà hàng nhắm tỷ lệ giá vốn 28–35% (lợi nhuận 65–72%).

---

## 3. Hướng dẫn cài đặt ban đầu

Thực hiện theo thứ tự 5 bước sau để có kết quả chính xác.

---

### Bước 1 — Thêm nhân viên & lịch làm việc

**Tab: Nhân viên → Nhân viên**

1. Nhấn **+ Thêm** để tạo từng nhân viên.
2. Nhập họ tên, vai trò (Bếp / Phục vụ) và lương theo giờ.
3. Thiết lập **Lịch làm tuần** — nhấn từng ngày và đặt giờ vào/ra.  
   Ứng dụng dùng số giờ thực tế để tính lương bình quân gia quyền.
4. Bật **Được chia tips** cho nhân viên hưởng tiền tip.

> ⚠️ **Quan trọng:** Nếu không có lịch làm, lương sẽ tính theo bình quân đơn giản. Lịch làm chính xác đảm bảo lương gia quyền phản ánh đúng người làm nhiều giờ nhất.

---

### Bước 2 — Thêm nguyên liệu & giá

**Tab: Nguyên liệu → Nguyên liệu**

1. Nhấn **+** để thêm từng nguyên liệu.
2. Nhập tên, giá và đơn vị mua.
3. **Đối với hàng mua theo thùng/túi** (ví dụ: thùng thịt bò 40 lb):
   - Chọn đơn vị = `box`
   - Bật phần Thùng / Túi chi tiết
   - Nhập số lượng trong thùng (vd. `40`) và đơn vị phụ (`lb`)
   - Ứng dụng hiển thị giá/oz tự động tính.
4. Gán danh mục (Thịt, Rau củ, Gia vị, v.v.) để dễ lọc.

---

### Bước 3 — Định nghĩa nước dùng / cốt *(tùy chọn)*

**Tab: Nguyên liệu → Nước dùng & Cốt**

1. Nhấn **+ Thêm nước dùng / cốt**.
2. Đặt tên (ví dụ: "Nước dùng phở").
3. Chỉ thêm **gia vị và nêm** dùng trong mẻ.  
   *(Nếu thịt xương sau khi hầm trở thành topping phục vụ khách, KHÔNG đưa vào đây — tính riêng như nguyên liệu của món).*
4. Nhập số phút nhân công bếp và nhóm phụ trách.
5. Nhập sản lượng mẻ theo oz (hoặc gram nếu dùng chế độ VNĐ).
6. Ứng dụng hiển thị **giá/oz** theo thời gian thực.

---

### Bước 4 — Nhập chi phí cố định

**Tab: Chi phí**

1. Nhấn **+ Thêm** cho từng khoản chi phí tháng.
2. Chọn loại (Điện, Thuê mặt bằng, v.v.) và nhập số tiền hàng tháng.
3. Nhấn **Sửa (⚙️)** trong thanh tổng để thiết lập:
   - **Ngày làm việc / tháng** (mặc định: 26)
   - **Số món bán / ngày** (mặc định: 100)
4. Chi phí/món được tính lại tự động.

---

### Bước 5 — Tạo công thức món ăn

**Tab: Món ăn → (+)**

**Bước 1/3 — Thông tin:** Nhập tên món, danh mục và ghi chú.

**Bước 2/3 — Nguyên liệu:**
- Nhấn **Thêm nguyên liệu** để mở bảng chọn.
- Chọn từng nguyên liệu và nhập số lượng dùng (oz, gram hoặc cái).
- Cuộn xuống **Nước dùng & Cốt** để thêm nước dùng (ví dụ: 30 oz nước phở).
- Tổng nguyên liệu cập nhật theo thời gian thực.

**Bước 3/3 — Nhân công:**
- Nhập thời gian chuẩn bị (phút) cho Bếp và/hoặc Phục vụ.
- Lương bình quân được hiển thị tự động.

Nhấn **Lưu món** — giá thành đầy đủ sẽ hiển thị trên thẻ món ăn.

---

### Bước 6 — Xem định giá thực đơn

**Tab: Tổng quan → (thẻ món ăn) → Biểu tượng máy tính**  
hoặc trực tiếp qua màn hình **Định giá thực đơn**.

- Chọn món để xem phân tích chi phí đầy đủ.
- Xem giá bán đề xuất ở 5 mức lợi nhuận.
- Dùng **Lợi nhuận tùy chỉnh %** để nhập mức mục tiêu bất kỳ.
- Nhấn **Chia sẻ báo cáo giá** để xuất ra.

---

## 4. Cài đặt ngôn ngữ & tiền tệ

Nhấn nút **⚙️ Cài đặt** trên màn hình Tổng quan.

### Ngôn ngữ

| Lựa chọn | Hiệu lực |
|---------|---------|
| 🇺🇸 English | Toàn bộ giao diện hiển thị tiếng Anh |
| 🇻🇳 Tiếng Việt | Toàn bộ giao diện hiển thị tiếng Việt |

> Ngôn ngữ và tiền tệ là **hai cài đặt độc lập** — có thể dùng tiếng Anh với VNĐ hoặc tiếng Việt với USD.

### Tiền tệ & Đơn vị

| Chế độ | Tiền tệ | Trọng lượng | Thể tích | Hàng đóng gói |
|--------|---------|------------|---------|--------------|
| 🇺🇸 Mỹ | $ (USD) | lb, oz | fl oz, gal, qt | box, bag, pack |
| 🇻🇳 Việt Nam | ₫ (VNĐ) | kg, gram, lạng | lít, ml, chai | hộp, túi, gói |

> Đổi tiền tệ sẽ thay đổi danh sách đơn vị trong toàn app. Dữ liệu nguyên liệu hiện có được giữ nguyên — chỉ mục nhập mới sử dụng danh sách đơn vị mới.

---

## 5. Thời gian dùng thử & bản quyền

### Dùng thử miễn phí

- Ứng dụng cho phép **dùng thử 7 ngày** kể từ lần mở đầu tiên.
- Toàn bộ tính năng đều có sẵn trong thời gian dùng thử.
- Thanh màu cam ở đầu app hiển thị số ngày còn lại.
- Sau 7 ngày, ứng dụng khóa lại và yêu cầu key bản quyền hợp lệ.

### Thời gian ân hạn offline

Nếu bạn có bản quyền hợp lệ nhưng mất kết nối internet:
- App xác nhận lại online mỗi **30 ngày**.
- Nếu không kết nối được server, thời gian **ân hạn offline 60 ngày** được áp dụng.
- Sau 60 ngày offline, app sẽ yêu cầu xác nhận lại.

---

## 6. Mua key bản quyền

### Cách A — Trong app

1. Nhấn thanh cam dùng thử ở đầu app.
2. Màn hình định giá xuất hiện — **$4,99 / tháng** mỗi nhà hàng.
3. Nhấn **Mua ngay**.
4. Điền form đặt hàng: tên, tên nhà hàng, email, số điện thoại, số thiết bị.
5. Sao chép **Device ID** ở cuối màn hình và dán vào form.
6. Gửi form.
7. Hoàn tất thanh toán qua **PayPal** ở màn hình tiếp theo.
8. Bạn sẽ nhận key bản quyền qua email trong vòng **24 giờ**.

### Cách B — Trình duyệt web

Truy cập: `https://stonephovaldosta.com/license-api/store.html`

Quy trình giống với cách mua trong app.

### Bảng giá

| Số thiết bị | Giá tháng |
|------------|----------|
| 1 thiết bị | $4,99 / tháng |
| 2 thiết bị | $8,00 / tháng |
| 3 thiết bị | $10,00 / tháng |

---

## 7. Kích hoạt bản quyền

Sau khi nhận được key bản quyền (định dạng: `XXXX-XXXX-XXXX-XXXX`):

1. Mở Menu Cost Pro.
2. Nhấn thanh cam dùng thử **hoặc** nút **Nhập key** trên màn hình khóa.
3. Chọn tab **Nhập key**.
4. Gõ hoặc dán key bản quyền vào ô nhập.
5. Nhấn **Kích hoạt**.
6. Ứng dụng kết nối server để xác minh key và đăng ký thiết bị.
7. Khi thành công, app mở khóa ngay lập tức và thanh dùng thử biến mất.

> ✅ **Dữ liệu của bạn được giữ nguyên** — kích hoạt không xóa nguyên liệu, món ăn hay bảng lương hiện có.

---

## 8. Hướng dẫn quản trị — Quản lý key

*Phần này dành cho chủ sở hữu / người vận hành hệ thống bản quyền.*

### Truy cập trang quản trị

URL: `https://stonephovaldosta.com/license-api/admin.html`  
Mật khẩu: *(giá trị `ADMIN_SECRET` đã cấu hình trong `config.php`)*

### Xử lý đơn hàng

Khi khách hàng gửi đơn hàng:

1. Bạn nhận được **email thông báo** với thông tin khách hàng.
2. Đăng nhập vào Trang quản trị.
3. Nhấn tab **📦 Orders** — dấu đỏ hiển thị đơn hàng đang chờ.
4. Tìm đơn và nhấn **💳 Mark Paid** sau khi xác nhận thanh toán PayPal.
5. Nhấn **🗝️ Create & Send Key** — form tạo key được điền sẵn tên và email khách.
6. Xác nhận số thiết bị khớp với đơn hàng.
7. Nhấn **Add Key** — key được tạo và **tự động gửi email** cho khách kèm hướng dẫn kích hoạt.

### Quản lý key

Từ tab **🗝️ Keys** bạn có thể:

| Hành động | Mô tả |
|----------|-------|
| 🎲 Generate | Tạo key ngẫu nhiên XXXX-XXXX-XXXX-XXXX |
| ✓ Activate | Mở lại key đã tắt |
| 🚫 Deactivate | Khóa key (vd. khách không gia hạn) |
| 🔄 Reset Devices | Xóa thiết bị đã đăng ký (khách đổi điện thoại) |
| 📋 Copy Key | Sao chép key để gửi thủ công |

### Các file server

Tất cả file server upload lên: `public_html/license-api/`

| File | Mục đích |
|------|---------|
| `config.php` | Thông tin kết nối DB & mật khẩu admin |
| `validate.php` | App gọi để xác minh / kích hoạt key |
| `admin-keys.php` | Liệt kê và tạo key (chỉ admin) |
| `admin-manage.php` | Kích hoạt / tắt / reset key (chỉ admin) |
| `admin-orders.php` | Liệt kê và xử lý đơn hàng (chỉ admin) |
| `order.php` | Xử lý form đặt hàng của khách |
| `health.php` | Kiểm tra kết nối database |
| `admin.html` | Trang quản trị web |
| `store.html` | Trang mua hàng dành cho khách |

### Cấu trúc cơ sở dữ liệu

Cần 2 bảng. Import `server/schema.sql` qua phpMyAdmin:

```
license_keys       — lưu thông tin key bản quyền
device_activations — theo dõi thiết bị đã kích hoạt từng key
license_orders     — lưu đơn hàng của khách
```

---

## 9. Câu hỏi thường gặp

**H: Có thể dùng một key cho nhiều thiết bị không?**  
Đ: Có. Chọn đúng số thiết bị khi đặt hàng. Mỗi thiết bị kích hoạt riêng bằng cùng một key, tối đa số lượng đã mua.

**H: Tôi mua điện thoại mới thì sao?**  
Đ: Liên hệ hỗ trợ. Admin có thể reset đăng ký thiết bị trên key của bạn để kích hoạt trên thiết bị mới.

**H: App có dùng được không có mạng không?**  
Đ: Có. Sau khi kích hoạt, app hoạt động hoàn toàn offline. Xác nhận lại online mỗi 30 ngày (hoặc ân hạn tối đa 60 ngày).

**H: Có thể đổi ngôn ngữ hoặc tiền tệ sau khi đã cài không?**  
Đ: Có, bất cứ lúc nào qua ⚙️ Cài đặt. Đổi ngôn ngữ hoặc tiền tệ không ảnh hưởng đến dữ liệu đã lưu.

**H: Giá thành món ăn có vẻ quá cao / quá thấp — tại sao?**  
Đ: Kiểm tra: (1) giá nguyên liệu nhập theo đơn vị mua, không phải theo khẩu phần; (2) ngày làm việc và số món/ngày trong cài đặt Chi phí cố định phù hợp thực tế; (3) lịch làm việc nhân viên được điền đầy đủ để tính đúng lương bình quân gia quyền.

---

*© 2025 Menu Cost Pro · support@stonephovaldosta.com*
