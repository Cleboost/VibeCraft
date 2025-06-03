// Générateur de particules arc-en-ciel pour VibeCraft
// Exemple d'animation avec système de particules

const MANIFEST = {
  name: "Particules Arc-en-ciel",
  version: "1.0.0",
  package_id: "com.vibecraft.rainbow-particles",
  api_version: "1.0",
  description: "Système de particules colorées qui tombent avec effet arc-en-ciel.",
  author: "VibeCraft",
  config: [
    { name: 'particleCount', type: 'number', default: 50, min: 10, max: 200, label: 'Nombre de particules' },
    { name: 'particleSize', type: 'number', default: 4, min: 2, max: 20, label: 'Taille des particules' },
    { name: 'fallSpeed', type: 'number', default: 3, min: 1, max: 10, label: 'Vitesse de chute' },
    { name: 'colorSpeed', type: 'number', default: 2, min: 0.5, max: 5, label: 'Vitesse changement couleur' },
    { name: 'gravity', type: 'number', default: 0.1, min: 0, max: 1, label: 'Gravité' },
    { name: 'backgroundColor', type: 'color', default: '#001122', label: 'Couleur de fond' },
    { name: 'glow', type: 'boolean', default: true, label: 'Effet de lueur' }
  ]
};

return class RainbowParticlesGenerator extends VideoGenerator {
  static get manifest() {
    return MANIFEST;
  }

  setup(canvas, params) {
    this.particles = [];
    this.time = 0;
    for (let i = 0; i < params.particleCount; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * params.fallSpeed,
        hue: Math.random() * 360,
        life: 1
      });
    }
  }

  draw(canvas, params) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = params.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = params.glow ? 10 : 0;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += params.gravity;
      particle.hue = (particle.hue + params.colorSpeed) % 360;
      if (particle.x < 0 || particle.x > canvas.width) {
        particle.vx *= -0.8;
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
      }
      if (particle.y > canvas.height + params.particleSize) {
        particle.y = -params.particleSize;
        particle.x = Math.random() * canvas.width;
        particle.vy = Math.random() * params.fallSpeed;
        particle.vx = (Math.random() - 0.5) * 2;
      }
      const color = `hsl(${particle.hue}, 100%, 60%)`;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, params.particleSize, 0, Math.PI * 2);
      ctx.fill();
    }
    while (this.particles.length < params.particleCount) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: -params.particleSize,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * params.fallSpeed,
        hue: Math.random() * 360,
        life: 1
      });
    }
    if (this.particles.length > params.particleCount) {
      this.particles = this.particles.slice(0, params.particleCount);
    }
    this.time++;
  }

  cleanup() {
    this.particles = [];
  }
} 