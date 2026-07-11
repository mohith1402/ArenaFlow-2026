// ArenaFlow 2026 Stadium Database

export const stadiumData = {
  name: "MetLife Stadium (NYNJ Host Venue)",
  capacity: 82500,
  match: {
    teams: "USA vs ENGLAND",
    stage: "Group Stage - Matchday 3",
    date: "July 7, 2026",
    time: "20:00 EST"
  },
  
  // Navigation nodes and map coordinates
  mapDimensions: { width: 800, height: 600 },
  center: { x: 400, y: 280 },
  dispatchHub: { x: 400, y: 280 },
  
  gates: {
    "Gate A": { id: "Gate A", name: "Gate A (North / Rail Gate)", x: 400, y: 70, type: "gate", status: "Open", queueTime: 5, description: "Direct access to MetLife Train Station. Highly accessible ramps.", accessibility: true },
    "Gate B": { id: "Gate B", name: "Gate B (East / Shuttle Gate)", x: 670, y: 280, type: "gate", status: "Open", queueTime: 12, description: "Near the Express Bus and Shuttle loop. Medium congestion.", accessibility: true },
    "Gate C": { id: "Gate C", name: "Gate C (South Gate)", x: 400, y: 490, type: "gate", status: "Open", queueTime: 8, description: "Main gate for park-and-ride lot arrivals. Normal flow.", accessibility: false },
    "Gate D": { id: "Gate D", name: "Gate D (West / Rideshare Gate)", x: 130, y: 280, type: "gate", status: "Open", queueTime: 6, description: "Direct pathway to Rideshare Zone (Lot G). Quick entry.", accessibility: true }
  },

  transit: {
    "Train Station": { id: "Train Station", name: "MetLife Central Rail Station", x: 400, y: 15, type: "transit", status: "Normal Service", frequency: "Every 6 minutes", description: "Direct line to Secaucus Junction & NYC Penn Station. Eco-friendly transit." },
    "Shuttle Terminal": { id: "Shuttle Terminal", name: "Sponsor Shuttle Loop", x: 740, y: 280, type: "transit", status: "Normal Service", frequency: "Every 10 minutes", description: "Free fan shuttles to remote Parking Lots A, B, and C." },
    "Rideshare Zone": { id: "Rideshare Zone", name: "Rideshare Pickup Lot G", x: 60, y: 280, type: "transit", status: "Congested", frequency: "On Demand", description: "Designated Uber/Lyft pickup bays. Expect high traffic." },
    "Bus Terminal": { id: "Bus Terminal", name: "Express Bus Terminal", x: 400, y: 560, type: "transit", status: "Normal Service", frequency: "Every 8 minutes", description: "Direct bus routes to Manhattan Port Authority and local transit hubs." }
  },

  concessions: {
    "Taco Cantina": { 
      id: "Taco Cantina", 
      name: "Section 102 - Taco Cantina", 
      x: 300, 
      y: 110, 
      type: "food", 
      category: "Mexican", 
      menu: ["Steak Tacos ($12)", "Chicken Quesadilla ($11)", "Chips & Guacamole ($6)"], 
      menuPrices: { "Steak Tacos": 12.00, "Chicken Quesadilla": 11.00, "Chips & Guacamole": 6.00 },
      waitTime: 4, 
      vegan: false, 
      halal: true, 
      glutenFree: true 
    },
    "Gridiron Grill": { 
      id: "Gridiron Grill", 
      name: "Section 104 - Gridiron Grill", 
      x: 540, 
      y: 180, 
      type: "food", 
      category: "Grill", 
      menu: ["Classic Cheeseburger ($14)", "Stadium Hot Dog ($8)", "Jumbo Fries ($6)"], 
      menuPrices: { "Classic Cheeseburger": 14.00, "Stadium Hot Dog": 8.00, "Jumbo Fries": 6.00 },
      waitTime: 15, 
      vegan: false, 
      halal: false, 
      glutenFree: false 
    },
    "Pizza Pitch": { 
      id: "Pizza Pitch", 
      name: "Section 106 - Pizza Pitch", 
      x: 600, 
      y: 280, 
      type: "food", 
      category: "Italian", 
      menu: ["Margherita Pizza Slice ($9)", "Pepperoni Pizza Slice ($10)", "Garlic Knots ($6)", "Soft Drink ($6)"], 
      menuPrices: { "Margherita Pizza Slice": 9.00, "Pepperoni Pizza Slice": 10.00, "Garlic Knots": 6.00, "Soft Drink": 6.00 },
      waitTime: 8, 
      vegan: false, 
      halal: true, 
      glutenFree: false 
    },
    "Vegan Goal": { 
      id: "Vegan Goal", 
      name: "Section 108 - The Vegan Goal", 
      x: 540, 
      y: 380, 
      type: "food", 
      category: "Vegan", 
      menu: ["Beyond Burger ($15)", "Loaded Vegan Nachos ($12)", "Kale Salad ($10)"], 
      menuPrices: { "Beyond Burger": 15.00, "Loaded Vegan Nachos": 12.00, "Kale Salad": 10.00 },
      waitTime: 3, 
      vegan: true, 
      halal: true, 
      glutenFree: true 
    },
    "World Cup Brews": { 
      id: "World Cup Brews", 
      name: "Section 110 - World Cup Brews", 
      x: 260, 
      y: 380, 
      type: "food", 
      category: "Drinks", 
      menu: ["Budweiser ($11)", "Local Craft IPA ($13)", "Soft Drink ($6)", "Bottled Water ($5)"], 
      menuPrices: { "Budweiser": 11.00, "Local Craft IPA": 13.00, "Soft Drink": 6.00, "Bottled Water": 5.00 },
      waitTime: 7, 
      vegan: true, 
      halal: true, 
      glutenFree: true 
    },
    "Sweet Stadium": { 
      id: "Sweet Stadium", 
      name: "Section 112 - Sweet Stadium", 
      x: 200, 
      y: 280, 
      type: "food", 
      category: "Dessert", 
      menu: ["Churros Basket ($8)", "Cotton Candy Tub ($7)", "Cyber Sweet Cupcake ($6)", "Bottled Water ($5)"], 
      menuPrices: { "Churros Basket": 8.00, "Cotton Candy Tub": 7.00, "Cyber Sweet Cupcake": 6.00, "Bottled Water": 5.00 },
      waitTime: 5, 
      vegan: true, 
      halal: true, 
      glutenFree: true 
    }
  },

  amenities: {
    "Restroom North": { id: "Restroom North", name: "Restroom - Section 101 (North Concourse)", x: 400, y: 110, type: "amenity", subType: "restroom", waitTime: 5, genderNeutral: true, accessible: true },
    "Restroom South": { id: "Restroom South", name: "Restroom - Section 107 (South Concourse)", x: 400, y: 450, type: "amenity", subType: "restroom", waitTime: 12, genderNeutral: false, accessible: true },
    "Restroom East": { id: "Restroom East", name: "Restroom - Section 105 (East Concourse)", x: 590, y: 280, type: "amenity", subType: "restroom", waitTime: 8, genderNeutral: true, accessible: true },
    "Restroom West": { id: "Restroom West", name: "Restroom - Section 111 (West Concourse)", x: 210, y: 280, type: "amenity", subType: "restroom", waitTime: 2, genderNeutral: false, accessible: true },
    "First Aid Station": { id: "First Aid Station", name: "Emergency First Aid - Section 112", x: 230, y: 200, type: "amenity", subType: "firstaid", waitTime: 0, description: "24/7 Medical Staff and CPR units. Wheelchairs available." },
    "Fan Support Hub": { id: "Fan Support Hub", name: "Section 103 - Fan Support Hub", x: 550, y: 140, type: "amenity", subType: "info", waitTime: 2, description: "Information, lost & found, translations, and general event inquiries." },
    "Fan Gear Store": { id: "Fan Gear Store", name: "Section 105 - Fan Gear Megastore", x: 570, y: 230, type: "amenity", subType: "merch", waitTime: 10, description: "Official FIFA World Cup jerseys, flags, scarfs, and tournament merchandise." },
    "Eco Hydration Oasis": { id: "Eco Hydration Oasis", name: "Section 108 - Eco Hydration Oasis", x: 450, y: 420, type: "amenity", subType: "water", waitTime: 1, description: "Chilled water refill station. Brings your own bottle to earn Eco Points!" }
  },

  sections: {
    "101": { id: "101", name: "Section 101", angleStart: 285, angleEnd: 315, capacity: 5500, category: "Premium West", price: 250 },
    "102": { id: "102", name: "Section 102", angleStart: 315, angleEnd: 345, capacity: 6000, category: "North Goal Zone", price: 150 },
    "103": { id: "103", name: "Section 103", angleStart: 345, angleEnd: 15,  capacity: 5500, category: "Premium East", price: 250 },
    "104": { id: "104", name: "Section 104", angleStart: 15,  angleEnd: 45,  capacity: 6500, category: "East Concourse", price: 180 },
    "105": { id: "105", name: "Section 105", angleStart: 45,  angleEnd: 75,  capacity: 7000, category: "East Goal Zone", price: 120 },
    "106": { id: "106", name: "Section 106", angleStart: 75,  angleEnd: 105, capacity: 6500, category: "East Concourse", price: 180 },
    "107": { id: "107", name: "Section 107", angleStart: 105, angleEnd: 135, capacity: 5500, category: "Premium East", price: 250 },
    "108": { id: "108", name: "Section 108", angleStart: 135, angleEnd: 165, capacity: 6000, category: "South Goal Zone", price: 150 },
    "109": { id: "109", name: "Section 109", angleStart: 165, angleEnd: 195, capacity: 5500, category: "Premium West", price: 250 },
    "110": { id: "110", name: "Section 110", angleStart: 195, angleEnd: 225, capacity: 6500, category: "West Concourse", price: 180 },
    "111": { id: "111", name: "Section 111", angleStart: 225, angleEnd: 255, capacity: 7000, category: "West Goal Zone", price: 120 },
    "112": { id: "112", name: "Section 112", angleStart: 255, angleEnd: 285, capacity: 6500, category: "West Concourse", price: 180 }
  },

  // Navigation Network for AI Pathfinding
  // Defines nodes and their direct connections (edges) for a BFS/Dijkstra routing grid.
  // Each node connects to nearby concessions, gates, sections, amenities, or concourse junctions.
  network: {
    // Junction points in the inner ring/concourse
    "J1": { x: 300, y: 200 },
    "J2": { x: 500, y: 200 },
    "J3": { x: 500, y: 360 },
    "J4": { x: 300, y: 360 },
    
    // Connections mapping: [NodeId] -> Array of [ConnectedNodeId]
    connections: {
      // Gates to Junctions / Transit
      "Gate A": ["Train Station", "Restroom North", "J1", "J2"],
      "Gate B": ["Shuttle Terminal", "Restroom East", "J2", "J3"],
      "Gate C": ["Bus Terminal", "Restroom South", "J3", "J4"],
      "Gate D": ["Rideshare Zone", "Restroom West", "J1", "J4"],
      
      // Junctions to Concessions and Amenities
      "J1": ["Gate A", "Gate D", "Taco Cantina", "Sweet Stadium", "First Aid Station", "Restroom North", "Restroom West", "101", "102", "112"],
      "J2": ["Gate A", "Gate B", "Gridiron Grill", "Restroom North", "Restroom East", "103", "104", "105", "Fan Gear Store", "Fan Support Hub"],
      "J3": ["Gate B", "Gate C", "Vegan Goal", "Pizza Pitch", "Restroom East", "Restroom South", "106", "107", "108", "Eco Hydration Oasis"],
      "J4": ["Gate C", "Gate D", "World Cup Brews", "First Aid Station", "Restroom West", "Restroom South", "109", "110", "111"],
      
      // Concessions / Amenities linkages
      "Taco Cantina": ["J1", "Restroom North"],
      "Gridiron Grill": ["J2", "Restroom East"],
      "Pizza Pitch": ["J3", "Restroom East"],
      "Vegan Goal": ["J3", "Restroom South"],
      "World Cup Brews": ["J4", "Restroom West"],
      "Sweet Stadium": ["J1", "First Aid Station"],
      "First Aid Station": ["J1", "J4"],
      "Fan Gear Store": ["J2", "Restroom East"],
      "Fan Support Hub": ["J2"],
      "Eco Hydration Oasis": ["J3"],
      
      // Transit connections
      "Train Station": ["Gate A"],
      "Shuttle Terminal": ["Gate B"],
      "Rideshare Zone": ["Gate D"],
      "Bus Terminal": ["Gate C"]
    }
  },

  // Base Guidelines / Q&A database for local AI assistant backup
  faq: {
    en: [
      { keywords: ["bag", "backpack", "policy"], answer: "FIFA World Cup 2026 Bag Policy: Only clear bags (plastic, vinyl, or PVC) not exceeding 12\" x 6\" x 12\" are permitted. Small clutch bags/purses under 4.5\" x 6.5\" are allowed and do not need to be clear. Backpacks are strictly prohibited." },
      { keywords: ["metro", "train", "transit", "bus", "transport"], answer: "The most sustainable way is the MetLife Rail Station (direct connections from Secaucus Junction, trains every 6 min). Express Buses run to Port Authority NYC. Ride-share is available in Lot G but expect 40+ min delays after final whistle." },
      { keywords: ["vegan", "vegetarian", "halal", "food", "diet"], answer: "We have multiple dietary options: 'Taco Cantina' (Section 102) is Halal-certified. 'The Vegan Goal' (Section 108) features 100% plant-based Beyond Burgers and Gluten-Free vegan nachos. Light beverages are at 'World Cup Brews' (Section 110)." },
      { keywords: ["wheelchair", "accessible", "disability", "elev", "ramp"], answer: "Gates A, B, and D are fully wheelchair-accessible with specialized entry lanes. Elevators are located at the East and West club entrances. Ramps lead to all upper bowl sections. First Aid (Section 112) provides temporary wheelchair support." },
      { keywords: ["ticket", "reentry", "exit"], answer: "FIFA operates a strict no re-entry policy. Once your digital ticket is scanned and you pass the turnstile, you cannot exit the stadium and re-enter. Ticket scanning stations close at the 60th minute of play." },
      { keywords: ["sustainability", "eco", "points", "greenfan", "scorecard", "rewards", "xp"], answer: "Earn sustainability points (XP) and reduce carbon footprint with the GreenFan Eco-Scorecard! Log activities on your Eco-Tracker overlay: take transit (Gate A/B/C) to earn +15 XP; refill water at the Sec 108 Oasis for +10 XP; pre-order from Vegan Goal (Sec 108) or Taco Cantina (Sec 102) for +5 to +20 XP. Reach 30 XP for a 15% concession discount; reach 50 XP for the physical Eco-Badge!" }
    ],
    es: [
      { keywords: ["bolso", "mochila", "cartera", "politica"], answer: "Política de Bolsos de la FIFA 2026: Solo se permiten bolsos transparentes (plástico, vinilo o PVC) que no superen las 12\" x 6\" x 12\". Las carteras de mano pequeñas de menos de 4.5\" x 6.5\" están permitidas y no necesitan ser transparentes. Las mochilas están estrictamente prohibidas." },
      { keywords: ["metro", "tren", "autobus", "transporte"], answer: "La forma más sostenible es la estación de tren MetLife Rail (conexión directa desde Secaucus, trenes cada 6 min). Los autobuses exprés viajan a Port Authority en NYC. Las plataformas de viaje compartido están en el Lote G (demoras de más de 40 min tras el partido)." },
      { keywords: ["vegano", "vegetariano", "halal", "comida", "dieta"], answer: "Contamos con opciones dietéticas: 'Taco Cantina' (Sección 102) tiene certificación Halal. 'The Vegan Goal' (Sección 108) ofrece hamburguesas veganas Beyond y nachos veganos sin gluten. 'World Cup Brews' (Sección 110) ofrece bebidas ligeras." },
      { keywords: ["silla de ruedas", "accesible", "discapacidad", "rampa", "ascensor"], answer: "Las puertas A, B y D son totalmente accesibles en silla de ruedas. Hay ascensores en las entradas de club Este y Oeste. Las rampas comunican con todos los niveles. Primeros Auxilios (Sección 112) ofrece asistencia temporal." },
      { keywords: ["sostenibilidad", "eco", "puntos", "greenfan", "tarjeta", "recompensas", "xp"], answer: "¡Gane puntos de sostenibilidad (XP) y reduzca emisiones con la tarjeta GreenFan Eco-Scorecard! Registre actividades: tome transporte público (Puerta A/B/C) para ganar +15 XP; rellene agua en Oasis Sec 108 para +10 XP; pre-ordene comida ecológica para ganar de +5 a +20 XP. ¡Con 30 XP obtenga 15% de descuento en comida y con 50 XP gane la insignia física!" }
    ],
    fr: [
      { keywords: ["sac", "sac à dos", "politique"], answer: "Politique des sacs FIFA 2026 : Seuls les sacs transparents (plastique, vinyle ou PVC) ne dépassant pas 12\" x 6\" x 12\" sont autorisés. Les petites pochettes de moins de 4,5\" x 6,5\" sont autorisées sans transparence. Les sacs à dos sont interdits." },
      { keywords: ["train", "metro", "bus", "transport"], answer: "Le moyen le plus écologique est la gare ferroviaire MetLife Rail (liaisons directes depuis Secaucus, trains toutes les 6 min). Des bus express desservent NYC Port Authority. Le covoiturage se fait au Lot G (attente de plus de 40 min en fin de match)." },
      { keywords: ["vegan", "végétarien", "halal", "nourriture", "manger"], answer: "Options alimentaires disponibles : 'Taco Cantina' (Section 102) est certifié Halal. 'The Vegan Goal' (Section 108) propose des Beyond Burgers 100% végétaliens et des nachos sans gluten. Des boissons sont disponibles à 'World Cup Brews' (Section 110)." },
      { keywords: ["soutenabilite", "eco", "points", "greenfan", "recompenses", "xp"], answer: "Gagnez des points écologiques (XP) avec la carte GreenFan Eco-Scorecard ! Enregistrez des activités : transports en commun (Porte A/B/C) pour +15 XP ; oasis Sec 108 pour +10 XP ; pré-commandes vertes pour +5 à +20 XP. Obtenez 30 XP pour 15% de réduction et 50 XP pour le badge physique exclusif !" }
    ],
    ar: [
      { keywords: ["حقيبة", "حقائب", "سياسة"], answer: "سياسة الحقائب لكأس العالم 2026: يُسمح فقط بالحقائب الشفافة (البلاستيك أو الفينيل أو PVC) التي لا تتجاوز 12 × 6 × 12 بوصة. يُسمح بالحقائب الصغيرة التي يقل حجمها عن 4.5 × 6.5 بوصة ولا يلزم أن تكون شفافة. يُمنع منعاً باتاً إدخال حقائب الظهر." },
      { keywords: ["قطار", "مترو", "حافلة", "مواصلات"], answer: "الوسيلة الأكثر استدامة هي محطة قطار MetLife Rail (رحلات مباشرة من Secaucus Junction كل 6 دقائق). تتوفر حافلات سريعة إلى مانهاتن. تقع منطقة أوبر وكريم في المواقف Lot G (توقع تأخيرات تتجاوز 40 دقيقة بعد صفارة النهاية)." },
      { keywords: ["استدامة", "بيئي", "نقاط", "نقاط الاستدامة", "جوائز"], answer: "احصل على نقاط الاستدامة (XP) ووفر الانبعاثات مع بطاقة GreenFan Eco-Scorecard! سجل الأنشطة بيئية: استخدام وسائل النقل العام (+15 نقطة)؛ تعبئة المياه من واحة القسم 108 (+10 نقاط)؛ الطلب المسبق للوجبات الخضراء (+5 إلى +20 نقطة). اجمع 30 نقطة للحصول على خصم 15٪ و50 نقطة للحصول على شارة بيئية حقيقية!" }
    ],
    pt: [
      { keywords: ["bolsa", "mochila", "politica"], answer: "Política de Bolsos da FIFA 2026: Apenas bolsas transparentes (plástico, vinil ou PVC) que não excedam 12\" x 6\" x 12\" são permitidas. Pequenas bolsas/carteiras de mão com menos de 4,5\" x 6,5\" são permitidas e não precisam ser transparentes. Mochilas são estritamente proibidas." },
      { keywords: ["metro", "trem", "ônibus", "transporte"], answer: "A forma mais sustentável é a estação de trem MetLife Rail (conexão direta de Secaucus Junction, trens a cada 6 min). Ônibus expressos circulam para Port Authority em NYC. Compartilhamento de viagens está disponível no Lote G, mas espere atrasos de mais de 40 min após o apito final." },
      { keywords: ["vegano", "vegetariano", "halal", "comida", "dieta"], answer: "Temos várias opções dietéticas: 'Taco Cantina' (Seção 102) é certificado Halal. 'The Vegan Goal' (Seção 108) oferece Beyond Burgers 100% à base de plantas e nachos veganos sem glúten. Bebidas estão disponíveis no 'World Cup Brews' (Seção 110)." },
      { keywords: ["cadeira de rodas", "acessível", "rampa", "elevador"], answer: "Os portões A, B e D são totalmente acessíveis para cadeiras de rodas. Elevadores estão localizados nas entradas do clube Leste e Oeste. Rampas levam a todas as seções superiores. O Posto de Primeiros Socorros (Seção 112) fornece suporte temporário." },
      { keywords: ["ingresso", "reentrada", "saída"], answer: "A FIFA opera uma política rígida de não reentrada. Uma vez que seu ingresso digital é escaneado, você não pode sair e reentrar. Os postos de escaneamento de ingressos fecham no 60º minuto de jogo." },
      { keywords: ["sustentabilidade", "eco", "pontos", "greenfan", "recompensas", "xp"], answer: "Ganhe pontos de sustentabilidade (XP) e reduza emissões com o GreenFan Eco-Scorecard! Registre atividades: use transporte público (Portão A/B/C) para ganhar +15 XP; abasteça água no Oasis Sec 108 para +10 XP; pré-encomende pratos sustentáveis para ganhar +5 a +20 XP. Alcance 30 XP para ganhar 15% de desconto e 50 XP para a insígnia física!" }
    ],
    de: [
      { keywords: ["tasche", "rucksack", "richtlinie"], answer: "FIFA World Cup 2026 Taschenrichtlinie: Nur durchsichtige Taschen (Kunststoff, Vinyl oder PVC), die 12\" x 6\" x 12\" nicht überschreiten, sind erlaubt. Kleine Handtaschen unter 4,5\" x 6,5\" sind ohne Transparenz erlaubt. Rucksäcke sind strengstens verboten." },
      { keywords: ["bahn", "zug", "bus", "verkehrsmittel"], answer: "Der nachhaltigste Weg ist die MetLife Rail Station (direkte Verbindungen von Secaucus Junction, Züge alle 6 Min.). Expressbusse fahren zur Port Authority NYC. Ridesharing ist auf Parkplatz G verfügbar, aber rechnen Sie nach dem Schlusspfiff mit 40+ Min. Verzögerungen." },
      { keywords: ["vegan", "vegetarisch", "halal", "essen"], answer: "Wir haben verschiedene Ernährungsoptionen: 'Taco Cantina' (Sektor 102) ist Halal-zertifiziert. 'The Vegan Goal' (Sektor 108) bietet 100% pflanzliche Beyond Burger und glutenfreie vegane Nachos. Getränke gibt es bei 'World Cup Brews' (Sektor 110)." },
      { keywords: ["rollstuhl", "barrierefrei", "rampe", "aufzug"], answer: "Die Tore A, B und D sind vollständig rollstuhlgerecht. Aufzüge befinden sich an den Eingängen Ost und West. Rampen führen zu allen oberen Rängen. Die Erste-Hilfe-Station (Sektor 112) bietet temporäre Rollstuhlunterstützung." },
      { keywords: ["ticket", "wiedereinlass", "ausgang"], answer: "Die FIFA hat eine strikte Richtlinie gegen Wiedereintritt. Sobald Ihr Ticket gescannt ist, können Sie das Stadion nicht verlassen und wieder betreten. Ticket-Scanner schließen in der 60. Spielminute." },
      { keywords: ["nachhaltigkeit", "eco", "punkte", "greenfan", "belohnungen", "xp"], answer: "Sammeln Sie Nachhaltigkeitspunkte (XP) und reduzieren Sie CO2-Emissionen mit der GreenFan Eco-Scorecard! Registrieren Sie Aktivitäten: nutzen Sie öffentliche Verkehrsmittel (Tor A/B/C) für +15 XP; füllen Sie Wasser an der Oase Sec 108 für +10 XP auf; bestellen Sie Bio-Gerichte für +5 bis +20 XP. Erreichen Sie 30 XP für 15 % Rabatt und 50 XP für die physische Anstecknadel!" }
    ],
    ja: [
      { keywords: ["バッグ", "リュック", "ポリシー", "鞄"], answer: "FIFAワールドカップ2026のバッグポリシー：12インチ×6インチ×12インチ以内の透明なバッグ（プラスチック、ビニール、PVC）のみ持ち込み可能です。4.5インチ×6.5インチ未満の小さなクラッチバッグや財布は透明である必要はありません。リュックサックは厳禁です。" },
      { keywords: ["電車", "列車", "バス", "交通", "アクセス"], answer: "最も環境に優しい方法はMetLife Rail駅（Secaucus Junctionから直通、6分間隔で運行）です。ExpressバスはNYC Port Authority行きが運行しています。ライドシェアはLot Gで利用できますが、試合終了後は40分以上の遅延が予想されます。" },
      { keywords: ["ヴィーガン", "ベジタリアン", "ハラール", "食事", "フード"], answer: "様々な食事オプションをご用意しています。セクション102の「Taco Cantina」はハラール認証済みです。セクション108の「The Vegan Goal」では、100%植物性のBeyond Burgerやグルテンフリーのヴィーガンナチョスを提供しています。軽飲料は「World Cup Brews」（セクション110）にあります。" },
      { keywords: ["車椅子", "バリアフリー", "スロープ", "エレベーター"], answer: "ゲートA、B、Dは完全に車椅子対応の入場レーンが設置されています。エレベーターはイーストおよびウェストのクラブエントランスにあります。すべての２階席へはスロープが通じています。応急処置室（セクション112）では一時的な車椅子のサポートを行っています。" },
      { keywords: ["チケット", "再入場", "退場"], answer: "FIFAは厳格な再入場禁止ポリシーを適用しています。デジタルチケットがスキャンされ入場した後は、スタジアムから退出して再入場することはできません。チケットのスキャンは試合開始60分後に終了します。" },
      { keywords: ["サステナビリティ", "エコ", "ポイント", "グリーンファン", "報酬", "xp"], answer: "GreenFan Eco-Scorecardでエコポイント（XP）を獲得し、CO2排出量を削減しましょう！アクティビティを記録：公共交通機関（ゲートA/B/C）利用で+15 XP、セクション108のオアシスで給水で+10 XP、グリーン飲食店（セクション108のThe Vegan Goal、セクション102のTaco Cantinaなど）での事前注文で+5～+20 XP。30 XPで売店15%割引、50 XPで実物のエコバッジピンがもらえます！" }
    ],
    zh: [
      { keywords: ["包", "背包", "政策", "携带"], answer: "2026年FIFA世界杯随身包袋政策：仅允许携带尺寸不超过 12\" x 6\" x 12\" 的透明塑料、乙烯基或 PVC 包。小于 4.5\" x 6.5\" 的小型手包无需透明。严格禁止携带双肩背包。" },
      { keywords: ["地铁", "火车", "轻轨", "公交", "交通"], answer: "最环保的方式是乘坐大都会铁路线（从 Secaucus Junction 直达，每6分钟一班）。快速巴士开往纽约港务局（Port Authority NYC）。Lot G 提供网约车，但终场哨响后预计会有40分钟以上的延迟。" },
      { keywords: ["素食", "纯素", "清真", "食物", "饮食"], answer: "我们提供多种饮食选择：Section 102的 'Taco Cantina' 经过清真认证。Section 108的 'The Vegan Goal' 提供100%植物肉 Beyond 汉堡和无麸质纯素烤干酪辣味干酪片。饮料可在 Section 110的 'World Cup Brews' 购买。" },
      { keywords: ["轮椅", "无障碍", "坡道", "电梯"], answer: "通道 A、B 和 D 设有专门的无障碍轮椅通道。电梯位于东侧和西侧俱乐部入口。坡道通往所有上层看台。急救站（Section 112）提供临时轮椅支持。" },
      { keywords: ["门票", "再次入场", "离场"], answer: "FIFA 实行严格的禁止再次入场政策。数字门票扫描入场后，您将无法离开体育场再次进入。检票口将在比赛第60分钟关闭。" },
      { keywords: ["环保", "可持续", "积分", "绿粉", "绿色", "xp"], answer: "使用 GreenFan 环保记分卡（Eco-Scorecard）赚取环保积分（XP）并减少碳排放！记录行为：乘公共交通（通道 A/B/C）赚取 +15 XP；在108区绿洲补水赚取 +10 XP；在纯素目标（108区）或塔可餐厅（102区）订餐赚取 +5 到 +20 XP。积满 30 XP 可享85折餐饮优惠；积满 50 XP 可换取精美实体环保徽章！" }
    ]
  }
};
