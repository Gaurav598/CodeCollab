import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { WebSocket } from 'ws';
// Provide WebSocket polyfill for y-websocket in Node
(global as any).WebSocket = WebSocket;

const BACKEND_URL = 'http://localhost:8080/api/v1';

async function register(username, email, password) {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    return res.json();
}

async function login(identifier, password) {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
    });
    return res.json();
}

async function createRoom(token) {
    const res = await fetch(`${BACKEND_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ visibility: 'public' })
    });
    return res.json();
}

async function createProject(roomId, token) {
    const res = await fetch(`${BACKEND_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomCode: roomId, name: 'Perf Project' })
    });
    return res.json();
}

async function createFile(projectId, token) {
    const res = await fetch(`${BACKEND_URL}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ projectId, path: 'perf.js' })
    });
    return res.json();
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runPerformanceTest(userCount: number, roomId: string, fileId: string) {
    console.log(`\n--- Starting Performance Test for ${userCount} users ---`);
    const clients: WebsocketProvider[] = [];
    const docs: Y.Doc[] = [];

    // Create users
    for (let i = 0; i < userCount; i++) {
        const user = await register(`perf_${userCount}_${i}_${Date.now()}`, `perf_${userCount}_${i}_${Date.now()}@test.com`, 'password');
        const auth = await login(user.user.username, 'password');
        
        const doc = new Y.Doc();
        docs.push(doc);
        
        const port = i % 2 === 0 ? 1234 : 1235; // Alternate instances
        const ws = new WebsocketProvider(`ws://localhost:${port}`, `sync?roomId=${roomId}&fileId=${fileId}&token=${auth.accessToken}`, doc);
        clients.push(ws);
        
        // Initial state
        ws.awareness.setLocalStateField('user', { id: user.user.id, name: user.user.username });
    }

    await delay(2000); // Wait for connections
    
    // Measure Propagation Latency
    const start = Date.now();
    
    // User 0 updates awareness
    clients[0].awareness.setLocalStateField('cursor', { line: 10, ch: 20 });
    
    // Wait until ALL other clients see User 0's update
    const userId0 = clients[0].awareness.getLocalState().user.id;
    let allReceived = false;
    
    while (!allReceived && Date.now() - start < 5000) {
        allReceived = true;
        for (let i = 1; i < userCount; i++) {
            const states = Array.from(clients[i].awareness.getStates().values());
            const remote0 = states.find((s: any) => s.user?.id === userId0);
            if (!remote0 || remote0.cursor?.line !== 10) {
                allReceived = false;
                break;
            }
        }
        if (!allReceived) await delay(50);
    }
    
    const latency = Date.now() - start;
    
    if (allReceived) {
        console.log(`✅ [${userCount} Users] Propagation Latency: ${latency}ms`);
    } else {
        console.error(`❌ [${userCount} Users] Sync timed out!`);
    }
    
    // Memory and cleanup
    const memUsage = process.memoryUsage();
    console.log(`[${userCount} Users] Memory (Heap Used): ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    for (const ws of clients) {
        ws.disconnect();
    }
    await delay(1000);
}

async function run() {
    console.log("=== PERFORMANCE VERIFICATION ===");
    
    // Setup domain
    const admin = await register(`admin_${Date.now()}`, `admin_${Date.now()}@test.com`, 'password');
    const authAdmin = await login(admin.user.username, 'password');
    
    const room = await createRoom(authAdmin.accessToken);
    const project = await createProject(room.id, authAdmin.accessToken);
    const file = await createFile(project.id, authAdmin.accessToken);
    
    await runPerformanceTest(2, room.id, file.id);
    await runPerformanceTest(5, room.id, file.id);
    await runPerformanceTest(10, room.id, file.id);
    
    console.log("=== COMPLETED ===");
    process.exit(0);
}

run().catch(console.error);
