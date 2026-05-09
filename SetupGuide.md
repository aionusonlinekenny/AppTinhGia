# Menu Cost Pro — Setup & User Guide

> **Version 2.0** · Supported Languages: English & Tiếng Việt  
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

**Menu Cost Pro** is a mobile application designed for restaurant owners and kitchen managers to accurately calculate the true cost of every dish on their menu. By combining ingredient purchase prices, prep department labor, cook department labor, and fixed overhead costs, the app gives you a complete and detailed picture of your food cost and recommends profitable menu prices.

### Key Features

| Feature | Description |
|--------|-------------|
| 🥕 **Ingredient Costing** | Track prices per unit (lb, oz, kg, gram, box, bag) |
| 📦 **Box / Bag Pricing** | Auto-calculate per-oz or per-gram cost from bulk purchases |
| 🔪 **Prep Labor per Ingredient** | Assign prep dept time (min/unit) to each ingredient — cost flows automatically |
| 🍜 **Stock & Broth Costing** | Define batch recipes (e.g., pho broth) and allocate cost per oz/gram |
| 👥 **Staff & Payroll** | Manage 3 department groups: Cook Dept, Prep Dept, Waiters |
| ⚡ **Overhead Allocation** | Spread fixed monthly costs (rent, electricity) across dishes |
| 🍽️ **Dish Recipes** | Build recipes and see real-time total food cost per dish |
| 📊 **Menu Pricing** | Suggested prices at 30%–70% profit margins with custom slider |
| 🌐 **Bilingual** | Full English / Vietnamese interface |
| 💱 **Dual Currency** | US Dollar ($, lb/oz) or Vietnamese Đồng (₫, kg/gram) |
| 📶 **Offline Ready** | Works without internet after initial activation |

---

## 2. Cost Calculation Formulas

Understanding how the app calculates costs helps you enter data accurately and trust the results.

---

### 2.1 Ingredient Purchase Price per Dish Unit

The app normalizes all ingredient prices to a **per-dish unit** (oz, gram, or piece) regardless of how you purchase them.

#### Standard units

| Purchase Unit | Dish Unit | Formula |
|--------------|-----------|---------|
| per lb | per oz | `price_per_oz = price_per_lb ÷ 16` |
| per oz | per oz | `price_per_oz = price_per_oz` |
| per kg | per gram | `price_per_gram = price_per_kg ÷ 1,000` |
| per gram | per gram | `price_per_gram = price_per_gram` |
| per lạng (100g) | per gram | `price_per_gram = price_per_lạng ÷ 100` |
| per lít | per ml | `price_per_ml = price_per_lít ÷ 1,000` |

#### Box / Bag / Pack pricing

When an ingredient is purchased by the box or bag, the app uses the **sub-unit** breakdown:

```
price_per_dish_unit = (price_per_box ÷ units_per_box) ÷ 16    [if sub-unit = lb]
price_per_dish_unit = (price_per_box ÷ units_per_box)           [if sub-unit = oz / piece]
price_per_dish_unit = (price_per_box ÷ units_per_box) ÷ 1,000 [if sub-unit = kg]
price_per_dish_unit = (price_per_box ÷ units_per_box)           [if sub-unit = gram]
```

**Example:** A 40 lb box of beef costs $180.
- Units per box = 40, sub-unit = lb
- Price per oz = $180 ÷ 40 ÷ 16 = **$0.28 / oz**

---

### 2.2 Prep Labor Cost per Ingredient

This is the key feature that separates ingredient cost into **purchase price** and **prep labor** (the cost of the vegetable/prep kitchen processing raw ingredients into ready-to-use form).

For each ingredient you can enter a **prep time per unit** (minutes per purchase unit). The app uses the Prep Department's weighted average hourly rate to calculate the labor cost automatically.

```
prep_labor_cost_per_purchase_unit = (prep_dept_hourly_rate ÷ 60) × prep_minutes_per_unit

prep_labor_cost_per_dish_unit = applies the same unit conversion as the purchase price
```

**Example:** Carrots purchased per kg, prep time = 3 min/kg  
Prep dept weighted rate = $12.00/hr

```
prep_labor_cost_per_kg  = ($12.00 ÷ 60) × 3 = $0.60 / kg
prep_labor_cost_per_gram = $0.60 ÷ 1,000    = $0.0006 / gram
```

The ingredient card displays all three lines:
```
Purchase:        $1.20 / gram
🔪 Prep labor: + $0.0006 / gram
Effective cost:  $1.2006 / gram
```

> If you have no Prep Dept employees, this cost is $0 and is hidden from all breakdowns.

---

### 2.3 Stock & Broth Batch Cost

A stock recipe (e.g., pho broth) is costed as a batch, then allocated per oz/gram used in each dish.

```
batch_ingredient_cost = Σ (price_per_dish_unit × quantity_used)

labor_cost = (cook_dept_weighted_rate ÷ 60) × labor_minutes

cost_per_oz = (batch_ingredient_cost + labor_cost) ÷ yield_oz
```

**Example:** Pho broth batch
- Seasonings cost: $12.50
- Labor: 4 hours × cook dept weighted rate $14.20/hr = $56.80
- Yield: 400 oz
- **Cost per oz = ($12.50 + $56.80) ÷ 400 = $0.17 / oz**

Each pho bowl using 30 oz of broth is allocated: `30 × $0.17 = $5.10`

---

### 2.4 Weighted Average Labor Rate (per Department)

The app calculates a **separate** weighted average hourly rate for each of the three staff groups.

```
weighted_rate = Σ(hourly_rate × weekly_hours) ÷ Σ(weekly_hours)
```

**Example:** Cook Dept has 3 cooks:
- Cook A: $14.00/hr × 44 hrs/week
- Cook B: $13.50/hr × 38 hrs/week
- Cook C: $13.50/hr × 44 hrs/week

```
cook_weighted_rate = (14×44 + 13.5×38 + 13.5×44) ÷ (44+38+44) = $13.82 / hr
```

**Example:** Prep Dept has 2 staff:
- Prep A: $12.00/hr × 40 hrs/week
- Prep B: $11.50/hr × 32 hrs/week

```
prep_weighted_rate = (12×40 + 11.5×32) ÷ (40+32) = $11.78 / hr
```

> Without a weekly schedule set, the app falls back to a simple average of hourly rates.

---

### 2.5 Cook Labor Cost per Dish

This covers only the **cooking time** on the line — not vegetable prep (which is already in the ingredient cost).

```
cook_labor_cost_per_dish = (cook_dept_weighted_rate ÷ 60) × cooking_minutes
```

**Example:** A dish takes 12 minutes of cook time:
```
cook_labor = ($13.82 ÷ 60) × 12 = $2.76
```

---

### 2.6 Overhead Allocation per Dish

Fixed monthly costs (rent, electricity, water, gas, etc.) are spread evenly across all dishes served.

```
total_monthly_overhead = Σ all overhead line items

dishes_per_month = working_days_per_month × dishes_sold_per_day

overhead_per_dish = total_monthly_overhead ÷ dishes_per_month
```

**Example:**
- Total overhead: $6,350 / month
- Working days: 26, dishes/day: 100
- **Overhead per dish = $6,350 ÷ (26 × 100) = $2.44**

---

### 2.7 Total Food Cost per Dish

```
total_food_cost = ingredient_cost
               + prep_labor_cost      ← from prep dept × ingredient prep times
               + cook_labor_cost      ← from cook dept × dish cooking time
               + overhead_per_dish
```

The dish card and calculator screen show each line separately so you can see exactly where your cost comes from.

---

### 2.8 Suggested Menu Price

```
menu_price = total_food_cost ÷ (1 − profit_margin)
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

Follow these steps in order for accurate results.

---

### Step 1 — Add Staff & Schedules

**Tab: Staff → Employees**

The app uses **three separate staff groups**, each with its own weighted labor rate:

| Group | Role | Used For |
|-------|------|---------|
| 👨‍🍳 **Cook Dept** | Line cooks, head chef | Cooking time per dish |
| 🥦 **Prep Dept** | Vegetable kitchen, prep cooks | Processing time per ingredient |
| 🍽️ **Waiters** | Front-of-house staff | Tip tracking, payroll |

For each employee:
1. Tap **+ Add** and enter name, hourly rate, and **group** (Cook Dept / Prep Dept / Waiters).
2. Set the **Weekly Schedule** — tap each day to set start and end times.  
   The app uses actual scheduled hours to weight the labor rate correctly.
3. Enable **Tip Share Eligible** for staff who share in pooled tips.

> ⚠️ **Important:** Setting accurate schedules ensures the weighted rate reflects who actually works the most hours. Without schedules, the app defaults to a simple average of hourly rates.

---

### Step 2 — Add Ingredients & Prices

**Tab: Ingredients → Ingredients**

1. Tap **+** to add each ingredient.
2. Enter the name, price, and purchase unit (lb, oz, kg, gram, box, bag, hộp, etc.).
3. **For box/bag items** (e.g., a 40 lb box of beef):
   - Select unit = `box`
   - Enable the Box/Bag Breakdown section
   - Enter quantity per box (e.g., `40`) and sub-unit (`lb`)
   - The app displays the derived $/oz automatically.
4. **For prep-processed ingredients** (vegetables, herbs that need cutting/cleaning):
   - Scroll to **🔪 Prep Labor** section
   - Enter the minutes your Prep Dept spends per unit purchased (e.g., `3` min/kg for carrots)
   - The app uses the Prep Dept's weighted rate to calculate prep cost per gram/oz automatically
   - The ingredient card shows: Purchase cost · Prep labor cost · Effective total cost
5. Assign a **Category** (Meat, Seafood, Produce, Spices, etc.) for easy filtering.

> 💡 **Tip:** Only fill in prep time for ingredients that actually require prep dept labor. Items like bottled sauces or packaged spices typically have 0 prep time.

---

### Step 3 — Define Stock & Broth Recipes *(optional)*

**Tab: Ingredients → Stocks & Bases**

1. Tap **+ Add Stock / Broth**.
2. Name the stock (e.g., "Pho Broth", "Chicken Stock").
3. Add only the **seasonings and spices** used in the batch.  
   *(If the bones or meat become toppings served in the dish, cost them as separate dish ingredients — not here.)*
4. Enter the cook dept labor minutes for the batch and select the group.
5. Enter the batch yield in oz (or gram in VND mode).
6. The app calculates and displays **cost per oz** in real time.

---

### Step 4 — Enter Overhead Costs

**Tab: Overhead**

1. Tap **+ Add** for each fixed monthly cost.
2. Select the type (Electricity, Water, Gas, Rent, Insurance, etc.) and enter the monthly amount.
3. Tap **⚙️** in the summary bar to configure:
   - **Working Days / Month** (default: 26)
   - **Dishes Sold / Day** (default: 100)
4. The overhead per dish is recalculated automatically whenever you change these values.

---

### Step 5 — Create Dish Recipes

**Tab: Dishes → (+)**

**Step 1 of 3 — Info:** Enter dish name, category, and optional notes.

**Step 2 of 3 — Ingredients:**
- Tap **Add ingredients** to open the ingredient picker.
- Select each ingredient and enter the quantity used (in oz, gram, or pieces).
- Prep labor cost is **already embedded** in each ingredient's effective cost — no extra entry needed.
- Scroll down to **Stocks & Broths** to add a broth component (e.g., 30 oz of pho broth).
- The ingredient subtotal updates in real time.

**Step 3 of 3 — Cook Labor:**
- Enter **cooking time** (minutes) for Cook Dept and/or Waiters.
- This covers only the time on the cook line — prep dept time is already captured in the ingredients.
- The weighted rate per group is displayed automatically.

Tap **Save Dish** — the total food cost with full breakdown is shown on the dish card.

---

### Step 6 — View Menu Pricing

**Tab: Overview → (dish card) → Price Menu button**  
or directly from **Dishes → Price Menu**

- Select a dish to see the full cost breakdown:
  - 🥕 Ingredient cost
  - 🥦 Prep labor (shown only if Prep Dept has staff and ingredients have prep times)
  - 👨‍🍳 Cook labor
  - ⚡ Overhead
  - **Total Food Cost**
- View suggested prices at 5 profit levels (30% – 70%).
- Use the **Custom Profit %** input for any target margin.
- Tap **Share Price Report** to export the full breakdown as text.

---

## 4. Language & Currency Settings

Tap the **⚙️ Settings** button on the Overview screen (top-right corner).

### Language

| Option | Effect |
|--------|--------|
| 🇺🇸 English | All UI text displays in English |
| 🇻🇳 Tiếng Việt | All UI text displays in Vietnamese |

> Language and currency are **independent** settings. You can use English with VND or Vietnamese with USD — they do not affect each other.

### Currency & Units

| Mode | Currency | Weight | Volume | Container |
|------|----------|--------|--------|-----------|
| 🇺🇸 US | $ (USD) | lb, oz | fl oz, gal, qt, pt, cup | box, bag, pack |
| 🇻🇳 Vietnam | ₫ (VND) | kg, gram, lạng | lít, ml, chai, lon | hộp, túi, gói |

> Switching currency updates all unit dropdowns throughout the app. Your existing ingredient data is preserved — only new entries use the updated unit list.

---

## 5. Trial Period & Licensing

### Free Trial

- The app grants a **7-day free trial** from the first launch.
- All features are fully available during the trial — no restrictions.
- An orange banner at the top shows how many days remain.
- After 7 days, the app locks and requires a valid license key to continue.

### Offline Grace Period

If you have an active license but lose internet access:
- The app re-validates with the server every **30 days**.
- If it cannot reach the server, a **60-day offline grace period** applies.
- After 60 days offline, the app will prompt for re-validation.

---

## 6. Purchasing a License Key

### Option A — In-App

1. Tap the orange trial banner at the top of the app.
2. The pricing screen appears — **$4.99 / month** per restaurant.
3. Tap **Buy Now**.
4. Fill in the order form: name, restaurant name, email, phone, number of devices.
5. Copy your **Device ID** shown at the bottom of the screen and paste it into the form.
6. Submit the form.
7. Complete payment via **PayPal** on the next screen ($4.99 for 1 device).
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
2. Tap the orange trial banner **or** the **Enter Key** tab on the lock screen.
3. Type or paste your license key into the input field.
4. Tap **Activate**.
5. The app connects to the server to verify the key and register your device.
6. On success, the app unlocks immediately and the banner disappears.

> ✅ **Your data is preserved.** Activation never erases existing ingredients, dishes, staff records, or payroll entries.

---

## 8. Admin Guide — Managing Keys

*This section is for the app owner / operator managing the licensing back-end.*

### Accessing the Admin Panel

URL: `https://stonephovaldosta.com/license-api/admin.html`  
Password: *(your `ADMIN_SECRET` value from `config.php`)*

### Processing an Order

When a customer submits an order:

1. You receive an **email notification** at `support@stonephovaldosta.com`.
2. Log in to the Admin Panel.
3. Click the **📦 Orders** tab — a red badge shows the count of pending orders.
4. Locate the order. Click **💳 Mark Paid** after confirming PayPal payment received.
5. Click **🗝️ Create & Send Key** — the key creation form pre-fills with the customer's name and email.
6. Confirm the device count matches the order.
7. Click **Add Key** — the key is created and **automatically emailed** to the customer with full activation instructions.

### Managing Keys

From the **🗝️ Keys** tab:

| Action | Description |
|--------|-------------|
| 🎲 Generate | Auto-generate a random XXXX-XXXX-XXXX-XXXX format key |
| ✓ Activate | Re-enable a previously deactivated key |
| 🚫 Deactivate | Block a key (e.g., non-payment, refund) |
| 🔄 Reset Devices | Remove all registered devices (customer switched phones) |
| 📋 Copy Key | Copy key to clipboard for manual delivery |

### Server Files

All files should be uploaded to: `public_html/license-api/`

| File | Purpose |
|------|---------|
| `config.php` | Database credentials & admin secret |
| `validate.php` | App calls this to verify / activate a key |
| `admin-keys.php` | Lists and creates keys (admin only) |
| `admin-manage.php` | Activate / deactivate / reset keys (admin only) |
| `admin-orders.php` | Lists and fulfills orders (admin only) |
| `order.php` | Handles customer order form submissions |
| `health.php` | Database connectivity test |
| `admin.html` | Admin web panel |
| `store.html` | Customer-facing purchase page |

### Database Schema

Three tables are required. Import `server/schema.sql` via phpMyAdmin:

```
license_keys       — stores license key records
device_activations — tracks which devices have activated each key
license_orders     — stores customer purchase orders
```

---

## 9. Frequently Asked Questions

**Q: What is the difference between Cook Dept and Prep Dept?**  
A: **Cook Dept** covers staff who cook on the line (their cost is assigned per dish based on cooking minutes). **Prep Dept** covers staff who process raw ingredients — washing, peeling, cutting vegetables — before cooking begins. Their cost is assigned per ingredient based on prep minutes per unit purchased, and flows automatically into every dish that uses that ingredient.

**Q: Do I have to fill in prep time for every ingredient?**  
A: No — it is optional. Only fill in prep time for ingredients that your prep kitchen actually processes. Pre-packaged items like bottled sauces or dried spices typically have 0 prep time and the field can be left blank.

**Q: Can I use one license key on multiple devices?**  
A: Yes. Choose the correct device count when ordering. Each device activates separately using the same key, up to the purchased device limit.

**Q: What if I get a new phone?**  
A: Contact support at support@stonephovaldosta.com. The admin can reset the device registration on your key so you can activate on the new device without purchasing again.

**Q: Does the app work without internet?**  
A: Yes. After activation, the app works fully offline. It re-validates online every 30 days (with up to 60 days grace period if offline).

**Q: Can I change language or currency after I've already entered data?**  
A: Yes, at any time via ⚙️ Settings. Language and currency settings do not affect your saved ingredients, dishes, staff, or payroll records.

**Q: The food cost per dish seems too high or too low — why?**  
A: Check: (1) ingredient prices are entered per **purchase unit**, not per dish portion; (2) the **Working Days** and **Dishes per Day** in Overhead settings match your actual operation; (3) employee **schedules** are filled in so the weighted labor rate is accurate; (4) if you have a Prep Dept, verify the prep time fields on ingredients are reasonable — an overly large number inflates every dish using that ingredient.

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

**Menu Cost Pro** là ứng dụng di động dành cho chủ nhà hàng và quản lý bếp, giúp tính chính xác giá thành thực tế của từng món ăn trên thực đơn. Bằng cách kết hợp giá nguyên liệu, công sơ chế (bếp rau cải), công nấu (bếp cook) và chi phí cố định hàng tháng, ứng dụng cung cấp bức tranh chi tiết về giá vốn và đề xuất giá bán có lợi nhuận.

### Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| 🥕 **Giá nguyên liệu** | Theo dõi giá theo đơn vị mua (lb, oz, kg, gram, thùng, túi, hộp) |
| 📦 **Giá thùng / túi** | Tự tính giá/oz hoặc giá/gram từ hàng mua sỉ |
| 🔪 **Công sơ chế theo nguyên liệu** | Gán thời gian bếp rau cải (phút/đơn vị) cho từng nguyên liệu — chi phí tự động tính |
| 🍜 **Nước dùng & cốt** | Định nghĩa công thức nấu theo mẻ, phân bổ giá/oz cho từng bát |
| 👥 **Nhân viên & bảng lương** | Quản lý 3 bộ phận: Bếp Cook, Bếp Rau Cải, Phục vụ |
| ⚡ **Chi phí cố định** | Phân bổ chi phí tháng (thuê mặt bằng, điện) cho từng món |
| 🍽️ **Công thức món ăn** | Xây dựng công thức và xem giá thành theo thời gian thực |
| 📊 **Định giá thực đơn** | Gợi ý giá bán với lợi nhuận 30%–70%, có thể tùy chỉnh |
| 🌐 **Song ngữ** | Giao diện đầy đủ tiếng Anh / Tiếng Việt |
| 💱 **Hai loại tiền tệ** | Đô la Mỹ ($, lb/oz) hoặc Việt Nam Đồng (₫, kg/gram) |
| 📶 **Hoạt động offline** | Không cần internet sau khi kích hoạt |

---

## 2. Công thức tính giá thành

Hiểu rõ cách tính giúp bạn nhập dữ liệu chính xác và tin tưởng kết quả.

---

### 2.1 Giá nguyên liệu mua về theo đơn vị dùng cho món ăn

Ứng dụng chuẩn hóa tất cả giá nguyên liệu về **đơn vị dùng cho món** (oz, gram, cái) bất kể bạn mua theo đơn vị nào.

#### Đơn vị tiêu chuẩn

| Đơn vị mua | Đơn vị tính | Công thức |
|-----------|-------------|----------|
| per lb | per oz | `giá/oz = giá/lb ÷ 16` |
| per oz | per oz | `giá/oz = giá/oz` |
| per kg | per gram | `giá/gram = giá/kg ÷ 1.000` |
| per gram | per gram | `giá/gram = giá/gram` |
| per lạng (100g) | per gram | `giá/gram = giá/lạng ÷ 100` |
| per lít | per ml | `giá/ml = giá/lít ÷ 1.000` |

#### Giá thùng / túi / gói

Khi nguyên liệu mua theo thùng hoặc túi, ứng dụng sử dụng phân tích **đơn vị phụ**:

```
giá/đơn vị = (giá/thùng ÷ số đơn vị trong thùng) ÷ 16       [nếu đơn vị phụ = lb]
giá/đơn vị = (giá/thùng ÷ số đơn vị trong thùng)              [nếu đơn vị phụ = oz / cái]
giá/đơn vị = (giá/thùng ÷ số đơn vị trong thùng) ÷ 1.000    [nếu đơn vị phụ = kg]
giá/đơn vị = (giá/thùng ÷ số đơn vị trong thùng)              [nếu đơn vị phụ = gram]
```

**Ví dụ:** Thùng thịt bò 40 lb giá $180.
- Số đơn vị trong thùng = 40, đơn vị phụ = lb
- Giá/oz = $180 ÷ 40 ÷ 16 = **$0,28 / oz**

---

### 2.2 Chi phí công sơ chế theo nguyên liệu

Đây là tính năng cốt lõi giúp tách biệt giữa **giá mua nguyên liệu** và **công bếp rau cải** (chi phí sơ chế nguyên liệu thô thành thành phẩm sử dụng được).

Với mỗi nguyên liệu, bạn nhập **thời gian sơ chế (phút / đơn vị mua)**. Ứng dụng dùng lương bình quân gia quyền của bộ phận Bếp Rau Cải để tự động tính chi phí công.

```
công_sơ_chế_mỗi_đơn_vị_mua = (lương_giờ_bếp_rau_cải ÷ 60) × phút_sơ_chế_mỗi_đơn_vị

công_sơ_chế_mỗi_đơn_vị_dùng = áp dụng cùng quy tắc đổi đơn vị như giá mua
```

**Ví dụ:** Cà rốt mua theo kg, thời gian sơ chế = 3 phút/kg  
Lương bình quân bếp rau cải = 14.000₫/giờ

```
công_sơ_chế/kg   = (14.000 ÷ 60) × 3 = 700₫ / kg
công_sơ_chế/gram = 700 ÷ 1.000       = 0,7₫ / gram
```

Thẻ nguyên liệu hiển thị đầy đủ 3 dòng:
```
Giá mua:         15.000₫ / gram
🔪 Công sơ chế: +     0,7₫ / gram
Giá thực tế:     15.000,7₫ / gram
```

> Nếu không có nhân viên Bếp Rau Cải, chi phí này bằng $0 và không hiển thị trong các màn hình.

---

### 2.3 Giá thành nước dùng / cốt theo mẻ

Công thức nước dùng được tính theo mẻ, sau đó phân bổ giá/oz cho từng bát dùng.

```
chi_phí_nguyên_liệu_mẻ = Σ (giá/đơn_vị × số_lượng_dùng)

chi_phí_nhân_công = (lương_giờ_bếp_cook ÷ 60) × số_phút_nấu

giá_mỗi_oz = (chi_phí_nguyên_liệu_mẻ + chi_phí_nhân_công) ÷ sản_lượng_oz
```

**Ví dụ:** Mẻ nước dùng phở
- Gia vị, nêm: 290.000₫
- Nhân công: 4 giờ × lương bình quân bếp cook 90.000₫/giờ = 360.000₫
- Sản lượng: 4.000 gram (4 lít)
- **Giá/gram = (290.000 + 360.000) ÷ 4.000 = 162,5₫ / gram**

Mỗi bát dùng 800 gram nước dùng: `800 × 162,5₫ = 130.000₫`

---

### 2.4 Lương bình quân gia quyền (theo bộ phận)

Ứng dụng tính **riêng** lương bình quân gia quyền cho từng trong 3 bộ phận.

```
lương_bình_quân = Σ(lương_giờ × giờ_tuần) ÷ Σ(giờ_tuần)
```

**Ví dụ:** Bếp Cook có 3 người:
- Bếp A: 90.000₫/giờ × 44 giờ/tuần
- Bếp B: 85.000₫/giờ × 38 giờ/tuần
- Bếp C: 85.000₫/giờ × 44 giờ/tuần

```
lương_bình_quân_bếp_cook = (90k×44 + 85k×38 + 85k×44) ÷ (44+38+44) = 86.760₫ / giờ
```

**Ví dụ:** Bếp Rau Cải có 2 người:
- Rau A: 70.000₫/giờ × 40 giờ/tuần
- Rau B: 65.000₫/giờ × 32 giờ/tuần

```
lương_bình_quân_bếp_rau = (70k×40 + 65k×32) ÷ (40+32) = 67.780₫ / giờ
```

> Nếu không có lịch làm việc, ứng dụng dùng bình quân đơn giản của lương giờ.

---

### 2.5 Chi phí bếp cook cho mỗi món

Chỉ tính thời gian **nấu trực tiếp trên bếp** — không tính sơ chế rau củ (đã tính trong nguyên liệu rồi).

```
chi_phí_bếp_cook/món = (lương_bình_quân_bếp_cook ÷ 60) × phút_nấu
```

**Ví dụ:** Món cần 12 phút nấu:
```
chi_phí_bếp_cook = (86.760 ÷ 60) × 12 = 17.352₫
```

---

### 2.6 Phân bổ chi phí cố định cho mỗi món

Chi phí cố định hàng tháng được phân bổ đều cho tất cả các món phục vụ.

```
tổng_chi_phí_tháng = Σ tất cả khoản chi phí cố định

món_mỗi_tháng = ngày_làm_việc_tháng × số_món_bán_ngày

chi_phí/món = tổng_chi_phí_tháng ÷ món_mỗi_tháng
```

**Ví dụ:**
- Tổng chi phí: 150.000.000₫/tháng
- Ngày làm: 26, số món/ngày: 100
- **Chi phí/món = 150.000.000 ÷ (26 × 100) = 57.692₫**

---

### 2.7 Tổng giá thành mỗi món

```
tổng_giá_thành = chi_phí_nguyên_liệu
               + công_sơ_chế_bếp_rau_cải    ← tự động từ thời gian sơ chế × nguyên liệu dùng
               + chi_phí_bếp_cook            ← thời gian nấu của món
               + chi_phí_cố_định/món
```

Thẻ món ăn và màn hình định giá hiển thị từng dòng riêng biệt để bạn thấy rõ chi phí đến từ đâu.

---

### 2.8 Giá bán đề xuất

```
giá_bán = tổng_giá_thành ÷ (1 − tỷ_lệ_lợi_nhuận)
```

| Mục tiêu lợi nhuận | Công thức | Ví dụ (giá thành = 85.000₫) |
|-------------------|----------|-----------------------------|
| 30% | giá ÷ 0,70 | 121.400₫ |
| 40% | giá ÷ 0,60 | 141.700₫ |
| 50% | giá ÷ 0,50 | 170.000₫ |
| 60% | giá ÷ 0,40 | 212.500₫ |
| 70% | giá ÷ 0,30 | 283.300₫ |

> **Tiêu chuẩn ngành:** Hầu hết nhà hàng nhắm tỷ lệ giá vốn 28–35% (lợi nhuận 65–72%).

---

## 3. Hướng dẫn cài đặt ban đầu

Thực hiện theo thứ tự các bước sau để có kết quả chính xác.

---

### Bước 1 — Thêm nhân viên & lịch làm việc

**Tab: Nhân viên → Nhân viên**

Ứng dụng sử dụng **3 bộ phận nhân viên riêng biệt**, mỗi bộ phận có lương bình quân gia quyền độc lập:

| Bộ phận | Vai trò | Dùng để tính |
|---------|---------|-------------|
| 👨‍🍳 **Bếp Cook** | Đầu bếp, phụ bếp nấu | Thời gian nấu cho từng món |
| 🥦 **Bếp Rau Cải** | Bếp sơ chế rau củ, thái thịt | Thời gian sơ chế cho từng nguyên liệu |
| 🍽️ **Phục vụ** | Nhân viên phục vụ, thu ngân | Tính lương, theo dõi tips |

Với mỗi nhân viên:
1. Nhấn **+ Thêm**, nhập họ tên, lương theo giờ và **bộ phận** (Bếp Cook / Bếp Rau Cải / Phục vụ).
2. Thiết lập **Lịch làm tuần** — nhấn từng ngày để đặt giờ vào/ra.  
   Ứng dụng dùng số giờ thực tế để tính lương bình quân gia quyền chính xác.
3. Bật **Được chia tips** cho nhân viên hưởng tiền tip.

> ⚠️ **Quan trọng:** Lịch làm việc chính xác đảm bảo lương gia quyền phản ánh đúng người thực tế làm nhiều giờ nhất. Không có lịch làm, ứng dụng dùng bình quân đơn giản.

---

### Bước 2 — Thêm nguyên liệu & giá

**Tab: Nguyên liệu → Nguyên liệu**

1. Nhấn **+** để thêm từng nguyên liệu.
2. Nhập tên, giá và đơn vị mua (lb, oz, kg, gram, thùng, túi, hộp, v.v.).
3. **Đối với hàng mua theo thùng/túi** (ví dụ: thùng thịt bò 40 lb):
   - Chọn đơn vị = `box` hoặc `hộp/túi/gói`
   - Bật phần Thùng / Túi chi tiết
   - Nhập số lượng trong thùng và đơn vị phụ
   - Ứng dụng tự hiển thị giá/oz hoặc giá/gram.
4. **Đối với nguyên liệu cần sơ chế** (rau củ, thảo mộc cần rửa/thái/gọt):
   - Cuộn xuống phần **🔪 Công sơ chế (tùy chọn)**
   - Nhập số phút bếp rau cải sơ chế mỗi đơn vị mua (vd. `3` phút/kg cho cà rốt)
   - Ứng dụng dùng lương bình quân của Bếp Rau Cải để tính công tự động
   - Thẻ nguyên liệu hiển thị: Giá mua · Công sơ chế · Giá thực tế
5. Gán **Danh mục** (Thịt, Hải sản, Rau củ, Gia vị, v.v.) để dễ lọc.

> 💡 **Gợi ý:** Chỉ điền thời gian sơ chế cho nguyên liệu thực sự cần bếp rau cải xử lý. Hàng đóng gói sẵn như nước mắm, gia vị khô thường để trống (0 phút).

---

### Bước 3 — Định nghĩa nước dùng / cốt *(tùy chọn)*

**Tab: Nguyên liệu → Nước dùng & Cốt**

1. Nhấn **+ Thêm nước dùng / cốt**.
2. Đặt tên (ví dụ: "Nước dùng phở", "Cốt gà").
3. Chỉ thêm **gia vị và nêm** dùng trong mẻ.  
   *(Nếu xương hay thịt sau khi hầm trở thành topping phục vụ khách, KHÔNG đưa vào đây — tính riêng như nguyên liệu của món.)*
4. Nhập số phút nhân công bếp cook cho mẻ và chọn nhóm.
5. Nhập sản lượng mẻ theo oz (hoặc gram nếu dùng chế độ VNĐ).
6. Ứng dụng hiển thị **giá/oz** hoặc **giá/gram** theo thời gian thực.

---

### Bước 4 — Nhập chi phí cố định

**Tab: Chi phí**

1. Nhấn **+ Thêm** cho từng khoản chi phí tháng.
2. Chọn loại (Điện, Nước, Gas, Thuê mặt bằng, Bảo hiểm, v.v.) và nhập số tiền hàng tháng.
3. Nhấn **⚙️** trong thanh tổng để cấu hình:
   - **Ngày làm việc / tháng** (mặc định: 26)
   - **Số món bán / ngày** (mặc định: 100)
4. Chi phí/món tự động cập nhật mỗi khi thay đổi các giá trị này.

---

### Bước 5 — Tạo công thức món ăn

**Tab: Món ăn → (+)**

**Bước 1/3 — Thông tin:** Nhập tên món, danh mục và ghi chú tùy chọn.

**Bước 2/3 — Nguyên liệu:**
- Nhấn **Thêm nguyên liệu** để mở bảng chọn.
- Chọn từng nguyên liệu và nhập số lượng dùng (oz, gram hoặc cái).
- Chi phí công sơ chế **đã được gộp vào** giá thực tế của từng nguyên liệu — không cần nhập thêm.
- Cuộn xuống **Nước dùng & Cốt** để thêm nước dùng (ví dụ: 800 gram nước phở).
- Tổng nguyên liệu cập nhật theo thời gian thực.

**Bước 3/3 — Nhân công bếp cook:**
- Nhập thời gian **nấu trực tiếp** (phút) cho Bếp Cook và/hoặc Phục vụ.
- Phần này chỉ tính công nấu — công sơ chế đã tự động tính trong nguyên liệu rồi.
- Lương bình quân của từng nhóm được hiển thị tự động.

Nhấn **Lưu món** — giá thành đầy đủ với phân tích chi tiết hiển thị trên thẻ món ăn.

---

### Bước 6 — Xem định giá thực đơn

**Tab: Tổng quan → (thẻ món ăn) → Nút Giá menu**  
hoặc trực tiếp từ **Món ăn → Giá menu**

- Chọn món để xem phân tích chi phí đầy đủ:
  - 🥕 Chi phí nguyên liệu
  - 🥦 Công sơ chế bếp rau cải (chỉ hiển thị khi có Bếp Rau Cải và nguyên liệu có nhập thời gian sơ chế)
  - 👨‍🍳 Chi phí bếp cook
  - ⚡ Chi phí cố định
  - **Tổng giá thành**
- Xem giá bán đề xuất ở 5 mức lợi nhuận (30% – 70%).
- Nhập **% Lợi nhuận tùy chỉnh** bất kỳ.
- Nhấn **Chia sẻ báo cáo giá** để xuất phân tích đầy đủ dạng văn bản.

---

## 4. Cài đặt ngôn ngữ & tiền tệ

Nhấn nút **⚙️ Cài đặt** trên màn hình Tổng quan (góc trên bên phải).

### Ngôn ngữ

| Lựa chọn | Hiệu lực |
|---------|---------|
| 🇺🇸 English | Toàn bộ giao diện hiển thị tiếng Anh |
| 🇻🇳 Tiếng Việt | Toàn bộ giao diện hiển thị tiếng Việt |

> Ngôn ngữ và tiền tệ là **hai cài đặt hoàn toàn độc lập** — có thể dùng tiếng Anh với VNĐ hoặc tiếng Việt với USD, không ràng buộc nhau.

### Tiền tệ & Đơn vị

| Chế độ | Tiền tệ | Trọng lượng | Thể tích | Hàng đóng gói |
|--------|---------|------------|---------|--------------|
| 🇺🇸 Mỹ | $ (USD) | lb, oz | fl oz, gal, qt, pt, cup | box, bag, pack |
| 🇻🇳 Việt Nam | ₫ (VNĐ) | kg, gram, lạng | lít, ml, chai, lon | hộp, túi, gói |

> Đổi tiền tệ sẽ thay đổi danh sách đơn vị trong toàn app. Dữ liệu nguyên liệu hiện có được giữ nguyên — chỉ mục nhập mới dùng danh sách đơn vị mới.

---

## 5. Thời gian dùng thử & bản quyền

### Dùng thử miễn phí

- Ứng dụng cho phép **dùng thử 7 ngày** kể từ lần mở đầu tiên.
- Toàn bộ tính năng đều có sẵn trong thời gian dùng thử — không giới hạn.
- Thanh màu cam ở đầu app hiển thị số ngày còn lại.
- Sau 7 ngày, ứng dụng khóa lại và yêu cầu key bản quyền hợp lệ.

### Thời gian ân hạn offline

Nếu bạn có bản quyền hợp lệ nhưng mất kết nối internet:
- App xác nhận lại với server mỗi **30 ngày**.
- Nếu không kết nối được, thời gian **ân hạn offline 60 ngày** được áp dụng.
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
7. Hoàn tất thanh toán qua **PayPal** ở màn hình tiếp theo ($4,99 cho 1 thiết bị).
8. Bạn sẽ nhận key bản quyền qua email trong vòng **24 giờ**.

### Cách B — Trình duyệt web

Truy cập: `https://stonephovaldosta.com/license-api/store.html`

Quy trình giống hoàn toàn với cách mua trong app.

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
2. Nhấn thanh cam dùng thử **hoặc** tab **Nhập key** trên màn hình khóa.
3. Gõ hoặc dán key bản quyền vào ô nhập.
4. Nhấn **Kích hoạt**.
5. Ứng dụng kết nối server để xác minh key và đăng ký thiết bị.
6. Khi thành công, app mở khóa ngay lập tức và thanh dùng thử biến mất.

> ✅ **Dữ liệu của bạn được giữ nguyên hoàn toàn.** Kích hoạt không xóa nguyên liệu, công thức món, nhân viên hay bảng lương hiện có.

---

## 8. Hướng dẫn quản trị — Quản lý key

*Phần này dành cho chủ sở hữu / người vận hành hệ thống bản quyền.*

### Truy cập trang quản trị

URL: `https://stonephovaldosta.com/license-api/admin.html`  
Mật khẩu: *(giá trị `ADMIN_SECRET` đã cấu hình trong `config.php`)*

### Xử lý đơn hàng

Khi khách hàng gửi đơn hàng:

1. Bạn nhận được **email thông báo** tại `support@stonephovaldosta.com`.
2. Đăng nhập vào Trang quản trị.
3. Nhấn tab **📦 Orders** — dấu đỏ hiển thị số đơn hàng đang chờ.
4. Tìm đơn hàng. Nhấn **💳 Mark Paid** sau khi xác nhận đã nhận tiền PayPal.
5. Nhấn **🗝️ Create & Send Key** — form tạo key được điền sẵn tên và email khách.
6. Xác nhận số thiết bị khớp với đơn hàng.
7. Nhấn **Add Key** — key được tạo và **tự động gửi email** cho khách kèm hướng dẫn kích hoạt chi tiết.

### Quản lý key

Từ tab **🗝️ Keys**:

| Hành động | Mô tả |
|----------|-------|
| 🎲 Generate | Tạo key ngẫu nhiên định dạng XXXX-XXXX-XXXX-XXXX |
| ✓ Activate | Mở lại key đã bị tắt |
| 🚫 Deactivate | Khóa key (vd. khách không gia hạn, hoàn tiền) |
| 🔄 Reset Devices | Xóa thiết bị đã đăng ký (khách đổi điện thoại) |
| 📋 Copy Key | Sao chép key để gửi thủ công |

### Các file server

Tất cả file upload lên: `public_html/license-api/`

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

Cần 3 bảng. Import `server/schema.sql` qua phpMyAdmin:

```
license_keys       — lưu thông tin key bản quyền
device_activations — theo dõi thiết bị đã kích hoạt từng key
license_orders     — lưu đơn hàng của khách hàng
```

---

## 9. Câu hỏi thường gặp

**H: Bếp Cook và Bếp Rau Cải khác nhau thế nào trong app?**  
Đ: **Bếp Cook** là người nấu trực tiếp — chi phí được gán cho từng món dựa trên thời gian nấu. **Bếp Rau Cải** là người sơ chế nguyên liệu thô (rửa, gọt, thái) — chi phí được gán cho từng nguyên liệu dựa trên phút sơ chế mỗi đơn vị mua, và tự động chảy vào mọi món dùng nguyên liệu đó.

**H: Có bắt buộc phải nhập thời gian sơ chế cho mọi nguyên liệu không?**  
Đ: Không — hoàn toàn tùy chọn. Chỉ nhập cho nguyên liệu thực sự cần bếp rau cải xử lý. Hàng đóng gói sẵn như nước mắm, gia vị khô có thể để trống (0 phút).

**H: Có thể dùng một key cho nhiều thiết bị không?**  
Đ: Có. Chọn đúng số thiết bị khi đặt hàng. Mỗi thiết bị kích hoạt riêng bằng cùng một key, tối đa số lượng đã mua.

**H: Tôi đổi điện thoại mới thì làm sao?**  
Đ: Liên hệ hỗ trợ tại support@stonephovaldosta.com. Admin sẽ reset đăng ký thiết bị trên key của bạn để kích hoạt trên thiết bị mới mà không cần mua lại.

**H: App có dùng được khi không có mạng không?**  
Đ: Có. Sau khi kích hoạt, app hoạt động hoàn toàn offline. Xác nhận lại online mỗi 30 ngày (ân hạn tối đa 60 ngày nếu offline).

**H: Có thể đổi ngôn ngữ hoặc tiền tệ sau khi đã nhập dữ liệu chưa?**  
Đ: Có, bất cứ lúc nào qua ⚙️ Cài đặt. Đổi ngôn ngữ hoặc tiền tệ không ảnh hưởng đến nguyên liệu, món ăn, nhân viên hay bảng lương đã lưu.

**H: Giá thành món ăn có vẻ quá cao hoặc quá thấp — tại sao?**  
Đ: Kiểm tra: (1) giá nguyên liệu nhập theo **đơn vị mua**, không phải theo khẩu phần; (2) ngày làm việc và số món/ngày trong cài đặt Chi phí cố định phù hợp thực tế; (3) lịch làm việc nhân viên điền đầy đủ để lương gia quyền chính xác; (4) nếu có Bếp Rau Cải, kiểm tra thời gian sơ chế nhập vào nguyên liệu — số quá lớn sẽ làm tăng giá thành mọi món dùng nguyên liệu đó.

---

*© 2025 Menu Cost Pro · support@stonephovaldosta.com*
