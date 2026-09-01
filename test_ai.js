// Native fetch in Node 20
async function testAI() {
  try {
    const res = await fetch('http://localhost:3000/api/generate-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: "Test User",
        context: "EMPLOYEE",
        rawPayload: { disc: { D: 40, I: 20, S: 10, C: 30 } },
        conflictFlags: []
      })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", data);
  } catch(e) {
    console.error("Error:", e);
  }
}
testAI();
