import { apiFetch } from "./authService";

export interface Room {
  id: string;
  roomCode: string;
  ownerId: string;
  visibility: "public" | "private";
  createdAt: string;
  role?: string;
}

export interface RoomMember {
  userId: string;
  username: string;
  role: string;
}

export interface FileEntry {
  id: string;
  projectId: string;
  path: string;
  language: string;
  createdAt: string;
}

export interface Project {
  id: string;
  roomId: string;
  name: string;
  createdAt: string;
  files: FileEntry[];
}

export async function getUserRooms(): Promise<Room[]> {
  return apiFetch<Room[]>("/rooms");
}

export async function createRoom(visibility: "public" | "private"): Promise<Room> {
  return apiFetch<Room>("/rooms", {
    method: "POST",
    body: JSON.stringify({ visibility }),
  });
}

export async function getRoom(roomCode: string): Promise<Room> {
  return apiFetch<Room>(`/rooms/${roomCode}`);
}

export async function joinRoom(roomCode: string): Promise<{ message: string; roomCode: string; role: string }> {
  return apiFetch(`/rooms/${roomCode}/join`, { method: "POST" });
}

export async function getRoomMembers(roomCode: string): Promise<RoomMember[]> {
  return apiFetch<RoomMember[]>(`/rooms/${roomCode}/members`);
}

export async function getRoomProjects(roomCode: string): Promise<Project[]> {
  return apiFetch<Project[]>(`/projects?roomCode=${roomCode}`);
}

export async function createProject(roomCode: string, name: string): Promise<Project> {
  return apiFetch<Project>("/projects", {
    method: "POST",
    body: JSON.stringify({ roomCode, name }),
  });
}

export async function renameProject(projectId: string, name: string): Promise<Project> {
  return apiFetch<Project>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function deleteProject(projectId: string): Promise<{ message: string }> {
  return apiFetch(`/projects/${projectId}`, { method: "DELETE" });
}

export async function createFile(projectId: string, path: string, language?: string): Promise<FileEntry> {
  return apiFetch<FileEntry>("/files", {
    method: "POST",
    body: JSON.stringify({ projectId, path, languageOrDefault: language }),
  });
}

export async function renameFile(fileId: string, newPath: string, newLanguage?: string): Promise<FileEntry> {
  return apiFetch<FileEntry>(`/files/${fileId}`, {
    method: "PATCH",
    body: JSON.stringify({ path: newPath, language: newLanguage }),
  });
}

export async function deleteFile(fileId: string): Promise<{ message: string }> {
  return apiFetch(`/files/${fileId}`, { method: "DELETE" });
}

export async function getFileContent(fileId: string): Promise<FileEntry & { content: string }> {
  return apiFetch<FileEntry & { content: string }>(`/files/${fileId}`);
}
