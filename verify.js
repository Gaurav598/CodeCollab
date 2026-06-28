const http = require('http');

async function run() {
  const username = "testuser" + Date.now();
  // 1. Register a user
  await fetch("http://localhost:8080/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username, email: username+"@example.com", password: "password" })
  });

  // Login
  const loginRes = await fetch("http://localhost:8080/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: username, password: "password" })
  });
  const token = (await loginRes.json()).accessToken;

  // Create room
  const roomRes = await fetch("http://localhost:8080/api/v1/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ visibility: "public" })
  });
  const roomCode = (await roomRes.json()).roomCode;

  // Create project
  const projRes = await fetch("http://localhost:8080/api/v1/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ roomCode, name: "Test Project" })
  });
  const projId = (await projRes.json()).id;

  // Create file
  const fileRes = await fetch("http://localhost:8080/api/v1/files", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ projectId: projId, path: "main.txt", language: "plaintext" })
  });
  const fileId = (await fileRes.json()).id;
  
  // 3. Save Code
  const saveContent = "hello world " + Date.now();
  console.log("Saving content:", saveContent);
  const patchRes = await fetch(`http://localhost:8080/api/v1/files/${fileId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content: saveContent })
  });
  console.log("Save status:", patchRes.status);
  
  // 4. Immediately query GET
  const getRes1 = await fetch(`http://localhost:8080/api/v1/files/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data1 = await getRes1.json();
  console.log("Immediate GET content:", data1.content);
  
  // 5. Wait 10 seconds
  console.log("Waiting 10 seconds...");
  await new Promise(r => setTimeout(r, 10000));
  
  // 6. Query GET again
  const getRes2 = await fetch(`http://localhost:8080/api/v1/files/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data2 = await getRes2.json();
  console.log("Delayed GET content:", data2.content);
  
  if (data1.content !== data2.content) {
    console.log("BUG IS STILL HAPPENING! Content was overwritten.");
  } else {
    console.log("FIXED! Content stayed the same.");
  }
}
run();
