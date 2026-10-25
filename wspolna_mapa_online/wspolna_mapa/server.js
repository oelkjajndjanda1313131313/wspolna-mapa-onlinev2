import express from "express";
import http from "http";
import { Server } from "socket.io";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Pokoje i pozycje są przechowywane tylko w pamięci procesu.
// Nie zapisujemy współrzędnych do plików ani bazy danych.
const rooms = new Map();

app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_req, res) => res.json({ ok: true }));

io.on("connection", socket => {
  socket.on("create-room", ({ displayName }, callback) => {
    const roomId = crypto.randomBytes(5).toString("hex");
    const safeName = cleanName(displayName);
    rooms.set(roomId, { members: new Map() });
    joinRoom(socket, roomId, safeName);
    callback?.({ ok: true, roomId });
  });

  socket.on("join-room", ({ roomId, displayName }, callback) => {
    const id = String(roomId || "").trim().toLowerCase();
    if (!rooms.has(id)) return callback?.({ ok: false, error: "Nie znaleziono pokoju. Sprawdź kod zaproszenia." });
    const room = rooms.get(id);
    if (room.members.size >= 2 && !room.members.has(socket.id)) {
      return callback?.({ ok: false, error: "W tym pokoju są już dwie osoby." });
    }
    joinRoom(socket, id, cleanName(displayName));
    callback?.({ ok: true, roomId: id });
  });

  socket.on("location-update", ({ latitude, longitude, accuracy }) => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return;
    const room = rooms.get(roomId);
    const member = room.members.get(socket.id);
    if (!member) return;
    member.location = {
      latitude, longitude,
      accuracy: Number.isFinite(accuracy) ? Math.max(0, accuracy) : null,
      updatedAt: Date.now()
    };
    broadcastMembers(roomId);
  });

  socket.on("stop-sharing", () => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    const member = room.members.get(socket.id);
    if (member) member.location = null;
    broadcastMembers(roomId);
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    room.members.delete(socket.id);
    if (room.members.size === 0) rooms.delete(roomId);
    else broadcastMembers(roomId);
  });
});

function cleanName(value) {
  const name = String(value || "").trim().replace(/[<>]/g, "").slice(0, 24);
  return name || "Użytkownik";
}
function joinRoom(socket, roomId, displayName) {
  // Jeden socket należy tylko do jednego pokoju.
  const previous = socket.data.roomId;
  if (previous && rooms.has(previous)) {
    rooms.get(previous).members.delete(socket.id);
    broadcastMembers(previous);
  }
  socket.join(roomId);
  socket.data.roomId = roomId;
  const room = rooms.get(roomId);
  room.members.set(socket.id, { id: socket.id, name: displayName, location: null });
  broadcastMembers(roomId);
}
function broadcastMembers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit("members", [...room.members.values()].map(m => ({
    id: m.id, name: m.name, location: m.location
  })));
}
server.listen(PORT, () => console.log(`Wspólna Mapa działa: http://localhost:${PORT}`));
