// ArenaFlow 2026 Sustainability & Eco-Score Engine

export class SustainabilityEngine {
  constructor() {
    this.points = 0;
    this.co2Offset = 0.0;
    this.badge = "Green Starter";
    this.loggedTasks = new Set();
  }

  // Log a task
  logTask(taskId, points, co2) {
    if (this.loggedTasks.has(taskId)) return false;
    
    this.loggedTasks.add(taskId);
    this.points += points;
    this.co2Offset += parseFloat(co2);
    this.updateBadge();
    
    return true;
  }

  // Update badge rank based on points thresholds
  updateBadge() {
    if (this.points >= 50) {
      this.badge = "World Cup Eco Legend! 🏆";
    } else if (this.points >= 30) {
      this.badge = "Climate Champion 🌟";
    } else if (this.points >= 15) {
      this.badge = "Eco Advocate 🌱";
    } else {
      this.badge = "Green Starter 🍃";
    }
  }

  // Get active status
  getStatus() {
    return {
      points: this.points,
      co2Offset: this.co2Offset.toFixed(1),
      badge: this.badge,
      loggedTasksCount: this.loggedTasks.size
    };
  }

  // Check rewards status
  getRewardsStatus() {
    return {
      reward1: {
        id: "reward1",
        name: "15% Concession Discount",
        requiredPoints: 30,
        eligible: this.points >= 30
      },
      reward2: {
        id: "reward2",
        name: "Exclusive Eco-Badge Pin",
        requiredPoints: 50,
        eligible: this.points >= 50
      }
    };
  }

  // Reset tracker
  reset() {
    this.points = 0;
    this.co2Offset = 0.0;
    this.badge = "Green Starter";
    this.loggedTasks.clear();
  }
}
