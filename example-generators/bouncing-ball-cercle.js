const MANIFEST = {
  name: "Balle Rebondissante avec Arcs Rotatifs",
  version: "1.0.2",
  package_id: "com.vibecraft.balle-rebondissante-arcs-rotatifs",
  api_version: "1.0",
  description: "Une balle rebondit à l'intérieur d'arcs rotatifs avec des espaces, faisant exploser l'arc le plus proche lorsqu'elle passe à travers l'espace, avec des transitions fluides et des arcs infinis.",
  author: "VibeCraft",
  config: [
    { name: 'destructionMode', type: 'boolean', default: false, label: 'Mode Destruction Totale' },
    { name: 'ballColor', type: 'color', default: '#ffffff', label: 'Couleur de la balle' },
    { name: 'ballSpeed', type: 'number', default: 2.5, min: 0.5, max: 10, step: 0.1, label: 'Vitesse de la balle' },
    { name: 'arcColor', type: 'color', default: '#ffffff', label: 'Couleur des cercles' },
    { name: 'arcThickness', type: 'number', default: 2, min: 1, max: 10, label: 'Épaisseur des cercles' },
    { name: 'arcSpacing', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1, label: 'Espace entre les cercles' }
  ]
};

return class GenerateurBalleRebondissante extends VideoGenerator {
  static get manifest() {
    return MANIFEST;
  }

  initialisation(canvas, params) {
    this.canvas = canvas;
    this.centreX = canvas.width / 2;
    this.centreY = canvas.height / 2;
    this.nombreArcs = 8;
    this.rayonBase = Math.min(canvas.width, canvas.height) * 0.4 / 3 * params.arcSpacing;
    this.arcs = Array.from({length: this.nombreArcs}, (_, i) => ({
      rayon: this.rayonBase * (i + 1),
      rayonCible: this.rayonBase * (i + 1),
      angle: Math.random() * Math.PI * 2,
      debutEspace: Math.random() * Math.PI * 2,
      tailleEspace: Math.PI / 3,
      explosion: false,
      progressionExplosion: 0,
      delaiAnimation: 0,
      detruit: false
    }));
    this.balle = {
      x: this.centreX + 50,
      y: this.centreY + 50,
      rayon: 10,
      vx: params.ballSpeed,
      vy: params.ballSpeed
    };
    this.particules = [];
    this.vitesseRotation = 0.01;
    this.toutDetruit = false;
  }

  obtenirDistanceBalleCentre() {
    return Math.sqrt(
      (this.balle.x - this.centreX) ** 2 + (this.balle.y - this.centreY) ** 2
    );
  }

  obtenirAngleBalle() {
    return Math.atan2(this.balle.y - this.centreY, this.balle.x - this.centreX);
  }

  estAngleDansEspace(angle, arc) {
    const debutEspace = (arc.angle + arc.debutEspace) % (Math.PI * 2);
    const finEspace = (debutEspace + arc.tailleEspace) % (Math.PI * 2);
    const angleNormalise = (angle + Math.PI * 2) % (Math.PI * 2);
    
    if (debutEspace < finEspace) {
      return angleNormalise >= debutEspace && angleNormalise <= finEspace;
    } else {
      return angleNormalise >= debutEspace || angleNormalise <= finEspace;
    }
  }

  rebondRadial() {
    const dx = this.balle.x - this.centreX;
    const dy = this.balle.y - this.centreY;
    const norme = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / norme;
    const ny = dy / norme;
    
    const produitScalaire = this.balle.vx * nx + this.balle.vy * ny;
    this.balle.vx -= 2 * produitScalaire * nx;
    this.balle.vy -= 2 * produitScalaire * ny;
    
    const angle = Math.atan2(this.balle.vy, this.balle.vx) + (Math.random() - 0.5) * 0.1;
    const vitesse = Math.sqrt(this.balle.vx ** 2 + this.balle.vy ** 2);
    this.balle.vx = Math.cos(angle) * vitesse;
    this.balle.vy = Math.sin(angle) * vitesse;
    
    this.balle.x += this.balle.vx * 2;
    this.balle.y += this.balle.vy * 2;
  }

  creerExplosion() {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vitesse = Math.random() * 3 + 1;
      this.particules.push({
        x: this.balle.x,
        y: this.balle.y,
        vx: Math.cos(angle) * vitesse,
        vy: Math.sin(angle) * vitesse,
        teinte: Math.random() * 360,
        vie: 1
      });
    }
  }

  dessiner(canvas, params) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = 10;
    ctx.strokeStyle = params.arcColor;
    ctx.lineWidth = params.arcThickness;

    for (const arc of this.arcs) {
      if (arc.detruit) continue;
      
      if (!arc.explosion) arc.angle = (arc.angle + 0.01) % (Math.PI * 2);
      if (arc.delaiAnimation <= 0) {
        arc.rayon += (arc.rayonCible - arc.rayon) * 0.03;
      } else {
        arc.delaiAnimation--;
      }
      
      const debutEspace = arc.angle + arc.debutEspace;
      const debutArc = debutEspace + arc.tailleEspace;
      const finArc = debutEspace + Math.PI * 2;
      
      ctx.save();
      if (arc.explosion) {
        const rgb = this.hexVersRgb(params.arcColor);
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${1 - arc.progressionExplosion})`;
      }
      ctx.beginPath();
      ctx.arc(this.centreX, this.centreY, arc.rayon, debutArc, finArc);
      ctx.stroke();
      ctx.restore();
    }

    for (let i = this.particules.length - 1; i >= 0; i--) {
      const p = this.particules[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vie -= 0.02;
      if (p.vie <= 0) {
        this.particules.splice(i, 1);
        continue;
      }
      ctx.fillStyle = `hsl(${p.teinte}, 100%, 60%)`;
      ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * p.vie, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.toutDetruit) return;

    this.balle.x += this.balle.vx;
    this.balle.y += this.balle.vy;

    if (this.balle.x - this.balle.rayon < 0 || this.balle.x + this.balle.rayon > canvas.width) {
      this.balle.vx *= -1;
      this.balle.x = Math.max(this.balle.rayon, Math.min(canvas.width - this.balle.rayon, this.balle.x));
    }
    if (this.balle.y - this.balle.rayon < 0 || this.balle.y + this.balle.rayon > canvas.height) {
      this.balle.vy *= -1;
      this.balle.y = Math.max(this.balle.rayon, Math.min(canvas.height - this.balle.rayon, this.balle.y));
    }

    const distanceBalle = this.obtenirDistanceBalleCentre();
    const angleBalle = this.obtenirAngleBalle();
    
    let arcPlusProche = null;
    let distancePlusProche = Infinity;
    for (const arc of this.arcs) {
      if (params.destructionMode && arc.destroyed) continue;
      const dist = Math.abs(ballDist - arc.radius);
      if (dist < closestDist) {
        closestDist = dist;
        closestArc = arc;
      }
    }
    
    if (closestArc && closestDist < this.ball.radius) {
      if (params.destructionMode) {
        if (this.isAngleInGap(ballAngle, closestArc)) {
          if (!closestArc.exploding) {
            closestArc.exploding = true;
            closestArc.explosionProgress = 0;
            this.createExplosion();
          }
        }
        this.bounceRadial();
      } else {
        if (closestArc.exploding) return;
        if (this.isAngleInGap(ballAngle, closestArc)) {
          this.bounceRadial();
          if (!closestArc.exploding) {
            closestArc.exploding = true;
            closestArc.explosionProgress = 0;
            this.createExplosion();
          }
        } else {
          this.bounceRadial();
        }
      }
    }

    for (const arc of this.arcs) {
      if (!arc.exploding) continue;
      arc.explosionProgress += 0.03;
      if (arc.explosionProgress >= 1) {
        if (params.destructionMode) {
          arc.destroyed = true;
          arc.exploding = false;
          if (this.arcs.every(a => a.destroyed)) {
            this.allDestroyed = true;
          }
        } else {
          const newArcs = [];
          for (let j = 0; j < this.arcs.length; j++) {
            if (this.arcs[j] === arc) continue;
            const oldArc = this.arcs[j];
            const arcIndex = this.arcs.indexOf(arc);
            const newPosition = j > arcIndex ? j - 1 : j;
            newArcs.push({
              radius: oldArc.radius,
              targetRadius: this.baseRadius * (newPosition + 1),
              angle: oldArc.angle,
              gapStart: oldArc.gapStart,
              gapSize: oldArc.gapSize,
              exploding: false,
              explosionProgress: 0,
              animationDelay: j > arcIndex ? (j - arcIndex) * 8 : 0,
              destroyed: false
            });
          }
          newArcs.push({
            radius: this.baseRadius * 8 * 1.8,
            targetRadius: this.baseRadius * 8,
            angle: Math.random() * Math.PI * 2,
            gapStart: Math.random() * Math.PI * 2,
            gapSize: Math.PI / 3,
            exploding: false,
            explosionProgress: 0,
            animationDelay: 64,
            destroyed: false
          });
          this.arcs = newArcs;
        }
        break;
      }
    }

    ctx.fillStyle = params.ballColor;
    ctx.shadowColor = params.ballColor;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fonction utilitaire pour convertir hex en rgb
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 255, g: 255, b: 255};
  }

  cleanup() {
    this.ball = null;
    this.particles = [];
    this.arcs = [];
  }
}