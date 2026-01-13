import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AlbumGrid from './components/AlbumGrid'
import ProjectList from './components/ProjectList'
import ProjectView from './components/ProjectView'
import FolderView from './components/FolderView'
import SimpleFolderView from './components/SimpleFolderView'
import Sortownia from './components/Sortownia'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AlbumGrid />} />
        <Route path="/album/:albumId" element={<ProjectList />} />
        <Route path="/project/:albumId/:projectName" element={<ProjectView />} />
        <Route path="/folder/:albumId/:projectName/:folderType" element={<FolderView />} />
        <Route path="/pliki/:folderType" element={<SimpleFolderView />} />
        <Route path="/sortownia" element={<Sortownia />} />
      </Routes>
    </Router>
  )
}

export default App
