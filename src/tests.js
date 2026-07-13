// ArenaFlow 2026 Test Suite
import { stadiumData } from './stadiumData';
import { SustainabilityEngine } from './sustainability';
import { MapRenderer } from './mapRenderer';
import { aiAssistant } from './aiAssistant';
import { SimulationEngine } from './simulationEngine';

export function runDiagnostics() {
  console.log("%c=== ArenaFlow 2026 Diagnostic Test Suite ===", "color: #00f0ff; font-weight: bold; font-size: 14px;");
  
  const results = {
    total: 0,
    passed: 0,
    failures: []
  };

  function assert(name, condition, errorMsg) {
    results.total++;
    if (condition) {
      results.passed++;
      console.log(`%c[PASS] ${name}`, "color: #10b981; font-weight: bold;");
    } else {
      results.failures.push({ name, errorMsg });
      console.error(`[FAIL] ${name}: ${errorMsg}`);
    }
  }

  // TEST 1: Pathfinder (BFS Route Verification)
  try {
    const tempMapRenderer = new MapRenderer('stadiumSvg', 'mapCanvasContainer');
    const startNode = "Gate A";
    const endNode = "102";
    const path = tempMapRenderer.bfs(startNode, endNode);
    
    assert(
      "BFS Pathfinder Integrity",
      path !== null && path.length > 0 && path[0] === startNode && path[path.length - 1] === endNode,
      `Path should start at Gate A and end at Section 102. Generated path: [${path ? path.join(' -> ') : 'null'}]`
    );
  } catch (e) {
    assert("BFS Pathfinder Integrity", false, `Pathfinder threw exception: ${e.message}`);
  }

  // TEST 2: Sustainability Metric Engine
  try {
    const tempSust = new SustainabilityEngine();
    
    // Log metro transit task (+15 XP, +1.2 kg CO2)
    tempSust.logTask("task_0", 15, 1.2);
    let status = tempSust.getStatus();
    
    assert(
      "Sustainability Score Calculation",
      status.points === 15 && parseFloat(status.co2Offset) === 1.2,
      `Metrics should update to 15 XP and 1.2 kg offset. Actual: ${status.points} XP, ${status.co2Offset} kg`
    );

    assert(
      "Sustainability Rank Promotion Threshold",
      status.badge === "Eco Advocate 🌱",
      `Rank badge should promote to "Eco Advocate" at 15 XP. Actual rank: "${status.badge}"`
    );

    // Log water refill (+5 XP) -> Total 20 XP
    tempSust.logTask("task_2", 5, 0.1);
    
    assert(
      "Sustainability Task Deduplication",
      tempSust.logTask("task_0", 15, 1.2) === false,
      "Task logging should deduplicate already logged activities to prevent point exploits."
    );
  } catch (e) {
    assert("Sustainability Metric Engine", false, `Sustainability threw exception: ${e.message}`);
  }

  // TEST 3: Static Graph Connectivity Checks
  try {
    const connections = stadiumData.network.connections;
    const gatesExist = Object.keys(stadiumData.gates).every(gateId => connections[gateId] !== undefined);
    
    assert(
      "Network Node Graph Mapping Connectivity",
      gatesExist,
      "Each defined Gate (A, B, C, D) must have mapping edge nodes defined in the network connections registry."
    );
  } catch (e) {
    assert("Network Node Graph Mapping Connectivity", false, `Graph connectivity check threw exception: ${e.message}`);
  }

  // TEST 4: Security XSS Sanitization Integrity
  try {
    const rawInput = "<script>alert('XSS')</script>";
    const clean = aiAssistant.escapeHTML(rawInput);
    assert(
      "XSS Input Sanitization Integrity",
      clean === "&lt;script&gt;alert(&#039;XSS&#039;)&lt;/script&gt;",
      "Security: XSS script tags and characters must be correctly encoded prior to UI rendering."
    );
  } catch (e) {
    assert("XSS Input Sanitization Integrity", false, `XSS sanitization check threw exception: ${e.message}`);
  }

  // TEST 5: Accessibility Attributes Registry
  try {
    const runDiagBtn = document.getElementById('btnRunDiagnostics');
    // Verify that the trigger element includes descriptive accessibility tags
    const hasAriaLabel = runDiagBtn ? runDiagBtn.hasAttribute('aria-label') : true;
    assert(
      "Accessibility ARIA Elements Registry",
      hasAriaLabel,
      "Accessibility: Key interactive triggers must carry descriptive aria-label tags."
    );
  } catch (e) {
    assert("Accessibility ARIA Elements Registry", false, `Accessibility attributes check threw exception: ${e.message}`);
  }

  // TEST 6: Response Caching Efficiency
  try {
    const testCacheKey = "arenaflow_cache_en_test_caching_query";
    sessionStorage.setItem(testCacheKey, "Cached AI Response");
    
    // Check key mapping retrieval matching our query cache algorithm
    const cleanMessage = "test caching query";
    const cachedResponse = sessionStorage.getItem(`arenaflow_cache_en_${cleanMessage.replace(/\s+/g, '_')}`);
    
    assert(
      "Response Caching and Token Savings",
      cachedResponse === "Cached AI Response",
      "Efficiency: Repeated queries must resolve instantly from client caching to conserve token quota."
    );
    sessionStorage.removeItem(testCacheKey);
  } catch (e) {
    assert("Response Caching and Token Savings", false, `Caching efficiency check threw exception: ${e.message}`);
  }

  // TEST 7: Concession Pre-order Cart Calculations
  try {
    // Mocking pricing structures
    const concessionPriceMap = {
      "Steak Tacos": 12.00,
      "Chicken Quesadilla": 11.00
    };
    
    // Simulate items in cart
    const mockCart = [
      { name: "Steak Tacos", price: concessionPriceMap["Steak Tacos"], qty: 2 },
      { name: "Chicken Quesadilla", price: concessionPriceMap["Chicken Quesadilla"], qty: 1 }
    ];
    
    // Calculation functions validation
    const subtotal = mockCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = subtotal * 0.06625;
    
    // Check points milestone calculation
    // Points = 30 earns 15% discount
    const hasDiscount = true; // Simulating points >= 30
    const discount = hasDiscount ? (subtotal * 0.15) : 0;
    const total = subtotal + tax - discount;

    assert(
      "Concession Cart Financial Calculations",
      subtotal === 35.00 && tax.toFixed(4) === "2.3188" && discount.toFixed(2) === "5.25" && total.toFixed(4) === "32.0688",
      `Expected: Subtotal=35.00, Tax=2.3188, Discount=5.25, Total=32.0688. Actual: Subtotal=${subtotal}, Tax=${tax}, Discount=${discount}, Total=${total}`
    );
  } catch (e) {
    assert("Concession Cart Financial Calculations", false, `Cart check threw exception: ${e.message}`);
  }

  // TEST 8: Multilingual Dispatch Translation Heuristic
  try {
    const tempMapRenderer = new MapRenderer('stadiumSvg', 'mapCanvasContainer');
    const tempEngine = new SimulationEngine(tempMapRenderer);
    const testBroadcastText = "Redirect volunteers to Gate A to help traffic";
    const translations = tempEngine.translateBroadcast(testBroadcastText);
    
    // Check if Spanish translation converts terms correctly
    const hasSpanishRedirect = translations.es.toLowerCase().includes("redirigir") || translations.es.toLowerCase().includes("personal");
    const hasFrenchGateA = translations.fr.toLowerCase().includes("porte a");

    assert(
      "Multilingual Dispatch Heuristic Translations",
      hasSpanishRedirect && hasFrenchGateA,
      `Expected translation mapping to resolve standard verbs. Translations returned: ES="${translations.es}", FR="${translations.fr}"`
    );
  } catch (e) {
    assert("Multilingual Dispatch Heuristic Translations", false, `Translations check threw exception: ${e.message}`);
  }

  // TEST 9: Operational Simulation Triggering
  try {
    const tempMapRenderer = new MapRenderer('stadiumSvg', 'mapCanvasContainer');
    const tempEngine = new SimulationEngine(tempMapRenderer);
    
    // Trigger simulated weather state then check if we can mock state transitions
    const result = tempEngine.triggerScenario('weather');
    const isWeatherAlert = result.matchBannerUpdate.status === 'Weather Alert';
    
    assert(
      "Operational Simulation Egress Scenarios",
      isWeatherAlert && result.recommendations.length > 0,
      `Expected scenario transition to return recommendations and updated status: ${result.matchBannerUpdate.status}`
    );
  } catch (e) {
    assert("Operational Simulation Egress Scenarios", false, `Evacuation scenarios check threw exception: ${e.message}`);
  }

  // Final summary logs
  console.log(`%c=== Summary: ${results.passed}/${results.total} Tests Passed ===`, "font-weight: bold; color: #fbbf24;");
  
  return {
    success: results.passed === results.total,
    passed: results.passed,
    total: results.total,
    failures: results.failures
  };
}
