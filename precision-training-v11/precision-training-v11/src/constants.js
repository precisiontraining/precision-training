// Environment variables are set in Vercel → Project Settings → Environment Variables
// For local development, create a .env file based on .env.example
// The Supabase anon key is public by design (protected by Row Level Security),
// but using env vars keeps credentials out of your git history.

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const TALLY_TRAINING = import.meta.env.VITE_TALLY_TRAINING ?? 'https://tally.so/r/XxDjzg'
export const TALLY_NUTRITION = import.meta.env.VITE_TALLY_NUTRITION ?? 'https://tally.so/r/EkPJ4l'

export const EXERCISE_GIF_URL = `${SUPABASE_URL}/functions/v1/exercise-gif`
export const PLAN_CHAT_URL = `${SUPABASE_URL}/functions/v1/plan-chat`

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
