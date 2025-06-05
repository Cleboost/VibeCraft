import { VideoGenerator } from '../utils/VideoGenerator';
const MANIFEST = {
  name: "Balle Rebondissante",
  version: "1.0.0",
  package_id: "com.vibecraft.generators.bouncing-ball",
  api_version: "1.0",
  description: "Générateur de balle rebondissante avec physique réaliste",
  author: "VibeCraft",
  config: [
    { type: 'number', name: 'speed', default: 3, min: 1, max: 10, label: 'Vitesse initiale de la balle' },
    { type: 'color', name: 'ballColor', default: '#ff0000', label: 'Couleur de la balle' },
    { type: 'color', name: 'circleColor', default: '#0000ff', label: 'Couleur du cercle' },
    {
      type: 'categorie', name: 'Apparence', collapse: true, content: [
        { type: 'number', name: 'ballRadius', default: 20, min: 5, max: 50, label: 'Rayon de la balle' },
        { type: 'boolean', name: 'isFilled', default: true, label: 'Balle pleine' }
      ]
    },
    {
      type: 'categorie', name: 'Physique', collapse: true, content: [
        { type: 'boolean', name: 'useGravity', default: true, label: 'Gravité réaliste' },
        { type: 'number', name: 'growthOnBounce', default: 0, min: 0, max: 5, label: 'Croissance à chaque rebond' }
      ]
    },
    {
      type: 'categorie', name: 'Affichage', collapse: true, content: [
        { type: 'boolean', name: 'showBounceLines', default: false, label: 'Afficher les lignes de rebond' },
        { type: 'boolean', name: 'showString', default: false, label: 'Afficher la ficelle centre-balle' }
      ]
    }
  ]
};

export class BouncingBallGenerator extends VideoGenerator {
  static get manifest() {
    return MANIFEST;
  }

  setup(canvas, params) {
    const minDimension = Math.min(canvas.width, canvas.height);

    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;

    this.circleRadius = minDimension * 0.4;
    const minBallPercent = 0.02;
    const maxBallPercent = 0.10;
    const ballPercent = minBallPercent + (maxBallPercent - minBallPercent) * ((params.ballRadius - 5) / (50 - 5));
    this.currentRadius = this.circleRadius * ballPercent;

    this.isAnimationComplete = false;
    this.bounceLines = [];

    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * (this.circleRadius - this.currentRadius);
    this.x = this.centerX + Math.cos(angle) * distance;
    this.y = this.centerY + Math.sin(angle) * distance;

    const speedAngle = Math.random() * 2 * Math.PI;
    const baseSpeed = 0.015 * minDimension;
    const initialSpeed = baseSpeed * (params.speed / 5);
    this.vx = Math.cos(speedAngle) * initialSpeed;
    this.vy = Math.sin(speedAngle) * initialSpeed;

    this.gravity = 0.0004 * minDimension * (params.useGravity ? 1 : 0);
    this.friction = 0.99;
  }

  draw(canvas, params) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const minDimension = Math.min(canvas.width, canvas.height);
    const scaleFactor = minDimension / 800;

    ctx.strokeStyle = params.circleColor;
    ctx.lineWidth = 3 * scaleFactor;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.circleRadius, 0, 2 * Math.PI);
    ctx.stroke();

    if (this.isAnimationComplete) {
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.circleRadius, 0, 2 * Math.PI);
      if (params.isFilled) {
        ctx.fillStyle = params.ballColor;
        ctx.fill();
      } else {
        ctx.strokeStyle = params.ballColor;
        ctx.lineWidth = 2 * scaleFactor;
        ctx.stroke();
      }
      return;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (params.useGravity) {
      this.vy += this.gravity;
    }

    const dx = this.x - this.centerX;
    const dy = this.y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance + this.currentRadius >= this.circleRadius) {
      const nx = dx / distance;
      const ny = dy / distance;

      this.x = this.centerX + nx * (this.circleRadius - this.currentRadius);
      this.y = this.centerY + ny * (this.circleRadius - this.currentRadius);

      if (params.showBounceLines) {
        const angle = Math.atan2(this.y - this.centerY, this.x - this.centerX);
        const edgeX = this.centerX + Math.cos(angle) * this.circleRadius;
        const edgeY = this.centerY + Math.sin(angle) * this.circleRadius;
        this.bounceLines.push({
          x1: edgeX,
          y1: edgeY,
          x2: this.centerX,
          y2: this.centerY
        });
      }

      const dotProduct = this.vx * nx + this.vy * ny;
      this.vx = this.vx - 2 * dotProduct * nx;
      this.vy = this.vy - 2 * dotProduct * ny;

      this.vx *= this.friction;
      this.vy *= this.friction;

      if (params.growthOnBounce > 0) {
        this.currentRadius += params.growthOnBounce * scaleFactor;
        if (this.currentRadius >= this.circleRadius) {
          this.isAnimationComplete = true;
          this.currentRadius = this.circleRadius;
        }
      }
    }

    if (params.showBounceLines) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1 * scaleFactor;
      this.bounceLines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      });
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentRadius, 0, 2 * Math.PI);

    if (params.isFilled) {
      ctx.fillStyle = params.ballColor;
      ctx.fill();
    } else {
      ctx.strokeStyle = params.ballColor;
      ctx.lineWidth = 2 * scaleFactor;
      ctx.stroke();
    }

    if (params.showString) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(200,200,200,0.7)';
      ctx.lineWidth = 2 * scaleFactor;
      ctx.moveTo(this.centerX, this.centerY);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
    }
  }
} 