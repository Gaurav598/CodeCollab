import { apiFetch } from "./authService";

export interface Room {
  id: string;
  roomCode: string;
  ownerId: string;
  name: string;
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
  roomId: string;
  path: string;
  language: string;
  createdAt: string;
}

export async function getUserRooms(): Promise<Room[]> {
  return apiFetch<Room[]>("/rooms");
}

export async function createRoom(): Promise<Room> {
  return apiFetch<Room>("/rooms", {
    method: "POST",
    body: JSON.stringify({}),
  });
}


export async function getRoom(roomCode: string): Promise<Room> {
  return apiFetch<Room>(`/rooms/${roomCode}`);
}

export async function deleteRoom(roomCode: string): Promise<{ message: string }> {
  return apiFetch(`/rooms/${roomCode}`, { method: "DELETE" });
}

export async function joinRoom(roomCode: string): Promise<{ message: string; roomCode: string; role: string }> {
  return apiFetch(`/rooms/${roomCode}/join`, { method: "POST" });
}

export async function getRoomMembers(roomCode: string): Promise<RoomMember[]> {
  return apiFetch<RoomMember[]>(`/rooms/${roomCode}/members`);
}

export async function approveMember(roomCode: string, targetUserId: string, role: string): Promise<{ userId: string; role: string }> {
  return apiFetch(`/rooms/${roomCode}/members/${targetUserId}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function patchMember(roomCode: string, targetUserId: string, role: string): Promise<{ userId: string; role: string }> {
  return apiFetch(`/rooms/${roomCode}/members/${targetUserId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(roomCode: string, targetUserId: string): Promise<{ message: string }> {
  return apiFetch(`/rooms/${roomCode}/members/${targetUserId}`, { method: "DELETE" });
}

export async function getRoomFiles(roomCode: string): Promise<FileEntry[]> {
  return apiFetch<FileEntry[]>(`/rooms/${roomCode}/files`);
}

export async function createFile(roomId: string, path: string, language?: string): Promise<FileEntry> {
  return apiFetch<FileEntry>("/files", {
    method: "POST",
    body: JSON.stringify({ roomId, path, language }),
  });
}

export async function renameFile(fileId: string, newPath: string, newLanguage?: string): Promise<FileEntry> {
  return apiFetch<FileEntry>(`/files/${fileId}`, {
    method: "PATCH",
    body: JSON.stringify({ path: newPath, language: newLanguage }),
  });
}

export async function updateFileContent(fileId: string, content: string): Promise<FileEntry> {
  return apiFetch<FileEntry>(`/files/${fileId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

export async function deleteFile(fileId: string): Promise<{ message: string }> {
  return apiFetch(`/files/${fileId}`, { method: "DELETE" });
}

export async function getFileContent(fileId: string): Promise<FileEntry & { content: string }> {
  return apiFetch<FileEntry & { content: string }>(`/files/${fileId}`);
}

export interface SavedCode {
  id: string;
  roomCode: string;
  fileName: string;
  language: string;
  code: string;
  savedAt: string;
  updatedAt: string;
}

export async function saveExplicitCode(roomCode: string, fileName: string, language: string, code: string): Promise<SavedCode> {
  return apiFetch<SavedCode>("/saved-codes", {
    method: "POST",
    body: JSON.stringify({ roomCode, fileName, language, code }),
  });
}

export async function getSavedCodes(): Promise<SavedCode[]> {
  return apiFetch<SavedCode[]>("/saved-codes");
}

export async function getSavedCode(id: string): Promise<SavedCode> {
  return apiFetch<SavedCode>(`/saved-codes/${id}`);
}

export async function deleteSavedCode(id: string): Promise<{ message: string }> {
  return apiFetch(`/saved-codes/${id}`, { method: "DELETE" });
}
