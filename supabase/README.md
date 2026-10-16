# Supabase kurulumu (BAForge AI)

1. **Tablolar:** Supabase → SQL Editor → New query → `schema.sql` içeriğini yapıştır → Run.
2. **Giriş adresleri:** Authentication → URL Configuration
   - Site URL: `https://geleceksimdi.vercel.app`
   - Redirect URLs: `https://geleceksimdi.vercel.app/**` ve `https://*-baforge-labs.vercel.app/**`
3. **Ortam değişkenleri (Vercel):** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. **İsteğe bağlı:** `AI_REQUIRE_LOGIN=1` → yapay zekâ ekranları yalnızca giriş yapanlara açılır.

Admin: `schema.sql` içindeki e-posta adresi ilk girişte otomatik admin olur.
