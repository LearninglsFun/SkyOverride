const input = document.getElementById('cmdInput');
const output = document.getElementById('output');
const videoFeed = document.getElementById('videoFeed');
const terminal = document.getElementById('terminal');
const loadingScreen = document.getElementById('loadingScreen');
const glitchSound = document.getElementById('glitchSound');
const hackCompleteSound = document.getElementById('hackCompleteSound');

let authenticated = false;
let currentDrone = null;
let isBusy = false;
let feedActive = false;
let map, droneMarker;
let commandHistory = [];
let historyIndex = -1;
let droneMoveInterval;

function print(msg) {
  const line = document.createElement('div');
  output.appendChild(line);
  let i = 0;
  playGlitchSound();
  const interval = setInterval(() => {
    line.innerHTML += msg.charAt(i);
    i++;
    if (i >= msg.length) {
      clearInterval(interval);
    }
    output.scrollTop = output.scrollHeight;
  }, 10 + Math.random() * 15);
}

function playGlitchSound() {
  if (glitchSound) {
    glitchSound.volume = 0.3;
    glitchSound.currentTime = 0;
    glitchSound.play().catch(() => {});
  }
}

function playHackCompleteSound() {
  if (hackCompleteSound) {
    hackCompleteSound.volume = 0.5;
    hackCompleteSound.currentTime = 0;
    hackCompleteSound.play().catch(() => {});
  }
}

function setBusy(busy) {
  isBusy = busy;
  // Don't disable input — just style it to show it's "busy"
  if (busy) {
    input.classList.add('busy');
  } else {
    input.classList.remove('busy');
    input.focus(); // Auto-refocus once done
  }
}

window.addEventListener('keydown', () => {
  if (document.activeElement !== input) input.focus();
});


function bootSequence() {
  loadingScreen.style.display = 'none';
  terminal.style.display = 'flex';
  const bootMessages = [
    "[SYSCHK] Initializing tactical terminal...",
    "[COMMS] Establishing uplink with interceptor grid...",
    "[SIGINT] Drone signal triangulation matrix online.",
    "[NAVSYS] Terrain overlay systems initialized.",
    "[AUTH] Awaiting command authorization. TYPE 'override' TO GAIN ACCESS."
  ];
  bootMessages.forEach((msg, i) => {
    setTimeout(() => print(msg), i * 1000);
  });
}

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const cmd = input.value.trim().toLowerCase();
    if (cmd === '') return;
    commandHistory.push(cmd);
    historyIndex = commandHistory.length;
    print(`> ${cmd}`);
    input.value = '';
    if (isBusy && cmd !== 'cancel') {
      print("[SYS] ACTIVE OP IN PROGRESS — use `cancel` to abort.");
      return;
    }
    handleCommand(cmd);
  } else if (e.key === 'ArrowUp') {
    if (historyIndex > 0) {
      historyIndex--;
      input.value = commandHistory[historyIndex];
    }
  } else if (e.key === 'ArrowDown') {
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      input.value = commandHistory[historyIndex];
    } else {
      input.value = '';
    }
  }
});

function handleCommand(cmd) {
  if (!authenticated && cmd !== 'override') {
    print("[AUTH] Invalid. Use `override` to access system.");
    return;
  }

  switch(cmd) {
    case 'override':
      if (authenticated) return print("[AUTH] Already in command node.");
      authenticated = true;
      print("[AUTH] ACCESS GRANTED — WELCOME, OPERATIVE.");
      print("Available commands: `track`, `hack`, `feed`, `cancel`, `help`");
      break;
    case 'track':
      if (currentDrone) return print("[WARN] Active drone already locked.");
      startTracking();
      break;
    case 'hack':
      if (!currentDrone) return print("[ERR] No valid drone target locked.");
      startHack();
      break;
     case 'fasttrack': fastTrack(); 
     break;
     case 'fasthack': fastHack(); 
     break;
     case 'fastdebug': fastDebug();  
     break;
    case 'feed':
      if (!currentDrone || !feedActive) {
        print("[ERR] FEED UNAVAILABLE. HACK REQUIRED.");
        return;
      }
      showFeed();
      break;
    case 'help':
      print("COMMANDS:");
      print("  override - Gain system access");
      print("  track    - Lock drone target");
      print("  hack     - Attempt to hack drone");
      print("  feed     - View drone video feed (if hacked)");
      print("  cancel   - Cancel active operation");
      break;
    case 'cancel':
      if (isBusy) {
        cancelOperation();
      } else {
        print("[SYS] No active operation to cancel.");
      }
      break;
    default:
      print(`[ERR] Unknown command: ${cmd}`);
  }
}

function startTracking() {
  setBusy(true);
  print("[SIGINT] SCANNING EASTERN SECTOR...");

  let progress = 0;
  const scanInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 8) + 5;
    if (progress >= 100) {
      clearInterval(scanInterval);
      currentDrone = simulateDrone();
      print(`[ACQ] UAS SIGNATURE LOCKED: ${currentDrone.name}`);
      print(`[LOC] GRID: ${currentDrone.mgrs}`);
      print(`[INFO] Model: ${currentDrone.model} | Altitude: ${currentDrone.alt}m | Battery: ${currentDrone.battery}% | Threat Level: ${currentDrone.threat}`);
      showMap(currentDrone);
      setBusy(false);
      simulateDroneMovement();
    } else {
      print(`[SCAN] Sector sweep ${progress}% complete...`);
    }
  }, 1000);
}

function startHack() {
  setBusy(true);
  let prog = 0;
  print(`[OPS] INITIATING SIGNAL OVERLAY — TARGET: ${currentDrone.name}`);
  const iv = setInterval(() => {
    const step = Math.floor(Math.random() * 4) + 1;
    prog = Math.min(prog + step, 100);
    print(`[LINK] HACKING ${prog}%`);
    if (prog === 100) {
      clearInterval(iv);
      print(`[COMPLETE] ${currentDrone.name} OVERRIDE SUCCESSFUL.`);
      print(`[SYS] Firmware v3.12 injected. Kill switch disabled.`);
      print(`[SYS] Encryption keys extracted: K3Y-4X9Z-QW7E`);
      print(`[CTRL] Feed command now available.`);
      feedActive = true;
      setBusy(false);
    }
  }, 1500);
}

function simulateDrone() {
  const names = ['RU-921X-BT3', 'UKR-A30Z-C1', 'RU-FTZ9239Z', 'UKR-MK11P-DS', 'RU-Z93K-02L', 'UKR-QP1-2213', 'RU-T73-SKP9'];
  const name = names[Math.floor(Math.random() * names.length)];
  const lat = 47.8 + Math.random();
  const lon = 36.4 + Math.random();
  const mgrs = `37T BT ${1000 + Math.floor(Math.random()*8000)} ${1000 + Math.floor(Math.random()*8000)}`;
  const alt = 120 + Math.floor(Math.random() * 500);
  const battery = 40 + Math.floor(Math.random() * 60);
  const threat = ["LOW", "MEDIUM", "HIGH", "CRITICAL"][Math.floor(Math.random() * 4)];
  const model = ["FPV-X9", "Scout-B", "KamDrone", "Recon-77"][Math.floor(Math.random() * 4)];
  return { name, lat, lon, mgrs, alt, battery, threat, model };
}

function showMap({ lat, lon, mgrs }) {
  if (!map) {
    map = L.map('map').setView([lat, lon], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  }
  if (droneMarker) map.removeLayer(droneMarker);
  droneMarker = L.marker([lat, lon]).addTo(map)
    .bindPopup(`${currentDrone.name}<br>${mgrs}`)
    .openPopup();
  map.panTo([lat, lon]);
}

function simulateDroneMovement() {
  let dx = (Math.random() - 0.5) * 0.01;
  let dy = (Math.random() - 0.5) * 0.01;
  droneMoveInterval = setInterval(() => {
    currentDrone.lat += dx;
    currentDrone.lon += dy;
    const newMgrs = `37T BT ${1000 + Math.floor(Math.random()*8000)} ${1000 + Math.floor(Math.random()*8000)}`;
    currentDrone.mgrs = newMgrs;
    droneMarker.setLatLng([currentDrone.lat, currentDrone.lon]);
    droneMarker.bindPopup(`${currentDrone.name}<br>${newMgrs}`).openPopup();
    map.panTo([currentDrone.lat, currentDrone.lon]);
  }, 4000);
}

function fastTrack() {
  setBusy(true);
  print("[TRACK] Quickly locating nearby drone...");
  
      currentDrone = simulateDrone();
      print(`[ACQ] UAS SIGNATURE LOCKED: ${currentDrone.name}`);
      print(`[LOC] GRID: ${currentDrone.mgrs}`);
      print(`[INFO] Model: ${currentDrone.model} | Altitude: ${currentDrone.alt}m | Battery: ${currentDrone.battery}% | Threat Level: ${currentDrone.threat}`);
      showMap(currentDrone);
      setBusy(false);
      simulateDroneMovement();
    }
  ;


function fastHack() {
  if (!currentDrone) {
    print("[ERR] No drone locked to hack.");
    return;
  }
  setBusy(true);
  print("[HACK] Quickly initiating drone hack...");
  glitchEffect(800, () => {
    print("[HACK] Drone hack complete. FEED AVAILABLE.");
    feedActive = true;
    playHackCompleteSound();
    setBusy(false);
  });
}

function fastDebug() {
  print("[DEBUG] Quick system status check...");
  print(`Authenticated: ${authenticated}`);
  print(`Current Drone: ${currentDrone ? JSON.stringify(currentDrone) : "None"}`);
  print(`Feed Active: ${feedActive}`);
  print(`Busy: ${isBusy}`);
}

function cancelOperation() {
  print("[SYS] Operation aborted by user.");
  setBusy(false);
  glitchEffect(500, () => {}); // small glitch effect on cancel
}

function initMap(lat, lng) {
  map = L.map('map').setView([lat, lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  droneMarker = L.marker([lat, lng]).addTo(map);

  // To fix map rendering bug when container changes visibility
  setTimeout(() => {
    map.invalidateSize();
  }, 300);
}

function glitchEffect(duration = 2000, callback) {
  const terminal = document.getElementById("terminal");
  const glitchSound = document.getElementById("glitchSound");

  // Play the sound only once
  if (glitchSound) {
    glitchSound.volume = 0.2; // Lowered volume
    glitchSound.currentTime = 0;
    glitchSound.play().catch(() => {});
  }

  let glitchCount = 0;
  const maxGlitches = 10;

  const glitchInterval = setInterval(() => {
    if (glitchCount % 2 === 0) {
      terminal.style.filter = `blur(${Math.random() * 1.5}px)`;
      terminal.style.transform = `translate(${Math.random() * 3}px, ${Math.random() * 3}px)`;
    } else {
      terminal.style.filter = 'none';
      terminal.style.transform = 'none';
    }

    glitchCount++;
    if (glitchCount > maxGlitches) {
      clearInterval(glitchInterval);
      terminal.style.filter = 'none';
      terminal.style.transform = 'none';
      if (callback) callback();
    }
  }, duration / maxGlitches);
}

window.addEventListener('DOMContentLoaded', () => {
  glitchSound.load();
  hackCompleteSound.load();
  animatedLoadingText();
  setTimeout(bootSequence, 3000);
});

function showFeed() {
  if (!feedActive) {
    print("[ERR] Feed not unlocked.");
    return;
  }
  print("[FEED] Attempting real-time uplink... Signal integrity low.");
  setBusy(true);

  // Show videoFeed side-by-side with map
  videoFeed.classList.add('visible');
  videoFeed.classList.remove('fullscreen');

  // Reset styles for side-by-side mode (not fullscreen)
  Object.assign(videoFeed.style, {
    position: 'relative',  // normal flow next to map
    top: '',
    left: '',
    width: '50%',
    height: '30vh',
    backgroundColor: 'black',
    zIndex: '1',
    overflow: 'hidden',
  });

  // Show static canvas inside videoFeed
  videoFeed.innerHTML = `<canvas id="fakeStatic" style="width:100%; height:100%; display:block;"></canvas>`;

  const canvas = document.getElementById('fakeStatic');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = videoFeed.clientWidth;
    canvas.height = videoFeed.clientHeight;
  }
  resizeCanvas();

  function drawStatic() {
    resizeCanvas();
    const img = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  const staticInterval = setInterval(drawStatic, 100);

  // After static duration, show YouTube video and switch to fullscreen
  setTimeout(() => {
    clearInterval(staticInterval);
    print("[FEED] Signal recovered — establishing real-time video uplink...");

    setTimeout(() => {
      // Switch videoFeed to fullscreen overlay
      videoFeed.classList.add('fullscreen');
      Object.assign(videoFeed.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'black',
        zIndex: '9999',
        overflow: 'hidden',
      });

      // Replace static canvas with YouTube iframe
      videoFeed.innerHTML = `
        <iframe width="100%" height="100%" 
          src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&showinfo=0&rel=0" 
          frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
        </iframe>
        <p style="
          position: absolute; 
          bottom: 10px; 
          width: 100%; 
          text-align: center; 
          color: #0f0; 
          font-family: monospace; 
          user-select: none;">
          [CTRL] Drone interface initialized.
        </p>
      `;
      setBusy(false);
    }, 3000);
  }, 4000);
}

function animatedLoadingText() {
  const loadingText = document.getElementById('loadingText');
  const base = "Initializing secure terminal";
  let dotCount = 0;
  setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    loadingText.textContent = base + ".".repeat(dotCount);
  }, 600);
}

