import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import albumsRouter from './routes/albums'
import projectsRouter from './routes/projects'
import filesRouter from './routes/files'
import { fileSystemService } from './services/file-system-service'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4001

app.use(cors())
app.use(express.json())

// Inicjalizacja systemu plików
fileSystemService.initialize().then(() => {
  console.log('✅ File system service initialized')
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Manager Norfa API is running' })
})

// Routes
app.use('/api/albums', albumsRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/files', filesRouter)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
