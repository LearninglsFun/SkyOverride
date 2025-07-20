const input = document.getElementById('cmdInput');
const output = document.getElementById('output');
const videoFeed = document.getElementById('videoFeed');
const terminal = document.getElementById('terminal');
const loadingScreen = document.getElementById('loadingScreen');
const liveContainer = document.getElementById('liveContainer');
const mapDiv = document.getElementById('map');


let authenticated = false;
let currentDrone = null;
let isBusy = false;
let feedActive = false;
let map, droneMarker;
let commandHistory = [];
let historyIndex = -1;
let droneMoveInterval;


document.addEventListener('DOMContentLoaded', () => {
  const startOverlay = document.getElementById('startOverlay');
  // Show the overlay only after DOM is ready
  startOverlay.style.display = 'flex';

  // Start the flicker effect
  let flickerInterval = setInterval(() => {
    startOverlay.style.opacity = (Math.random() * 0.3 + 0.7).toFixed(2);
  }, 100);

  // The rest of your code that initializes event listeners etc.
  // For example, your click handler to begin boot sequence
  startOverlay.addEventListener('click', beginBootSequence);
  document.addEventListener('keydown', beginBootSequence, { once: true });
});

function print(msg) {
  const line = document.createElement('div');
  output.appendChild(line);
  let i = 0;
  const interval = setInterval(() => {
    line.innerHTML += msg.charAt(i);
    i++;
    if (i >= msg.length) {
      clearInterval(interval);
    }
    output.scrollTop = output.scrollHeight;
  }, 10 + Math.random() * 15);
}


function setBusy(busy) {
  isBusy = busy;
  if (busy) {
    input.classList.add('busy');
  } else {
    input.classList.remove('busy');
    input.focus();
  }
}

window.addEventListener('keydown', () => {
  if (document.activeElement !== input) input.focus();
});

// Your existing code, with a key fix:  
// When calling showLiveContainers(), ensure map and videoFeed are visible.

function showLiveContainers() {
  // Show main live container
  liveContainer.style.display = 'flex';
  liveContainer.style.visibility = 'visible';
  liveContainer.style.opacity = '1';

  // Show map
  mapDiv.style.display = 'flex'; // match your layout
  mapDiv.style.visibility = 'visible';
  mapDiv.style.opacity = '1';

  // Show video feed
  videoFeed.style.display = 'flex';
  videoFeed.style.visibility = 'visible';
  videoFeed.style.opacity = '1';

  // Invalidate map size after container becomes visible
  if (map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 300); // delay to allow layout changes to apply
  }
}


function bootSequence() {
  const bootMessages = [
    "[SYSCHK] Initializing tactical terminal...",
    "[COMMS] Establishing uplink with interceptor grid...",
    "[SIGINT] Drone signal triangulation matrix online.",
    "[NAVSYS] Terrain overlay systems initialized.",
    "[AUTH] Awaiting command authorization.",
    "[AUTH] TYPE 'override' TO GAIN ACCESS."
  ];

  terminal.style.display = 'flex';
  let delay = 0;

  bootMessages.forEach((msg, i) => {
    setTimeout(() => {
      print(msg);
      if (i === bootMessages.length - 1) {
  if (input) input.focus();
}
    }, i * 1000);
  });
}

function startTransitionSequence() {
  loadingScreen.style.transition = 'opacity 1.2s ease-in-out';
  loadingScreen.style.opacity = '0';

  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 400);

  setTimeout(() => {
    // Hide loading screen
    loadingScreen.style.display = 'none';
    loadingScreen.style.visibility = 'hidden';

    // Show terminal
    terminal.style.display = 'flex';
    terminal.style.visibility = 'visible';
    terminal.style.opacity = '1';
    terminal.style.zIndex = '9997';

    // Show container, map and video feed with fade-in
    liveContainer.style.display = 'flex';
    liveContainer.style.visibility = 'visible';
    liveContainer.style.opacity = '1';

    mapDiv.style.visibility = 'visible';
    mapDiv.style.opacity = '1';

    videoFeed.style.visibility = 'visible';
    videoFeed.style.opacity = '1';

    mapDiv.style.display = 'flex';
    videoFeed.style.display = 'flex';

    bootSequence();

    const menu = document.getElementById("mainMenu");
    if (menu) {
      menu.classList.remove('hidden');
      menu.classList.add('fade-in');
    }
  }, 1300);
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
    case 'fasttrack': fastTrack(); break;
    case 'fasthack': fastHack(); break;
    case 'fastdebug': fastDebug(); break;
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
      showLiveContainers(); // <-- show map + feed containers side by side
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

function fastTrack() {
  setBusy(true);
  print("[SIGINT] RAPID SECTOR SCAN INITIATED...");
  setTimeout(() => {
    currentDrone = simulateDrone();
    print(`[ACQ] QUICK UAS LOCK: ${currentDrone.name}`);
    print(`[LOC] GRID: ${currentDrone.mgrs}`);
    print(`[INFO] Model: ${currentDrone.model} | Altitude: ${currentDrone.alt}m | Battery: ${currentDrone.battery}% | Threat Level: ${currentDrone.threat}`);
    showLiveContainers();
    showMap(currentDrone);
    setBusy(false);
    simulateDroneMovement();
  }, 3000);
}

const fakeAIChatter = [
  "[AI] System diagnostic nominal.",
  "[AI] Autonomous protocols engaged.",
  "[AI] Environmental sensors online.",
  "[AI] Target acquisition algorithms active.",
  "[AI] Energy reserves stable.",
  "[AI] Signal interference detected, compensating.",
];

const fakeErrors = [
  "[ERR] Sensor calibration failed.",
  "[WARN] Signal lost briefly.",
  "[ERR] Unauthorized access attempt detected.",
  "[WARN] Drone overheating.",
  "[ERR] Firmware checksum mismatch.",
  "[WARN] Low battery detected.",
];

function randomChatterAndErrors() {
  if (!isBusy && terminal.style.display === 'flex' && Math.random() < 0.6) {
    if (Math.random() < 0.6) {
      print(fakeAIChatter[Math.floor(Math.random() * fakeAIChatter.length)]);
    } else {
      print(fakeErrors[Math.floor(Math.random() * fakeErrors.length)]);
    }
  }
}
setInterval(randomChatterAndErrors, 20000 + Math.random() * 20000);

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
  setTimeout(() => {
    if (!map) {
      map = L.map('map', {
        center: [lat, lon],
        zoom: 8,
        zoomControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    } else {
      map.setView([lat, lon], 8);
    }

    if (droneMarker) {
      droneMarker.setLatLng([lat, lon]);
    } else {
      droneMarker = L.marker([lat, lon]).addTo(map).bindPopup(mgrs);
    }

    // Force resize to fix hidden map rendering issues
    setTimeout(() => map.invalidateSize(), 300);
  }, 100); // Delay until layout fully applies
}


function simulateDroneMovement() {
  if (droneMoveInterval) clearInterval(droneMoveInterval);
  droneMoveInterval = setInterval(() => {
    if (!currentDrone) return;
    currentDrone.lat += (Math.random() - 0.5) * 0.02;
    currentDrone.lon += (Math.random() - 0.5) * 0.02;
    showMap(currentDrone);
  }, 3000);
}

function showFeed() {
  if (!videoFeed || !currentDrone) return;

  const STATIC_MS = 2000;
  const EXPAND_MS = 1800;

  // Add static flicker effect
  videoFeed.innerHTML = `<div class="static"></div>`;
  videoFeed.classList.add('static-effect');

  // Prepare videoFeed for fullscreen expansion
  videoFeed.classList.remove('fullscreen');
  videoFeed.style.transition = `all ${EXPAND_MS}ms ease-in-out`;
  void videoFeed.offsetWidth; // force reflow

  // Expand to fullscreen after static
  setTimeout(() => {
    videoFeed.classList.add('fullscreen');
    videoFeed.classList.remove('static-effect');
  }, STATIC_MS);

  // Inject the Rick Astley video after animation finishes
  setTimeout(() => {
    videoFeed.innerHTML = `
      <iframe
        width="100%" height="100%"
        src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0"
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowfullscreen>
      </iframe>`;
    terminal.style.display = 'none';
  }, STATIC_MS + EXPAND_MS);

  print(`[FEED] STREAMING LIVE VIDEO FROM ${currentDrone.name}`);
}




function fastHack() {
  if (!currentDrone) {
    print("[ERR] No drone locked.");
    return;
  }
  setBusy(true);
  print(`[OPS] QUICK HACK INITIATED ON ${currentDrone.name}...`);
  setTimeout(() => {
    print(`[COMPLETE] ${currentDrone.name} OVERRIDE SUCCESSFUL.`);
    feedActive = true;
    print(`[CTRL] Feed command now available.`);
    setBusy(false);
  }, 4000);
}

function fastDebug() {
  print("[DBG] DEBUG MODE ENGAGED.");
  print("[DBG] AUTH STATUS: " + (authenticated ? "AUTHORIZED" : "UNAUTHORIZED"));
  print("[DBG] DRONE LOCK: " + (currentDrone ? currentDrone.name : "NONE"));
  print("[DBG] FEED ACTIVE: " + feedActive);
  print("[DBG] BUSY: " + isBusy);
}

window.onload = () => {
  // Show loading screen
  loadingScreen.style.display = 'flex';
  loadingScreen.style.visibility = 'visible';
  loadingScreen.style.opacity = '1';
  loadingScreen.style.zIndex = '9998';

  // Make sure everything else is hidden
  terminal.style.display = 'none';
  terminal.style.visibility = 'hidden';
  terminal.style.opacity = '0';
  terminal.style.zIndex = '-1';

  liveContainer.style.display = 'none';
  liveContainer.classList.remove('visible');
  liveContainer.style.visibility = 'hidden';
  liveContainer.style.opacity = '0';
  liveContainer.style.zIndex = '-1';

  mapDiv.style.display = 'none';
  mapDiv.classList.remove('visible');
  videoFeed.style.display = 'none';
  videoFeed.classList.remove('visible');

  // Begin boot transition
  setTimeout(() => {
    startTransitionSequence();
  }, 1500);
};