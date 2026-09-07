// Call /join on page load
async function joinGame() {
  const res = await fetch('/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await res.json();
  token = data.token;
  coords = data.coords;

  console.log("Joined game with token:", token);
  console.log("Initial coords:", coords);
}

// Send updated coords every 100ms
async function updateLoop() {
  if (!token) return; // Not joined yet

  try {
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, coords })
    });

    const data = await res.json();
    console.log("All players:", data.players);

  } catch (err) {
    console.error("Update failed:", err);
  }
}
