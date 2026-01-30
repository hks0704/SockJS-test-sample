import './style.css'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

const BASE_URL = "http://localhost:8080";
const STOMP_ENDPOINT = `${BASE_URL}/ws/socket/connect`;

let stompClient = null;

const log = (msg) => {
  const logBox = document.getElementById("log");
  logBox.textContent += msg + "\n";
  logBox.scrollTop = logBox.scrollHeight;
};

// 소켓 연결 전 SEND 버튼 비활성화
document.getElementById("sendBtn").disabled = true;

/* =====================
   로그인 / 로그아웃
===================== */

document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    log(res.ok ? "✅ LOGIN SUCCESS" : "❌ LOGIN FAIL");
  } catch {
    log("❌ LOGIN ERROR");
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch(`${BASE_URL}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
  log("🔓 LOGOUT");
});

/* =====================
   STOMP
===================== */

document.getElementById("connectBtn").addEventListener("click", () => {
  stompClient = new Client({
    webSocketFactory: () => new SockJS(STOMP_ENDPOINT),
    reconnectDelay: 5000,
    debug: (msg) => console.log(msg),

    onConnect: (frame) => {
      log("✅ STOMP CONNECTED");
      document.getElementById("sendBtn").disabled = false;

      stompClient.subscribe("/ws/sub/test", (msg) => {
        log("📩 RECEIVE: " + msg.body);
      });
    },

    onStompError: (frame) => {
      log("❌ STOMP ERROR: " + frame.body);
    }
  });

  stompClient.activate();
});

document.getElementById("disconnectBtn").addEventListener("click", () => {
  if (stompClient) {
    stompClient.deactivate();
    log("🔌 DISCONNECTED");
    document.getElementById("sendBtn").disabled = true;
  }
});

document.getElementById("sendBtn").addEventListener("click", () => {
  if (!stompClient || !stompClient.connected) {
    log("⚠ STOMP NOT CONNECTED YET");
    return;
  }

  const msg = document.getElementById("messageInput").value;

  stompClient.publish({
    destination: "/ws/pub/test",
    body: msg
  });

  log("📤 SEND: " + msg);
});
