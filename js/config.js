// ─────────────────────────────────────────────
//  SUPABASE CONFIG
//  Replace the two values below with your own.
//  Find them in: Supabase Dashboard → Project Settings → API
// ─────────────────────────────────────────────

const SUPABASE_URL = 'https://dcymnjlxvyhfwmhirhuf.supabase.co';       // e.g. https://xyzabc.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjeW1uamx4dnloZndtaGlyaHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTQ5NzMsImV4cCI6MjA5MjUzMDk3M30.2AY9yyxIe9acSGf_BdbrDwKYrQPSuvghJtDSjTT4YFE'; // long public key from Supabase

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
