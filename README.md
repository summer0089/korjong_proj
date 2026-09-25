# Korjong (ขอจอง) : ระบบจองห้องประชุมออนไลน์

ระบบบริหารจัดการและจองห้องประชุมออนไลน์สำหรับองค์กร พัฒนาด้วยเทคโนโลยีที่ทันสมัย ออกแบบให้ใช้งานง่าย สวยงาม แสดงผลแบบเรียลไทม์ และรองรับการจัดการสิทธิ์การใช้งานอย่างเป็นระบบ

---

## 🌟 คุณสมบัติเด่นของระบบ (Key Features)

### 1. ตารางการจองห้องประชุมแบบโต้ตอบ (Interactive Scheduler)
- **มุมมองตารางชัดเจน**: แกน Y เป็นช่วงเวลา (08:00 - 18:00 น.) และแกน X เป็นรายชื่อห้องประชุม
- **จองสะดวก รวดเร็ว**: รองรับทั้งการลากเมาส์เลือกช่วงเวลา (Drag-to-Select) หรือกดเลือกช่วงเวลาในช่องตาราง
- **ป้องกันข้อผิดพลาดอัตโนมัติ**: 
  - ระบบตรวจสอบการจองชนกัน (Time Conflict Check)
  - ป้องกันการบันทึกจองในวันที่ย้อนหลัง
- **การ์ดระบุสถานะ**: แสดงสีตามสถานะอย่างชัดเจน พร้อมแท็ก **"ของฉัน" (My Booking)**
- **ตัวเลือกวันที่ (Thai DatePicker)**: ปฏิทินแสดงผล พ.ศ. พร้อมปุ่มเลือกวันนี้และทางลัด

### 2. ระบบจัดการคำร้องของฉัน (My Bookings)
- ดูประวัติคำขอจองห้องประชุมส่วนตัวของผู้ใช้งาน
- เพิ่มการจองใหม่, แก้ไขข้อมูลการจอง, ขอยกเลิกคำขอ หรือลบรายการ
- มีระบบค้นหา กรองสถานะ และจัดเรียงข้อมูล

### 3. ระบบพิจารณาอนุมัติคำขอ (Approver Workflow)
- เมนูเฉพาะสำหรับ **ผู้อนุมัติ (Approver)** และ **ผู้ดูแลระบบ (Admin)**
- ดึงรายการคำร้องที่ **รอการอนุมัติ (PENDING)** มาแสดงผลทันที
- ปุ่มอนุมัติและไม่อนุมัติ (สามารถระบุเหตุผลการไม่อนุมัติได้)
- การ์ดสรุป KPI จำนวนคำร้องที่รอการดำเนินการ

### 4. รายงานและสถิติการใช้งาน (Analytics & Reports)
- **แดชบอร์ดสถิติการใช้งาน (`/p/report/usage`)**:
  - ตัวชี้วัดสำคัญ (KPIs): จำนวนครั้งที่จอง, ชั่วโมงใช้งานรวม, จำนวนผู้เข้าร่วมเฉลี่ย, และห้องยอดนิยมอันดับ 1
  - กราฟเปรียบเทียบการใช้งานแยกตามห้องประชุม
  - กราฟวงกลม (Donut Chart) แสดงสัดส่วนสถานะการจอง
  - กราฟแท่งแสดงช่วงเวลายอดนิยม (Peak Meeting Hours) 08:00 - 18:00 น.
  - อันดับหน่วยงานที่มีการใช้งานสูงสุด และการกระจายตัวตามวันในสัปดาห์
  - ตารางสรุปประสิทธิภาพรายห้องประชุม
- **ตารางประวัติการจองและส่งออกข้อมูล (`/p/report/approval`)**:
  - ตาราง DataTable ครบวงจร ค้นหาคำสำคัญ กรองตามห้อง แผนก และช่วงวันที่
  - เรียงลำดับคอลัมน์ (Sorting) และแบ่งหน้า (Pagination)
  - **ส่งออกไฟล์ CSV (Export to CSV)**: มี UTF-8 BOM รองรับภาษาไทยบน **Microsoft Excel** 100% ไม่เกิดปัญหาตัวอักษรต่างดาว

### 5. จัดการระบบและสิทธิ์ผู้ใช้งาน (System Administration)
- จัดการข้อมูลหน่วยงานภายใน (Department Management)
- จัดการห้องประชุม ความจุ และสถานที่ (Meeting Room Management)
- จัดการรายชื่อผู้ใช้งานและกำหนดระดับสิทธิ์ (Employee & Role Management)
- หน้าจัดการโปรไฟล์ส่วนตัวและเปลี่ยนรหัสผ่าน

---

## 👥 ระดับสิทธิ์ผู้ใช้งาน (User Roles)

| บทบาท (Role) | สิทธิ์การเข้าถึง |
| :--- | :--- |
| **USER** | จองห้องประชุม, ดูตารางปฏิทิน, ดูรายการจองของตนเอง, ดูรายงานและสถิติ, แก้ไขโปรไฟล์ |
| **APPROVER** | สิทธิ์ทุกอย่างของ USER + พิจารณาอนุมัติ/ไม่อนุมัติคำขอจองในหน้า `/a/approve-list` |
| **ADMIN** | สิทธิ์สูงสุด ดูแลจัดการห้องประชุม, หน่วยงาน, บัญชีผู้ใช้งานระบบ และพิจารณาอนุมัติคำขอ |

---

## 🗺️ โครงสร้างเส้นทางหน้าจอ (Routing Overview)

```
app/
├── (auth)/
│   └── page.tsx              # หน้าเข้าสู่ระบบ (Sign In)
├── p/                        # หน้าสำหรับผู้ใช้งานทั่วไป (Protected for Users)
│   ├── home/                 # หน้าหลัก & ตารางจองห้องประชุม
│   ├── booking/              # หน้าจอเข้าสู่การจองห้องประชุม
│   ├── my-booking/           # รายการคำร้องและประวัติการจองของฉัน
│   └── report/
│       ├── usage/            # แดชบอร์ดสรุปสถิติการใช้งานห้องประชุม
│       └── approval/         # ตารางประวัติการจองทั้งหมด & Export CSV
├── a/                        # หน้าสำหรับผู้อนุมัติและแอดมิน (Approver / Admin)
│   ├── approve-list/         # หน้ารายการคำร้องรอพิจารณาอนุมัติ
│   └── employee-list/        # หน้าจัดการรายชื่อพนักงานและสิทธิ์
├── i/                        # ข้อมูลระบบพื้นฐาน (Internal Management)
│   ├── department/           # จัดการหน่วยงานภายใน
│   └── meeting-room/         # จัดการห้องประชุม
└── u/                        # บัญชีผู้ใช้ส่วนบุคคล
    ├── profile/              # แก้ไขข้อมูลส่วนตัว
    └── change-password/      # เปลี่ยนรหัสผ่าน
```

---

## 🛠️ เทคโนโลยีที่ใช้พัฒนา (Tech Stack)

- **Frontend & Fullstack**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI & State**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & ORM**: PostgreSQL ผ่าน [Prisma 8](https://www.prisma.io/) (`@prisma/orm-postgres`)
- **Authentication**: Stateless Cookie-based Session พร้อมระบบตรวจสอบสิทธิ์ผ่าน Middleware/Proxy
- **Email Notification**: [Nodemailer](https://nodemailer.com/) สำหรับส่งอีเมลแจ้งเตือน

---

## 🚀 การติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าไฟล์ Environment Variables
สร้างหรือแก้ไขไฟล์ `.env` ที่โฟลเดอร์หลัก:
```env
# การเชื่อมต่อฐานข้อมูล PostgreSQL
DATABASE_URL="postgresql://<username>:<password>@<host>:<port>/<database>?pgbouncer=true"
DIRECT_URL="postgresql://<username>:<password>@<host>:<port>/<database>"

# การตั้งค่า SMTP สำหรับส่งอีเมล
SMTP_SERVER_URL=mail.yourdomain.com
SMTP_SERVER_PORT=587
SMTP_USERNAME=support@yourdomain.com
SMTP_PASSWORD=your_password

# Secret Keys
AUTH_SECRET=your_auth_secret_key
OTP_SECRET=your_otp_secret_key
```

### 3. ซิงค์ฐานข้อมูล (Database Schema)
```bash
npx prisma db push
```

### 4. รันเซิร์ฟเวอร์สำหรับพัฒนา (Development Server)
```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่: **`http://localhost:3000`**

---

## 🔌 API Endpoints สำคัญ

### 📅 การจองห้องประชุม (Booking)
- `POST /api/booking/new` : บันทึกการจองใหม่ (พร้อมตรวจเวลาชน)
- `PUT /api/booking/update` : แก้ไขข้อมูลการจอง
- `POST /api/booking/cancel` : ขอยกเลิกการจอง
- `DELETE /api/booking/delete` : ลบรายการจองออกจากระบบ
- `POST /api/booking/status/approve` : อนุมัติคำขอจอง
- `POST /api/booking/status/reject` : ไม่อนุมัติคำขอจอง
- `GET /api/booking/get` : ดึงข้อมูลการจองทั้งหมด (รองรับตัวกรองห้อง สถานะ ช่วงเวลา)
- `GET /api/booking/get/by-user-id` : ดึงประวัติการจองของผู้ใช้ปัจจุบัน
- `GET /api/booking/get/status` : ดึงคำขอตามสถานะ (เช่น `PENDING`)

### 🏢 ข้อมูลพื้นฐาน (Master Data)
- `GET /api/meeting-room/get` : รายชื่อห้องประชุมทั้งหมด
- `GET /api/department/get` : รายชื่อหน่วยงานทั้งหมด
- `GET /api/auth/session` : ตรวจสอบข้อมูลผู้ใช้งานที่เข้าสู่ระบบ

---

## 📄 ใบอนุญาต (License)
โปรเจกต์นี้พัฒนาขึ้นสำหรับใช้งานภายในองค์กร
