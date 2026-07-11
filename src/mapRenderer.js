// ArenaFlow 2026 Map Renderer & Pathfinding Engine
import { stadiumData } from './stadiumData';

export class MapRenderer {
  constructor(svgId, containerId) {
    this.svg = document.getElementById(svgId);
    this.container = document.getElementById(containerId);
    this.selectedNodeId = null;
    this.activeLayer = 'queues'; // 'queues' or 'heatmap'
    this.crowdHeatmap = {}; // sectionId -> density percentage (0-100)
    
    // Zoom and Pan state
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;
    
    // Custom start/end routing nodes
    this.routeStartNodeId = null;
    this.routeEndNodeId = null;

    // Nodes index for pathfinding and coordinates lookup
    this.nodes = {};
    this.initNodesIndex();
    this.initZoomPanEvents();
  }

  // Pre-index all elements with coordinates to quickly retrieve their positions
  initNodesIndex() {
    // Add gates
    Object.values(stadiumData.gates).forEach(g => {
      this.nodes[g.id] = { id: g.id, name: g.name, x: g.x, y: g.y, type: 'gate', details: g };
    });
    // Add concessions
    Object.values(stadiumData.concessions).forEach(c => {
      this.nodes[c.id] = { id: c.id, name: c.name, x: c.x, y: c.y, type: 'food', details: c };
    });
    // Add transit
    Object.values(stadiumData.transit).forEach(t => {
      this.nodes[t.id] = { id: t.id, name: t.name, x: t.x, y: t.y, type: 'transit', details: t };
    });
    // Add amenities
    Object.values(stadiumData.amenities).forEach(a => {
      this.nodes[a.id] = { id: a.id, name: a.name, x: a.x, y: a.y, type: 'amenity', details: a };
    });
    // Add sections
    Object.entries(stadiumData.sections).forEach(([id, s]) => {
      // Calculate section centroid coordinate for pathfinding
      const angle = (s.angleStart + s.angleEnd) / 2;
      const rad = (angle - 90) * Math.PI / 180;
      const r = 160; // middle of the seating ring
      const sx = stadiumData.center.x + r * Math.cos(rad);
      const sy = stadiumData.center.y + r * Math.sin(rad);
      this.nodes[id] = { id, name: s.name, x: sx, y: sy, type: 'section', details: s };
    });
    // Add network junctions
    Object.entries(stadiumData.network).forEach(([id, coords]) => {
      if (id !== 'connections') {
        this.nodes[id] = { id, x: coords.x, y: coords.y, type: 'junction' };
      }
    });
  }

  // Set up mouse/touch drag pan and wheel scroll zoom listeners
  initZoomPanEvents() {
    if (!this.svg) return;

    this.svg.addEventListener('mousedown', (e) => {
      // Avoid panning when clicking interactive buttons, or only pan when clicking the background/SVG
      this.isPanning = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.svg.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;

      // Limit pan range so map doesn't disappear
      const limit = 600;
      this.panX = Math.max(-limit, Math.min(limit, this.panX));
      this.panY = Math.max(-limit, Math.min(limit, this.panY));

      this.applyZoomPan();
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        if (this.svg) this.svg.style.cursor = 'default';
      }
    });

    // Touch support for Edge / tablets
    this.svg.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isPanning = true;
        this.startX = e.touches[0].clientX - this.panX;
        this.startY = e.touches[0].clientY - this.panY;
      }
    });

    this.svg.addEventListener('touchmove', (e) => {
      if (!this.isPanning || e.touches.length !== 1) return;
      this.panX = e.touches[0].clientX - this.startX;
      this.panY = e.touches[0].clientY - this.startY;
      this.applyZoomPan();
    });

    this.svg.addEventListener('touchend', () => {
      this.isPanning = false;
    });

    // Zoom on wheel event
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();

      const zoomIntensity = 0.08;
      const rect = this.svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const previousZoom = this.zoom;
      if (e.deltaY < 0) {
        this.zoom = Math.min(5.0, this.zoom + zoomIntensity);
      } else {
        this.zoom = Math.max(0.6, this.zoom - zoomIntensity);
      }

      // Smooth zoom centered on mouse cursor coordinates
      this.panX = mouseX - (mouseX - this.panX) * (this.zoom / previousZoom);
      this.panY = mouseY - (mouseY - this.panY) * (this.zoom / previousZoom);

      this.applyZoomPan();
    });
  }

  applyZoomPan() {
    if (this.mapGroup) {
      this.mapGroup.setAttribute("transform", `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    }
  }

  zoomIn() {
    const rect = this.svg.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const previousZoom = this.zoom;
    this.zoom = Math.min(5.0, this.zoom + 0.25);
    this.panX = cx - (cx - this.panX) * (this.zoom / previousZoom);
    this.panY = cy - (cy - this.panY) * (this.zoom / previousZoom);
    this.applyZoomPan();
  }

  zoomOut() {
    const rect = this.svg.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const previousZoom = this.zoom;
    this.zoom = Math.max(0.6, this.zoom - 0.25);
    this.panX = cx - (cx - this.panX) * (this.zoom / previousZoom);
    this.panY = cy - (cy - this.panY) * (this.zoom / previousZoom);
    this.applyZoomPan();
  }

  resetZoom() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.applyZoomPan();
  }

  // Render the stadium SVG layout
  render() {
    this.svg.innerHTML = ''; // Clear previous contents
    const cx = stadiumData.center.x;
    const cy = stadiumData.center.y;

    // ── 0. SVG Definitions (gradients, filters, animations) ──
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    // Grass radial gradient
    const grassGrad = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
    grassGrad.setAttribute("id", "grassGradient");
    grassGrad.setAttribute("cx", "50%"); grassGrad.setAttribute("cy", "50%");
    grassGrad.setAttribute("r", "70%");
    const gs1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    gs1.setAttribute("offset", "0%"); gs1.setAttribute("stop-color", "#0e4a2e");
    const gs2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    gs2.setAttribute("offset", "60%"); gs2.setAttribute("stop-color", "#083d22");
    const gs3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    gs3.setAttribute("offset", "100%"); gs3.setAttribute("stop-color", "#052e18");
    grassGrad.appendChild(gs1); grassGrad.appendChild(gs2); grassGrad.appendChild(gs3);
    defs.appendChild(grassGrad);

    // Node glow filter
    const glowFilter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    glowFilter.setAttribute("id", "nodeGlow");
    glowFilter.setAttribute("x", "-50%"); glowFilter.setAttribute("y", "-50%");
    glowFilter.setAttribute("width", "200%"); glowFilter.setAttribute("height", "200%");
    const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    blur.setAttribute("stdDeviation", "3"); blur.setAttribute("result", "blur");
    const merge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const mn1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    mn1.setAttribute("in", "blur");
    const mn2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    mn2.setAttribute("in", "SourceGraphic");
    merge.appendChild(mn1); merge.appendChild(mn2);
    glowFilter.appendChild(blur); glowFilter.appendChild(merge);
    defs.appendChild(glowFilter);

    // Spotlight gradient (radial, transparent center)
    const spotGrad = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
    spotGrad.setAttribute("id", "spotlightGrad");
    spotGrad.setAttribute("cx", "30%"); spotGrad.setAttribute("cy", "30%"); spotGrad.setAttribute("r", "60%");
    const sp1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    sp1.setAttribute("offset", "0%"); sp1.setAttribute("stop-color", "rgba(255,255,255,0.06)");
    const sp2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    sp2.setAttribute("offset", "100%"); sp2.setAttribute("stop-color", "rgba(255,255,255,0)");
    spotGrad.appendChild(sp1); spotGrad.appendChild(sp2);
    defs.appendChild(spotGrad);

    // Grass stripe pattern
    const stripePattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    stripePattern.setAttribute("id", "grassStripes");
    stripePattern.setAttribute("patternUnits", "userSpaceOnUse");
    stripePattern.setAttribute("width", "20"); stripePattern.setAttribute("height", "20");
    stripePattern.setAttribute("patternTransform", "rotate(90)");
    const stripeRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    stripeRect.setAttribute("width", "10"); stripeRect.setAttribute("height", "20");
    stripeRect.setAttribute("fill", "rgba(255,255,255,0.015)");
    stripePattern.appendChild(stripeRect);
    defs.appendChild(stripePattern);

    this.svg.appendChild(defs);

    // Create the zoom/pan root group and append it
    this.mapGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.mapGroup.setAttribute("id", "mapMainGroup");
    this.svg.appendChild(this.mapGroup);
    this.applyZoomPan();

    // ── 1. Upper Bowl (outer seating tier) ──
    const upperBowl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    upperBowl.setAttribute("cx", cx); upperBowl.setAttribute("cy", cy);
    upperBowl.setAttribute("r", "240");
    upperBowl.setAttribute("class", "upper-bowl-ring");
    this.mapGroup.appendChild(upperBowl);

    // ── 2. Draw Concourse Ring ──
    const concourse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    concourse.setAttribute("cx", cx); concourse.setAttribute("cy", cy);
    concourse.setAttribute("r", "215");
    concourse.setAttribute("class", "concourse-ring");
    this.mapGroup.appendChild(concourse);

    // ── 3. Structural Radial Struts (every 30°) ──
    const strutGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    strutGroup.setAttribute("class", "stadium-struts");
    for (let angle = 0; angle < 360; angle += 30) {
      const rad = (angle - 90) * Math.PI / 180;
      const x1 = cx + 108 * Math.cos(rad);
      const y1 = cy + 108 * Math.sin(rad);
      const x2 = cx + 245 * Math.cos(rad);
      const y2 = cy + 245 * Math.sin(rad);
      const strut = document.createElementNS("http://www.w3.org/2000/svg", "line");
      strut.setAttribute("x1", x1); strut.setAttribute("y1", y1);
      strut.setAttribute("x2", x2); strut.setAttribute("y2", y2);
      strutGroup.appendChild(strut);
    }
    this.mapGroup.appendChild(strutGroup);

    // ── 4. Draw Seating Sections (Wedges) ──
    const rInner = 110;
    const rOuter = 210;
    
    Object.entries(stadiumData.sections).forEach(([id, section]) => {
      const pathData = this.getWedgePath(cx, cy, rInner, rOuter, section.angleStart, section.angleEnd);
      const wedge = document.createElementNS("http://www.w3.org/2000/svg", "path");
      wedge.setAttribute("d", pathData);
      wedge.setAttribute("class", "map-section section-shimmer");
      wedge.setAttribute("id", `sec-${id}`);
      wedge.setAttribute("data-section-id", id);
      
      // Stagger shimmer animation per section for organic crowd feel
      const delay = (parseInt(id) - 101) * 0.6;
      wedge.style.animationDelay = `${delay}s`;
      
      this.updateSectionStyle(wedge, id);
      wedge.addEventListener('click', () => this.handleNodeClick(id));
      
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `${section.name}\nCategory: ${section.category}\nCapacity: ${section.capacity.toLocaleString()}\nTicket Price: $${section.price}`;
      wedge.appendChild(title);
      
      this.mapGroup.appendChild(wedge);

      // Section labels
      const midAngle = (section.angleStart + section.angleEnd) / 2;
      const labelRad = (midAngle - 90) * Math.PI / 180;
      const labelDist = rInner + (rOuter - rInner) / 2;
      const lx = cx + labelDist * Math.cos(labelRad);
      const ly = cy + labelDist * Math.sin(labelRad);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", lx);
      label.setAttribute("y", ly + 4);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("class", "section-label-text");
      label.setAttribute("pointer-events", "none");
      label.textContent = id;
      this.mapGroup.appendChild(label);
    });

    // ── 5. Draw Field/Pitch with gradient ──
    const pitchWidth = 170;
    const pitchHeight = 110;
    const pitchX = cx - pitchWidth / 2;
    const pitchY = cy - pitchHeight / 2;

    const pitch = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    pitch.setAttribute("x", pitchX); pitch.setAttribute("y", pitchY);
    pitch.setAttribute("width", pitchWidth); pitch.setAttribute("height", pitchHeight);
    pitch.setAttribute("class", "pitch");
    pitch.setAttribute("fill", "url(#grassGradient)");
    pitch.setAttribute("rx", "3");
    this.mapGroup.appendChild(pitch);

    // Grass stripe overlay
    const grassOverlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    grassOverlay.setAttribute("x", pitchX); grassOverlay.setAttribute("y", pitchY);
    grassOverlay.setAttribute("width", pitchWidth); grassOverlay.setAttribute("height", pitchHeight);
    grassOverlay.setAttribute("fill", "url(#grassStripes)");
    grassOverlay.setAttribute("rx", "3");
    grassOverlay.setAttribute("pointer-events", "none");
    this.mapGroup.appendChild(grassOverlay);

    // ── 5a. Full Pitch Markings ──
    const markingsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    markingsGroup.setAttribute("class", "pitch-markings");

    // Pitch outline
    const outline = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    outline.setAttribute("x", pitchX + 3); outline.setAttribute("y", pitchY + 3);
    outline.setAttribute("width", pitchWidth - 6); outline.setAttribute("height", pitchHeight - 6);
    outline.setAttribute("fill", "none"); outline.setAttribute("class", "pitch-lines");
    markingsGroup.appendChild(outline);

    // Center line
    const midLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    midLine.setAttribute("x1", cx); midLine.setAttribute("y1", pitchY + 3);
    midLine.setAttribute("x2", cx); midLine.setAttribute("y2", pitchY + pitchHeight - 3);
    midLine.setAttribute("class", "pitch-lines");
    markingsGroup.appendChild(midLine);

    // Center circle
    const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centerCircle.setAttribute("cx", cx); centerCircle.setAttribute("cy", cy);
    centerCircle.setAttribute("r", "20");
    centerCircle.setAttribute("class", "pitch-lines");
    markingsGroup.appendChild(centerCircle);

    // Center spot
    const centerSpot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centerSpot.setAttribute("cx", cx); centerSpot.setAttribute("cy", cy);
    centerSpot.setAttribute("r", "2");
    centerSpot.setAttribute("fill", "rgba(255,255,255,0.3)");
    markingsGroup.appendChild(centerSpot);

    // Penalty boxes (left & right)
    const penW = 36; const penH = 60;
    // Left penalty box
    const lPen = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    lPen.setAttribute("x", pitchX + 3); lPen.setAttribute("y", cy - penH / 2);
    lPen.setAttribute("width", penW); lPen.setAttribute("height", penH);
    lPen.setAttribute("fill", "none"); lPen.setAttribute("class", "pitch-lines");
    markingsGroup.appendChild(lPen);

    // Right penalty box
    const rPen = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rPen.setAttribute("x", pitchX + pitchWidth - 3 - penW); rPen.setAttribute("y", cy - penH / 2);
    rPen.setAttribute("width", penW); rPen.setAttribute("height", penH);
    rPen.setAttribute("fill", "none"); rPen.setAttribute("class", "pitch-lines");
    markingsGroup.appendChild(rPen);

    // Goal areas (smaller boxes inside penalty areas)
    const goalW = 14; const goalH = 30;
    const lGoal = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    lGoal.setAttribute("x", pitchX + 3); lGoal.setAttribute("y", cy - goalH / 2);
    lGoal.setAttribute("width", goalW); lGoal.setAttribute("height", goalH);
    lGoal.setAttribute("fill", "none"); lGoal.setAttribute("class", "pitch-lines");
    markingsGroup.appendChild(lGoal);

    const rGoal = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rGoal.setAttribute("x", pitchX + pitchWidth - 3 - goalW); rGoal.setAttribute("y", cy - goalH / 2);
    rGoal.setAttribute("width", goalW); rGoal.setAttribute("height", goalH);
    rGoal.setAttribute("fill", "none"); rGoal.setAttribute("class", "pitch-lines");
    markingsGroup.appendChild(rGoal);

    // Penalty spots
    const lSpot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    lSpot.setAttribute("cx", pitchX + 3 + 28); lSpot.setAttribute("cy", cy);
    lSpot.setAttribute("r", "1.5"); lSpot.setAttribute("fill", "rgba(255,255,255,0.25)");
    markingsGroup.appendChild(lSpot);

    const rSpot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    rSpot.setAttribute("cx", pitchX + pitchWidth - 3 - 28); rSpot.setAttribute("cy", cy);
    rSpot.setAttribute("r", "1.5"); rSpot.setAttribute("fill", "rgba(255,255,255,0.25)");
    markingsGroup.appendChild(rSpot);

    // Penalty arcs (semicircles outside penalty boxes)
    const lArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const arcR = 16;
    const lArcCx = pitchX + 3 + 28;
    lArc.setAttribute("d", `M ${pitchX + 3 + penW} ${cy - arcR * 0.8} A ${arcR} ${arcR} 0 0 1 ${pitchX + 3 + penW} ${cy + arcR * 0.8}`);
    lArc.setAttribute("fill", "none"); lArc.setAttribute("class", "pitch-lines");
    markingsGroup.appendChild(lArc);

    const rArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
    rArc.setAttribute("d", `M ${pitchX + pitchWidth - 3 - penW} ${cy - arcR * 0.8} A ${arcR} ${arcR} 0 0 0 ${pitchX + pitchWidth - 3 - penW} ${cy + arcR * 0.8}`);
    rArc.setAttribute("fill", "none"); rArc.setAttribute("class", "pitch-lines");
    markingsGroup.appendChild(rArc);

    // Corner arcs (4 corners)
    const cornerR = 6;
    const corners = [
      { x: pitchX + 3, y: pitchY + 3, sweep: "0 0 1" },
      { x: pitchX + pitchWidth - 3, y: pitchY + 3, sweep: "0 0 0" },
      { x: pitchX + 3, y: pitchY + pitchHeight - 3, sweep: "0 0 0" },
      { x: pitchX + pitchWidth - 3, y: pitchY + pitchHeight - 3, sweep: "0 0 1" }
    ];
    corners.forEach(c => {
      const dx = c.x === pitchX + 3 ? 1 : -1;
      const dy = c.y === pitchY + 3 ? 1 : -1;
      const arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
      arc.setAttribute("d", `M ${c.x} ${c.y + dy * cornerR} A ${cornerR} ${cornerR} ${c.sweep} ${c.x + dx * cornerR} ${c.y}`);
      arc.setAttribute("fill", "none"); arc.setAttribute("class", "pitch-lines");
      markingsGroup.appendChild(arc);
    });

    // Goal nets (thin rectangles behind goal lines)
    const netW = 4; const netH = 22;
    const lNet = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    lNet.setAttribute("x", pitchX - 1); lNet.setAttribute("y", cy - netH / 2);
    lNet.setAttribute("width", netW); lNet.setAttribute("height", netH);
    lNet.setAttribute("fill", "none"); lNet.setAttribute("stroke", "rgba(255,255,255,0.12)");
    lNet.setAttribute("stroke-width", "0.5"); lNet.setAttribute("rx", "1");
    markingsGroup.appendChild(lNet);

    const rNet = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rNet.setAttribute("x", pitchX + pitchWidth - 3); rNet.setAttribute("y", cy - netH / 2);
    rNet.setAttribute("width", netW); rNet.setAttribute("height", netH);
    rNet.setAttribute("fill", "none"); rNet.setAttribute("stroke", "rgba(255,255,255,0.12)");
    rNet.setAttribute("stroke-width", "0.5"); rNet.setAttribute("rx", "1");
    markingsGroup.appendChild(rNet);

    this.mapGroup.appendChild(markingsGroup);

    // ── 5b. Spotlight sweep overlay ──
    const spotlight = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    spotlight.setAttribute("cx", cx); spotlight.setAttribute("cy", cy);
    spotlight.setAttribute("rx", "80"); spotlight.setAttribute("ry", "50");
    spotlight.setAttribute("fill", "url(#spotlightGrad)");
    spotlight.setAttribute("class", "pitch-spotlight");
    spotlight.setAttribute("pointer-events", "none");
    this.mapGroup.appendChild(spotlight);

    // ── 6. Concourse connection lines (pathway grid) ──
    const connGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    connGroup.setAttribute("stroke", "rgba(255, 255, 255, 0.05)");
    connGroup.setAttribute("stroke-dasharray", "4 4");
    connGroup.setAttribute("stroke-width", "1");
    connGroup.setAttribute("fill", "none");
    
    const connections = stadiumData.network.connections;
    const drawn = new Set();
    
    Object.entries(connections).forEach(([nodeId, neighbors]) => {
      const nodeA = this.nodes[nodeId];
      if (!nodeA) return;
      neighbors.forEach(neighborId => {
        const nodeB = this.nodes[neighborId];
        if (!nodeB) return;
        const key = [nodeId, neighborId].sort().join('-');
        if (!drawn.has(key)) {
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", nodeA.x); line.setAttribute("y1", nodeA.y);
          line.setAttribute("x2", nodeB.x); line.setAttribute("y2", nodeB.y);
          connGroup.appendChild(line);
          drawn.add(key);
        }
      });
    });
    this.mapGroup.appendChild(connGroup);

    // ── 7. Draw Node Groups (gates, food, transit, amenities) ──
    this.renderNodeGroup(stadiumData.gates, 'node-gate', 12);
    this.renderNodeGroup(stadiumData.concessions, 'node-concession', 11);
    this.renderNodeGroup(stadiumData.transit, 'node-transit', 13);
    this.renderNodeGroup(stadiumData.amenities, 'node-amenity', 10);

    // Draw active start/end pins if they exist
    this.drawRouteMarkers();

    // ── 8. Compass Rose ──
    this.drawCompassRose(70, 70);
  }

  // Draw compass rose at given coordinates
  drawCompassRose(x, y) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "compass-rose");
    g.setAttribute("transform", `translate(${x}, ${y})`);

    const isLight = document.body.classList.contains('light-mode');

    // Outer plate background
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bg.setAttribute("cx", 0); bg.setAttribute("cy", 0); bg.setAttribute("r", "28");
    bg.setAttribute("fill", isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(11, 15, 25, 0.85)");
    bg.setAttribute("stroke", isLight ? "rgba(15, 23, 42, 0.15)" : "rgba(255, 255, 255, 0.15)");
    bg.setAttribute("stroke-width", "1.5");
    if (!isLight) bg.setAttribute("filter", "url(#nodeGlow)");
    g.appendChild(bg);

    // Inner tick ring
    const innerRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    innerRing.setAttribute("cx", 0); innerRing.setAttribute("cy", 0);
    innerRing.setAttribute("r", "22");
    innerRing.setAttribute("fill", "none");
    innerRing.setAttribute("stroke", isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)");
    innerRing.setAttribute("stroke-dasharray", "2 3");
    g.appendChild(innerRing);

    // Compass Cross lines
    const nsLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    nsLine.setAttribute("x1", 0); nsLine.setAttribute("y1", -20);
    nsLine.setAttribute("x2", 0); nsLine.setAttribute("y2", 20);
    nsLine.setAttribute("stroke", isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)");
    g.appendChild(nsLine);

    const ewLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    ewLine.setAttribute("x1", -20); ewLine.setAttribute("y1", 0);
    ewLine.setAttribute("x2", 20); ewLine.setAttribute("y2", 0);
    ewLine.setAttribute("stroke", isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)");
    g.appendChild(ewLine);

    // North pointer (red triangle)
    const nPtr = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    nPtr.setAttribute("points", "0,-22 -5,-8 5,-8");
    nPtr.setAttribute("fill", "#ef4444");
    g.appendChild(nPtr);

    // South pointer (translucent triangle)
    const sPtr = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    sPtr.setAttribute("points", "0,22 -5,8 5,8");
    sPtr.setAttribute("fill", isLight ? "rgba(15, 23, 42, 0.25)" : "rgba(255, 255, 255, 0.25)");
    g.appendChild(sPtr);

    // Direction labels
    const dirs = [
      { text: 'N', x: 0, y: -12, color: '#ef4444' },
      { text: 'S', x: 0, y: 12, color: isLight ? '#475569' : '#94a3b8' },
      { text: 'E', x: 13, y: 0, color: isLight ? '#475569' : '#94a3b8' },
      { text: 'W', x: -13, y: 0, color: isLight ? '#475569' : '#94a3b8' }
    ];
    dirs.forEach(d => {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", d.x); t.setAttribute("y", d.y);
      t.setAttribute("dominant-baseline", "central");
      t.setAttribute("text-anchor", "middle"); t.setAttribute("fill", d.color);
      t.setAttribute("font-size", "9px"); t.setAttribute("font-weight", "800");
      t.setAttribute("font-family", "var(--font-title)");
      t.textContent = d.text;
      g.appendChild(t);
    });

    this.svg.appendChild(g);
  }

  // Draw wedges helper
  getWedgePath(cx, cy, rInner, rOuter, angleStartDeg, angleEndDeg) {
    const startRad = (angleStartDeg - 90) * Math.PI / 180;
    const endRad = (angleEndDeg - 90) * Math.PI / 180;
    
    const xInnerStart = cx + rInner * Math.cos(startRad);
    const yInnerStart = cy + rInner * Math.sin(startRad);
    const xInnerEnd = cx + rInner * Math.cos(endRad);
    const yInnerEnd = cy + rInner * Math.sin(endRad);
    
    const xOuterStart = cx + rOuter * Math.cos(startRad);
    const yOuterStart = cy + rOuter * Math.sin(startRad);
    const xOuterEnd = cx + rOuter * Math.cos(endRad);
    const yOuterEnd = cy + rOuter * Math.sin(endRad);
    
    const largeArcFlag = angleEndDeg - angleStartDeg <= 180 ? 0 : 1;
    
    return `
      M ${xInnerStart} ${yInnerStart}
      L ${xOuterStart} ${yOuterStart}
      A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${xOuterEnd} ${yOuterEnd}
      L ${xInnerEnd} ${yInnerEnd}
      A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${xInnerStart} ${yInnerStart}
      Z
    `;
  }

  // Draw node points with icon symbols and pulse rings
  renderNodeGroup(nodeList, cssClass, radius) {
    Object.values(nodeList).forEach(node => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", `map-node ${cssClass}`);
      g.setAttribute("id", `node-${node.id}`);
      g.setAttribute("transform", `translate(${node.x}, ${node.y})`);

      // Check if this node has high wait time for pulse ring
      const wait = node.waitTime !== undefined ? node.waitTime : (node.queueTime !== undefined ? node.queueTime : null);
      const isHighWait = wait !== null && wait > 10;

      // Animated pulse ring for congested nodes
      if (isHighWait) {
        const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pulse.setAttribute("cx", 0); pulse.setAttribute("cy", 0);
        pulse.setAttribute("r", radius + 4);
        pulse.setAttribute("class", "node-pulse-ring");
        g.appendChild(pulse);
      }
      
      const shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      shape.setAttribute("cx", 0); shape.setAttribute("cy", 0);
      shape.setAttribute("r", radius);
      
      // Dynamic color/glow for queues
      if (this.activeLayer === 'queues') {
        let nodeColor = '';
        if (wait !== null) {
          if (wait < 5) nodeColor = '#10b981';
          else if (wait <= 10) nodeColor = '#f59e0b';
          else nodeColor = '#ef4444';
          shape.setAttribute("fill", nodeColor);
        }
      } else if (this.activeLayer === 'ecoscore') {
        let nodeColor = '#f59e0b'; // default amber
        if (node.type === 'gate') {
          if (node.id === 'Gate A') nodeColor = '#10b981'; // near trains
          else if (node.id === 'Gate D') nodeColor = '#ef4444'; // rideshare
        } else if (node.type === 'food') {
          if (node.id === 'Vegan Goal') nodeColor = '#10b981';
          else if (node.id === 'Gridiron Grill') nodeColor = '#ef4444';
        } else if (node.type === 'transit') {
          if (node.id === 'Train Station' || node.id === 'Bus Terminal') nodeColor = '#10b981';
          else if (node.id === 'Rideshare Zone') nodeColor = '#ef4444';
        } else if (node.type === 'amenity') {
          if (node.id === 'First Aid Station' || node.id === 'Restroom North' || node.id === 'Eco Hydration Oasis') nodeColor = '#10b981';
        }
        shape.setAttribute("fill", nodeColor);
      }

      // Apply glow filter
      shape.setAttribute("filter", "url(#nodeGlow)");

      g.appendChild(shape);
      
      // Icon symbol label (descriptive glyphs)
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      
      // Emojis on Windows Segoe UI Emoji have a bottom-left bias.
      // Offset by 0.6px right and -0.6px up ONLY for food concessions to center them perfectly inside circles.
      if (node.type === 'food') {
        label.setAttribute("x", 0.6);
        label.setAttribute("y", -0.6);
      } else {
        // Gates, Transit terminals, and Amenities align perfectly at (0,0)
        label.setAttribute("x", 0);
        label.setAttribute("y", 0);
      }
      
      label.setAttribute("dominant-baseline", "central");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("class", "node-icon-symbol");
      
      let symbol = '';
      if (node.type === 'gate') {
        symbol = node.id.replace('Gate ', '');
        label.setAttribute("font-size", "11px");
        label.setAttribute("font-weight", "800");
      } else if (node.type === 'food') {
        // Food category icons
        const cat = (node.category || '').toLowerCase();
        if (cat.includes('mexican')) {
          // Rebuild Taco icon with a custom vector SVG path group to ensure perfect centering and cross-platform fidelity
          const tacoGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
          tacoGroup.setAttribute("class", "custom-svg-taco");
          tacoGroup.setAttribute("pointer-events", "none");
          tacoGroup.setAttribute("transform", "translate(-0.5, 0.5)"); // perfectly centers the graphic inside the circle
          
          // Lettuce/fillings layer (green stroke)
          const lettuce = document.createElementNS("http://www.w3.org/2000/svg", "path");
          lettuce.setAttribute("d", "M -5.5,-1 Q -3,-4.5 0,-2.5 Q 3,-4.5 5.5,-1");
          lettuce.setAttribute("fill", "none");
          lettuce.setAttribute("stroke", "#10b981");
          lettuce.setAttribute("stroke-width", "2");
          lettuce.setAttribute("stroke-linecap", "round");
          
          // Red tomatoes layer
          const tomato1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          tomato1.setAttribute("cx", "-2");
          tomato1.setAttribute("cy", "-2.5");
          tomato1.setAttribute("r", "1.3");
          tomato1.setAttribute("fill", "#ef4444");

          const tomato2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          tomato2.setAttribute("cx", "2");
          tomato2.setAttribute("cy", "-2.5");
          tomato2.setAttribute("r", "1.3");
          tomato2.setAttribute("fill", "#ef4444");
          
          // Yellow-gold shell layer
          const shell = document.createElementNS("http://www.w3.org/2000/svg", "path");
          shell.setAttribute("d", "M -6.5,1.5 C -6.5,-3.5 6.5,-3.5 6.5,1.5 Z");
          shell.setAttribute("fill", "#fbbf24");
          shell.setAttribute("stroke", "#d97706");
          shell.setAttribute("stroke-width", "1");
          shell.setAttribute("stroke-linejoin", "round");

          tacoGroup.appendChild(lettuce);
          tacoGroup.appendChild(tomato1);
          tacoGroup.appendChild(tomato2);
          tacoGroup.appendChild(shell);
          
          g.appendChild(tacoGroup);
          symbol = ''; // no text label needed
        } else if (cat.includes('grill')) symbol = '🍔';
        else if (cat.includes('italian') || cat.includes('pizza')) symbol = '🍕';
        else if (cat.includes('vegan')) symbol = '🥗';
        else if (cat.includes('drink') || cat.includes('brew')) symbol = '🍺';
        else if (cat.includes('dessert') || cat.includes('sweet')) symbol = '🧁';
        else symbol = '🍽';
        label.setAttribute("font-size", "11.5px");
      } else if (node.type === 'transit') {
        const desc = (node.name || '').toLowerCase();
        if (desc.includes('train') || desc.includes('rail')) symbol = '🚆';
        else if (desc.includes('shuttle')) symbol = '🚌';
        else if (desc.includes('rideshare')) symbol = '🚗';
        else if (desc.includes('bus')) symbol = '🚍';
        else symbol = '🚏';
        label.setAttribute("font-size", "13px");
      } else if (node.type === 'amenity') {
        if (node.subType === 'restroom') symbol = '🚻';
        else if (node.subType === 'firstaid') symbol = '🏥';
        else if (node.subType === 'merch') symbol = '🛍';
        else if (node.subType === 'water') symbol = '💧';
        else if (node.subType === 'info') symbol = '📋';
        else symbol = 'ℹ';
        label.setAttribute("font-size", "12px");
      }
      
      label.textContent = symbol;
      g.appendChild(label);

      // Tooltip description (enhanced)
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      let tooltipText = `${node.name}`;
      if (node.waitTime !== undefined) tooltipText += `\nWait Time: ${node.waitTime} mins`;
      else if (node.queueTime !== undefined) tooltipText += `\nQueue Time: ${node.queueTime} mins`;
      if (node.status) tooltipText += `\nStatus: ${node.status}`;
      if (node.category) tooltipText += `\nCategory: ${node.category}`;
      if (node.description) tooltipText += `\n${node.description}`;
      title.textContent = tooltipText;
      g.appendChild(title);
      
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleNodeClick(node.id);
      });
      
      this.mapGroup.appendChild(g);
    });
  }

  // Update Seating Sectors colors based on Layer Toggle (Queues/Density or Heatmap)
  updateSectionStyle(wedge, sectionId) {
    if (this.activeLayer === 'heatmap') {
      const density = this.crowdHeatmap[sectionId] || 15; // default 15%
      let color = '';
      if (density < 30) color = 'rgba(16, 185, 129, 0.25)'; // green shade
      else if (density < 65) color = 'rgba(245, 158, 11, 0.4)'; // amber shade
      else color = 'rgba(239, 68, 68, 0.6)'; // red congestion shade
      
      wedge.style.fill = color;
      wedge.style.stroke = 'rgba(255,255,255,0.15)';
    } else if (this.activeLayer === 'ecoscore') {
      const secNum = parseInt(sectionId);
      let color = 'rgba(245, 158, 11, 0.25)'; // Default amber shade
      if ([101, 102, 103, 108, 112].includes(secNum)) {
        color = 'rgba(16, 185, 129, 0.3)'; // Green shade (highly eco friendly)
      } else if ([104, 109, 111].includes(secNum)) {
        color = 'rgba(239, 68, 68, 0.3)'; // Red shade (low eco friendly)
      }
      wedge.style.fill = color;
      wedge.style.stroke = 'rgba(255,255,255,0.15)';
    } else {
      // Standard visual styling for seat sections
      if (this.selectedNodeId === sectionId) {
        wedge.style.fill = 'rgba(6, 182, 212, 0.25)';
        wedge.style.stroke = 'var(--primary)';
      } else {
        if (document.body.classList.contains('light-mode')) {
          wedge.style.fill = '#e2e8f0';
          wedge.style.stroke = '#cbd5e1';
        } else {
          wedge.style.fill = '#151d2a';
          wedge.style.stroke = '#223249';
        }
      }
    }
  }

  // Toggle Map Views
  setLayer(layerName) {
    this.activeLayer = layerName;
    if (this.mapGroup) {
      const mapSections = this.mapGroup.querySelectorAll('.map-section');
      mapSections.forEach(wedge => {
        const sectionId = wedge.getAttribute('data-section-id');
        this.updateSectionStyle(wedge, sectionId);
      });
      
      // Rerender the nodes to update their colors/glows
      this.mapGroup.querySelectorAll('.map-node').forEach(node => node.remove());
      this.renderNodeGroup(stadiumData.gates, 'node-gate', 12);
      this.renderNodeGroup(stadiumData.concessions, 'node-concession', 11);
      this.renderNodeGroup(stadiumData.transit, 'node-transit', 13);
      this.renderNodeGroup(stadiumData.amenities, 'node-amenity', 10);
    }
  }

  // Set crowd heatmap density from external simulator
  setHeatmapData(densityMap) {
    this.crowdHeatmap = densityMap;
    if (this.activeLayer === 'heatmap') {
      this.setLayer('heatmap');
    }
  }

  // Highlight a specific section or node from search or click
  handleNodeClick(nodeId) {
    const node = this.nodes[nodeId];
    if (!node) return;
    
    const prevSelected = this.selectedNodeId;
    this.selectedNodeId = nodeId;
    
    // Refresh visual selections
    const sections = this.svg.querySelectorAll('.map-section');
    sections.forEach(wedge => {
      const secId = wedge.getAttribute('data-section-id');
      if (secId === prevSelected || secId === nodeId) {
        this.updateSectionStyle(wedge, secId);
      }
    });

    // Update node glow
    this.svg.querySelectorAll('.map-node').forEach(n => {
      n.classList.remove('selected-node-pulse');
      if (n.getAttribute('id') === `node-${nodeId}`) {
        n.classList.add('selected-node-pulse');
      }
    });

    // Dispatches custom event to notify main JS to update details and offer routing options
    const event = new CustomEvent('stadiumNodeSelected', { 
      detail: { nodeId, node, prevSelected } 
    });
    window.dispatchEvent(event);

    // If both prevSelected was a Gate/Transit and current is a Section/Food, trigger pathfinder automatically!
    const isFanMode = document.getElementById('btnToggleFan').classList.contains('active');
    if (isFanMode && prevSelected && prevSelected !== nodeId) {
      const prevNode = this.nodes[prevSelected];
      if (prevNode && (prevNode.type === 'gate' || prevNode.type === 'transit') && (node.type === 'section' || node.type === 'food' || node.type === 'amenity')) {
        this.findAndDrawRoute(prevSelected, nodeId);
      }
    }
  }

  // Shortest path routing using BFS
  findAndDrawRoute(startId, endId) {
    // Clear previous route
    const existingRoute = document.getElementById('active-route-line');
    if (existingRoute) existingRoute.remove();

    // Track the current routing endpoints
    this.routeStartNodeId = startId;
    this.routeEndNodeId = endId;

    const path = this.bfs(startId, endId);
    if (!path || path.length === 0) {
      document.getElementById('routeOverlayCard').classList.add('hidden');
      this.drawRouteMarkers();
      return;
    }

    // Draw route path
    const routeCoordinates = path.map(id => this.nodes[id]);
    
    // Render custom path using SVG spline/lines
    const dAttr = this.generateSvgPathString(routeCoordinates);
    
    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement.setAttribute("d", dAttr);
    pathElement.setAttribute("class", "route-path");
    pathElement.setAttribute("id", "active-route-line");
    
    // Prepend to render below nodes inside the zoom group
    this.mapGroup.insertBefore(pathElement, this.mapGroup.querySelector('.map-node'));

    // Draw pins at start and destination
    this.drawRouteMarkers();

    // Compute route parameters
    const totalTime = this.calculateRouteTime(path);
    const startNodeName = this.nodes[startId].name;
    const endNodeName = this.nodes[endId].name;
    
    // Display instructions
    const routeDetails = document.getElementById('routeDetails');
    const routeOverlayCard = document.getElementById('routeOverlayCard');
    
    routeDetails.innerHTML = `
      <div class="route-stat">
        <span>From:</span>
        <span>${startNodeName}</span>
      </div>
      <div class="route-stat">
        <span>To:</span>
        <span>${endNodeName}</span>
      </div>
      <div class="route-stat">
        <span>Est. Walking Time:</span>
        <span style="color: var(--primary); font-weight: 700;">${totalTime} mins</span>
      </div>
      <div class="route-direction">
        <h5>AI Smart-Route Active</h5>
        <p>Path optimized to avoid congested concourses. Standard accessibility ramps used.</p>
      </div>
      <div class="route-actions-row">
        <button id="btnMapClearRoute" class="btn btn-secondary btn-xs" style="width: 100%; border-radius: 8px;"><i data-lucide="x"></i> Clear Route</button>
      </div>
    `;
    
    routeOverlayCard.classList.remove('hidden');

    // Attach clear event inside overlay
    const btnMapClearRoute = document.getElementById('btnMapClearRoute');
    if (btnMapClearRoute) {
      btnMapClearRoute.onclick = () => this.clearRoute();
    }
    if (window.lucide) window.lucide.createIcons();
  }

  clearRoute() {
    const existingRoute = document.getElementById('active-route-line');
    if (existingRoute) existingRoute.remove();
    this.routeStartNodeId = null;
    this.routeEndNodeId = null;
    this.drawRouteMarkers();
    document.getElementById('routeOverlayCard').classList.add('hidden');
  }

  // Sets custom start routing point
  setRouteStart(nodeId) {
    this.routeStartNodeId = nodeId;
    if (this.routeStartNodeId && this.routeEndNodeId) {
      this.findAndDrawRoute(this.routeStartNodeId, this.routeEndNodeId);
    } else {
      this.drawRouteMarkers();
    }
  }

  // Sets custom destination routing point
  setRouteEnd(nodeId) {
    this.routeEndNodeId = nodeId;
    if (this.routeStartNodeId && this.routeEndNodeId) {
      this.findAndDrawRoute(this.routeStartNodeId, this.routeEndNodeId);
    } else {
      this.drawRouteMarkers();
    }
  }

  // Renders visual pins on the map for route start/destination endpoints
  drawRouteMarkers() {
    if (!this.mapGroup) return;
    
    // Manage floating clear button visibility
    const floatBtn = document.getElementById('btnMapFloatClearRoute');
    if (floatBtn) {
      if (this.routeStartNodeId || this.routeEndNodeId) {
        floatBtn.classList.remove('hidden');
      } else {
        floatBtn.classList.add('hidden');
      }
    }
    
    // Clean old markers
    this.mapGroup.querySelectorAll('.route-marker-group').forEach(pin => pin.remove());

    if (this.routeStartNodeId) {
      const startNode = this.nodes[this.routeStartNodeId];
      if (startNode) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "route-marker-group start-marker-group");
        g.setAttribute("transform", `translate(${startNode.x}, ${startNode.y})`);
        
        // Outer pulsing ring
        const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pulse.setAttribute("cx", 0); pulse.setAttribute("cy", 0);
        pulse.setAttribute("r", "16");
        pulse.setAttribute("fill", "none");
        pulse.setAttribute("stroke", "#10b981");
        pulse.setAttribute("stroke-width", "2");
        pulse.setAttribute("class", "node-pulse-ring");
        g.appendChild(pulse);

        // Main pin circle
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", 0); circle.setAttribute("cy", 0);
        circle.setAttribute("r", "11");
        circle.setAttribute("class", "start-marker");
        g.appendChild(circle);

        // Icon text
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", 0); text.setAttribute("y", 3.5);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#fff");
        text.setAttribute("font-size", "10px");
        text.setAttribute("font-weight", "900");
        text.setAttribute("font-family", "var(--font-title)");
        text.textContent = "S";
        g.appendChild(text);

        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `Start Point: ${startNode.name || this.routeStartNodeId}`;
        g.appendChild(title);
        
        this.mapGroup.appendChild(g);
      }
    }

    if (this.routeEndNodeId) {
      const endNode = this.nodes[this.routeEndNodeId];
      if (endNode) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "route-marker-group dest-marker-group");
        g.setAttribute("transform", `translate(${endNode.x}, ${endNode.y})`);
        
        // Outer pulsing ring
        const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pulse.setAttribute("cx", 0); pulse.setAttribute("cy", 0);
        pulse.setAttribute("r", "16");
        pulse.setAttribute("fill", "none");
        pulse.setAttribute("stroke", "#ef4444");
        pulse.setAttribute("stroke-width", "2");
        pulse.setAttribute("class", "node-pulse-ring");
        g.appendChild(pulse);

        // Main pin circle
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", 0); circle.setAttribute("cy", 0);
        circle.setAttribute("r", "11");
        circle.setAttribute("class", "dest-marker");
        g.appendChild(circle);

        // Icon text
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", 0); text.setAttribute("y", 3.5);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#fff");
        text.setAttribute("font-size", "10px");
        text.setAttribute("font-weight", "900");
        text.setAttribute("font-family", "var(--font-title)");
        text.textContent = "D";
        g.appendChild(text);

        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `Destination: ${endNode.name || this.routeEndNodeId}`;
        g.appendChild(title);
        
        this.mapGroup.appendChild(g);
      }
    }
  }

  // Draw animated dispatch vector from Hub to target node
  drawDispatchVector(targetId) {
    const startNode = stadiumData.dispatchHub || { x: 400, y: 280 };
    const targetNode = this.nodes[targetId];
    if (!targetNode) return;

    // Clear previous dispatch vectors if they exist
    const existingVector = document.getElementById('dispatch-vector-line');
    if (existingVector) existingVector.remove();

    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const dAttr = `M ${startNode.x} ${startNode.y} L ${targetNode.x} ${targetNode.y}`;
    pathElement.setAttribute("d", dAttr);
    pathElement.setAttribute("class", "dispatch-vector-line");
    pathElement.setAttribute("id", "dispatch-vector-line");

    // Insert route line before map nodes inside the zoom group
    this.mapGroup.insertBefore(pathElement, this.mapGroup.querySelector('.map-node'));

    // Automatically remove drawing after 4 seconds
    setTimeout(() => {
      if (pathElement.parentNode) {
        pathElement.remove();
      }
    }, 4000);
  }

  // BFS search helper on static graph
  bfs(startId, endId) {
    const queue = [[startId]];
    const visited = new Set([startId]);
    const connections = stadiumData.network.connections;

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];

      if (node === endId) {
        return path;
      }

      const neighbors = connections[node] || [];
      for (let neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    return null; // No path found
  }

  // Generate SVG path coordinate line
  generateSvgPathString(routeCoords) {
    if (routeCoords.length === 0) return '';
    let d = `M ${routeCoords[0].x} ${routeCoords[0].y}`;
    for (let i = 1; i < routeCoords.length; i++) {
      // Standard line segments
      d += ` L ${routeCoords[i].x} ${routeCoords[i].y}`;
    }
    return d;
  }

  // Calculate walking time based on congestion metrics of nodes
  calculateRouteTime(path) {
    let baseTime = (path.length - 1) * 2; // 2 minutes per segment walk
    
    // Add wait/congestions times of nodes passed through
    path.forEach(nodeId => {
      const node = this.nodes[nodeId];
      if (!node) return;
      if (node.queueTime) baseTime += Math.floor(node.queueTime / 4);
      if (node.waitTime) baseTime += Math.floor(node.waitTime / 4);
    });

    return Math.max(2, baseTime);
  }
}
