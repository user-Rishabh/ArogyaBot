const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

// Service key gives full DB access (use only in backend)
const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = supabase