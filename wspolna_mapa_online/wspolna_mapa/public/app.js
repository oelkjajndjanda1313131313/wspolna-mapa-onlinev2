const socket = io();
const $ = id => document.getElementById(id);
let roomId = null;
let watchId = null;
let myLocation = null;
const markers = new Map();
const latestMembers = new Map();

const map = L.map("map").setView([52.0, 19.2], 6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

socket.on("connect", () => $("connection").textContent = "Połączono");
socket.on("disconnect", () => $("connection").textContent = "Rozłączono");
socket.on("members", members => {
  latestMembers.clear();
  members.forEach(m => latestMembers.set(m.id, m));
  renderMembers(members);
  updateMarkers(members);
});

$("create").onclick = () => {
  socket.emit("create-room", { displayName: $("name").value }, result => {
    if (!result?.ok) return alert("Nie udało się utworzyć pokoju.");
    setRoom(result.roomId);
  });
};
$("join").onclick = () => {
  const code = $("room").value.trim().toLowerCase();
  if (!code) return alert("Wpisz kod pokoju.");
  socket.emit("join-room", { roomId: code, displayName: $("name").value }, result => {
    if (!result?.ok) return alert(result?.error || "Nie udało się dołączyć.");
    setRoom(result.roomId);
  });
};
function setRoom(id) {
  roomId = id;
  $("room").value = id;
  $("roomCode").textContent = id;
  $("roomInfo").classList.remove("hidden");
  $("share").disabled = false;
  $("shareStatus").textContent = "Pokój gotowy. Włącz GPS, gdy chcesz udostępnić pozycję.";
}
$("copy").onclick = async () => {
  const invite = `${location.origin}/?room=${encodeURIComponent(roomId)}`;
  try {
    await navigator.clipboard.writeText(invite);
    $("copy").textContent = "Skopiowano!";
  } catch {
    prompt("Skopiuj link zaproszenia:", invite);
  }
};
const params = new URLSearchParams(location.search);
if (params.get("room")) $("room").value = params.get("room");

$("share").onclick = () => {
  if (!roomId) return alert("Najpierw utwórz pokój lub dołącz.");
  if (!navigator.geolocation) return alert("Ta przeglądarka nie obsługuje geolokalizacji.");
  if (!window.isSecureContext && location.hostname !== "localhost") {
    return alert("GPS wymaga bezpiecznego połączenia HTTPS. Uruchom stronę lokalnie lub wdroż ją przez HTTPS.");
  }
  $("shareStatus").textContent = "Oczekiwanie na zgodę przeglądarki…";
  watchId = navigator.geolocation.watchPosition(position => {
    const c = position.coords;
    myLocation = { latitude: c.latitude, longitude: c.longitude, accuracy: c.accuracy };
    socket.emit("location-update", myLocation);
    $("shareStatus").textContent = `Udostępniasz pozycję (dokładność ok. ${Math.round(c.accuracy)} m).`;
    $("share").disabled = true;
    $("stop").disabled = false;
  }, error => {
    const messages = {
      1: "Nie udzielono zgody na lokalizację.",
      2: "Nie można ustalić lokalizacji urządzenia.",
      3: "Upłynął czas oczekiwania na GPS."
    };
    $("shareStatus").textContent = messages[error.code] || "Błąd lokalizacji.";
    stopSharing(false);
  }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
};
$("stop").onclick = () => stopSharing(true);
function stopSharing(send) {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  myLocation = null;
  if (send && socket.connected) socket.emit("stop-sharing");
  $("share").disabled = !roomId;
  $("stop").disabled = true;
  $("shareStatus").textContent = "Udostępnianie wyłączone.";
}

function renderMembers(members) {
  const root = $("members");
  root.innerHTML = "";
  if (!members.length) {
    root.innerHTML = '<p class="muted">Brak osób w pokoju.</p>';
    return;
  }
  members.forEach(member => {
    const row = document.createElement("div");
    row.className = "member";
    const dot = document.createElement("span");
    dot.className = "dot" + (member.location ? " active" : "");
    const main = document.createElement("div");
    main.className = "member-main";
    const name = document.createElement("div");
    name.className = "member-name";
    name.textContent = member.name + (member.id === socket.id ? " (Ty)" : "");
    const state = document.createElement("div");
    state.className = "member-state";
    state.textContent = member.location ? "Udostępnia lokalizację" : "Nie udostępnia lokalizacji";
    main.append(name, state);
    row.append(dot, main);
    root.append(row);
  });
}
function updateMarkers(members) {
  const present = new Set();
  members.forEach(member => {
    if (!member.location) {
      if (markers.has(member.id)) {
        map.removeLayer(markers.get(member.id));
        markers.delete(member.id);
      }
      return;
    }
    present.add(member.id);
    const { latitude, longitude } = member.location;
    if (!markers.has(member.id)) {
      const marker = L.marker([latitude, longitude]).addTo(map);
      markers.set(member.id, marker);
    }
    const marker = markers.get(member.id);
    marker.setLatLng([latitude, longitude]);
    marker.bindPopup(`${escapeHtml(member.name)}${member.id === socket.id ? " (Ty)" : ""}`);
  });
  for (const [id, marker] of markers) {
    if (!present.has(id)) {
      map.removeLayer(marker);
      markers.delete(id);
    }
  }
  if (members.some(m => m.location)) {
    const points = members.filter(m => m.location).map(m => [m.location.latitude, m.location.longitude]);
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
    else map.setView(points[0], 14);
  }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
}
window.addEventListener("beforeunload", () => {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
});
