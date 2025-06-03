// Générateur de spirale colorée pour VibeCraft
// Exemple d'animation avec effet de traînée

const MANIFEST = {
  name: "Spirale Colorée",
  version: "1.0.0",
  package_id: "com.vibecraft.spiral-color",
  api_version: "1.0",
  description: "Crée une spirale colorée avec effet de traînée optionnel.",
  author: "VibeCraft",
  config: [
    { name: 'speed', type: 'number', default: 2, min: 0.5, max: 10, label: 'Vitesse de rotation' },
    { name: 'radiusGrowth', type: 'number', default: 50, min: 10, max: 200, label: 'Croissance du rayon' },
    { name: 'colorSpeed', type: 'number', default: 0.1, min: 0.01, max: 1, label: 'Vitesse de changement de couleur' },
    { name: 'lineWidth', type: 'number', default: 3, min: 1, max: 10, label: 'Épaisseur de la ligne' },
    { name: 'backgroundColor', type: 'color', default: '#000000', label: 'Couleur de fond' },
    { name: 'enableTrail', type: 'boolean', default: true, label: 'Activer la traînée' }
  ]
};

return class ColorfulSpiralGenerator extends VideoGenerator {
  static get manifest() {
    return MANIFEST;
  }

  setup(canvas, params) {
    this.angle = 0;
    this.radius = 40;
    this.colorOffset = 0;
    this.centerX = canvas.width / 3;
    this.centerY = canvas.height / 2;
    this.maxRadius = Math.min(canvas.width, canvas.height) / 2 - 20;
  }

  draw(canvas, params) {
    const ctx = canvas.getContext('2d');
    if (params.enableTrail) {
      ctx.fillStyle = params.backgroundColor + '20';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = params.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const x = this.centerX + Math.cos(this.angle) * this.radius;
    const y = this.centerY + Math.sin(this.angle) * this.radius;
    const hue = (this.colorOffset + this.angle * 50) % 360;
    ctx.strokeStyle = `hsl(${hue}, 70%, 50%)`;
    ctx.lineWidth = params.lineWidth;
    if (this.radius > 0) {
      const prevX = this.centerX + Math.cos(this.angle - 0.1) * (this.radius - 1);
      const prevY = this.centerY + Math.sin(this.angle - 0.1) * (this.radius - 1);
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    this.angle += params.speed * 0.1;
    this.radius += params.radiusGrowth * 0.01;
    this.colorOffset += params.colorSpeed;
    if (this.radius > this.maxRadius) {
      this.radius = 0;
      this.angle = 0;
    }
  }

  cleanup() {
    // Rien à nettoyer
  }
} 