# ทะเบียนประวัติผู้รับธรรมะ

เว็บทะเบียนภาษาไทยสำหรับผู้ดูแลระบบภายใน ใช้ Next.js App Router, TypeScript, Tailwind CSS, Ant Design **v5**, Supabase PostgreSQL / Authentication และ dayjs ไม่มีข้อมูลจำลองในหน้าจริง

## เริ่มต้น

ต้องใช้ Node.js 20.9 ขึ้นไป (แนะนำ Node.js LTS ที่ยังได้รับการดูแล) และ npm

```bash
npm install
cp .env.example .env.local
npm run dev
```

เปิด http://localhost:3000 ระบบจะนำไปหน้าเข้าสู่ระบบ หากยังไม่ตั้งค่า environment หน้าเข้าสู่ระบบจะแจ้งเตือนและปิดปุ่มเข้าสู่ระบบ

## ตั้งค่า Supabase

1. สร้าง Supabase project **สำหรับระบบ Admin นี้โดยเฉพาะ** เพราะผู้ใช้ email/password ที่ authenticated ทุกคนใน project มีสิทธิ์จัดการทะเบียนทั้งหมดตามนโยบายที่กำหนด
2. ใน Authentication → Sign In / Providers (หรือ Settings ตาม Dashboard รุ่นที่ใช้งาน) **ปิด Allow new users to sign up** และ **ปิด Anonymous sign-ins** ปิด provider อื่นที่ไม่ใช้ เปิดเฉพาะ email/password ห้ามเปิด signup ภายหลัง เนื่องจาก RLS อนุญาตบัญชี authenticated ทั้งหมด การไม่มีหน้า signup เพียงอย่างเดียวไม่ป้องกันการสมัครผ่าน Auth API
3. ไปที่ Authentication → Users → Add user → Create new user สร้างอีเมลและรหัสผ่านของ Admin และยืนยันอีเมล (Auto Confirm) จาก Dashboard เท่านั้น แอปไม่มีหน้า signup หรือคำสั่งสร้างบัญชี
4. เปิด SQL Editor แล้วรันไฟล์ `supabase/migrations/202609180001_create_dharma_recipients.sql` หนึ่งครั้ง แล้วรัน `supabase/migrations/202609180002_registry_options_and_import.sql` ตามลำดับ หรือใช้ Supabase CLI migration workflow หากใช้งาน CLI อยู่แล้ว
5. คัดลอก Project URL และ **Publishable key** จาก Project Settings → API Keys ลง `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

หากใช้ legacy anon key ให้ตั้ง `NEXT_PUBLIC_SUPABASE_ANON_KEY` แทนได้ ระบบรองรับทั้งสองชื่อ โดยใช้ Publishable key ก่อนหากตั้งไว้ทั้งคู่

6. ตั้ง Authentication → URL Configuration → Site URL เป็น `http://localhost:3000` ขณะพัฒนา และโดเมน HTTPS จริงเมื่อขึ้นระบบ
7. รีสตาร์ต `npm run dev` แล้วเข้า `/login` ด้วยบัญชี Admin ที่สร้างไว้

**ห้ามใส่ service_role key ใน environment ฝั่ง browser** แอปนี้ไม่ต้องใช้ service_role key และไม่เก็บ key ใน source code

## การใช้งาน

- `/login` เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
- `/admin/dashboard` ภาพรวมจำนวนทะเบียน จำนวนผู้รับธรรมะเดือนนี้ถึงวันนี้ (เขตเวลาไทย) และ 5 ทะเบียนที่เพิ่มล่าสุด
- `/admin/recipients` ตารางครบทุกช่อง ค้นหาชื่อ/เบอร์โทร/ที่อยู่ กรองช่วงวันที่แบบรวมวันเริ่มต้นและวันสิ้นสุด และกรองระดับแบบตรงกับข้อความ แบ่งหน้าฝั่งฐานข้อมูล 10/20/50 รายการ
- `/admin/recipients/create` เพิ่มทะเบียน
- `/admin/recipients/[id]` รายละเอียดครบทุกช่อง รวมรหัสทะเบียนและวันที่สร้าง/แก้ไข
- `/admin/recipients/[id]/edit` แก้ไขทะเบียน
- ปุ่มลบมีหน้าต่างยืนยันก่อนลบจริง
- บนมือถือใช้เมนูด้านข้างแบบ Drawer และเลื่อนตารางแนวนอนเพื่อดูทุกคอลัมน์

วันที่แสดง `DD/MM/YYYY` (ปี ค.ศ.) และเก็บเป็น PostgreSQL date ไม่มีการแปลงเป็น พ.ศ. ช่องอาจารย์แนะนำ อาจารย์รับรอง ชั้น ระดับ และสถานที่รับธรรมเลือกจากข้อมูลตัวเลือกที่ผู้ดูแลสร้าง จำนวนเงินรองรับทศนิยม 2 ตำแหน่ง

## โครงสร้าง

```text
app/                       หน้า App Router และ Server Actions
  login/                   หน้าเข้าสู่ระบบ
  admin/                   Layout ที่ตรวจสอบผู้ใช้ฝั่ง server
    dashboard/             ภาพรวม
    recipients/            รายการ เพิ่ม รายละเอียด และแก้ไข
components/
  admin/                   โครงหน้าและเมนู
  recipients/              ตาราง ฟอร์ม และรายละเอียด
  shared/                  Providers และ LoginForm
lib/
  supabase/                Supabase SSR client และการอ่าน environment
  auth.ts                  ตรวจสอบผู้ใช้ด้วย auth.getUser()
  recipients.ts            อ่านและกรองข้อมูลจากฐานข้อมูล
  validation.ts            Schema validation ฝั่ง server
  format.ts                รูปแบบวันที่และจำนวนเงิน
proxy.ts                   Refresh session และป้องกัน /admin/*
types/recipient.ts         DharmaRecipient และ Supabase database types
supabase/migrations/       ตาราง constraints indexes trigger และ RLS policies
tests/                     ทดสอบ validation และการกรอง search input
```

## ความปลอดภัย

- Proxy refresh cookie และตรวจสอบผู้ใช้ด้วย `auth.getUser()` กับ Supabase Auth ไม่เชื่อค่า session ที่อ่านจาก client เพียงอย่างเดียว
- ตรวจสอบผู้ใช้อีกครั้งใน protected layout, ฟังก์ชันอ่านข้อมูล และ Server Actions สำหรับเขียน/ลบ ป้องกันการเรียก action โดยตรง
- เปิด RLS และให้ SELECT/INSERT/UPDATE/DELETE เฉพาะ authenticated users ที่ไม่ใช่ anonymous พร้อมถอนสิทธิ์ anon และไม่มี policy สำหรับ public
- ใช้ session ของผู้ใช้ในการ query ฐานข้อมูล จึงอยู่ภายใต้ RLS ทุกครั้ง
- ตรวจสอบข้อมูลทั้ง Ant Design Form, Zod ฝั่ง server และ database constraints
- ข้อมูลส่วนบุคคลไม่มี shared application cache และ response ที่เกี่ยวกับ session ใช้ `private, no-store` ไม่ควรวาง CDN cache ครอบ `/admin/*` หรือ `/login`
- Server Actions ใช้กลไก same-origin ของ Next.js ควรตั้ง reverse proxy ให้ส่ง Host / Origin ถูกต้อง
- การลบเป็นการลบถาวร ควรตั้ง database backup ใน Supabase สำหรับระบบจริง

## ตรวจสอบและ build

```bash
npm run test
npm run typecheck
npm run lint
npm run build
npm start
```

ทดสอบการเชื่อมต่อจริงหลังใส่ค่า Supabase:

1. เปิด `/admin/recipients` ในหน้าต่างไม่ระบุตัวตน ต้องกลับ `/login` และไม่มีข้อมูลทะเบียน
2. เรียก REST API ของตารางด้วย anon key โดยไม่มี JWT ของผู้ใช้ ต้องอ่านหรือแก้ไขข้อมูลไม่ได้
3. ทดลองสมัครผ่าน Auth API ต้องถูกปฏิเสธหลังปิด signup
4. Login ด้วย Admin เพิ่มข้อมูลทุกช่อง ตรวจสอบรายละเอียด แก้ไข ค้นหา กรอง และเปลี่ยนหน้า
5. ตรวจสอบว่า `updated_at` เปลี่ยนหลังแก้ไข และชื่อว่าง/อายุผิด/เบอร์โทรมีตัวอักษร/จำนวนเงินติดลบไม่ผ่าน
6. ยกเลิก dialog ลบต้องยังมีข้อมูล ยืนยันลบแล้วข้อมูลต้องหาย
7. Logout แล้วกลับไป URL ทะเบียนโดยตรง ต้องเข้าสู่ระบบใหม่
8. ตรวจสอบหน้าจอขนาดมือถือ แท็บเล็ต และเดสก์ท็อป

ชุดทดสอบ TypeScript ตรวจ validation และ username mapping ส่วน `tests/verify-migrations.py` สร้าง SQL ทดสอบ migrations, CRUD, RLS, การแปลงวันที่ และการนำเข้าซ้ำใน PostgreSQL เครื่อง local โดยใช้ schema/roles ชั่วคราวและ rollback ทั้งหมด ยังต้องทดสอบ Login กับ Supabase project จริง

เอกสารอ้างอิง: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Ant Design กับ Next.js](https://ant.design/docs/react/use-with-next/)

## ชื่อผู้ใช้แทนอีเมล

หน้า Login ใช้ชื่อผู้ใช้ เช่น `chaiya` และรหัสผ่าน ชื่อผู้ใช้ยาว 3–32 ตัว รองรับภาษาอังกฤษ ตัวเลข และ `._-` ไม่แยกตัวพิมพ์ใหญ่เล็ก

บัญชีใหม่ให้สร้างใน Supabase Dashboard ด้วยอีเมลภายใน `ชื่อผู้ใช้@admin.example.com` และเลือก Auto Confirm ไม่ต้องใช้อีเมลจริง โดเมนนี้เป็นชื่ออ้างอิงเท่านั้น จึงรับอีเมลยืนยันหรือรีเซ็ตรหัสผ่านไม่ได้ ผู้ดูแลต้องจัดการบัญชีผ่าน Dashboard

บัญชีเดิมใช้ต่อได้ด้วย `AUTH_USERNAME_EMAIL_MAP` ใน `.env.local` เป็น JSON mapping ชื่อผู้ใช้ตัวพิมพ์เล็กไปยังอีเมลบัญชีเดิม ดูตัวอย่างใน `.env.example` ค่านี้ใช้เฉพาะฝั่ง server ห้ามเติม `NEXT_PUBLIC_` การตั้งชื่อผู้ใช้ไม่ได้ข้ามการยืนยันบัญชี ต้องยืนยันบัญชีเดิมให้เรียบร้อย แล้วรีสตาร์ต dev server หรือ build ใหม่สำหรับ production

## อัปเดตตัวเลือกและข้อมูลทะเบียน 14 รายการ

สำหรับระบบเดิมที่รัน migration แรกแล้ว ให้เปิด Supabase SQL Editor และรันเฉพาะ `supabase/migrations/202609180002_registry_options_and_import.sql` ไฟล์นี้จะ:

- เปลี่ยนคอลัมน์ `note` เป็น `received_place` โดยเก็บค่าเดิมไว้เป็นสถานที่รับธรรม
- สร้างตาราง `registry_options` พร้อม RLS เฉพาะผู้ดูแลที่ authenticated และไม่ใช่ anonymous
- นำค่าจากทะเบียนเดิมเข้าสู่ตัวเลือก และเพิ่มตัวเลือกที่ปรากฏในข้อมูลนำเข้า
- นำเข้าทะเบียนจริง 14 รายการตามข้อมูลที่ผู้ใช้ให้ พร้อมแปลง พ.ศ. 2559 → ค.ศ. 2016 และ พ.ศ. 2558 → ค.ศ. 2015
- สถานที่รับธรรมใช้ค่าจาก note: `ผู้เอ็น` และ `สิบเมตตา` ระดับเป็น `c` ชั้นเว้นว่างเพราะไม่ได้ระบุ
- ตรวจค่าตัวเลือกด้วย database trigger แม้เรียกฐานข้อมูลโดยตรง

ไฟล์ทำงานใน transaction เดียว รันซ้ำได้โดยใช้ ID คงที่และไม่เพิ่มแถวที่มีชื่อ วันที่รับธรรม และเบอร์โทรตรงกัน ไม่เขียนทับทะเบียนเดิม ลำดับ `no` จากต้นทางใช้ระบุแถวใน SQL เท่านั้น ลำดับบนหน้าเว็บยังคำนวณตามการเรียงและแบ่งหน้า

เข้าเมนู **จัดการข้อมูลตัวเลือก** เพื่อเพิ่มรายการในทั้ง 5 หมวด หรือกด **+** ข้างช่องเลือกในฟอร์มเพื่อเพิ่มและเลือกทันที รองรับค้นหาและล้างค่า ตัวเลือกที่เพิ่มจะใช้ร่วมกันทั้งระบบ สามารถแก้ไขชื่อโดยอัปเดตทะเบียนที่เกี่ยวข้องพร้อมกัน และลบได้เฉพาะตัวเลือกที่ยังไม่มีทะเบียนใช้งาน

ชื่อบุคคลและเบอร์โทรใน migration เป็นข้อมูลจริงที่ผู้ใช้ให้ ควรเก็บ repository นี้เป็นส่วนตัว

ทดสอบ SQL กับ PostgreSQL ในเครื่อง (ใช้บัญชี local ที่สร้าง role/schema ได้):

```bash
python3 tests/verify-migrations.py > /tmp/dharma-verify-migrations.sql
psql -h localhost -d postgres -f /tmp/dharma-verify-migrations.sql
```

การทดสอบนี้จำลอง `auth.uid()`/`auth.jwt()` สำหรับ RLS ไม่ได้เรียก Supabase Auth จริง

## แก้ไขและลบข้อมูลตัวเลือก

รัน `supabase/migrations/202609190001_edit_delete_registry_options.sql` หลัง migration สองไฟล์แรก แล้วใช้ปุ่มแก้ไข/ลบใน `/admin/options` ได้ทั้ง 5 หมวด

การแก้ไขชื่ออัปเดตตัวเลือกและทะเบียนที่อ้างอิงใน transaction เดียว ชื่อซ้ำในหมวดเดียวกันจะถูกปฏิเสธ การลบตรวจว่ามีทะเบียนใช้อยู่หรือไม่ที่ฝั่งฐานข้อมูลและมี dialog ยืนยัน หากมีผู้ใช้อยู่ต้องเปลี่ยนตัวเลือกในทะเบียนก่อน

RPC ใช้ SECURITY DEFINER แบบจำกัดเฉพาะสองคำสั่ง ตรวจผู้ใช้และ anonymous JWT ภายในฟังก์ชัน กำหนด search_path ว่าง ตรวจหมวดกับ allowlist และให้ EXECUTE เฉพาะ authenticated ไม่มีการเปิดสิทธิ์ UPDATE/DELETE ตารางตัวเลือกโดยตรง ล็อกการเขียนทะเบียนช่วงสั้น ๆ ระหว่างเปลี่ยนชื่อ/ลบเพื่อป้องกันรายการอ้างอิงค้างเมื่อมีการใช้งานพร้อมกัน
# dharma-registry
