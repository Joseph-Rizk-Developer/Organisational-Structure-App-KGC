# Organisational Structure App

A Next.js and Chakra UI company directory backed by Supabase, with authenticated viewing and administrator-only editing.

## Supabase setup

1. Run `supabase/setup.sql` in the Supabase SQL Editor.
2. Create users under Supabase Authentication.
3. Promote an administrator in the SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'administrator@example.com'
);
```

4. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in Vercel for Production, Preview, and Development.
5. Redeploy the project.

Never expose `SUPABASE_SECRET_KEY` in the browser.

## Local development

Copy `.env.example` to `.env.local`, enter the project URL and publishable key, then run:

```powershell
npm install
npm run dev
```

The application uses the Next.js App Router and TypeScript throughout. Run checks with:

```powershell
npm test
npm run typecheck
npm run build
```
