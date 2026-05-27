import 'dotenv/config'
import { createApp } from './app.js'

const PORT = process.env.PORT || 3001
const app = createApp()

app.listen(PORT, () => {
  console.log(`TalentStage API running on http://localhost:${PORT}`)
  console.log(`Health: http://localhost:${PORT}/api/health`)
})
