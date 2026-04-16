// Environment variables are set in Vercel → Project Settings → Environment Variables
// For local development, create a .env file based on .env.example
// The Supabase anon key is public by design (protected by Row Level Security),
// but using env vars keeps credentials out of your git history.

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const TALLY_TRAINING = import.meta.env.VITE_TALLY_TRAINING ?? 'https://tally.so/r/XxDjzg'
export const TALLY_NUTRITION = import.meta.env.VITE_TALLY_NUTRITION ?? 'https://tally.so/r/EkPJ4l'

// Webhook URLs — set in Vercel env vars, never hardcode
export const MAKE_TRAINING_WEBHOOK = import.meta.env.VITE_MAKE_TRAINING_WEBHOOK ?? ''
export const MAKE_NUTRITION_WEBHOOK = import.meta.env.VITE_MAKE_NUTRITION_WEBHOOK ?? ''

// Optional shared secret sent with every webhook call — validate in Make.com
// Add a Filter after your Webhook module: header "x-pt-token" = value of VITE_WEBHOOK_SECRET
export const WEBHOOK_SECRET = import.meta.env.VITE_WEBHOOK_SECRET ?? ''

export const EXERCISE_GIF_URL = `${SUPABASE_URL}/functions/v1/exercise-gif`
export const PLAN_CHAT_URL = `${SUPABASE_URL}/functions/v1/plan-chat`

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
