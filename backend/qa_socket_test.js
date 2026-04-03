const { io } = require("socket.io-client");
const fetch = require("node-fetch");

const SOCKET_URL = "http://localhost:5006";
const API_URL = "http://localhost:5006/api/v1";

async function testSocket() {
  console.log("--- STARTING SOCKET.IO VERIFICATION ---");
  
  const socket = io(SOCKET_URL, {
    transports: ["websocket"]
  });

  socket.on("connect", () => {
    console.log("✅ Connected to Socket.io server:", socket.id);
    
    // Join a facility room (using the ID from previous test)
    const facilityId = "ba547b84-b97f-40ee-8bbe-43088ff93336";
    socket.emit("join_facility", facilityId);
    console.log(`📡 Joined room: facility_${facilityId}`);
  });

  socket.on("slot_updated", (data) => {
    console.log("🔥 RECEIVED REAL-TIME UPDATE:", data);
    if (data.facility_id === "ba547b84-b97f-40ee-8bbe-43088ff93336") {
      console.log("✅ Socket.io Verification PASSED");
      process.exit(0);
    }
  });

  socket.on("connect_error", (err) => {
    console.log("❌ Connection Error:", err.message);
    process.exit(1);
  });

  // Timeout after 30 seconds
  setTimeout(() => {
    console.log("❌ Socket.io Verification TIMED OUT");
    process.exit(1);
  }, 30000);

  console.log("⏳ Waiting for events... (You should trigger a booking now)");
}

testSocket();
