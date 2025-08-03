// ระบบสุ่ม flavor แบบง่าย
export class FlavorRandomizer {
  constructor() {
    this.secretChance = 0.1; // 10% โอกาสได้ secret
  }

  // สุ่ม flavor
  randomizeFlavor(selectedFlavor) {
    const isSecret = Math.random() < this.secretChance;
    const finalFlavor = isSecret ? "secret" : selectedFlavor;

    console.log(
      `🎲 ${selectedFlavor} → ${finalFlavor} (${(
        this.secretChance * 100
      ).toFixed(0)}% chance)`
    );

    return {
      originalFlavor: selectedFlavor,
      finalFlavor: finalFlavor,
      isSecret: isSecret,
      chance: this.secretChance,
    };
  }

  // ตั้งค่าโอกาส
  setSecretChance(chance) {
    this.secretChance = Math.max(0, Math.min(1, chance));
    console.log(`🎯 Secret chance: ${(this.secretChance * 100).toFixed(0)}%`);
  }

  // ดูข้อมูล
  getInfo() {
    return {
      secretChance: this.secretChance,
      secretChancePercent: (this.secretChance * 100).toFixed(0),
    };
  }
}

// สร้าง instance เริ่มต้น
export const flavorRandomizer = new FlavorRandomizer();
