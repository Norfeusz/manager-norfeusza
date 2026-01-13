import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import albumsRouter from './routes/albums'
import projectsRouter from './routes/projects'
import filesRouter from './routes/files'
import sortowniaRouter from './routes/sortownia'
import coversRouter from './routes/covers'
import simpleFoldersRouter from './routes/simple-folders'
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Manager Norfa API is running' })
})

// Routes
app.use('/api/albums', albumsRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/files', filesRouter)
app.use('/api/sortownia', sortowniaRouter)
app.use('/api/covers', coversRouter)
app.use('/api/simple-folders', simpleFoldersRouter)

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
