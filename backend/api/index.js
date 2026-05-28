import 'dotenv/config'
import { createApp } from '../src/app.js'

// Debug logging
console.log('Backend starting...')
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL)
console.log('NODE_ENV:', process.env.NODE_ENV)

const app = createApp()

export default app
