// Shared TypeScript types for Manager Norfa

export interface Album {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  projectCount?: number;
}

export interface Project {
  id: string;
  name: string;
  albumId: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  structure: FolderStructure;
}

export interface FolderStructure {
  projektFL: string;
  projektReaper: string;
  tekst: string;
  demoBit: string;
  demoNawijka: string;
  demoUtwor: string;
  gotowe: string;
  pliki: string;
}

export interface CreateProjectRequest {
  name: string;
  albumId?: string; // domyślnie "Robocze"
}

export interface CreateAlbumRequest {
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
