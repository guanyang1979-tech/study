import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://avkxmugvwwqnwdrhpfra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a3htdWd2d3dxbndkcmhwZnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE4MzIsImV4cCI6MjA5MDMzNzgzMn0.NdaEJau2Cuw_1U3E3MfUGDLDI3J0NJxykJJphkQLxWY';

export const supabase = createClient(supabaseUrl, supabaseKey);