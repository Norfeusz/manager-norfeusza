import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AlbumGrid from './components/AlbumGrid'
import ProjectList from './components/ProjectList'
import ProjectView from './components/ProjectView'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AlbumGrid />} />
        <Route path="/album/:albumId" element={<ProjectList />} />
        <Route path="/project/:albumId/:projectName" element={<ProjectView />} />
      </Routes>
    </Router>
  )
}

export default App
