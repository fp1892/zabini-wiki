console.log("WIKI.JS VERSION", "v1");

// Firebase CDN (GitHub Pages kompatibel)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/** >>> HIER DEINE firebaseConfig EINTRAGEN (gleich wie in mvp app) <<< */
const firebaseConfig = {
  apiKey: "AIzaSyAjWpYMV0xKUVqD2MdhmHdsv-CONgZ8iDM",
  authDomain: "zabini-mvp.firebaseapp.com",
  projectId: "zabini-mvp",
  storageBucket: "zabini-mvp.firebasestorage.app",
  messagingSenderId: "757946103220",
  appId: "1:757946103220:web:d56c1371db8c84aac7eee1"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

const securityRef = doc(db, "config", "security");

const overlay = document.getElementById("loginOverlay");
const form = document.getElementById("loginForm");
const pwd = document.getElementById("passwordInput");
const statusEl = document.getElementById("loginStatus");
const protectedRoot = document.getElementById("protectedRoot");

function setStatus(msg){ statusEl.textContent = msg; }

async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function checkPasswordGate(plain) {
  const snap = await getDoc(securityRef);
  if (!snap.exists()) throw new Error("Firestore: config/security fehlt.");

  const sec = snap.data() || {};
  const hasHash = typeof sec.passwordHash === "string" && sec.passwordHash.length > 0;
  const hasPlain = typeof sec.password === "string" && sec.password.length > 0;

  if (!hasHash && !hasPlain) {
    throw new Error("config/security braucht passwordHash (empfohlen) oder password.");
  }

  if (hasHash) {
    const inputHash = await sha256Hex(plain);
    return inputHash === sec.passwordHash;
  }
  return plain === sec.password;
}

function unlock(){
  overlay.style.display = "none";
  protectedRoot.style.display = "block";
}

setStatus("Verbinde…");
await signInAnonymously(auth);
setStatus("Bitte Passwort eingeben.");

// Optional: Session merken (nur Browser)
const cached = sessionStorage.getItem("wikiUnlocked");
if (cached === "1") {
  unlock();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("Prüfe Passwort…");

  try{
    const ok = await checkPasswordGate(pwd.value);
    if(!ok){
      setStatus("❌ Falsches Passwort.");
      return;
    }
    sessionStorage.setItem("wikiUnlocked", "1");
    setStatus("✅ OK.");
    unlock();
  }catch(err){
    console.error(err);
    setStatus("⚠️ " + (err?.message || "Fehler"));
  }
});