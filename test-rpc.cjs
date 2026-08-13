const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://juavorsfoscbtxsiudvv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YXZvcnNmb3NjYnR4c2l1ZHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MjY0NDgsImV4cCI6MjA5OTAwMjQ0OH0.cYOO5gIrwgp5pbC1zJZYn-GQ3IKjDuxE-H8ky1f4iOs');

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { query: "SELECT 1" });
  console.log("RPC check:", data, error);
}
run();
