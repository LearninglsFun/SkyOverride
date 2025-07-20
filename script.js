const input = document.getElementById('cmdInput');
const output = document.getElementById('output');
const videoFeed = document.getElementById('videoFeed');
const terminal = document.getElementById('terminal');
const loadingScreen = document.getElementById('loadingScreen');

let authenticated = false;
let currentDrone = null;
let isBusy = false;
let feedActive = false;
let map, droneMarker;
let commandHistory = [];
let historyIndex = -1;
let droneMoveInterval;

function print(msg) {
  output.innerHTML += `<br />${msg}`;
  output.scrollTop = output.scrollHeight;
}

function setBusy(busy) {
  isBusy = busy;
  input.disabled = busy;
}

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
    case 'feed':
      if (!currentDrone || !feedActive) {
        print("[ERR] FEED UNAVAILABLE. HACK REQUIRED.");
        return;
      }
      showFeed();
      break;
    case 'help':
      print("COMMANDS:\n - override\n - track\n - hack\n - feed\n - cancel");
      break;
    case 'cancel':
      if (isBusy) {
        setBusy(false);
        clearInterval(droneMoveInterval);
        print("[SYS] OPERATION TERMINATED.");
      } else {
        print("[SYS] No active processes.");
      }
      break;
    default:
      print("[ERR] Unrecognized command.");
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

function showFeed() {
  print("[FEED] Attempting real-time uplink... Signal integrity low.");
  setBusy(true);
  videoFeed.innerHTML = `<canvas id="fakeStatic" style="width:100%;height:100%"></canvas>`;
  videoFeed.style.display = 'flex';

  const canvas = document.getElementById('fakeStatic');
  const ctx = canvas.getContext('2d');

  function drawStatic() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const img = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i+1] = img.data[i+2] = v;
      img.data[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  const staticInterval = setInterval(drawStatic, 100);

  setTimeout(() => {
    clearInterval(staticInterval);
    print("[FEED] Signal recovered — establishing real-time video uplink...");
    setTimeout(() => {
      videoFeed.innerHTML = `
        <iframe width="100%" height="100%" 
          src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
          frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
        </iframe>
        <p style="margin-top:5px;">[CTRL] Drone interface initialized.</p>
      `;
      setBusy(false);
    }, 3000);
  }, 4000);
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

// Run boot sequence after fake loading
setTimeout(bootSequence, 3000);
