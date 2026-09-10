// Call /join on page load
async function joinGame() {
  const res = await fetch('/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await res.json();
  token = data.token;
  allPlayerInfo = data.info;
  console.log("All player info: ", allPlayerInfo);

  console.log("Joined game with token:", token);
  console.log("Initial coords:", allPlayerInfo[token].position);
}
