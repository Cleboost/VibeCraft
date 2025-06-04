import { VideoGenerator } from '../utils/VideoGenerator';
/**
 * Manifest du générateur de balle rebondissante
 */
const MANIFEST = {
  name: "Balle Rebondissante",
  version: "1.0.0",
  package_id: "com.vibecraft.generators.bouncing-ball",
  api_version: "1.0",
  description: "Générateur de balle rebondissante avec physique réaliste",
  author: "VibeCraft",
  config: [
    { name: 'speed', type: 'number', default: 3, min: 1, max: 10, label: 'Vitesse initiale de la balle' },
    { name: 'ballColor', type: 'color', default: '#ff0000', label: 'Couleur de la balle' },
    { name: 'circleColor', type: 'color', default: '#0000ff', label: 'Couleur du cercle' },
    { name: 'ballRadius', type: 'number', default: 20, min: 5, max: 50, label: 'Rayon de la balle' },
    { name: 'isFilled', type: 'boolean', default: true, label: 'Balle pleine' },
    { name: 'useGravity', type: 'boolean', default: true, label: 'Gravité réaliste' },
    { name: 'growthOnBounce', type: 'number', default: 0, min: 0, max: 5, label: 'Croissance à chaque rebond' },
    { name: 'showBounceLines', type: 'boolean', default: false, label: 'Afficher les lignes de rebond' },
    { name: 'showString', type: 'boolean', default: false, label: 'Afficher la ficelle centre-balle' }
  ]
};

/**
 * Générateur de balle rebondissante par défaut
 */
export class BouncingBallGenerator extends VideoGenerator {
  static get manifest() {
    return MANIFEST;
  }

  setup(canvas, params) {
    // Calculer les dimensions en fonction de la résolution
    const minDimension = Math.min(canvas.width, canvas.height);
    
    // Centrer le cercle
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    
    // Rayon du cercle = 40% de la plus petite dimension
    this.circleRadius = minDimension * 0.4;
    // Rayon de la balle = pourcentage du rayon du cercle (de 2% à 10% selon le paramètre utilisateur)
    const minBallPercent = 0.02;
    const maxBallPercent = 0.10;
    const ballPercent = minBallPercent + (maxBallPercent - minBallPercent) * ((params.ballRadius - 5) / (50 - 5));
    this.currentRadius = this.circleRadius * ballPercent;
    
    this.isAnimationComplete = false;
    this.bounceLines = [];
    
    // Position initiale aléatoire dans le cercle
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * (this.circleRadius - this.currentRadius);
    this.x = this.centerX + Math.cos(angle) * distance;
    this.y = this.centerY + Math.sin(angle) * distance;
    
    // Vitesse initiale aléatoire
    const speedAngle = Math.random() * 2 * Math.PI;
    // Ajuster la vitesse en fonction de la résolution
    const baseSpeed = 0.015 * minDimension; // vitesse de base proportionnelle à la taille
    const initialSpeed = baseSpeed * (params.speed / 5); // params.speed de 1 à 10
    this.vx = Math.cos(speedAngle) * initialSpeed;
    this.vy = Math.sin(speedAngle) * initialSpeed;
    
    // Constantes physiques adaptées à la résolution
    this.gravity = 0.0004 * minDimension * (params.useGravity ? 1 : 0); // gravité proportionnelle
    this.friction = 0.99;
  }

  draw(canvas, params) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculer le facteur d'échelle
    const minDimension = Math.min(canvas.width, canvas.height);
    const scaleFactor = minDimension / 800; // 800 est la largeur de référence
    
    // Dessiner le cercle de contour
    ctx.strokeStyle = params.circleColor;
    ctx.lineWidth = 3 * scaleFactor;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.circleRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Si l'animation est terminée, dessiner uniquement la balle finale
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
    
    // Mettre à jour la position
    this.x += this.vx;
    this.y += this.vy;
    
    // Appliquer la gravité si activée
    if (params.useGravity) {
      this.vy += this.gravity;
    }
    
    // Vérifier la collision avec le cercle
    const dx = this.x - this.centerX;
    const dy = this.y - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance + this.currentRadius >= this.circleRadius) {
      // Normaliser le vecteur de collision
      const nx = dx / distance;
      const ny = dy / distance;
      
      // Replacer la balle à la bonne position
      this.x = this.centerX + nx * (this.circleRadius - this.currentRadius);
      this.y = this.centerY + ny * (this.circleRadius - this.currentRadius);
      
      // Ajouter une ligne de rebond si l'option est activée
      if (params.showBounceLines) {
        // Calculer la direction du rebond
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
      
      // Calculer la réflexion (rebond)
      const dotProduct = this.vx * nx + this.vy * ny;
      this.vx = this.vx - 2 * dotProduct * nx;
      this.vy = this.vy - 2 * dotProduct * ny;
      
      // Ajouter un peu d'amortissement
      this.vx *= this.friction;
      this.vy *= this.friction;

      // Augmenter la taille de la balle si l'option est activée
      if (params.growthOnBounce > 0) {
        this.currentRadius += params.growthOnBounce * scaleFactor;
        // Vérifier si la balle a atteint la taille du cercle
        if (this.currentRadius >= this.circleRadius) {
          this.isAnimationComplete = true;
          this.currentRadius = this.circleRadius;
        }
      }
    }
    
    // Dessiner les lignes de rebond
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
    
    // Dessiner la balle
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

    // Dessiner la ficelle si activée
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