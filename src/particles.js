// Motor de Partículas e Efeitos de Alta Fidelidade (Canvas)

// Estado Global das Partículas
let bgAnimationId = null;
let sparksAnimationId = null;
let rainAnimationId = null;

let bgCanvas, bgCtx;
let sparksCanvas, sparksCtx;
let rainCanvas, rainCtx;

const bgParticles = [];
const activeSparks = [];
const rainPetals = [];

// ==========================================
// 1. Partículas Lentas de Fundo (Cristais)
// ==========================================
class CrystalParticle {
  constructor(width, height) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = Math.random() * 2 + 1; // 1px a 3px
    this.speedY = -(Math.random() * 0.2 + 0.05); // Sobem lentamente
    this.speedX = Math.random() * 0.1 - 0.05;
    this.alpha = Math.random() * 0.4 + 0.1;
    this.twinkleSpeed = Math.random() * 0.01 + 0.005;
    this.twinklePhase = Math.random() * Math.PI;
  }

  update(width, height) {
    this.y += this.speedY;
    this.x += this.speedX;
    this.twinklePhase += this.twinkleSpeed;
    
    // Reposiciona se sair do topo
    if (this.y < 0) {
      this.y = height;
      this.x = Math.random() * width;
    }
    // Reposiciona se sair das laterais
    if (this.x < 0 || this.x > width) {
      this.x = Math.random() * width;
    }
  }

  draw(ctx) {
    const currentAlpha = Math.max(0.05, this.alpha + Math.sin(this.twinklePhase) * 0.15);
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(184, 164, 217, ${currentAlpha})`; // Tom violeta suave
    ctx.shadowBlur = this.size * 2;
    ctx.shadowColor = 'rgba(229, 192, 180, 0.5)'; // Brilho Rose Gold
    ctx.fill();
    ctx.restore();
  }
}

export function initBackgroundParticles(canvasElement) {
  if (bgAnimationId) cancelAnimationFrame(bgAnimationId);
  
  bgCanvas = canvasElement;
  bgCtx = bgCanvas.getContext('2d');
  
  const resizeBg = () => {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
  };
  
  resizeBg();
  window.addEventListener('resize', resizeBg);
  
  // Criar partículas
  bgParticles.length = 0;
  const particleCount = Math.min(60, Math.floor((bgCanvas.width * bgCanvas.height) / 18000));
  for (let i = 0; i < particleCount; i++) {
    bgParticles.push(new CrystalParticle(bgCanvas.width, bgCanvas.height));
  }
  
  function animateBg() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    for (let i = 0; i < bgParticles.length; i++) {
      bgParticles[i].update(bgCanvas.width, bgCanvas.height);
      bgParticles[i].draw(bgCtx);
    }
    
    bgAnimationId = requestAnimationFrame(animateBg);
  }
  
  animateBg();
}

// ==========================================
// 2. Faíscas Físicas de Toque (Juicy UI)
// ==========================================
class TouchSpark {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    
    // Dispersão em direções radiais
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 2; // Velocidade inicial explosiva
    
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 1.5; // Viés levemente para cima
    
    this.size = Math.random() * 3 + 1.5;
    this.alpha = 1;
    this.decay = Math.random() * 0.02 + 0.015; // Desaparecimento rápido
    this.color = Math.random() > 0.4 ? 'rgba(255, 123, 144, ' : 'rgba(229, 192, 180, '; // Rose Gold ou Blush Pink
    this.gravity = 0.12; // Efeito físico de queda
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity; // Aplica gravidade
    this.vx *= 0.98; // Atrito do ar
    this.alpha -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    // Desenha losangos brilhantes para simular cristais
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.random() * Math.PI);
    ctx.moveTo(0, -this.size);
    ctx.lineTo(this.size / 2, 0);
    ctx.lineTo(0, this.size);
    ctx.lineTo(-this.size / 2, 0);
    ctx.closePath();
    
    ctx.fillStyle = `${this.color}${this.alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff7b90';
    ctx.fill();
    ctx.restore();
  }
}

export function triggerTouchSparks(x, y) {
  if (!sparksCanvas) {
    // Configura o canvas de faíscas dinamicamente caso não exista
    sparksCanvas = document.getElementById('sparks-canvas');
    if (!sparksCanvas) return;
    sparksCtx = sparksCanvas.getContext('2d');
    
    const resizeSparks = () => {
      sparksCanvas.width = window.innerWidth;
      sparksCanvas.height = window.innerHeight;
    };
    resizeSparks();
    window.addEventListener('resize', resizeSparks);
  }
  
  // Adiciona um feixe de 8 faíscas
  for (let i = 0; i < 8; i++) {
    activeSparks.push(new TouchSpark(x, y));
  }
  
  // Inicia animação se não estiver rodando
  if (!sparksAnimationId) {
    animateSparks();
  }
}

function animateSparks() {
  sparksCtx.clearRect(0, 0, sparksCanvas.width, sparksCanvas.height);
  
  for (let i = activeSparks.length - 1; i >= 0; i--) {
    const spark = activeSparks[i];
    spark.update();
    
    if (spark.alpha <= 0) {
      activeSparks.splice(i, 1);
    } else {
      spark.draw(sparksCtx);
    }
  }
  
  if (activeSparks.length > 0) {
    sparksAnimationId = requestAnimationFrame(animateSparks);
  } else {
    sparksAnimationId = null;
    sparksCtx.clearRect(0, 0, sparksCanvas.width, sparksCanvas.height);
  }
}

// ==========================================
// 3. Chuva de Pétalas 3D (Rosas e Orquídeas)
// ==========================================
class FlowerPetal {
  constructor(width) {
    this.x = Math.random() * width;
    this.y = -20 - Math.random() * 100;
    this.size = Math.random() * 12 + 10; // 10px a 22px
    this.speedY = Math.random() * 1.5 + 1; // Cair suavemente
    
    // Movimento oscilatório horizontal (efeito folha ao vento)
    this.angle = Math.random() * Math.PI * 2;
    this.angleSpeed = Math.random() * 0.02 + 0.01;
    this.oscillationWidth = Math.random() * 20 + 10;
    
    // Rotação 3D
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = Math.random() * 0.03 - 0.015;
    this.skew = Math.random() * 0.8 + 0.2; // Efeito de profundidade 3D
    this.skewSpeed = Math.random() * 0.02 + 0.01;
    
    // Tipo: Rosa Vermelha ou Orquídea (Violeta suave)
    this.type = Math.random() > 0.4 ? 'rose' : 'orchid';
  }

  update(width, height) {
    this.y += this.speedY;
    this.angle += this.angleSpeed;
    this.rotation += this.rotationSpeed;
    this.skew = Math.sin(this.angle) * 0.6 + 0.4;
    
    // Movimento horizontal sutil baseado em cosseno
    this.x += Math.cos(this.angle) * 0.8;
    
    // Reset se sair da tela
    if (this.y > height + 20) {
      this.y = -20;
      this.x = Math.random() * width;
      this.speedY = Math.random() * 1.5 + 1;
    }
  }

  draw(ctx) {
    ctx.save();
    
    // Posiciona e aplica rotação/inclinação 3D
    ctx.translate(this.x + Math.sin(this.angle) * this.oscillationWidth / 2, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.skew, 1); // Simula profundidade 3D achatando no eixo X
    
    ctx.beginPath();
    
    if (this.type === 'rose') {
      // Pétala de Rosa Vermelha Romântica (Gota gordinha)
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-this.size / 2, -this.size / 2, -this.size, this.size / 3, 0, this.size);
      ctx.bezierCurveTo(this.size, this.size / 3, this.size / 2, -this.size / 2, 0, 0);
      
      const grad = ctx.createLinearGradient(0, 0, 0, this.size);
      grad.addColorStop(0, '#e63946'); // Vermelho vivo
      grad.addColorStop(1, '#6b050c'); // Vermelho escuro e rico
      ctx.fillStyle = grad;
    } else {
      // Pétala de Orquídea Delicada (Asas ovais com pontas)
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-this.size * 0.8, -this.size * 0.2, -this.size * 0.4, this.size, 0, this.size * 0.9);
      ctx.bezierCurveTo(this.size * 0.4, this.size, this.size * 0.8, -this.size * 0.2, 0, 0);
      
      const grad = ctx.createLinearGradient(0, 0, 0, this.size);
      grad.addColorStop(0, '#e1bee7'); // Violeta claro / orquídea
      grad.addColorStop(0.5, '#ba68c8'); // Lilás
      grad.addColorStop(1, '#6a1b9a'); // Roxo aveludado
      ctx.fillStyle = grad;
    }
    
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.fill();
    ctx.restore();
  }
}

export function startFlowerRain(canvasElement) {
  if (rainAnimationId) cancelAnimationFrame(rainAnimationId);
  
  rainCanvas = canvasElement;
  rainCtx = rainCanvas.getContext('2d');
  
  const resizeRain = () => {
    rainCanvas.width = window.innerWidth;
    rainCanvas.height = window.innerHeight;
  };
  
  resizeRain();
  window.addEventListener('resize', resizeRain);
  
  // Criar pétalas
  rainPetals.length = 0;
  const petalCount = Math.min(50, Math.floor((rainCanvas.width * rainCanvas.height) / 22000));
  for (let i = 0; i < petalCount; i++) {
    rainPetals.push(new FlowerPetal(rainCanvas.width));
  }
  
  function animateRain() {
    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    
    for (let i = 0; i < rainPetals.length; i++) {
      rainPetals[i].update(rainCanvas.width, rainCanvas.height);
      rainPetals[i].draw(rainCtx);
    }
    
    rainAnimationId = requestAnimationFrame(animateRain);
  }
  
  animateRain();
}

export function stopFlowerRain() {
  if (rainAnimationId) {
    cancelAnimationFrame(rainAnimationId);
    rainAnimationId = null;
  }
  if (rainCtx && rainCanvas) {
    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
  }
}
