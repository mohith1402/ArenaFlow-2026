// ArenaFlow 2026 Coordinator Script
import './style.css';
import { MapRenderer } from './mapRenderer';
import { SimulationEngine } from './simulationEngine';
import { SustainabilityEngine } from './sustainability';
import { aiAssistant } from './aiAssistant';
import { stadiumData } from './stadiumData';
import { runDiagnostics } from './tests';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Engines
  const mapRenderer = new MapRenderer('stadiumSvg', 'mapCanvasContainer');
  const simulationEngine = new SimulationEngine(mapRenderer);
  const sustainability = new SustainabilityEngine();

  // GreenFan Eco Scorecard UI Update Helper
  function updateEcoScorecardUI() {
    const status = sustainability.getStatus();
    const ecoPointsVal = document.getElementById('ecoPointsVal');
    const ecoCo2Val = document.getElementById('ecoCo2Val');
    const ecoRankVal = document.getElementById('ecoRankVal');
    
    if (ecoPointsVal) ecoPointsVal.textContent = status.points;
    if (ecoCo2Val) ecoCo2Val.textContent = `${status.co2Offset} kg`;
    if (ecoRankVal) {
      ecoRankVal.textContent = status.badge.replace(/[🌱🍃🏆🌟]/g, '').trim();
      if (status.points >= 50) {
        ecoRankVal.style.color = 'var(--accent-gold)';
      } else if (status.points >= 30) {
        ecoRankVal.style.color = 'var(--primary)';
      } else if (status.points >= 15) {
        ecoRankVal.style.color = 'var(--secondary)';
      } else {
        ecoRankVal.style.color = 'var(--text-muted)';
      }
    }
  }

  function checkEcoTransitRewards(nodeId) {
    if (nodeId === 'Gate A') {
      sustainability.logTask("transit_train_ebike", 15, 1.2);
    } else if (nodeId === 'Gate B') {
      sustainability.logTask("transit_electric_shuttle", 10, 0.8);
    } else if (nodeId === 'Gate C') {
      sustainability.logTask("transit_express_bus", 12, 1.0);
    } else if (nodeId === 'Eco Hydration Oasis') {
      sustainability.logTask("hydration_oasis", 10, 0.6);
    }
    updateEcoScorecardUI();
  }

  // Initialize Eco Scorecard UI Values
  updateEcoScorecardUI();

  // Render Initial Map Layout
  mapRenderer.render();

  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 1. Premium Theme Mode Toggle (Light / Dark Mode Toggle)
  const btnToggleTheme = document.getElementById('btnToggleTheme');
  
  function updateThemeUI() {
    const isLight = document.body.classList.contains('light-mode');
    const icon = btnToggleTheme.querySelector('i') || btnToggleTheme.querySelector('svg');
    if (icon) {
      if (isLight) {
        icon.setAttribute('data-lucide', 'moon');
        btnToggleTheme.setAttribute('title', 'Switch to Dark Mode');
      } else {
        icon.setAttribute('data-lucide', 'sun');
        btnToggleTheme.setAttribute('title', 'Switch to Light Mode');
      }
    }
    if (window.lucide) window.lucide.createIcons();
    
    // Dynamically update map rendering sections & nodes
    if (mapRenderer) {
      mapRenderer.setLayer(mapRenderer.activeLayer);
      // Redraw compass rose so it updates colors
      const compass = document.querySelector('.compass-rose');
      if (compass) compass.remove();
      mapRenderer.drawCompassRose(70, 70);
    }
  }

  btnToggleTheme.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const currentMode = document.body.classList.contains('light-mode') ? 'light' : 'dark';
    localStorage.setItem('arenaflow_theme_mode', currentMode);
    updateThemeUI();
  });

  // Restore saved theme mode on startup
  const savedMode = localStorage.getItem('arenaflow_theme_mode') || 'dark';
  if (savedMode === 'light') {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
  updateThemeUI();

  // 2. State & Variables
  let currentLanguage = 'en';

  // Security: HTML sanitizer to protect against XSS injection
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  let isEvacuationMode = false;
  
  // Volunteer staff headcounts (mutable state)
  const gateStaff = {
    'Gate A': 8,
    'Gate B': 12,
    'Gate C': 10,
    'Gate D': 6
  };

  // Selected concession food order cart item
  let selectedFoodItem = null;
  let orderTimerInterval = null;

  // Helper to close all custom select dropdown menus
  function closeAllCustomDropdowns() {
    const dropdowns = [
      { options: document.getElementById('customConcessionOptions'), wrapper: document.getElementById('customConcessionSelectWrapper') },
      { options: document.getElementById('customLanguageOptions'), wrapper: document.getElementById('customLanguageSelectWrapper') },
      { options: document.getElementById('customSectorOptions'), wrapper: document.getElementById('customSectorSelectWrapper') },
      { options: document.getElementById('customBroadcastLangOptions'), wrapper: document.getElementById('customBroadcastLangSelectWrapper') }
    ];
    dropdowns.forEach(d => {
      if (d.options) d.options.classList.add('hidden');
      if (d.wrapper) d.wrapper.classList.remove('open');
    });
  }

  // Unified outside click listener to close all custom dropdowns
  document.addEventListener('click', () => {
    closeAllCustomDropdowns();
  });

  // Setup Gemini API Connection (Implicitly configured key)
  const defaultApiKey = 'AIzaSyBagkIdVsB0UC-jBPeyWU_PpvrwQlYJBzU';
  aiAssistant.saveApiKey(defaultApiKey);

  // 3. Pill Capsule Portal View Toggle
  const btnToggleFan = document.getElementById('btnToggleFan');
  const btnToggleStaff = document.getElementById('btnToggleStaff');
  const fanPortalContent = document.getElementById('fanPortalContent');
  const staffPortalContent = document.getElementById('staffPortalContent');
  const fanTelemetryContent = document.getElementById('fanTelemetryContent');
  const staffTelemetryContent = document.getElementById('staffTelemetryContent');

  btnToggleFan.addEventListener('click', () => {
    btnToggleFan.classList.add('active');
    btnToggleStaff.classList.remove('active');
    
    // Toggle side panels
    fanPortalContent.classList.remove('hidden');
    staffPortalContent.classList.add('hidden');
    
    // Toggle telemetry panels
    fanTelemetryContent.classList.remove('hidden');
    staffTelemetryContent.classList.add('hidden');

    mapRenderer.clearRoute(); // Clear route overlays
    
    // Update Map titles
    document.getElementById('mapPanelTitle').innerHTML = `<i data-lucide="map" class="icon-accent"></i> Stadium Visualizer`;
    document.getElementById('mapPanelSubtitle').textContent = "Inspect crowd density and concessions routes in real-time.";
    
    // Switch map layer to Queues
    document.getElementById('layerQueues').click();
    if (window.lucide) window.lucide.createIcons();
  });

  btnToggleStaff.addEventListener('click', () => {
    btnToggleStaff.classList.add('active');
    btnToggleFan.classList.remove('active');
    
    // Toggle side panels
    staffPortalContent.classList.remove('hidden');
    fanPortalContent.classList.add('hidden');
    
    // Toggle telemetry panels
    staffTelemetryContent.classList.remove('hidden');
    fanTelemetryContent.classList.add('hidden');

    mapRenderer.clearRoute(); // Clear route overlays
    
    // Update Map titles
    document.getElementById('mapPanelTitle').innerHTML = `<i data-lucide="shield-alert" class="icon-red"></i> Operational Control Heatmap`;
    document.getElementById('mapPanelSubtitle').textContent = "Monitor real-time crowd bottlenecks and coordinate volunteer vectors.";
    
    // Switch map layer to Heatmap
    document.getElementById('layerHeatmap').click();
    if (window.lucide) window.lucide.createIcons();
  });

  // 4. Setup TAB Navigation (Fan Portal)
  const tabFanAssistantBtn = document.getElementById('tabFanAssistantBtn');
  const tabFanTicketBtn = document.getElementById('tabFanTicketBtn');
  const tabFanOrderBtn = document.getElementById('tabFanOrderBtn');

  const fanTabAssistant = document.getElementById('fanTabAssistant');
  const fanTabTicket = document.getElementById('fanTabTicket');
  const fanTabOrder = document.getElementById('fanTabOrder');

  const fanTabBtns = [tabFanAssistantBtn, tabFanTicketBtn, tabFanOrderBtn];
  const fanTabContents = [fanTabAssistant, fanTabTicket, fanTabOrder];

  function switchFanTab(activeBtn, activeContent) {
    fanTabBtns.forEach(btn => btn.classList.remove('active'));
    fanTabContents.forEach(content => content.classList.add('hidden'));
    
    activeBtn.classList.add('active');
    activeContent.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  tabFanAssistantBtn.addEventListener('click', () => switchFanTab(tabFanAssistantBtn, fanTabAssistant));
  tabFanTicketBtn.addEventListener('click', () => switchFanTab(tabFanTicketBtn, fanTabTicket));
  tabFanOrderBtn.addEventListener('click', () => {
    switchFanTab(tabFanOrderBtn, fanTabOrder);
    renderConcessionMenu(); // Initialize default menu load
  });

  // 5. Setup TAB Navigation (Staff Portal)
  const tabStaffSimBtn = document.getElementById('tabStaffSimBtn');
  const tabStaffVolunteersBtn = document.getElementById('tabStaffVolunteersBtn');

  const staffTabSim = document.getElementById('staffTabSim');
  const staffTabVolunteers = document.getElementById('staffTabVolunteers');

  const staffTabBtns = [tabStaffSimBtn, tabStaffVolunteersBtn];
  const staffTabContents = [staffTabSim, staffTabVolunteers];

  function switchStaffTab(activeBtn, activeContent) {
    staffTabBtns.forEach(btn => btn.classList.remove('active'));
    staffTabContents.forEach(content => content.classList.add('hidden'));
    
    activeBtn.classList.add('active');
    activeContent.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  tabStaffSimBtn.addEventListener('click', () => switchStaffTab(tabStaffSimBtn, staffTabSim));
  tabStaffVolunteersBtn.addEventListener('click', () => switchStaffTab(tabStaffVolunteersBtn, staffTabVolunteers));

  // 6. Map Layer Controls (Heatmap vs Queues vs Eco-Score)
  const layerHeatmap = document.getElementById('layerHeatmap');
  const layerQueues = document.getElementById('layerQueues');
  const btnEcoOverlay = document.getElementById('btnEcoOverlay');
  const ecoOverlay = document.getElementById('ecoOverlay');

  layerHeatmap.addEventListener('click', () => {
    layerHeatmap.classList.add('active');
    layerQueues.classList.remove('active');
    btnEcoOverlay.classList.remove('active');
    mapRenderer.setLayer('heatmap');
  });

  layerQueues.addEventListener('click', () => {
    layerQueues.classList.add('active');
    layerHeatmap.classList.remove('active');
    btnEcoOverlay.classList.remove('active');
    mapRenderer.setLayer('queues');
  });

  btnEcoOverlay.addEventListener('click', () => {
    btnEcoOverlay.classList.add('active');
    layerHeatmap.classList.remove('active');
    layerQueues.classList.remove('active');
    mapRenderer.setLayer('ecoscore');
    ecoOverlay.classList.add('active');
  });

  // 7. Pathfinder Overlay Dismiss
  document.getElementById('closeRouteBtn').addEventListener('click', () => {
    mapRenderer.clearRoute();
  });

  // 8. Quick Navigation Filter Buttons
  document.getElementById('btnQuickRestrooms').addEventListener('click', () => {
    const restrooms = Object.values(stadiumData.amenities).filter(a => a.subType === 'restroom');
    restrooms.sort((a, b) => a.waitTime - b.waitTime);
    if (restrooms.length > 0) {
      mapRenderer.handleNodeClick(restrooms[0].id);
      appendSystemMessage(`Optimal Restroom Found: Highlighted ${restrooms[0].name} (Wait: ${restrooms[0].waitTime} mins).`);
    }
  });

  document.getElementById('btnQuickAccessibility').addEventListener('click', () => {
    mapRenderer.handleNodeClick('Gate A');
    appendSystemMessage("Highlighted Gate A: Features specialized low-slope wheelchair access ramps and priority ticket turnstiles.");
  });

  document.getElementById('btnQuickFirstAid').addEventListener('click', () => {
    mapRenderer.handleNodeClick('First Aid Station');
    appendSystemMessage("Highlighted Section 112 Medical Station. Staffed 24/7 with emergency paramedics.");
  });

  document.getElementById('btnQuickTransit').addEventListener('click', () => {
    mapRenderer.handleNodeClick('Train Station');
    appendSystemMessage("Highlighted MetLife Central Rail Station: Transit lines running direct to Secaucus & NYC every 6 minutes.");
  });

  // 9. Locate Seat/Section Search & Autocomplete
  const seatSearchInput = document.getElementById('seatSearchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const searchSuggestions = document.getElementById('searchSuggestions');
  let activeSuggestionIndex = -1;
  let suggestionItems = [];

  // Generate searchable index from stadiumData
  const searchableList = [];
  Object.values(stadiumData.sections).forEach(s => {
    searchableList.push({ id: s.id, name: s.name, type: 'section', keywords: [s.id, s.name, s.category] });
  });
  Object.values(stadiumData.gates).forEach(g => {
    searchableList.push({ id: g.id, name: g.name, type: 'gate', keywords: [g.id, g.name, g.status, 'entrance'] });
  });
  Object.values(stadiumData.concessions).forEach(c => {
    searchableList.push({ 
      id: c.id, 
      name: c.name, 
      type: 'food', 
      keywords: [c.id, c.name, c.category, ...(c.menu || [])] 
    });
  });
  Object.values(stadiumData.transit).forEach(t => {
    searchableList.push({ id: t.id, name: t.name, type: 'transit', keywords: [t.id, t.name, t.status, 'transport'] });
  });
  Object.values(stadiumData.amenities).forEach(a => {
    searchableList.push({ id: a.id, name: a.name, type: 'amenity', keywords: [a.id, a.name, a.subType] });
  });

  function showSuggestions(query) {
    searchSuggestions.innerHTML = '';
    activeSuggestionIndex = -1;
    
    if (!query) {
      searchSuggestions.classList.add('hidden');
      btnClearSearch.style.display = 'none';
      return;
    }
    
    btnClearSearch.style.display = 'flex';
    
    const filtered = searchableList.filter(item => {
      const q = query.toLowerCase();
      return item.keywords.some(k => k && k.toLowerCase().includes(q));
    }).slice(0, 7);
    
    if (filtered.length === 0) {
      searchSuggestions.classList.add('hidden');
      return;
    }
    
    suggestionItems = filtered;
    searchSuggestions.classList.remove('hidden');
    
    filtered.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.dataset.id = item.id;
      
      let typeEmoji = '📍';
      if (item.type === 'section') typeEmoji = '🪑';
      else if (item.type === 'gate') typeEmoji = '🚪';
      else if (item.type === 'food') typeEmoji = '🌮';
      else if (item.type === 'transit') typeEmoji = '🚆';
      else if (item.type === 'amenity') typeEmoji = '🚻';

      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span>${typeEmoji}</span>
          <span>${escapeHTML(item.name)}</span>
        </div>
        <span class="suggestion-meta">${item.type}</span>
      `;
      
      div.addEventListener('click', () => {
        selectSuggestion(item);
      });
      
      searchSuggestions.appendChild(div);
    });
  }

  function selectSuggestion(item) {
    seatSearchInput.value = item.name;
    searchSuggestions.classList.add('hidden');
    mapRenderer.handleNodeClick(item.id);
    
    // Auto route in Fan Mode if route start is set
    const isFanMode = document.getElementById('btnToggleFan').classList.contains('active');
    if (isFanMode) {
      if (mapRenderer.routeStartNodeId && mapRenderer.routeStartNodeId !== item.id) {
        mapRenderer.findAndDrawRoute(mapRenderer.routeStartNodeId, item.id);
      } else if (item.id !== 'Gate A' && (item.type === 'section' || item.type === 'food' || item.type === 'amenity')) {
        mapRenderer.findAndDrawRoute('Gate A', item.id);
      }
    }
  }

  seatSearchInput.addEventListener('input', (e) => {
    showSuggestions(e.target.value.trim());
  });

  seatSearchInput.addEventListener('focus', () => {
    if (seatSearchInput.value.trim()) {
      showSuggestions(seatSearchInput.value.trim());
    }
  });

  btnClearSearch.addEventListener('click', () => {
    seatSearchInput.value = '';
    showSuggestions('');
    seatSearchInput.focus();
  });

  document.addEventListener('click', (e) => {
    if (!searchSuggestions.contains(e.target) && e.target !== seatSearchInput) {
      searchSuggestions.classList.add('hidden');
    }
  });

  seatSearchInput.addEventListener('keydown', (e) => {
    const items = searchSuggestions.querySelectorAll('.suggestion-item');
    if (searchSuggestions.classList.contains('hidden') || items.length === 0) {
      if (e.key === 'Enter') executeSearch();
      return;
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
      updateActiveSuggestion(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
      updateActiveSuggestion(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0) {
        const selectedItem = suggestionItems[activeSuggestionIndex];
        selectSuggestion(selectedItem);
      } else {
        executeSearch();
      }
    } else if (e.key === 'Escape') {
      searchSuggestions.classList.add('hidden');
    }
  });

  function updateActiveSuggestion(items) {
    items.forEach((item, index) => {
      if (index === activeSuggestionIndex) {
        item.classList.add('active-suggestion');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active-suggestion');
      }
    });
  }

  document.getElementById('btnFindSeat').addEventListener('click', executeSearch);

  function executeSearch() {
    const query = seatSearchInput.value.trim().toLowerCase();
    if (!query) return;

    let matchId = null;
    if (stadiumData.sections[query]) {
      matchId = query;
    } else {
      const allSearchable = {
        ...stadiumData.gates,
        ...stadiumData.concessions,
        ...stadiumData.amenities,
        ...stadiumData.transit
      };
      
      const found = Object.values(allSearchable).find(item => 
        item.name.toLowerCase().includes(query) || 
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.menu && item.menu.some(m => m.toLowerCase().includes(query)))
      );
      
      if (found) {
        matchId = found.id;
      }
    }

    if (matchId) {
      mapRenderer.handleNodeClick(matchId);
      const isFanMode = document.getElementById('btnToggleFan').classList.contains('active');
      if (isFanMode) {
        if (mapRenderer.routeStartNodeId && mapRenderer.routeStartNodeId !== matchId) {
          mapRenderer.findAndDrawRoute(mapRenderer.routeStartNodeId, matchId);
        } else if (matchId !== 'Gate A') {
          setTimeout(() => {
            mapRenderer.findAndDrawRoute('Gate A', matchId);
          }, 300);
        }
      }
    } else {
      alert("No matching seat section, gate, concession, or transit station found. Try searching: '102', 'Taco', 'Gate B', or 'Train'.");
    }
  }

  // Map zoom and pan controls wiring
  document.getElementById('btnZoomIn').addEventListener('click', () => mapRenderer.zoomIn());
  document.getElementById('btnZoomOut').addEventListener('click', () => mapRenderer.zoomOut());
  document.getElementById('btnZoomReset').addEventListener('click', () => mapRenderer.resetZoom());
  
  const btnMapFloatClearRoute = document.getElementById('btnMapFloatClearRoute');
  if (btnMapFloatClearRoute) {
    btnMapFloatClearRoute.addEventListener('click', () => {
      mapRenderer.clearRoute();
    });
  }

  // 10. Fan Digital Ticket Scanner Logic
  const btnScanTicket = document.getElementById('btnScanTicket');
  const ticketSeatInput = document.getElementById('ticketSeatInput');
  const ticketPlaceholder = document.getElementById('ticketPlaceholder');
  const ticketPassContainer = document.getElementById('ticketPassContainer');
  const passSection = document.getElementById('passSection');
  const passGate = document.getElementById('passGate');
  const passAccess = document.getElementById('passAccess');
  const passBarcodeText = document.getElementById('passBarcodeText');
  const btnRouteFromTicket = document.getElementById('btnRouteFromTicket');
  const btnClearScan = document.getElementById('btnClearScan');

  let recommendedGate = 'Gate A';

  btnScanTicket.addEventListener('click', () => {
    const seatId = ticketSeatInput.value.trim();
    const parsedSec = parseInt(seatId);
    
    if (isNaN(parsedSec) || parsedSec < 101 || parsedSec > 112) {
      alert("Please enter a valid seat section number between 101 and 112.");
      return;
    }

    if ([101, 102, 112].includes(parsedSec)) {
      recommendedGate = 'Gate A';
    } else if ([103, 104, 105].includes(parsedSec)) {
      recommendedGate = 'Gate B';
    } else if ([106, 107, 108].includes(parsedSec)) {
      recommendedGate = 'Gate C';
    } else {
      recommendedGate = 'Gate D';
    }

    passSection.textContent = `Section ${seatId}`;
    passGate.textContent = recommendedGate;
    if (passBarcodeText) {
      passBarcodeText.textContent = `#FIFA-2026-SEC${seatId}`;
    }
    
    if (stadiumData.gates[recommendedGate].accessibility) {
      passAccess.textContent = "Yes - Ramps & Priority Lanes";
      passAccess.style.color = 'var(--secondary)';
    } else {
      passAccess.textContent = "No - Gate B features Ramps";
      passAccess.style.color = 'var(--accent-gold)';
    }

    if (ticketPlaceholder) ticketPlaceholder.classList.add('hidden');
    ticketPassContainer.classList.remove('hidden');
    appendSystemMessage(`Ticket scanned successfully! Seating: Section ${seatId}. Proximity entrance: ${recommendedGate}.`);
  });

  if (btnClearScan) {
    btnClearScan.addEventListener('click', () => {
      ticketSeatInput.value = '';
      if (ticketPlaceholder) ticketPlaceholder.classList.remove('hidden');
      ticketPassContainer.classList.add('hidden');
      mapRenderer.clearRoute();
    });
  }

  // Simulated Camera Scan click trigger
  const simScannerViewport = document.getElementById('simScannerViewport');
  if (simScannerViewport) {
    simScannerViewport.addEventListener('click', () => {
      const sections = ['101', '102', '104', '105', '108', '110', '112'];
      const randomSec = sections[Math.floor(Math.random() * sections.length)];
      
      ticketSeatInput.value = randomSec;
      
      // Visual feedback scan beep flash
      simScannerViewport.style.background = 'rgba(16, 185, 129, 0.15)';
      simScannerViewport.style.borderColor = 'var(--secondary)';
      
      setTimeout(() => {
        simScannerViewport.style.background = 'rgba(0,0,0,0.3)';
        simScannerViewport.style.borderColor = 'rgba(255,255,255,0.12)';
        btnScanTicket.click();
      }, 400);
    });
  }

  btnRouteFromTicket.addEventListener('click', () => {
    const seatId = ticketSeatInput.value.trim();
    if (!seatId) return;
    
    mapRenderer.clearRoute();
    mapRenderer.handleNodeClick(seatId);
    
    setTimeout(() => {
      mapRenderer.findAndDrawRoute(recommendedGate, seatId);
    }, 200);
  });

  // 11. Fan Concessions Pre-Order Cart & Tracker Logic
  const orderConcessionSelect = document.getElementById('orderConcessionSelect');
  const concessionMenuDisplay = document.getElementById('concessionMenuDisplay');
  const cartPlaceholder = document.getElementById('cartPlaceholder');
  const cartSection = document.getElementById('cartSection');
  const cartItemsList = document.getElementById('cartItemsList');
  const btnPlaceOrder = document.getElementById('btnPlaceOrder');
  const orderProgressContainer = document.getElementById('orderProgressContainer');
  const orderTimer = document.getElementById('orderTimer');
  const btnClearCart = document.getElementById('btnClearCart');
  const btnDismissTracker = document.getElementById('btnDismissTracker');

  let cart = []; // Array of { name, price, qty, concession }

  // Map food item names to standard visual emojis
  function getFoodIcon(name) {
    const lower = name.toLowerCase();
    if (lower.includes('taco')) return '🌮';
    if (lower.includes('burger') || lower.includes('cheeseburger')) return '🍔';
    if (lower.includes('hotdog')) return '🌭';
    if (lower.includes('chips') || lower.includes('nachos') || lower.includes('fries')) return '🍟';
    if (lower.includes('pretzel')) return '🥨';
    if (lower.includes('wrap')) return '🌯';
    if (lower.includes('soda') || lower.includes('water') || lower.includes('bottle')) return '🥤';
    if (lower.includes('ipa') || lower.includes('lager') || lower.includes('beer')) return '🍺';
    return '🍔';
  }

  // Populate concessions dropdown options dynamically from database
  function populateConcessionSelect() {
    if (!orderConcessionSelect) return;
    
    // Clear both select lists
    orderConcessionSelect.innerHTML = '';
    const customOptions = document.getElementById('customConcessionOptions');
    if (customOptions) customOptions.innerHTML = '';
    
    let firstId = null;

    Object.entries(stadiumData.concessions).forEach(([id, c], index) => {
      if (index === 0) firstId = id;
      
      let traits = [];
      if (c.vegan) traits.push('Vegan');
      if (c.halal) traits.push('Halal');
      if (c.glutenFree) traits.push('GF');
      const traitText = traits.length > 0 ? ` (${traits.join('/')})` : '';
      const fullText = `${c.name}${traitText}`;
      
      // Populate native option
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = fullText;
      orderConcessionSelect.appendChild(opt);

      // Populate custom M3 option list
      if (customOptions) {
        const customOpt = document.createElement('div');
        customOpt.className = 'custom-option';
        customOpt.dataset.value = id;
        customOpt.innerHTML = `
          <span>${escapeHTML(c.name)}</span>
          <small style="font-size: 0.65rem; color: var(--primary); font-family: var(--font-mono);">${traits.length > 0 ? traits.join('/') : c.category}</small>
        `;
        
        customOpt.addEventListener('click', (e) => {
          e.stopPropagation();
          selectCustomOption(id, fullText);
        });
        
        customOptions.appendChild(customOpt);
      }
    });

    if (firstId) {
      const firstC = stadiumData.concessions[firstId];
      let traits = [];
      if (firstC.vegan) traits.push('Vegan');
      if (firstC.halal) traits.push('Halal');
      if (firstC.glutenFree) traits.push('GF');
      const traitText = traits.length > 0 ? ` (${traits.join('/')})` : '';
      selectCustomOption(firstId, `${firstC.name}${traitText}`, true);
    }
  }

  function selectCustomOption(value, text, isInit = false) {
    const triggerText = document.getElementById('customConcessionTriggerText');
    const customOptions = document.getElementById('customConcessionOptions');
    const wrapper = document.getElementById('customConcessionSelectWrapper');
    
    orderConcessionSelect.value = value;
    if (triggerText) triggerText.textContent = text;
    
    // Toggle selected state indicator style
    if (customOptions) {
      const opts = customOptions.querySelectorAll('.custom-option');
      opts.forEach(o => {
        if (o.dataset.value === value) o.classList.add('selected');
        else o.classList.remove('selected');
      });
    }

    if (!isInit) {
      if (customOptions) customOptions.classList.add('hidden');
      if (wrapper) wrapper.classList.remove('open');
      renderConcessionMenu();
    }
  }

  // Toggle Custom Dropdown Options display
  const customConcessionTrigger = document.getElementById('customConcessionTrigger');
  const customConcessionOptions = document.getElementById('customConcessionOptions');
  const customConcessionSelectWrapper = document.getElementById('customConcessionSelectWrapper');
  
  if (customConcessionTrigger) {
    customConcessionTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (customConcessionOptions) {
        const isOpen = !customConcessionOptions.classList.contains('hidden');
        closeAllCustomDropdowns();
        if (!isOpen) {
          customConcessionOptions.classList.remove('hidden');
          if (customConcessionSelectWrapper) {
            customConcessionSelectWrapper.classList.add('open');
          }
        }
      }
    });
  }

  populateConcessionSelect();
  orderConcessionSelect.addEventListener('change', renderConcessionMenu);

  function renderConcessionMenu() {
    const concessionName = orderConcessionSelect.value;
    const items = stadiumData.concessions[concessionName]?.menu || [];
    const prices = stadiumData.concessions[concessionName]?.menuPrices || {};
    
    concessionMenuDisplay.innerHTML = '';
    
    items.forEach((itemText) => {
      const parts = itemText.split(' ($');
      const name = parts[0];
      const priceVal = prices[name] || parseFloat(parts[1] ? parts[1].replace(')', '') : '10');
      const priceText = `$${priceVal.toFixed(2)}`;

      const card = document.createElement('div');
      card.className = 'menu-item-card';
      card.innerHTML = `
        <div class="item-details" style="display: flex; align-items: center; gap: 0.65rem;">
          <span class="food-emoji" style="font-size: 1.35rem; line-height: 1;">${getFoodIcon(name)}</span>
          <div>
            <h5 style="margin: 0; font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${escapeHTML(name)}</h5>
            <span style="font-size: 0.68rem; color: var(--text-muted);">Section ${stadiumData.concessions[concessionName].id.replace('Section ', '').split(' - ')[0]} concourse</span>
          </div>
        </div>
        <div class="menu-item-card-right" style="display: flex; align-items: center; gap: 0.5rem;">
          <div class="item-price" style="font-size: 0.85rem; font-weight: 700; color: var(--primary); font-family: var(--font-mono); margin-right: 0.25rem;">${priceText}</div>
          <button class="btn-add-to-cart-chip" data-name="${escapeHTML(name)}" data-price="${priceVal}">Add</button>
        </div>
      `;

      card.querySelector('.btn-add-to-cart-chip').addEventListener('click', (e) => {
        e.stopPropagation();
        const existing = cart.find(i => i.name === name && i.concession === concessionName);
        if (existing) {
          existing.qty++;
        } else {
          cart.push({ name, price: priceVal, qty: 1, concession: concessionName });
        }
        updateCartUI();
      });

      concessionMenuDisplay.appendChild(card);
    });
  }

  function updateCartUI() {
    if (cart.length === 0) {
      if (cartPlaceholder) cartPlaceholder.classList.remove('hidden');
      cartSection.classList.add('hidden');
      return;
    }
    
    if (cartPlaceholder) cartPlaceholder.classList.add('hidden');
    cartSection.classList.remove('hidden');
    cartItemsList.innerHTML = '';
    
    let subtotal = 0;
    
    cart.forEach((item, index) => {
      const itemSubtotal = item.price * item.qty;
      subtotal += itemSubtotal;
      
      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML = `
        <div class="cart-item-name-info">
          <span>${escapeHTML(item.name)}</span>
          <small>${escapeHTML(item.concession)}</small>
        </div>
        <div class="cart-item-actions">
          <button class="cart-qty-btn decrease-qty-btn" data-index="${index}">-</button>
          <span class="cart-qty-val">${item.qty}</span>
          <button class="cart-qty-btn increase-qty-btn" data-index="${index}">+</button>
        </div>
        <div class="cart-item-price">$${itemSubtotal.toFixed(2)}</div>
      `;
      
      row.querySelector('.decrease-qty-btn').addEventListener('click', () => {
        if (item.qty > 1) {
          item.qty--;
        } else {
          cart.splice(index, 1);
        }
        updateCartUI();
      });
      
      row.querySelector('.increase-qty-btn').addEventListener('click', () => {
        item.qty++;
        updateCartUI();
      });
      
      cartItemsList.appendChild(row);
    });
    
    const tax = subtotal * 0.06625;
    const hasDiscount = sustainability.points >= 30;
    const discount = hasDiscount ? (subtotal * 0.15) : 0;
    const discountRow = document.getElementById('cartDiscountRow');
    
    if (hasDiscount) {
      discountRow.classList.remove('hidden');
      document.getElementById('cartDiscount').textContent = `-$${discount.toFixed(2)}`;
    } else {
      discountRow.classList.add('hidden');
    }
    
    const total = subtotal + tax - discount;
    
    document.getElementById('cartSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cartTax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
    
    if (window.lucide) window.lucide.createIcons();
  }

  btnClearCart.addEventListener('click', () => {
    cart = [];
    updateCartUI();
  });

  btnPlaceOrder.addEventListener('click', () => {
    if (cart.length === 0) return;

    if (cartPlaceholder) cartPlaceholder.classList.add('hidden');
    cartSection.classList.add('hidden');
    orderProgressContainer.classList.remove('hidden');
    if (btnDismissTracker) btnDismissTracker.classList.add('hidden');
    
    let maxWaitTime = 5;
    const vendors = new Set(cart.map(i => i.concession));
    vendors.forEach(v => {
      const w = stadiumData.concessions[v]?.waitTime || 5;
      if (w > maxWaitTime) maxWaitTime = w;
    });
    
    let itemsString = cart.map(i => `${i.qty}x ${i.name}`).join(', ');
    
    // Reward Eco-Scorecard points for selecting eco-friendly/sustainable options
    cart.forEach(item => {
      if (item.concession === 'Vegan Goal') {
        sustainability.logTask("preorder_vegan_goal", 20, 1.5);
      } else if (item.concession === 'Taco Cantina') {
        sustainability.logTask("preorder_taco_cantina", 8, 0.5);
      } else if (item.concession === 'Sweet Stadium') {
        sustainability.logTask("preorder_sweet_stadium", 5, 0.3);
      }
    });
    updateEcoScorecardUI();

    cart = []; // clear cart
    updateCartUI();

    let secondsLeft = maxWaitTime;
    orderTimer.textContent = `${Math.floor(secondsLeft / 60)}:${secondsLeft % 60 < 10 ? '0' : ''}${secondsLeft % 60}`;
    
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    step1.className = "stepper-step active";
    step2.className = "stepper-step";
    step3.className = "stepper-step";

    if (orderTimerInterval) clearInterval(orderTimerInterval);

    const initialSeconds = secondsLeft;

    orderTimerInterval = setInterval(() => {
      secondsLeft--;
      
      const min = Math.floor(secondsLeft / 60);
      const sec = secondsLeft % 60;
      orderTimer.textContent = `${min}:${sec < 10 ? '0' : ''}${sec}`;

      const elapsed = initialSeconds - secondsLeft;
      const pct = elapsed / initialSeconds;

      if (pct >= 0.75) {
        step1.className = "stepper-step complete";
        step2.className = "stepper-step complete";
        step3.className = "stepper-step active";
      } else if (pct >= 0.35) {
        step1.className = "stepper-step complete";
        step2.className = "stepper-step active";
      }

      if (secondsLeft <= 0) {
        clearInterval(orderTimerInterval);
        step3.className = "stepper-step complete";
        orderTimer.textContent = "Ready!";
        orderTimer.style.color = 'var(--secondary)';
        if (btnDismissTracker) btnDismissTracker.classList.remove('hidden');
        appendSystemMessage(`Concession Ready! Show confirmation code [WC26-FOOD-${Math.floor(1000 + Math.random() * 9000)}] to collect: ${itemsString}.`);
      }
    }, 1000);
  });

  if (btnDismissTracker) {
    btnDismissTracker.addEventListener('click', () => {
      orderProgressContainer.classList.add('hidden');
      btnDismissTracker.classList.add('hidden');
      if (cartPlaceholder) cartPlaceholder.classList.remove('hidden');
      orderTimer.style.color = '';
    });
  }

  // 12. Eco-Tracker Sustainability Gamification
  const closeEcoBtn = document.getElementById('closeEcoBtn');
  closeEcoBtn.addEventListener('click', () => {
    ecoOverlay.classList.remove('active');
    if (btnEcoOverlay.classList.contains('active')) {
      layerQueues.click();
    }
  });

  const ecoTaskItems = document.querySelectorAll('.eco-task-item');
  ecoTaskItems.forEach((item, index) => {
    const btn = item.querySelector('.btn-eco-action');
    const pts = parseInt(item.getAttribute('data-points'));
    const co2 = parseFloat(item.getAttribute('data-co2'));
    const taskId = `task_${index}`;

    btn.addEventListener('click', () => {
      if (sustainability.logTask(taskId, pts, co2)) {
        btn.classList.add('logged');
        btn.textContent = 'Activity Logged';
        btn.disabled = true;
        
        const status = sustainability.getStatus();
        document.getElementById('ecoPointsVal').textContent = status.points;
        document.getElementById('ecoCo2Val').textContent = `${status.co2Offset} kg`;
        document.getElementById('ecoRankVal').textContent = status.badge;
        
        if (index === 0) {
          document.getElementById('footGreenTransport').textContent = '47%';
        }

        updateRewardsStatus();
        updateCartUI(); // Dynamically updates discount when eco points threshold is met
        appendSystemMessage(`Sustainability logged! Earned +${pts} Eco Points. Saved ${co2}kg carbon footprint.`);
      }
    });
  });

  function updateRewardsStatus() {
    const rewards = sustainability.getRewardsStatus();
    Object.keys(rewards).forEach(id => {
      const reward = rewards[id];
      const card = document.getElementById(id);
      if (reward.eligible) {
        card.classList.remove('disabled');
        card.classList.add('claimable');
        const p = card.querySelector('p');
        p.textContent = "Eligible - Claim Now!";
        
        if (!card.dataset.claimed) {
          card.onclick = () => {
            card.dataset.claimed = 'true';
            card.classList.remove('claimable');
            card.classList.add('disabled');
            p.textContent = "Claimed / Redeemed";
            alert(`Reward Unlocked: Show this confirmation code [WC26-ECO-${Math.floor(1000 + Math.random() * 9000)}] at concession staff!`);
          };
        }
      }
    });
  }

  // 13. AI Assistant Chat Interactions
  const chatInputField = document.getElementById('chatInputField');
  const sendChatBtn = document.getElementById('sendChatBtn');
  const chatMessages = document.getElementById('chatMessages');
  const languageSelect = document.getElementById('languageSelect');
  const quickPromptsGrid = document.getElementById('quickPromptsGrid');

  // ── Custom Language Dropdown Wiring ──
  const customLangWrapper = document.getElementById('customLanguageSelectWrapper');
  const customLangTrigger = document.getElementById('customLanguageTrigger');
  const customLangTriggerText = document.getElementById('customLanguageTriggerText');
  const customLangOptions = document.getElementById('customLanguageOptions');

  // Populate custom language options from the hidden native <select>
  function populateLanguageOptions() {
    if (!customLangOptions || !languageSelect) return;
    customLangOptions.innerHTML = '';
    const languageFlags = { en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷', ar: '🇸🇦', pt: '🇵🇹', de: '🇩🇪', ja: '🇯🇵', zh: '🇨🇳' };
    Array.from(languageSelect.options).forEach(opt => {
      const div = document.createElement('div');
      div.className = 'custom-option' + (opt.value === languageSelect.value ? ' selected' : '');
      div.dataset.value = opt.value;
      const flag = languageFlags[opt.value] || '🌐';
      div.innerHTML = `<span>${flag}  ${opt.text}</span>`;
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        selectLanguageOption(opt.value, opt.text, flag);
      });
      customLangOptions.appendChild(div);
    });
  }

  function selectLanguageOption(value, text, flag) {
    languageSelect.value = value;
    currentLanguage = value;
    if (customLangTriggerText) customLangTriggerText.textContent = `${flag}  ${text}`;

    // Update selected style
    if (customLangOptions) {
      customLangOptions.querySelectorAll('.custom-option').forEach(o => {
        o.classList.toggle('selected', o.dataset.value === value);
      });
      customLangOptions.classList.add('hidden');
    }
    if (customLangWrapper) customLangWrapper.classList.remove('open');
    appendSystemMessage(`Language set to: ${text}`);
  }

  if (customLangTrigger) {
    customLangTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (customLangOptions) {
        const isOpen = !customLangOptions.classList.contains('hidden');
        closeAllCustomDropdowns();
        if (!isOpen) {
          customLangOptions.classList.remove('hidden');
          if (customLangWrapper) customLangWrapper.classList.add('open');
        }
      }
    });
  }

  populateLanguageOptions();
  // Set initial flag display
  if (customLangTriggerText) customLangTriggerText.textContent = '🇺🇸  English (EN)';

  // Keep hidden select in sync (for any programmatic triggers)
  languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.value || e.target.value;
    appendSystemMessage(`Language set to: ${languageSelect.options[languageSelect.selectedIndex].text}`);
  });

  sendChatBtn.addEventListener('click', handleUserChat);
  chatInputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserChat();
  });

  quickPromptsGrid.addEventListener('click', (e) => {
    const chip = e.target.closest('.quick-prompt-chip');
    if (chip) {
      chatInputField.value = chip.getAttribute('data-prompt');
      handleUserChat();
    }
  });

  async function handleUserChat() {
    const messageText = chatInputField.value.trim();
    if (!messageText) return;

    chatInputField.value = '';
    appendChatMessage(messageText, 'user');
    const typingIndicator = showTypingIndicator();

    try {
      const response = await aiAssistant.query(messageText, currentLanguage);
      typingIndicator.remove();
      appendChatMessage(response, 'assistant');
      updateGeminiTelemetry();
    } catch (e) {
      typingIndicator.remove();
      appendChatMessage("Apologies, I encountered an operational network failure. Please verify your connection or try again.", 'assistant');
    }
  }

  function appendChatMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    // Security: escape raw message strings against XSS injections
    const escaped = escapeHTML(text);
    const formattedText = escaped.replace(/\n/g, '<br/>');

    messageDiv.innerHTML = `
      <div class="message-content">
        <p>${formattedText}</p>
      </div>
      <span class="message-meta">${sender === 'user' ? 'You' : 'FIFA AI'} • ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (window.lucide) window.lucide.createIcons();
  }

  function appendSystemMessage(text) {
    const systemDiv = document.createElement('div');
    systemDiv.className = "message system-message";
    systemDiv.innerHTML = `
      <div class="message-content">
        <p>${text}</p>
      </div>
    `;
    chatMessages.appendChild(systemDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTypingIndicator() {
    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = "message assistant-message typing-container";
    indicatorDiv.innerHTML = `
      <div class="message-content typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    chatMessages.appendChild(indicatorDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return indicatorDiv;
  }

  // 14. Staff Simulation Control Logic
  const simNormalBtn = document.getElementById('simNormal');
  const simPostMatchBtn = document.getElementById('simPostMatch');
  const simWeatherBtn = document.getElementById('simWeather');
  const simIncidentBtn = document.getElementById('simIncident');

  const simButtons = [simNormalBtn, simPostMatchBtn, simWeatherBtn, simIncidentBtn];

  simNormalBtn.addEventListener('click', () => updateSimulation('normal'));
  simPostMatchBtn.addEventListener('click', () => updateSimulation('post-match'));
  simWeatherBtn.addEventListener('click', () => updateSimulation('weather'));
  simIncidentBtn.addEventListener('click', () => updateSimulation('incident'));

  function updateSimulation(scenarioId) {
    // If Evacuation mode is active, disable other simulations
    if (isEvacuationMode) {
      alert("Evacuation Mode is currently ACTIVE. Please deactivate Evacuation Mode first to run other scenarios.");
      return;
    }

    simButtons.forEach(btn => btn.classList.remove('active'));
    
    let activeBtn = simNormalBtn;
    if (scenarioId === 'post-match') activeBtn = simPostMatchBtn;
    else if (scenarioId === 'weather') activeBtn = simWeatherBtn;
    else if (scenarioId === 'incident') activeBtn = simIncidentBtn;
    
    activeBtn.classList.add('active');

    const result = simulationEngine.triggerScenario(scenarioId);
    
    // Update Scoreboard banner
    if (result.matchBannerUpdate) {
      const banner = document.getElementById('matchBanner');
      const score = banner.querySelector('#scoreVal');
      const time = banner.querySelector('#timeVal');
      const status = banner.querySelector('#statusVal');
      const pulse = banner.querySelector('.live-dot');

      score.textContent = result.matchBannerUpdate.score;
      time.textContent = result.matchBannerUpdate.time;
      status.textContent = result.matchBannerUpdate.status;
      
      if (result.matchBannerUpdate.status === 'Delayed' || result.matchBannerUpdate.status === 'Match Ended') {
        pulse.style.backgroundColor = 'var(--accent-gold)';
        pulse.style.boxShadow = '0 0 8px var(--accent-gold)';
      } else {
        pulse.style.backgroundColor = 'var(--accent-red)';
        pulse.style.boxShadow = '0 0 8px var(--accent-red)';
      }
    }

    // Render AI Decision Recommendations in sidepanel
    const recContainer = document.getElementById('aiRecommendations');
    recContainer.innerHTML = '';
    
    // Randomize the order of recommendations to keep suggestions fresh
    const randomizedRecs = [...result.recommendations].sort(() => Math.random() - 0.5);
    
    randomizedRecs.forEach(rec => {
      const recItem = document.createElement('div');
      recItem.className = `recommendation-item ${rec.type}`;
      recItem.innerHTML = `
        <div class="rec-icon"><i data-lucide="${rec.icon}"></i></div>
        <div class="rec-content">
          <h4>${rec.title}</h4>
          <p>${rec.description}</p>
        </div>
      `;
      recContainer.appendChild(recItem);
    });

    // Update Analytics Chart Bars to match simulation wait times
    updateAnalyticsUI();
    
    // Update ticker Commentary text to match scenario
    const tickerText = document.getElementById('liveCommentaryText');
    if (scenarioId === 'normal') {
      tickerText.textContent = "Match status: USA 1 - 1 ENG (68') • Concourse queue wait times normal at Sectors 104, 108 • MetLife Rail operations running normal scheduling.";
    } else if (scenarioId === 'post-match') {
      tickerText.textContent = "MATCH OVER: USA 2 - 1 ENG (FT) • Post-match egress streams active • Outbound queues swelling at Gate A (32m wait) • High demand at shuttle terminal.";
    } else if (scenarioId === 'weather') {
      tickerText.textContent = "GAME SUSPENDED: Weather delay triggered • Heavy lightning warning within 5 miles • All fans advised to seek shelter in covered concourse rings immediately.";
    } else if (scenarioId === 'incident') {
      tickerText.textContent = "SECURITY INCIDENT: Gate A (North Entrance) temporarily CLOSED due to ticketing network failure • Arriving fans redirected to Gates B & D.";
    }

    if (window.lucide) window.lucide.createIcons();
    appendSystemMessage(`Staff Alert: Switched operations control map to scenario [${scenarioId.toUpperCase()}]. Heatmap updated.`);
  }

  // 15. Staff Real-time Analytics Bar Updates
  function updateAnalyticsUI() {
    const gates = stadiumData.gates;
    const updateGateBar = (gateId, fillId, valId) => {
      const gate = gates[gateId];
      const fillEl = document.getElementById(fillId);
      const valEl = document.getElementById(valId);
      if (!fillEl || !valEl) return;

      const queue = gate.queueTime;
      valEl.textContent = gate.status.includes("Blocked") ? "Closed (99m)" : `${queue} mins`;
      
      let pct = (queue / 40) * 100;
      if (gate.status.includes("Blocked")) pct = 100;
      fillEl.style.width = `${Math.min(100, pct)}%`;

      fillEl.className = 'bar-fill';
      if (gate.status.includes("Blocked") || queue >= 20) {
        fillEl.classList.add('danger');
      } else if (queue >= 8) {
        fillEl.classList.add('warning');
      }
    };

    updateGateBar('Gate A', 'barGateAFill', 'barGateAVal');
    updateGateBar('Gate B', 'barGateBFill', 'barGateBVal');
    updateGateBar('Gate C', 'barGateCFill', 'barGateCVal');
    updateGateBar('Gate D', 'barGateDFill', 'barGateDVal');

    const concessions = stadiumData.concessions;
    const updateConcessBar = (conId, fillId, valId) => {
      const concess = concessions[conId];
      const fillEl = document.getElementById(fillId);
      const valEl = document.getElementById(valId);
      if (!fillEl || !valEl) return;

      const wait = concess.waitTime;
      valEl.textContent = `${wait} mins`;
      let pct = (wait / 25) * 100;
      fillEl.style.width = `${Math.min(100, pct)}%`;

      fillEl.className = 'bar-fill';
      if (wait >= 20) fillEl.classList.add('danger');
      else if (wait >= 10) fillEl.classList.add('warning');
    };

    updateConcessBar('Taco Cantina', 'barConcess1Fill', 'barConcess1Val');
    updateConcessBar('Gridiron Grill', 'barConcess2Fill', 'barConcess2Val');
    updateConcessBar('Vegan Goal', 'barConcess3Fill', 'barConcess3Val');
  }

  // 16. Staff Volunteer Deployment staffing adjusters
  const adjustStaffBtns = document.querySelectorAll('.adjust-staff-btn');
  adjustStaffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const gateId = btn.getAttribute('data-gate-id');
      const action = btn.getAttribute('data-action');
      if (gateStaff[gateId] !== undefined) {
        const oldTime = stadiumData.gates[gateId].queueTime;
        const gateKey = gateId.replace('Gate ', '');
        const staffLabel = document.getElementById(`gate${gateKey}StaffVal`);
        
        if (action === 'add') {
          gateStaff[gateId] += 2;
          const newTime = Math.max(2, oldTime - 3);
          stadiumData.gates[gateId].queueTime = newTime;
          appendSystemMessage(`Staff Update: Deployed 2 additional volunteers to ${gateId}. Total: ${gateStaff[gateId]} staff. Wait time reduced to ${newTime}m.`);
        } else if (action === 'remove') {
          if (gateStaff[gateId] <= 2) {
            appendSystemMessage(`Staff Warning: Cannot remove staff from ${gateId}. A baseline of at least 2 staff is required for operations.`);
            return;
          }
          gateStaff[gateId] -= 2;
          const newTime = oldTime + 3;
          stadiumData.gates[gateId].queueTime = newTime;
          appendSystemMessage(`Staff Update: Reallocated 2 volunteers away from ${gateId}. Remaining: ${gateStaff[gateId]} staff. Wait time increased to ${newTime}m.`);
        }
        
        if (staffLabel) staffLabel.textContent = `${gateStaff[gateId]} Staff`;
        mapRenderer.setLayer(mapRenderer.activeLayer);
        updateAnalyticsUI();
      }
    });
  });

  // 17. Master Evacuation Trigger Control
  const btnEvacuate = document.getElementById('btnEvacuate');
  btnEvacuate.addEventListener('click', () => {
    isEvacuationMode = !isEvacuationMode;
    
    const tickerText = document.getElementById('liveCommentaryText');
    const scoreVal = document.getElementById('scoreVal');
    const timeVal = document.getElementById('timeVal');
    const statusVal = document.getElementById('statusVal');
    const pulseDot = document.querySelector('.live-dot');

    if (isEvacuationMode) {
      // Toggle CSS danger pulse on page body
      document.body.classList.add('evac-active');
      btnEvacuate.innerHTML = `<i data-lucide="shield-x"></i> DEACTIVATE ALARM`;
      btnEvacuate.style.background = 'var(--accent-red)';
      btnEvacuate.style.color = '#ffffff';

      // Update TV Commentary Ticker
      tickerText.textContent = "!!! EMERGENCY STADIUM WIDE EVACUATION PROTOCOL ACTIVE !!! PLEASE PROCEED CALMLY TO ALL ACTIVE OUTBOUND EXITS GATES A, B, C AND D. DO NOT USE ELEVATORS.";
      tickerText.style.color = 'var(--accent-red)';
      tickerText.style.fontWeight = 'bold';

      // Update Scoreboard to alert state
      scoreVal.textContent = "ALARM";
      scoreVal.style.color = 'var(--accent-red)';
      timeVal.textContent = "EVAC";
      statusVal.textContent = "WARNING";
      pulseDot.style.backgroundColor = 'var(--accent-red)';

      // Direct AI response update
      appendSystemMessage("⚠️ [EMERGENCY EVACUATION SYSTEM CONFIGURED] ⚠️ All exits have been mapped to Gate exits. Direction paths are set to bypass internal concourses.");
      appendChatMessage("ATTENTION FANS AND STAFF: A stadium-wide evacuation order has been triggered. Please exit the bowl immediately and proceed to Gate A (North), Gate B (East), Gate C (South), or Gate D (West). Volunteers are standing by at concourses to guide your egress path. Do not use elevators. Remain calm.", "assistant");

      // Visual route change: route from Gate A to Sections representing evacuation lines
      mapRenderer.clearRoute();
      
      // Update heatmap values to all Red
      const evacHeatmap = {};
      Object.keys(stadiumData.sections).forEach(id => {
        evacHeatmap[id] = 99; // 100% capacity / alert
      });
      mapRenderer.setHeatmapData(evacHeatmap);
      mapRenderer.setLayer('heatmap');

    } else {
      // Deactivate Evacuation Mode
      document.body.classList.remove('evac-active');
      btnEvacuate.innerHTML = `<i data-lucide="alert-triangle"></i> TRIGGER EVACUATION`;
      btnEvacuate.style.background = '';
      btnEvacuate.style.color = '';

      // Restore scoreboard
      scoreVal.style.color = '';
      
      // Trigger normal simulation to restore stats
      updateSimulation('normal');
      appendSystemMessage("Evacuation protocol deactivated. Stadium operations restored to Normal flow.");
    }
    
    if (window.lucide) window.lucide.createIcons();
  });

  // 18. HVAC & Floodlight Telemetry Sliders
  const hvacSlider = document.getElementById('hvacSlider');
  const hvacValue = document.getElementById('hvacValue');
  const footTemp = document.getElementById('footTemp');

  hvacSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    hvacValue.textContent = `${val}°F`;
    footTemp.textContent = `${val}°F (${val == 72 ? 'Optimal' : 'AirCon Adjusting'})`;
  });

  const lightSlider = document.getElementById('lightSlider');
  const lightValue = document.getElementById('lightValue');

  lightSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    lightValue.textContent = `${val}%`;
  });

  // 19. Staff Multilingual Volunteer Broadcast Dispatcher
  const btnDispatch = document.getElementById('btnDispatch');
  const dispatchMsgInput = document.getElementById('dispatchMsgInput');
  const dispatchSector = document.getElementById('dispatchSector');
  const dispatchLogItems = document.getElementById('dispatchLogItems');

  // ── Custom Sector Dropdown Wiring (Command Center) ──
  const customSectorWrapper = document.getElementById('customSectorSelectWrapper');
  const customSectorTrigger = document.getElementById('customSectorTrigger');
  const customSectorTriggerText = document.getElementById('customSectorTriggerText');
  const customSectorOptions = document.getElementById('customSectorOptions');

  function populateSectorOptions() {
    if (!customSectorOptions || !dispatchSector) return;
    customSectorOptions.innerHTML = '';
    Array.from(dispatchSector.options).forEach(opt => {
      const div = document.createElement('div');
      div.className = 'custom-option' + (opt.value === dispatchSector.value ? ' selected' : '');
      div.dataset.value = opt.value;
      div.innerHTML = `<span>${opt.text}</span>`;
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        selectSectorOption(opt.value, opt.text);
      });
      customSectorOptions.appendChild(div);
    });
  }

  function selectSectorOption(value, text) {
    if (!dispatchSector) return;
    dispatchSector.value = value;
    if (customSectorTriggerText) customSectorTriggerText.textContent = text;
    if (customSectorOptions) {
      customSectorOptions.querySelectorAll('.custom-option').forEach(o => {
        o.classList.toggle('selected', o.dataset.value === value);
      });
      customSectorOptions.classList.add('hidden');
    }
    if (customSectorWrapper) customSectorWrapper.classList.remove('open');
  }

  if (customSectorTrigger) {
    customSectorTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (customSectorOptions) {
        const isOpen = !customSectorOptions.classList.contains('hidden');
        closeAllCustomDropdowns();
        if (!isOpen) {
          customSectorOptions.classList.remove('hidden');
          if (customSectorWrapper) customSectorWrapper.classList.add('open');
        }
      }
    });
  }

  // ── Custom Broadcast Language Dropdown Wiring (Command Center) ──
  const dispatchLang = document.getElementById('dispatchLang');
  const customBroadcastLangWrapper = document.getElementById('customBroadcastLangSelectWrapper');
  const customBroadcastLangTrigger = document.getElementById('customBroadcastLangTrigger');
  const customBroadcastLangTriggerText = document.getElementById('customBroadcastLangTriggerText');
  const customBroadcastLangOptions = document.getElementById('customBroadcastLangOptions');

  function populateBroadcastLangOptions() {
    if (!customBroadcastLangOptions || !dispatchLang) return;
    customBroadcastLangOptions.innerHTML = '';
    const langFlags = { all: '🌐', es: '🇪🇸', fr: '🇫🇷', ar: '🇸🇦', pt: '🇵🇹', de: '🇩🇪', ja: '🇯🇵', zh: '🇨🇳' };
    Array.from(dispatchLang.options).forEach(opt => {
      const div = document.createElement('div');
      div.className = 'custom-option' + (opt.value === dispatchLang.value ? ' selected' : '');
      div.dataset.value = opt.value;
      const flag = langFlags[opt.value] || '🌐';
      div.innerHTML = `<span>${flag}  ${opt.text}</span>`;
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        selectBroadcastLangOption(opt.value, opt.text, flag);
      });
      customBroadcastLangOptions.appendChild(div);
    });
  }

  function selectBroadcastLangOption(value, text, flag) {
    if (!dispatchLang) return;
    dispatchLang.value = value;
    if (customBroadcastLangTriggerText) customBroadcastLangTriggerText.textContent = `${flag}  ${text}`;
    if (customBroadcastLangOptions) {
      customBroadcastLangOptions.querySelectorAll('.custom-option').forEach(o => {
        o.classList.toggle('selected', o.dataset.value === value);
      });
      customBroadcastLangOptions.classList.add('hidden');
    }
    if (customBroadcastLangWrapper) customBroadcastLangWrapper.classList.remove('open');
  }

  if (customBroadcastLangTrigger) {
    customBroadcastLangTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (customBroadcastLangOptions) {
        const isOpen = !customBroadcastLangOptions.classList.contains('hidden');
        closeAllCustomDropdowns();
        if (!isOpen) {
          customBroadcastLangOptions.classList.remove('hidden');
          if (customBroadcastLangWrapper) customBroadcastLangWrapper.classList.add('open');
        }
      }
    });
  }

  // Populate initially
  populateSectorOptions();
  populateBroadcastLangOptions();
  if (customBroadcastLangTriggerText) customBroadcastLangTriggerText.textContent = '🌐  All Languages';

  btnDispatch.addEventListener('click', () => {
    const text = dispatchMsgInput.value.trim();
    if (!text) return;

    const sectorId = dispatchSector.value;
    const sectorName = dispatchSector.options[dispatchSector.selectedIndex].text;
    const langId = document.getElementById('dispatchLang').value;
    dispatchMsgInput.value = '';

    // Security: Escape user inputs to prevent XSS payloads in logs
    const cleanText = escapeHTML(text);
    const translations = simulationEngine.translateBroadcast(cleanText);

    let translationsHtml = '';
    if (langId === 'all') {
      translationsHtml = `
        <span class="translation-chip" title="${escapeHTML(translations.es)}">ES: ${escapeHTML(translations.es.substring(0, 30))}...</span>
        <span class="translation-chip" title="${escapeHTML(translations.fr)}">FR: ${escapeHTML(translations.fr.substring(0, 30))}...</span>
        <span class="translation-chip" title="${escapeHTML(translations.ar)}">AR: ${escapeHTML(translations.ar.substring(0, 30))}...</span>
        <span class="translation-chip" title="${escapeHTML(translations.pt)}">PT: ${escapeHTML(translations.pt.substring(0, 30))}...</span>
        <span class="translation-chip" title="${escapeHTML(translations.de)}">DE: ${escapeHTML(translations.de.substring(0, 30))}...</span>
        <span class="translation-chip" title="${escapeHTML(translations.ja)}">JA: ${escapeHTML(translations.ja.substring(0, 30))}...</span>
        <span class="translation-chip" title="${escapeHTML(translations.zh)}">ZH: ${escapeHTML(translations.zh.substring(0, 30))}...</span>
      `;
    } else {
      const langNames = { 
        es: 'Spanish (ES)', 
        fr: 'French (FR)', 
        ar: 'Arabic (AR)',
        pt: 'Portuguese (PT)',
        de: 'German (DE)',
        ja: 'Japanese (JA)',
        zh: 'Chinese (ZH)'
      };
      const transText = translations[langId];
      translationsHtml = `
        <span class="translation-chip active-translation-chip" style="background: rgba(0, 240, 255, 0.08); border: 1px solid var(--primary); padding: 0.1rem 0.4rem; color: var(--primary);" title="${escapeHTML(transText)}">
          <strong>${langNames[langId]}:</strong> ${escapeHTML(transText)}
        </span>
      `;
    }

    const logItem = document.createElement('div');
    logItem.className = "log-item";
    logItem.innerHTML = `
      <div class="log-item-header">
        <span class="log-item-sector">${sectorName}</span>
        <span class="log-item-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
      </div>
      <div class="log-item-body">${cleanText}</div>
      <div class="log-item-translations" style="margin-top: 0.25rem; display: flex; gap: 0.35rem; flex-wrap: wrap;">
        ${translationsHtml}
      </div>
    `;

    const emptyLog = dispatchLogItems.querySelector('.empty-log');
    if (emptyLog) emptyLog.remove();

    dispatchLogItems.prepend(logItem);
    appendSystemMessage(`Broadcast Sent: Volunteer dispatch message transmitted to ${sectorName}. Live translations logged.`);
  });

// 20. Wire up Diagnostic Automated Tests
  const btnRunDiagnostics = document.getElementById('btnRunDiagnostics');
  if (btnRunDiagnostics) {
    btnRunDiagnostics.addEventListener('click', () => {
      appendSystemMessage("🔍 Running diagnostic suite. Exercising BFS Pathfinding, Sustainability telemetry engines, and Graph connectivity assertions...");
      setTimeout(() => {
        try {
          const testResults = runDiagnostics();
          if (testResults.success) {
            appendSystemMessage(`%c DIAGNOSTIC INTEGRITY: Passed ${testResults.passed}/${testResults.total} assertions. Code structures, metric updates, and graph coordinates are operational. Details logged in Developer Console.`);
          } else {
            appendSystemMessage(`❌ DIAGNOSTIC FAILURE: ${testResults.failures.length} diagnostic assertions failed. Check Developer Console for logs.`);
          }
        } catch (e) {
          appendSystemMessage(`❌ TEST HARNESS ERROR: Diagnostics crashed with exception: ${e.message}`);
        }
      }, 300);
    });
  }

  // 21. Match Event Simulation & Confetti Celebration
  const btnSimEvent = document.getElementById('btnSimEvent');
  const scoreVal = document.getElementById('scoreVal');
  const timeVal = document.getElementById('timeVal');
  const liveCommentaryText = document.getElementById('liveCommentaryText');
  const matchBanner = document.getElementById('matchBanner');

  const simulatedEvents = [
    { type: 'goal_usa', title: '⚽ GOAL USA!', description: 'Christian Pulisic scores a magnificent volley from the edge of the box! USA takes the lead!' },
    { type: 'goal_eng', title: '⚽ GOAL ENGLAND!', description: 'Harry Kane converts a clinical penalty into the bottom right corner!' },
    { type: 'card_eng', title: '🟨 Yellow Card (England)', description: 'Jude Bellingham receives a caution for a late challenge in midfield.' },
    { type: 'card_usa', title: '🟨 Yellow Card (USA)', description: 'Weston McKennie cautioned for unsporting behavior.' },
    { type: 'offside', title: '🚩 Offside (England)', description: 'Bukayo Saka caught offside after a direct through pass.' },
    { type: 'save', title: '🧤 SPECTACULAR SAVE!', description: 'Matt Turner makes a diving fingertip save to deny a heading attempt!' }
  ];

  btnSimEvent.addEventListener('click', () => {
    const event = simulatedEvents[Math.floor(Math.random() * simulatedEvents.length)];
    
    // Update live feed
    liveCommentaryText.textContent = `${event.title}: ${event.description} (${timeVal.textContent})`;
    appendSystemMessage(`<strong>Match Event:</strong> ${event.title} - ${event.description}`);

    if (event.type.startsWith('goal')) {
      const scores = scoreVal.textContent.split(' - ');
      let usaScore = parseInt(scores[0]);
      let engScore = parseInt(scores[1]);

      if (event.type === 'goal_usa') usaScore++;
      else engScore++;

      scoreVal.textContent = `${usaScore} - ${engScore}`;

      // Trigger visual pulse overlay on header scoreboard
      matchBanner.classList.remove('goal-pulse-active');
      void matchBanner.offsetWidth; // trigger reflow
      matchBanner.classList.add('goal-pulse-active');

      // Trigger HTML5 Canvas Confetti explosion
      triggerConfetti();
    }
  });

  // Confetti Canvas Particle System
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  let confettiParticles = [];
  let isConfettiActive = false;
  let confettiAnimationId = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class ConfettiParticle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * -canvas.height;
      this.size = Math.random() * 8 + 4;
      this.color = `hsl(${Math.random() * 360}, 90%, 60%)`;
      this.speedX = Math.random() * 4 - 2;
      this.speedY = Math.random() * 5 + 3;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 4 - 2;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.rotation += this.rotationSpeed;
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation * Math.PI / 180);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    }
  }

  function triggerConfetti() {
    confettiParticles = [];
    for (let i = 0; i < 180; i++) {
      confettiParticles.push(new ConfettiParticle());
    }
    
    if (!isConfettiActive) {
      isConfettiActive = true;
      animateConfetti();
      
      setTimeout(() => {
        isConfettiActive = false;
        if (confettiAnimationId) {
          cancelAnimationFrame(confettiAnimationId);
          confettiAnimationId = null;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }, 4000);
    }
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    confettiParticles.forEach((p, idx) => {
      p.update();
      p.draw();
      
      if (p.y > canvas.height) {
        if (isConfettiActive) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        } else {
          confettiParticles.splice(idx, 1);
        }
      }
    });

    if (isConfettiActive || confettiParticles.length > 0) {
      confettiAnimationId = requestAnimationFrame(animateConfetti);
    }
  }

  // Set default Simulation scenario at the end once all components are fully bound
  updateSimulation('normal');

  // Initialize Lucide Icons at the end
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 22. Custom Event Listener from mapRenderer when node clicked
  window.addEventListener('stadiumNodeSelected', (e) => {
    const { nodeId, node } = e.detail;
    const isStaffMode = btnToggleStaff && btnToggleStaff.classList.contains('active');
    
    if (isStaffMode) {
      const routeOverlayCard = document.getElementById('routeOverlayCard');
      const routeDetails = document.getElementById('routeDetails');
      const headerTitle = routeOverlayCard.querySelector('.route-header h4');
      
      headerTitle.innerHTML = `<i data-lucide="shield-alert" class="icon-accent"></i> Tactical Inspector`;
      
      let typeLabel = node.type.toUpperCase();
      let statusInfo = '';
      let dispatchButtonHtml = '';
      
      if (node.type === 'gate') {
        const waitTime = stadiumData.gates[nodeId].queueTime;
        statusInfo = `
          <div class="route-stat">
            <span>Active Volunteers:</span>
            <strong id="inspectGateStaff">${gateStaff[nodeId]} Volunteers</strong>
          </div>
          <div class="route-stat">
            <span>Queue Wait Time:</span>
            <strong id="inspectGateWait" style="color: ${waitTime >= 20 ? 'var(--accent-red)' : (waitTime >= 8 ? 'var(--accent-gold)' : 'var(--secondary)')}">${waitTime} mins</strong>
          </div>
          <div class="route-stat">
            <span>Access Status:</span>
            <span>${stadiumData.gates[nodeId].status}</span>
          </div>
        `;
        dispatchButtonHtml = `<button id="btnTacticalDispatch" class="btn btn-accent-glow" style="width: 100%; margin-top: 0.5rem; border-radius: 12px;"><i data-lucide="users"></i> Dispatch Volunteer Vector</button>`;
      } else if (node.type === 'food') {
        const waitTime = stadiumData.concessions[nodeId].waitTime;
        statusInfo = `
          <div class="route-stat">
            <span>Concourse Wait:</span>
            <strong id="inspectFoodWait" style="color: ${waitTime >= 15 ? 'var(--accent-red)' : 'var(--secondary)'}">${waitTime} mins</strong>
          </div>
          <div class="route-stat">
            <span>Category:</span>
            <span>${stadiumData.concessions[nodeId].category}</span>
          </div>
        `;
        dispatchButtonHtml = `<button id="btnTacticalDispatch" class="btn btn-accent-glow" style="width: 100%; margin-top: 0.5rem; border-radius: 12px;"><i data-lucide="users"></i> Dispatch Concession Help</button>`;
      } else {
        statusInfo = `
          <div class="route-stat">
            <span>Transit Status:</span>
            <span>${node.details?.status || 'Active'}</span>
          </div>
          <div class="route-stat">
            <span>Info:</span>
            <span>${node.details?.description || 'Junction point'}</span>
          </div>
        `;
      }
      
      routeDetails.innerHTML = `
        <div class="route-stat">
          <span>Target Node:</span>
          <strong>${node.name || nodeId}</strong>
        </div>
        <div class="route-stat">
          <span>Type:</span>
          <span>${typeLabel}</span>
        </div>
        ${statusInfo}
        ${dispatchButtonHtml}
      `;
      
      routeOverlayCard.classList.remove('hidden');
      
      const btnTacticalDispatch = document.getElementById('btnTacticalDispatch');
      if (btnTacticalDispatch) {
        btnTacticalDispatch.onclick = () => {
          // Play SVG dispatch vector
          mapRenderer.drawDispatchVector(nodeId);
          
          if (node.type === 'gate') {
            // Deploy staff
            gateStaff[nodeId] += 2;
            const gateKey = nodeId.replace('Gate ', '');
            const staffLabel = document.getElementById(`gate${gateKey}StaffVal`);
            if (staffLabel) staffLabel.textContent = `${gateStaff[nodeId]} Staff`;

            const oldTime = stadiumData.gates[nodeId].queueTime;
            const newTime = Math.max(2, oldTime - 3);
            stadiumData.gates[nodeId].queueTime = newTime;

            appendSystemMessage(`Tactical Alert: Volunteer stream directed to ${nodeId}. Active staff increased to ${gateStaff[nodeId]}. Wait time reduced to ${newTime}m.`);
            
            const inspectGateStaff = document.getElementById('inspectGateStaff');
            const inspectGateWait = document.getElementById('inspectGateWait');
            if (inspectGateStaff) inspectGateStaff.textContent = `${gateStaff[nodeId]} Volunteers`;
            if (inspectGateWait) {
              inspectGateWait.textContent = `${newTime} mins`;
              inspectGateWait.style.color = newTime >= 20 ? 'var(--accent-red)' : (newTime >= 8 ? 'var(--accent-gold)' : 'var(--secondary)');
            }

            mapRenderer.setLayer(mapRenderer.activeLayer);
            updateAnalyticsUI();
          } else if (node.type === 'food') {
            const oldTime = stadiumData.concessions[nodeId].waitTime;
            const newTime = Math.max(1, oldTime - 2);
            stadiumData.concessions[nodeId].waitTime = newTime;
            
            appendSystemMessage(`Tactical Alert: Support wave dispatched to Concession stand ${nodeId}. Concourse wait time reduced to ${newTime}m.`);
            
            const inspectFoodWait = document.getElementById('inspectFoodWait');
            if (inspectFoodWait) {
              inspectFoodWait.textContent = `${newTime} mins`;
              inspectFoodWait.style.color = newTime >= 15 ? 'var(--accent-red)' : 'var(--secondary)';
            }
            
            mapRenderer.setLayer(mapRenderer.activeLayer);
            updateAnalyticsUI();
          }
        };
      }
      
      if (window.lucide) window.lucide.createIcons();
    } else {
      // FAN PORTAL INSPECTOR
      const routeOverlayCard = document.getElementById('routeOverlayCard');
      const routeDetails = document.getElementById('routeDetails');
      const headerTitle = routeOverlayCard.querySelector('.route-header h4');
      
      headerTitle.innerHTML = `<i data-lucide="info" class="icon-accent"></i> Concourse Inspector`;
      
      let typeLabel = node.type ? node.type.toUpperCase() : 'SECTION';
      let infoContent = '';
      
      if (node.type === 'gate') {
        const gate = stadiumData.gates[nodeId];
        infoContent = `
          <div class="route-stat">
            <span>Status:</span>
            <span class="text-green">${gate.status}</span>
          </div>
          <div class="route-stat">
            <span>Queue Time:</span>
            <strong>${gate.queueTime} mins</strong>
          </div>
          <div class="route-stat">
            <span>Accessibility:</span>
            <span>${gate.accessibility ? '♿ Wheelchair Ramps' : 'Standard Entrance'}</span>
          </div>
          <p style="margin-top: 0.5rem; font-size: 0.72rem; color: var(--text-muted);">${gate.description}</p>
        `;
      } else if (node.type === 'food') {
        const concession = stadiumData.concessions[nodeId];
        const dietBadges = [];
        if (concession.vegan) dietBadges.push('<span class="badge badge-green" style="background: rgba(16,185,129,0.15); color: #10b981; font-size: 0.55rem; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(16,185,129,0.3);">VEGAN</span>');
        if (concession.halal) dietBadges.push('<span class="badge badge-blue" style="background: rgba(6,182,212,0.15); color: #06b6d4; font-size: 0.55rem; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(6,182,212,0.3);">HALAL</span>');
        if (concession.glutenFree) dietBadges.push('<span class="badge badge-orange" style="background: rgba(245,158,11,0.15); color: #f59e0b; font-size: 0.55rem; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.3);">GF</span>');
        
        infoContent = `
          <div class="route-stat">
            <span>Stand Category:</span>
            <span>${concession.category}</span>
          </div>
          <div class="route-stat">
            <span>Queue Wait Time:</span>
            <strong style="color: var(--secondary);">${concession.waitTime} mins</strong>
          </div>
          <div style="margin: 0.5rem 0; display: flex; gap: 0.35rem; flex-wrap: wrap;">
            ${dietBadges.join(' ')}
          </div>
          <div style="margin-top: 0.5rem;">
            <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Stand Menu:</span>
            <ul style="margin: 0.25rem 0 0.5rem 1rem; padding: 0; font-size: 0.75rem; color: var(--text-secondary);">
              ${(concession.menu || []).map(m => `<li>${m}</li>`).join('')}
            </ul>
          </div>
        `;
      } else if (node.type === 'transit') {
        const transit = stadiumData.transit[nodeId];
        infoContent = `
          <div class="route-stat">
            <span>Service:</span>
            <span class="${transit.status.includes('Delay') || transit.status.includes('Congested') ? 'text-red' : 'text-green'}">${transit.status}</span>
          </div>
          <div class="route-stat">
            <span>Frequency:</span>
            <span>${transit.frequency}</span>
          </div>
          <p style="margin-top: 0.5rem; font-size: 0.72rem; color: var(--text-muted);">${transit.description}</p>
        `;
      } else if (node.type === 'amenity') {
        const amenity = stadiumData.amenities[nodeId];
        const accInfo = amenity.accessible ? '♿ Accessible' : '';
        const neutral = amenity.genderNeutral ? '🚻 Gender Neutral' : '';
        infoContent = `
          <div class="route-stat">
            <span>Type:</span>
            <span>${amenity.subType || 'Service'}</span>
          </div>
          <div class="route-stat">
            <span>Wait Time:</span>
            <span>${amenity.waitTime} mins</span>
          </div>
          <p style="margin-top: 0.4rem; font-size: 0.72rem; color: var(--text-muted);">${amenity.description || 'Amenities restroom checkpoint.'} ${accInfo} ${neutral}</p>
        `;
      } else if (node.type === 'section') {
        const sec = stadiumData.sections[nodeId];
        infoContent = `
          <div class="route-stat">
            <span>Category:</span>
            <span>${sec.category}</span>
          </div>
          <div class="route-stat">
            <span>Capacity:</span>
            <span>${sec.capacity.toLocaleString()} seats</span>
          </div>
          <div class="route-stat">
            <span>Base Price:</span>
            <span style="color: var(--accent-gold); font-weight: bold;">$${sec.price}</span>
          </div>
        `;
      }
      
      routeDetails.innerHTML = `
        <div class="route-stat">
          <span>Selected:</span>
          <strong>${node.name || nodeId}</strong>
        </div>
        <div class="route-stat">
          <span>Concourse Type:</span>
          <span>${typeLabel}</span>
        </div>
        <hr style="border: none; border-top: 1px solid var(--border-glass); margin: 0.5rem 0;" />
        ${infoContent}
        <hr style="border: none; border-top: 1px solid var(--border-glass); margin: 0.5rem 0;" />
        <div class="route-actions-row">
          <button id="btnSetStart" class="btn btn-secondary btn-xs" style="border-radius: 8px;"><i data-lucide="map-pin"></i> Set Start</button>
          <button id="btnSetDest" class="btn btn-primary btn-xs" style="border-radius: 8px;"><i data-lucide="flag"></i> Set Destination</button>
        </div>
      `;
      
      routeOverlayCard.classList.remove('hidden');
      
      // Hook up Set Start & Set Destination actions
      document.getElementById('btnSetStart').onclick = () => {
        mapRenderer.setRouteStart(nodeId);
        checkEcoTransitRewards(nodeId);
      };
      document.getElementById('btnSetDest').onclick = () => {
        mapRenderer.setRouteEnd(nodeId);
        checkEcoTransitRewards(nodeId);
      };
      
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // ── Google Gemini Ops Panel Integration (Hackathon Feature) ──
  const btnOpenAiConfig = document.getElementById('btnOpenAiConfig');
  const btnCloseAiConfig = document.getElementById('btnCloseAiConfig');
  const aiConfigModal = document.getElementById('aiConfigModal');
  
  const geminiModelSelector = document.getElementById('geminiModelSelector');
  const activeModelBadge = document.getElementById('activeModelBadge');
  const systemPromptCustomizer = document.getElementById('systemPromptCustomizer');
  const btnSaveSystemPrompt = document.getElementById('btnSaveSystemPrompt');
  const resetSystemPrompt = document.getElementById('resetSystemPrompt');

  const telemetryLatency = document.getElementById('telemetryLatency');
  const telemetryInTokens = document.getElementById('telemetryInTokens');
  const telemetryOutTokens = document.getElementById('telemetryOutTokens');

  // Toggle AI Config Drawer Panel
  if (btnOpenAiConfig && aiConfigModal) {
    btnOpenAiConfig.addEventListener('click', () => {
      aiConfigModal.classList.remove('hidden');
      const drawer = aiConfigModal.querySelector('.glass-card');
      if (drawer) {
        // Force reflow to ensure the transition fires
        void drawer.offsetWidth;
        drawer.style.transform = 'translateX(0)';
      }
    });
  }

  function closeAiConfigDrawer() {
    if (aiConfigModal) {
      const drawer = aiConfigModal.querySelector('.glass-card');
      if (drawer) {
        drawer.style.transform = 'translateX(100%)';
      }
      setTimeout(() => {
        aiConfigModal.classList.add('hidden');
      }, 300); // matches the CSS transition length
    }
  }

  if (btnCloseAiConfig) {
    btnCloseAiConfig.addEventListener('click', closeAiConfigDrawer);
  }

  if (aiConfigModal) {
    aiConfigModal.addEventListener('click', (e) => {
      if (e.target === aiConfigModal) {
        closeAiConfigDrawer();
      }
    });
  }

  // Model Selection & Custom Select Dropdown
  const customModelTrigger = document.getElementById('customModelTrigger');
  const customModelTriggerText = document.getElementById('customModelTriggerText');
  const customModelOptions = document.getElementById('customModelOptions');

  if (geminiModelSelector) {
    geminiModelSelector.value = aiAssistant.model;
    geminiModelSelector.addEventListener('change', () => {
      aiAssistant.model = geminiModelSelector.value;
      const isPro = aiAssistant.model === 'gemini-2.5-pro';
      
      if (activeModelBadge) {
        activeModelBadge.textContent = isPro ? 'Expert Mode' : 'Standard Mode';
      }
      if (customModelTriggerText) {
        customModelTriggerText.textContent = isPro ? 'Expert Mode (Gemini Pro)' : 'Standard Mode (Gemini Flash)';
      }
      
      // Update selected class in custom option list
      if (customModelOptions) {
        customModelOptions.querySelectorAll('.custom-option').forEach(opt => {
          if (opt.getAttribute('data-value') === aiAssistant.model) {
            opt.classList.add('selected');
          } else {
            opt.classList.remove('selected');
          }
        });
      }
      appendSystemMessage(`AI Reasoner mode switched to: <strong>${isPro ? 'Expert Mode (Gemini Pro)' : 'Standard Mode (Gemini Flash)'}</strong>`);
    });
  }

  if (customModelTrigger && customModelOptions && geminiModelSelector) {
    customModelTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      customModelOptions.classList.toggle('hidden');
    });

    customModelOptions.querySelectorAll('.custom-option').forEach(option => {
      option.addEventListener('click', () => {
        const val = option.getAttribute('data-value');
        geminiModelSelector.value = val;
        geminiModelSelector.dispatchEvent(new Event('change'));
        customModelOptions.classList.add('hidden');
      });
    });

    document.addEventListener('click', () => {
      customModelOptions.classList.add('hidden');
    });
  }

  // Populate Default System Instructions
  if (systemPromptCustomizer) {
    systemPromptCustomizer.value = aiAssistant.customSystemPrompt || aiAssistant.getDefaultSystemInstruction(currentLanguage);
  }

  // Save System Instructions
  if (btnSaveSystemPrompt && systemPromptCustomizer) {
    btnSaveSystemPrompt.addEventListener('click', () => {
      const customPrompt = systemPromptCustomizer.value.trim();
      if (customPrompt) {
        aiAssistant.customSystemPrompt = customPrompt;
        appendSystemMessage("Stadium AI custom behavioral directives applied successfully!");
      }
    });
  }

  // Reset System Instructions
  if (resetSystemPrompt && systemPromptCustomizer) {
    resetSystemPrompt.addEventListener('click', (e) => {
      e.preventDefault();
      aiAssistant.customSystemPrompt = '';
      systemPromptCustomizer.value = aiAssistant.getDefaultSystemInstruction(currentLanguage);
      appendSystemMessage("Stadium AI behavioral directives reset to defaults.");
    });
  }

  // Telemetry Updater
  window.updateGeminiTelemetry = function() {
    if (telemetryLatency) telemetryLatency.textContent = `${aiAssistant.lastLatency}s`;
    if (telemetryInTokens) telemetryInTokens.textContent = aiAssistant.lastPromptTokens;
    if (telemetryOutTokens) telemetryOutTokens.textContent = aiAssistant.lastResponseTokens;
    
    const isPro = aiAssistant.lastModel === 'gemini-2.5-pro';
    const isFallback = aiAssistant.lastModel === 'Local-Fallback';
    
    if (activeModelBadge) {
      activeModelBadge.textContent = isFallback ? 'Offline Mode' : (isPro ? 'Expert Mode' : 'Standard Mode');
    }
    if (customModelTriggerText) {
      customModelTriggerText.textContent = isFallback ? 'Offline Simulator' : (isPro ? 'Expert Mode (Gemini Pro)' : 'Standard Mode (Gemini Flash)');
    }
    if (geminiModelSelector) {
      geminiModelSelector.value = aiAssistant.model;
    }
  };

  // Initialize telemetry display
  updateGeminiTelemetry();
});
