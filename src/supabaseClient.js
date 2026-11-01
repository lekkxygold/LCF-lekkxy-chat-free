import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ubriiwfurjjlijyiffcc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVicmlpd2Z1cmpqbGlqeWlmZmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDk3NjMsImV4cCI6MjEwNjI4NTc2M30.wDmBsuMlToqEKE9hsWrB_r3ju1o2RMKwUDqcPm-o1vw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
