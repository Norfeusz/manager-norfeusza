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

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
  createdAt: string;
  modifiedAt: string;
  isDirectory: boolean;
}

export interface MoveFileRequest {
  sourcePath: string;
  targetFolder: 'Projekt FL' | 'Projekt Reaper' | 'Tekst' | 'Demo bit' | 'Demo nawijka' | 'Demo utwor' | 'Gotowe' | 'Pliki';
  fileType?: 'bit' | 'nawijka' | 'utwor' | 'projekt_bit' | 'projekt_nawijka' | 'tekst';
}

export interface RenameFileRequest {
  filePath: string;
  newName: string;
}

export interface DeleteFileRequest {
  filePath: string;
}

export type FolderType = 'Projekt FL' | 'Projekt Reaper' | 'Tekst' | 'Demo bit' | 'Demo nawijka' | 'Demo utwor' | 'Gotowe' | 'Pliki';
