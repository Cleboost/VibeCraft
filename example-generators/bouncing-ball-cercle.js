const MANIFEST = {
  name: "Balle Rebondissante avec Arcs Rotatifs",
  version: "1.0.3",
  package_id: "com.vibecraft.balle-rebondissante-arcs-rotatifs",
  api_version: "1.0",
  description: "Une balle rebondit à l'intérieur d'arcs rotatifs avec des espaces, faisant exploser l'arc le plus proche lorsqu'elle passe à travers l'espace, avec des transitions fluides et des arcs infinis.",
  author: "VibeCraft",
  config: [
    { name: 'destructionMode', type: 'boolean', default: false, label: 'Mode Destruction Totale' },
    {
      type: 'categorie', name: 'Balle', collapse: false, content: [
        { name: 'ballColor', type: 'color', default: '#ffffff', label: 'Couleur de la balle' },
        { name: 'ballSpeed', type: 'number', default: 2.5, min: 0.5, max: 10, step: 0.1, label: 'Vitesse de la balle' }
      ]
    },
    {
      type: 'categorie', name: 'Cercles', collapse: false, content: [
        { name: 'arcColor', type: 'color', default: '#ffffff', label: 'Couleur des cercles' },
        { name: 'arcThickness', type: 'number', default: 2, min: 1, max: 10, label: 'Épaisseur des cercles' },
        { name: 'arcSpacing', type: 'number', default: 1, min: 0.5, max: 3, step: 0.1, label: 'Espace entre les cercles' }
      ]
    },
    {
      type: 'categorie', name: 'Effets', collapse: true, content: [
        { name: 'advancedExplosion', type: 'boolean', default: true, label: 'Explosion circulaire avancée' }
      ]
    }
  ]
};

return class GenerateurBalleRebondissante extends VideoGenerator {
  static get manifest() {
    return MANIFEST;
  }

  setup(canvas, params) {
    this.canvas = canvas;
    this.centreX = canvas.width / 2;
    this.centreY = canvas.height / 2;
    this.nombreArcs = 8;
    this.rayonBase = Math.min(canvas.width, canvas.height) * 0.4 / 3 * params.arcSpacing;
    this.rayonConfinement = this.rayonBase * (this.nombreArcs + 0.5);
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

  creerExplosionSimple() {
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

  creerExplosionAvancee(arc, params) {
    const rgb = this.hexToRgb(params.arcColor);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    const nombreParticules = Math.floor(arc.rayon * 0.5);
    for (let i = 0; i < nombreParticules; i++) {
      const angle = (i / nombreParticules) * Math.PI * 2;
      const x = this.centreX + Math.cos(angle) * arc.rayon;
      const y = this.centreY + Math.sin(angle) * arc.rayon;
      
      const vitesse = Math.random() * 4 + 2;
      const vx = Math.cos(angle) * vitesse;
      const vy = Math.sin(angle) * vitesse;
      
      this.particules.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        teinte: hsl.h + (Math.random() - 0.5) * 60,
        saturation: Math.max(50, hsl.s + (Math.random() - 0.5) * 40),
        luminosite: Math.max(40, Math.min(80, hsl.l + (Math.random() - 0.5) * 40)),
        vie: 1,
        taille: Math.random() * 3 + 2
      });
    }
    
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vitesse = Math.random() * 6 + 3;
      this.particules.push({
        x: this.balle.x,
        y: this.balle.y,
        vx: Math.cos(angle) * vitesse,
        vy: Math.sin(angle) * vitesse,
        teinte: hsl.h + (Math.random() - 0.5) * 60,
        saturation: Math.max(50, hsl.s + (Math.random() - 0.5) * 40),
        luminosite: Math.max(40, Math.min(80, hsl.l + (Math.random() - 0.5) * 40)),
        vie: 1,
        taille: Math.random() * 4 + 3
      });
    }
  }

  creerExplosion(arc, params) {
    if (params.advancedExplosion) {
      this.creerExplosionAvancee(arc, params);
    } else {
      this.creerExplosionSimple();
    }
  }

  draw(canvas, params) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
      ctx.shadowBlur = 10;
      ctx.shadowColor = params.arcColor;
      ctx.strokeStyle = params.arcColor;
      ctx.lineWidth = params.arcThickness;
      if (arc.explosion) {
        const rgb = this.hexToRgb(params.arcColor);
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${1 - arc.progressionExplosion})`;
        ctx.shadowColor = `rgba(${rgb.r},${rgb.g},${rgb.b},${1 - arc.progressionExplosion})`;
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
      p.vie -= params.advancedExplosion ? 0.015 : 0.02;
      
      if (params.advancedExplosion) {
        p.vx *= 0.98;
        p.vy *= 0.98;
      }
      
      if (p.vie <= 0) {
        this.particules.splice(i, 1);
        continue;
      }
      
      ctx.save();
      
      if (params.advancedExplosion) {
        const alpha = p.vie;
        const saturation = p.saturation || 100;
        const luminosite = p.luminosite || 60;
        const taille = (p.taille || 3) * p.vie;
        
        ctx.fillStyle = `hsla(${p.teinte}, ${saturation}%, ${luminosite}%, ${alpha})`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, taille, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `hsl(${p.teinte}, 100%, 60%)`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.vie, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }

    if (this.toutDetruit) return;

    this.balle.x += this.balle.vx;
    this.balle.y += this.balle.vy;

    if (params.destructionMode) {
      if (this.balle.x - this.balle.rayon < 0 || this.balle.x + this.balle.rayon > canvas.width) {
        this.balle.vx *= -1;
        this.balle.x = Math.max(this.balle.rayon, Math.min(canvas.width - this.balle.rayon, this.balle.x));
      }
      if (this.balle.y - this.balle.rayon < 0 || this.balle.y + this.balle.rayon > canvas.height) {
        this.balle.vy *= -1;
        this.balle.y = Math.max(this.balle.rayon, Math.min(canvas.height - this.balle.rayon, this.balle.y));
      }
    } else {
      const distanceBalleCentre = this.obtenirDistanceBalleCentre();
      
      if (distanceBalleCentre + this.balle.rayon >= this.rayonConfinement) {
        const dx = this.balle.x - this.centreX;
        const dy = this.balle.y - this.centreY;
        const norme = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / norme;
        const ny = dy / norme;
        
        this.balle.x = this.centreX + nx * (this.rayonConfinement - this.balle.rayon);
        this.balle.y = this.centreY + ny * (this.rayonConfinement - this.balle.rayon);
        
        const produitScalaire = this.balle.vx * nx + this.balle.vy * ny;
        this.balle.vx -= 2 * produitScalaire * nx;
        this.balle.vy -= 2 * produitScalaire * ny;
        
        const angle = Math.atan2(this.balle.vy, this.balle.vx) + (Math.random() - 0.5) * 0.1;
        const vitesse = Math.sqrt(this.balle.vx ** 2 + this.balle.vy ** 2);
        this.balle.vx = Math.cos(angle) * vitesse;
        this.balle.vy = Math.sin(angle) * vitesse;
      }
    }

    const distanceBalle = this.obtenirDistanceBalleCentre();
    const angleBalle = this.obtenirAngleBalle();
    
    let arcPlusProche = null;
    let distancePlusProche = Infinity;
    for (const arc of this.arcs) {
      if (params.destructionMode && arc.detruit) continue;
      const dist = Math.abs(distanceBalle - arc.rayon);
      if (dist < distancePlusProche) {
        distancePlusProche = dist;
        arcPlusProche = arc;
      }
    }
    
    if (arcPlusProche && distancePlusProche < this.balle.rayon) {
      if (params.destructionMode) {
        if (this.estAngleDansEspace(angleBalle, arcPlusProche)) {
          if (!arcPlusProche.explosion) {
            arcPlusProche.explosion = true;
            arcPlusProche.progressionExplosion = 0;
            this.creerExplosion(arcPlusProche, params);
          }
        }
        this.rebondRadial();
      } else {
        if (arcPlusProche.explosion) return;
        if (this.estAngleDansEspace(angleBalle, arcPlusProche)) {
          this.rebondRadial();
          if (!arcPlusProche.explosion) {
            arcPlusProche.explosion = true;
            arcPlusProche.progressionExplosion = 0;
            this.creerExplosion(arcPlusProche, params);
          }
        } else {
          this.rebondRadial();
        }
      }
    }

    for (const arc of this.arcs) {
      if (!arc.explosion) continue;
      arc.progressionExplosion += 0.03;
      if (arc.progressionExplosion >= 1) {
        if (params.destructionMode) {
          arc.detruit = true;
          arc.explosion = false;
          if (this.arcs.every(a => a.detruit)) {
            this.toutDetruit = true;
          }
        } else {
          const nouveauxArcs = [];
          for (let j = 0; j < this.arcs.length; j++) {
            if (this.arcs[j] === arc) continue;
            const ancienArc = this.arcs[j];
            const indexArc = this.arcs.indexOf(arc);
            const nouvellePosition = j > indexArc ? j - 1 : j;
            nouveauxArcs.push({
              rayon: ancienArc.rayon,
              rayonCible: this.rayonBase * (nouvellePosition + 1),
              angle: ancienArc.angle,
              debutEspace: ancienArc.debutEspace,
              tailleEspace: ancienArc.tailleEspace,
              explosion: false,
              progressionExplosion: 0,
              delaiAnimation: j > indexArc ? (j - indexArc) * 8 : 0,
              detruit: false
            });
          }
          nouveauxArcs.push({
            rayon: this.rayonBase * 8 * 1.8,
            rayonCible: this.rayonBase * 8,
            angle: Math.random() * Math.PI * 2,
            debutEspace: Math.random() * Math.PI * 2,
            tailleEspace: Math.PI / 3,
            explosion: false,
            progressionExplosion: 0,
            delaiAnimation: 64,
            detruit: false
          });
          this.arcs = nouveauxArcs;
        }
        break;
      }
    }

    ctx.save();
    ctx.fillStyle = params.ballColor;
    ctx.shadowColor = params.ballColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.balle.x, this.balle.y, this.balle.rayon, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 255, g: 255, b: 255};
  }

  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  cleanup() {
    this.balle = null;
    this.particules = [];
    this.arcs = [];
  }
}