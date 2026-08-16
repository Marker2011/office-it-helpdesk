# HelpDesk Live

ระบบ IT Helpdesk ภายในออฟฟิศแบบ Realtime

## ฟีเจอร์ V1

- User สมัคร/เข้าสู่ระบบด้วยอีเมล
- User แจ้งเคส IT และดูเคสของตัวเอง
- เลข Ticket เช่น `IT-2026-00001`
- Priority: Low / Normal / High / Critical
- IT Dashboard เห็นเคสทั้งหมด
- IT กด **รับเคส** → Database บันทึก `accepted_at`
- IT เปลี่ยนเป็น **กำลังดำเนินการ** / **รอ User**
- IT ใส่วิธีแก้และ **ปิดเคส** → Database บันทึก `closed_at`
- แสดง Response Time และ Resolution Time
- Realtime ผ่าน Supabase Postgres Changes
- RLS: User เห็นเฉพาะเคสตัวเอง, IT/Admin เห็นทั้งหมด
- เวลาใน UI แสดงเป็น Asia/Bangkok และ timestamp สำคัญถูกสร้างจาก Database

## 1) สร้าง Supabase Project

สร้างโปรเจกต์ Supabase แล้วเปิด **SQL Editor**  
คัดลอกทั้งหมดจาก `supabase/schema.sql` แล้ว Run

> สำหรับการทดลองในออฟฟิศแบบเร็ว:
> Auth > Providers > Email จะเปิด/ปิด email confirmation ตามนโยบายบริษัทก็ได้
> ถ้าเปิด confirmation ผู้ใช้ต้องกดยืนยันอีเมลก่อน Login

## 2) ตั้ง Environment

คัดลอก `.env.example` เป็น `.env.local`

```bash
cp .env.example .env.local
```

ใส่ค่าจาก Supabase Project Settings / API:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

ห้ามเอา `service_role` key มาใส่ใน Browser

## 3) Run บนเครื่อง

ต้องมี Node.js เวอร์ชันที่รองรับ Next.js รุ่นปัจจุบัน

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000`

## 4) สร้าง IT account

ให้ IT สมัคร/Login ผ่านหน้าเว็บหนึ่งครั้งก่อน เพื่อให้เกิด record ใน `profiles`

จากนั้นรันใน Supabase SQL Editor:

```sql
update public.profiles
set role = 'it'
where email = 'it@company.com';
```

ถ้าจะให้เป็น Admin:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@company.com';
```

Logout/Login ใหม่ แล้วเมนู `IT Dashboard` จะปรากฏ

## 5) Deploy ฟรีบน Vercel

1. Push โฟลเดอร์นี้ขึ้น GitHub
2. Import repository เข้า Vercel
3. เพิ่ม Environment Variables 2 ตัว:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy
5. แชร์ URL `ชื่อโปรเจกต์.vercel.app` ให้คนในออฟฟิศ

## Realtime ทำงานอย่างไร

หน้า User และ IT subscribe ตาราง `tickets` ผ่าน Supabase Realtime  
เมื่อมี Insert/Update event หน้าเว็บจะ query ข้อมูลใหม่ทันที จึงไม่ต้องกด Refresh

ใน `schema.sql` มีคำสั่งเพิ่ม `tickets` และ `ticket_logs` เข้า publication `supabase_realtime` ให้แล้ว

## ความปลอดภัย

- ใช้ Row Level Security (RLS)
- User insert/read ได้เฉพาะเคสตัวเอง
- การรับเคส/เปลี่ยนสถานะ/ปิดเคสทำผ่าน Postgres RPC ที่ตรวจ role `it`/`admin`
- `accepted_at` และ `closed_at` ใช้ `now()` ฝั่ง Database
- อย่า commit `.env.local`
- สำหรับข้อมูลบริษัทจริง ควรกำหนดนโยบายรหัสผ่าน, email domain และ MFA ตามนโยบายองค์กร

## ไฟล์สำคัญ

- `app/page.tsx` — Employee Portal
- `app/it/page.tsx` — IT Dashboard
- `components/UserHome.tsx` — แจ้งเคส/เคสของฉัน
- `components/ItDashboard.tsx` — รับเคส/ปิดเคส
- `supabase/schema.sql` — Database, RLS, RPC, Realtime
- `preview.html` — ตัวอย่าง UI แบบเปิดดูได้ทันที (ไม่เชื่อม Database)
