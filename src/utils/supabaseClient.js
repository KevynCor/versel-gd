import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ogxknbhdkysvapfglznf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9neGtuYmhka3lzdmFwZmdsem5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNTIxNTcsImV4cCI6MjA2OTkyODE1N30.qrHWX-6Kp5BgKeO2qcahWL5uad2DArSumjC4zFGSJZU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);