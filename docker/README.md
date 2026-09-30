# คู่มือการใช้งาน Docker Compose และ Nginx Reverse Proxy

โครงสร้างนี้จัดทำขึ้นเพื่อรัน Next.js Application ร่วมกับ Nginx ทำหน้าที่เป็น Reverse Proxy โดยจัดการผ่าน Docker Compose

---

## 📁 โครงสร้างไฟล์
```
docker/
├── docker-compose.yml          # ไฟล์ Docker Compose กำหนด service app และ nginx
├── nginx/
│   └── default.conf            # คอนฟิก Nginx Reverse Proxy (รองรับ HTTP & HTTPS)
├── ssl/
│   ├── nginx-selfsigned.crt    # ไฟล์ SSL Certificate
│   └── nginx-selfsigned.key    # ไฟล์ SSL Private Key
└── README.md                   # เอกสารแนะนำการใช้งาน
```

---

## 🚀 คำสั่งการใช้งาน

### 1. เริ่มรัน Service (Start)
รันจากโฟลเดอร์ Root ของโปรเจกต์:
```bash
docker compose -f docker/docker-compose.yml up -d
```
หรือเข้าไปที่โฟลเดอร์ `docker` แล้วรัน:
```bash
cd docker
docker compose up -d
```

### 2. ตรวจสอบสถานะการทำงาน (Check Status)
```bash
docker compose -f docker/docker-compose.yml ps
```

### 3. ดู Logs การทำงาน (View Logs)
```bash
# ดู logs ทั้งหมดแบบเรียลไทม์
docker compose -f docker/docker-compose.yml logs -f

# ดูเฉพาะ Nginx
docker compose -f docker/docker-compose.yml logs -f nginx

# ดูเฉพาะ Next.js App
docker compose -f docker/docker-compose.yml logs -f app
```

### 4. สั่ง Rebuild Image ใหม่เมื่อโค้ดมีการเปลี่ยนแปลง (Rebuild)
```bash
docker compose -f docker/docker-compose.yml up -d --build
```

### 5. หยุดการทำงาน (Stop)
```bash
docker compose -f docker/docker-compose.yml down
```

---

## 🌐 การเข้าใช้งาน
- เข้าใช้งานผ่านเบราว์เซอร์: 
  - **HTTPS**: [https://localhost/korjong](https://localhost/korjong) (พอร์ต 443 ปลอดภัยด้วย SSL)
  - **HTTP**: [http://localhost/korjong](http://localhost/korjong) (พอร์ต 80)
- Nginx จะส่งต่อ Request ภายในเครือข่าย Docker ไปยัง Next.js ที่พอร์ต `3000` โดยอัตโนมัติ
