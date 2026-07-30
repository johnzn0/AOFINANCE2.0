const { createClient } = require('@supabase/supabase-js');
const url = 'https://juavorsfoscbtxsiudvv.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YXZvcnNmb3NjYnR4c2l1ZHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MjY0NDgsImV4cCI6MjA5OTAwMjQ0OH0.cYOO5gIrwgp5pbC1zJZYn-GQ3IKjDuxE-H8ky1f4iOs';
const supabase = createClient(url, key);
supabase.from('profiles').upsert({ id: '00000000-0000-0000-0000-000000000000', email: 'test@test.com' }).then(console.log).catch(console.error);
