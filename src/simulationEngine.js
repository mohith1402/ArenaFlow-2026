// ArenaFlow 2026 Egress & Crowd Simulation Engine
import { stadiumData } from './stadiumData';

export class SimulationEngine {
  constructor(mapRenderer) {
    this.mapRenderer = mapRenderer;
    this.activeScenario = 'normal';
    
    // Initial stats copies so we don't permanently corrupt base data
    this.originalGateQueues = { ...stadiumData.gates };
    this.originalConcessions = { ...stadiumData.concessions };
    this.originalAmenities = { ...stadiumData.amenities };
    this.originalTransit = { ...stadiumData.transit };
  }

  // Resets all stats to original values
  resetStats() {
    Object.keys(this.originalGateQueues).forEach(k => {
      stadiumData.gates[k].queueTime = this.originalGateQueues[k].queueTime;
      stadiumData.gates[k].status = this.originalGateQueues[k].status;
    });
    Object.keys(this.originalConcessions).forEach(k => {
      stadiumData.concessions[k].waitTime = this.originalConcessions[k].waitTime;
    });
    Object.keys(this.originalAmenities).forEach(k => {
      stadiumData.amenities[k].waitTime = this.originalAmenities[k].waitTime;
    });
    Object.keys(this.originalTransit).forEach(k => {
      stadiumData.transit[k].status = this.originalTransit[k].status;
    });
  }

  // Trigger scenario and return metadata
  triggerScenario(scenarioId) {
    this.activeScenario = scenarioId;
    this.resetStats();
    
    let crowdHeatmap = {};
    let recommendations = [];
    let matchBannerUpdate = null;

    switch (scenarioId) {
      case 'normal':
        // Normal state: low-medium density
        Object.keys(stadiumData.sections).forEach(id => {
          crowdHeatmap[id] = 15 + Math.floor(Math.random() * 20); // 15-35%
        });
        
        recommendations = [
          {
            type: 'normal',
            title: 'Operations Stable',
            description: 'All gates running under 8 minutes wait times. Transit shuttle frequency normal. Staff levels adequate.',
            icon: 'check-circle'
          },
          {
            type: 'normal',
            title: 'Concession Wait Times Low',
            description: 'Concourse food courts operating at standard speed. Section 104 Gridiron Grill queue at 15 mins (optimal).',
            icon: 'info'
          }
        ];
        
        matchBannerUpdate = {
          teams: "USA vs ENGLAND",
          score: "1 - 1",
          time: "68'",
          status: "Live"
        };
        break;

      case 'post-match':
        // Post-match egress: high density near gate sections and transport hubs
        Object.keys(stadiumData.sections).forEach(id => {
          const num = parseInt(id);
          // Sections 101, 102, 103 (near gate A/Train) and 107, 108, 109 (near gate C/Bus) are packed
          if ([101, 102, 103, 107, 108, 109].includes(num)) {
            crowdHeatmap[id] = 85 + Math.floor(Math.random() * 10); // 85-95%
          } else {
            crowdHeatmap[id] = 40 + Math.floor(Math.random() * 20); // 40-60%
          }
        });

        // Gates swell
        stadiumData.gates["Gate A"].queueTime = 32;
        stadiumData.gates["Gate B"].queueTime = 25;
        stadiumData.gates["Gate C"].queueTime = 28;
        stadiumData.gates["Gate D"].queueTime = 14;

        stadiumData.transit["Rideshare Zone"].status = "Critically Delayed (60m)";
        stadiumData.transit["Train Station"].status = "High Volume (10m delay)";

        recommendations = [
          {
            type: 'warning',
            title: 'Gate A Egress Surge',
            description: 'Heavy outbound congestion at Gate A (North). Recommend activating Metro Shuttle Backup Train #4 immediately.',
            icon: 'alert-triangle'
          },
          {
            type: 'warning',
            title: 'Rideshare Lot G Congested',
            description: 'Lot G delay exceeds 60 minutes. Broadcast AI push notification advising fans to utilize MetLife Rail (Gate A) or wait in concourse.',
            icon: 'info'
          },
          {
            type: 'normal',
            title: 'Egress Diversion Plan Active',
            description: 'Direct Sectors 101-102 volunteers to guide fans towards Gate D (West Gate) to reduce Gate A queue bottleneck.',
            icon: 'arrow-right-left'
          }
        ];

        matchBannerUpdate = {
          teams: "USA vs ENGLAND",
          score: "2 - 1",
          time: "FT",
          status: "Match Ended"
        };
        break;

      case 'weather':
        // Weather emergency: concourses (covered areas) swell to 95%. Pitch/open areas cleared.
        Object.keys(stadiumData.sections).forEach(id => {
          const num = parseInt(id);
          // Covered concourses and lower premium seats have people clustering
          if ([101, 103, 107, 109, 112, 106].includes(num)) {
            crowdHeatmap[id] = 92 + Math.floor(Math.random() * 5); // 92-97%
          } else {
            crowdHeatmap[id] = 10 + Math.floor(Math.random() * 10); // 10-20% (empty)
          }
        });

        // Food stands swell as fans crowd around covered concourses
        stadiumData.concessions["Taco Cantina"].waitTime = 25;
        stadiumData.concessions["Gridiron Grill"].waitTime = 35;
        stadiumData.concessions["Vegan Goal"].waitTime = 18;

        recommendations = [
          {
            type: 'danger',
            title: 'Lightning Warning Alert',
            description: 'Severe lightning detected within 5 miles. Direct volunteers to instruct all fans to evacuate the open seating bowl immediately.',
            icon: 'zap'
          },
          {
            type: 'danger',
            title: 'Concourse Crowd Limit',
            description: 'Concourse sectors 101 and 107 at 95% capacity. Temporarily halt gate scanning for inbound arrivals to prevent crowding.',
            icon: 'users'
          },
          {
            type: 'warning',
            title: 'First Aid Blankets',
            description: 'Dispatched 4 medical volunteers to Section 112 and Section 105 with rain ponchos and foil warming blankets.',
            icon: 'heart-pulse'
          }
        ];

        matchBannerUpdate = {
          teams: "USA vs ENGLAND",
          score: "1 - 1",
          time: "Delayed",
          status: "Weather Alert"
        };
        break;

      case 'incident':
        // Gate A blockage
        Object.keys(stadiumData.sections).forEach(id => {
          const num = parseInt(id);
          // Bottleneck at Section 101/102 near Gate A
          if ([101, 102].includes(num)) {
            crowdHeatmap[id] = 95;
          } else {
            crowdHeatmap[id] = 20 + Math.floor(Math.random() * 15);
          }
        });

        stadiumData.gates["Gate A"].status = "Blocked / Closed";
        stadiumData.gates["Gate A"].queueTime = 99; // Closed
        
        stadiumData.gates["Gate B"].queueTime = 18;
        stadiumData.gates["Gate D"].queueTime = 22;

        recommendations = [
          {
            type: 'danger',
            title: 'Security Incident - Gate A Closed',
            description: 'Gate A closed due to a localized ticketing scanner failure and security breach. Dispatching response unit.',
            icon: 'shield-alert'
          },
          {
            type: 'danger',
            title: 'Incoming Transit Divert',
            description: 'Divert train passengers arriving at Rail Station from entering Gate A. Direct them via exterior security walkway to Gate B (East) and Gate D (West).',
            icon: 'shuffle'
          },
          {
            type: 'warning',
            title: 'Volunteer Deployment',
            description: 'Broadcast alerts to 12 volunteers near MetLife Rail Platform to guide arriving crowds around the stadium perimeter.',
            icon: 'megaphone'
          }
        ];

        matchBannerUpdate = {
          teams: "USA vs ENGLAND",
          score: "1 - 1",
          time: "74'",
          status: "Live"
        };
        break;
    }

    // Apply changes on map
    this.mapRenderer.setHeatmapData(crowdHeatmap);
    this.mapRenderer.setLayer(this.mapRenderer.activeLayer);

    return { recommendations, matchBannerUpdate };
  }

  // Simulated Multilingual translation of broadcasts for volunteers
  translateBroadcast(text) {
    const textLower = text.toLowerCase();
    
    // Heuristic maps for mock translations of key phrases
    const esPhrases = [
      { key: "redirect", val: "Redirigir" },
      { key: "section", val: "la sección" },
      { key: "gate a", val: "la Puerta A" },
      { key: "gate b", val: "la Puerta B" },
      { key: "gate c", val: "la Puerta C" },
      { key: "gate d", val: "la Puerta D" },
      { key: "concourse", val: "el vestíbulo" },
      { key: "weather", val: "clima severo" },
      { key: "incident", val: "incidente" },
      { key: "deploy", val: "desplegar" },
      { key: "volunteers", val: "voluntarios" },
      { key: "to", val: "a" },
      { key: "help", val: "ayudar" },
      { key: "traffic", val: "tráfico" }
    ];

    const frPhrases = [
      { key: "redirect", val: "Rediriger" },
      { key: "section", val: "la section" },
      { key: "gate a", val: "la Porte A" },
      { key: "gate b", val: "la Porte B" },
      { key: "gate c", val: "la Porte C" },
      { key: "gate d", val: "la Porte D" },
      { key: "concourse", val: "le hall" },
      { key: "weather", val: "intempéries" },
      { key: "incident", val: "incident" },
      { key: "deploy", val: "déployer" },
      { key: "volunteers", val: "bénévoles" },
      { key: "to", val: "à" },
      { key: "help", val: "aider" },
      { key: "traffic", val: "trafic" }
    ];

    const arPhrases = [
      { key: "redirect", val: "إعادة توجيه" },
      { key: "section", val: "القسم" },
      { key: "gate a", val: "البوابة A" },
      { key: "gate b", val: "البوابة B" },
      { key: "gate c", val: "البوابة C" },
      { key: "gate d", val: "البوابة D" },
      { key: "concourse", val: "البهو الرئيسي" },
      { key: "weather", val: "الطقس السيئ" },
      { key: "incident", val: "الحادث" },
      { key: "deploy", val: "نشر" },
      { key: "volunteers", val: "المتطوعين" },
      { key: "to", val: "إلى" },
      { key: "help", val: "مساعدة" },
      { key: "traffic", val: "حركة المرور" }
    ];

    const ptPhrases = [
      { key: "redirect", val: "Redirecionar" },
      { key: "section", val: "a seção" },
      { key: "gate a", val: "o Portão A" },
      { key: "gate b", val: "o Portão B" },
      { key: "gate c", val: "o Portão C" },
      { key: "gate d", val: "o Portão D" },
      { key: "concourse", val: "o vestíbulo" },
      { key: "weather", val: "clima severo" },
      { key: "incident", val: "incidente" },
      { key: "deploy", val: "implantar" },
      { key: "volunteers", val: "voluntários" },
      { key: "to", val: "para" },
      { key: "help", val: "ajudar" },
      { key: "traffic", val: "tráfego" }
    ];

    const dePhrases = [
      { key: "redirect", val: "Umleiten" },
      { key: "section", val: "Sektor" },
      { key: "gate a", val: "Tor A" },
      { key: "gate b", val: "Tor B" },
      { key: "gate c", val: "Tor C" },
      { key: "gate d", val: "Tor D" },
      { key: "concourse", val: "Concourse" },
      { key: "weather", val: "Unwetter" },
      { key: "incident", val: "Vorfall" },
      { key: "deploy", val: "entsenden" },
      { key: "volunteers", val: "Freiwillige" },
      { key: "to", val: "nach" },
      { key: "help", val: "helfen" },
      { key: "traffic", val: "Verkehr" }
    ];

    const jaPhrases = [
      { key: "redirect", val: "誘導" },
      { key: "section", val: "セクション" },
      { key: "gate a", val: "ゲートA" },
      { key: "gate b", val: "ゲートB" },
      { key: "gate c", val: "ゲートC" },
      { key: "gate d", val: "ゲートD" },
      { key: "concourse", val: "コンコース" },
      { key: "weather", val: "荒天" },
      { key: "incident", val: "インシデント" },
      { key: "deploy", val: "配置" },
      { key: "volunteers", val: "ボランティア" },
      { key: "to", val: "へ" },
      { key: "help", val: "支援" },
      { key: "traffic", val: "混雑" }
    ];

    const zhPhrases = [
      { key: "redirect", val: "引导" },
      { key: "section", val: "区域" },
      { key: "gate a", val: "A通道" },
      { key: "gate b", val: "B通道" },
      { key: "gate c", val: "C通道" },
      { key: "gate d", val: "D通道" },
      { key: "concourse", val: "大厅" },
      { key: "weather", val: "恶劣天气" },
      { key: "incident", val: "事件" },
      { key: "deploy", val: "部署" },
      { key: "volunteers", val: "志愿者" },
      { key: "to", val: "到" },
      { key: "help", val: "协助" },
      { key: "traffic", val: "流量" }
    ];

    let es = text;
    let fr = text;
    let ar = text;
    let pt = text;
    let de = text;
    let ja = text;
    let zh = text;

    esPhrases.forEach(p => {
      es = es.replace(new RegExp(p.key, 'gi'), p.val);
    });
    frPhrases.forEach(p => {
      fr = fr.replace(new RegExp(p.key, 'gi'), p.val);
    });
    arPhrases.forEach(p => {
      ar = ar.replace(new RegExp(p.key, 'gi'), p.val);
    });
    ptPhrases.forEach(p => {
      pt = pt.replace(new RegExp(p.key, 'gi'), p.val);
    });
    dePhrases.forEach(p => {
      de = de.replace(new RegExp(p.key, 'gi'), p.val);
    });
    jaPhrases.forEach(p => {
      ja = ja.replace(new RegExp(p.key, 'gi'), p.val);
    });
    zhPhrases.forEach(p => {
      zh = zh.replace(new RegExp(p.key, 'gi'), p.val);
    });

    // Clean up translations to look fluent if they contain standard words
    if (es === text) es = "Redirigir al personal de seguridad y voluntarios a las áreas especificadas de inmediato.";
    if (fr === text) fr = "Rediriger immédiatement le personnel et les bénévoles vers les zones spécifiées.";
    if (ar === text) ar = "يرجى توجيه المتطوعين والموظفين إلى القطاعات المحددة على الفور.";
    if (pt === text) pt = "Redirecionar a equipe de segurança e voluntários para as áreas especificadas imediatamente.";
    if (de === text) de = "Sicherheitskräfte und Freiwillige sofort in die angegebenen Bereiche umleiten.";
    if (ja === text) ja = "ただちに警備スタッフとボランティアを指定エリアに配置・誘導してください。";
    if (zh === text) zh = "请立即引导安保人员和志愿者前往指定区域。";

    return { es, fr, ar, pt, de, ja, zh };
  }
}
