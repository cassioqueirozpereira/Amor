import { defaultTextData } from './textData.js';
import { 
  initBackgroundParticles, 
  triggerTouchSparks, 
  startFlowerRain, 
  stopFlowerRain 
} from './particles.js';

// 1. Inicializar os Textos (Carrega do localStorage para preview do Cassio, ou usa os originais)
const savedData = localStorage.getItem('amor_homenagem_data');
const textData = savedData ? JSON.parse(savedData) : defaultTextData;

// 2. Elementos Globais do DOM
const appElement = document.getElementById('app');
const bgCanvas = document.getElementById('bg-canvas');

// 3. Gerenciamento do Reprodutor de Música Romântica
let audio = null;
let musicController = null;

function setupMusic() {
  if (audio) return; // Já configurado
  
  // Criar elemento de áudio com Gymnopédie No. 1 de Erik Satie (Piano suave e romântico)
  audio = new Audio('https://upload.wikimedia.org/wikipedia/commons/b/b8/Erik_Satie_-_Gymnop%C3%A9die_No._1_-_piano.mp3');
  audio.loop = true;
  
  // Criar botão do controlador de música flutuante
  musicController = document.createElement('div');
  musicController.className = 'music-controller no-print';
  musicController.innerHTML = `
    <span class="icon">🎵</span>
    <span class="text">Tocar Música</span>
  `;
  document.body.appendChild(musicController);
  
  musicController.addEventListener('click', toggleMusic);
  
  // Verifica se o estado de reprodução foi salvo na sessão
  if (sessionStorage.getItem('music_playing') === 'true') {
    playMusic();
  }
}

function playMusic() {
  if (!audio) return;
  audio.play()
    .then(() => {
      musicController.classList.add('playing');
      musicController.querySelector('.text').textContent = 'Pausar Música';
      sessionStorage.setItem('music_playing', 'true');
    })
    .catch(err => {
      console.log("Autoplay bloqueado pelo navegador. Aguardando interação do usuário.", err);
    });
}

function toggleMusic() {
  if (!audio) return;
  if (audio.paused) {
    playMusic();
  } else {
    audio.pause();
    musicController.classList.remove('playing');
    musicController.querySelector('.text').textContent = 'Tocar Música';
    sessionStorage.setItem('music_playing', 'false');
  }
}

// 4. Motor de Digitação HTML Elegante (HTML-Typewriter Engine)
function typeHtml(targetElement, htmlString, speed = 55, onComplete = null) {
  targetElement.innerHTML = '';
  
  const parser = document.createElement('div');
  parser.innerHTML = htmlString;
  
  const textTasks = [];
  
  // Clona a estrutura DOM de forma idêntica, mas deixando nós de texto vazios
  function cloneStructure(sourceNode, targetParent) {
    for (const child of sourceNode.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const emptyText = document.createTextNode('');
        targetParent.appendChild(emptyText);
        textTasks.push({
          node: emptyText,
          fullText: child.textContent
        });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const elementClone = child.cloneNode(false);
        targetParent.appendChild(elementClone);
        cloneStructure(child, elementClone);
      }
    }
  }
  
  cloneStructure(parser, targetElement);
  
  // Adiciona o cursor piscando ao final do container
  const cursor = document.createElement('span');
  cursor.className = 'typewriter-cursor';
  targetElement.appendChild(cursor);
  
  let currentTaskIndex = 0;
  let currentCharIndex = 0;
  let typingInterval = null;
  
  function typeNextChar() {
    if (currentTaskIndex >= textTasks.length) {
      clearInterval(typingInterval);
      cursor.remove();
      if (onComplete) onComplete();
      return;
    }
    
    const task = textTasks[currentTaskIndex];
    if (currentCharIndex < task.fullText.length) {
      task.node.textContent += task.fullText[currentCharIndex];
      currentCharIndex++;
      
      // Auto-scroll suave para visualização mobile perfeita
      const appRect = appElement.getBoundingClientRect();
      if (appRect.bottom > window.innerHeight) {
        window.scrollBy({
          top: 15,
          behavior: 'smooth'
        });
      }
    } else {
      currentTaskIndex++;
      currentCharIndex = 0;
      typeNextChar();
    }
  }
  
  typingInterval = setInterval(typeNextChar, speed);
  
  return {
    skip: () => {
      clearInterval(typingInterval);
      textTasks.forEach(task => {
        task.node.textContent = task.fullText;
      });
      cursor.remove();
      if (onComplete) onComplete();
    }
  };
}

// 5. Aplicar o Spotlight Efetivo no Card
function applyCardSpotlight(cardElement) {
  cardElement.addEventListener('mousemove', e => {
    const rect = cardElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardElement.style.setProperty('--mouse-x', `${x}px`);
    cardElement.style.setProperty('--mouse-y', `${y}px`);
  });
  
  cardElement.addEventListener('touchmove', e => {
    if (e.touches.length > 0) {
      const rect = cardElement.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      cardElement.style.setProperty('--mouse-x', `${x}px`);
      cardElement.style.setProperty('--mouse-y', `${y}px`);
    }
  });
}

// 6. Roteador SPA (Single Page Application Router)
function router() {
  stopFlowerRain(); // Para a chuva de pétalas por padrão ao mudar de página
  
  const params = new URLSearchParams(window.location.search);
  const page = params.get('p');
  
  // Inicializa o canvas de fundo
  initBackgroundParticles(bgCanvas);
  
  // Garante que a música está configurada após qualquer interação
  setupMusic();

  if (page === 'historia') {
    renderHistoria();
  } else if (page === 'filhos') {
    renderFilhos();
  } else if (page === 'motivos') {
    renderMotivos();
  } else if (page === 'carta') {
    renderCarta();
  } else {
    renderPortal();
  }
}

// ==========================================
// PÁGINA: Portal/Home
// ==========================================
function renderPortal() {
  appElement.innerHTML = `
    <div class="glass-card">
      <span class="crystal-heart">💎</span>
      <h1>${textData.portal.title}</h1>
      <div class="subtitle">${textData.portal.subtitle}</div>
      
      <div class="typewriter-content" id="portal-text"></div>
      
      <div class="no-print" style="margin-top: 20px;">
        <button class="btn-romantic" id="btn-start">
          <span>Abrir Homenagem 🌹</span>
        </button>
      </div>
    </div>
  `;
  
  const card = appElement.querySelector('.glass-card');
  applyCardSpotlight(card);
  
  const typewriterElement = document.getElementById('portal-text');
  const typingController = typeHtml(typewriterElement, textData.portal.intro, undefined);
  
  document.getElementById('btn-start').addEventListener('click', e => {
    // Ao clicar, toca a música (ultrapassando restrição do navegador)
    playMusic();
    typingController.skip();
    
    // Mostra as opções de navegação
    setTimeout(() => {
      appElement.innerHTML = `
        <div class="glass-card" style="max-width: 550px;">
          <span class="crystal-heart" style="font-size: 3rem;">💖</span>
          <h2>Nossos Capítulos</h2>
          <p class="subtitle" style="margin-bottom: 20px;">Escolha um capítulo ou escaneie o QR Code físico</p>
          
          <div style="display: flex; flex-direction: column; gap: 15px; width: 100%;">
            <a href="?p=historia" class="btn-romantic" style="justify-content: center; margin: 0;">Capítulo I: A Nossa História</a>
            <a href="?p=filhos" class="btn-romantic" style="justify-content: center; margin: 0;">Capítulo II: Os Nossos Frutos</a>
            <a href="?p=motivos" class="btn-romantic" style="justify-content: center; margin: 0;">Capítulo III: 15 Motivos Para Te Amar</a>
            <a href="?p=carta" class="btn-romantic" style="justify-content: center; margin: 0;">Capítulo IV: Carta Para o Futuro</a>
          </div>
        </div>
      `;
      applyCardSpotlight(appElement.querySelector('.glass-card'));
    }, 400);
  });
}

// ==========================================
// PÁGINA: QR Code 1 - Nossa História
// ==========================================
function renderHistoria() {
  appElement.innerHTML = `
    <div class="glass-card">
      <span class="crystal-heart" style="font-size: 3rem;">💍</span>
      <h2>${textData.historia.title}</h2>
      <div class="subtitle">${textData.historia.subtitle}</div>
      
      <div class="typewriter-content" id="historia-text"></div>
      
      <div class="no-print" style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
        <button class="btn-skip" id="btn-skip-typing">Pular digitação</button>
        <a href="." class="btn-romantic" id="btn-back" style="display: none;">Voltar ao Portal 🏛️</a>
      </div>
    </div>
  `;
  
  const card = appElement.querySelector('.glass-card');
  applyCardSpotlight(card);
  
  const textContainer = document.getElementById('historia-text');
  const btnSkip = document.getElementById('btn-skip-typing');
  const btnBack = document.getElementById('btn-back');
  
  // Toca a música automaticamente se já tiver sido interagido
  playMusic();
  
  const typingController = typeHtml(textContainer, textData.historia.content, undefined, () => {
    btnSkip.style.display = 'none';
    btnBack.style.display = 'inline-flex';
  });
  
  btnSkip.addEventListener('click', () => {
    typingController.skip();
  });
}

// ==========================================
// PÁGINA: QR Code 2 - Filhos
// ==========================================
function renderFilhos() {
  appElement.innerHTML = `
    <div class="glass-card" style="max-width: 550px;">
      <span class="crystal-heart" style="font-size: 3rem;">👨‍👩‍👧‍👦</span>
      <h2>${textData.filhos.title}</h2>
      <div class="subtitle">${textData.filhos.subtitle}</div>
      
      <div class="typewriter-content" id="filhos-intro" style="margin-bottom: 20px;"></div>
      
      <div class="children-grid" style="display: none;" id="children-block">
        <div class="child-card">
          <div class="child-name">
            <span>${textData.filhos.boy.name}</span>
            <span class="child-age">${textData.filhos.boy.age}</span>
          </div>
          <div id="boy-text" style="font-size: 0.95rem; text-align: justify; color: var(--color-text-muted);"></div>
        </div>
        
        <div class="child-card">
          <div class="child-name">
            <span>${textData.filhos.girl.name}</span>
            <span class="child-age">${textData.filhos.girl.age}</span>
          </div>
          <div id="girl-text" style="font-size: 0.95rem; text-align: justify; color: var(--color-text-muted);"></div>
        </div>
      </div>
      
      <div class="no-print" style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 20px;">
        <button class="btn-skip" id="btn-skip-typing">Pular digitação</button>
        <a href="." class="btn-romantic" id="btn-back" style="display: none;">Voltar ao Portal 🏛️</a>
      </div>
    </div>
  `;
  
  const card = appElement.querySelector('.glass-card');
  applyCardSpotlight(card);
  
  const introContainer = document.getElementById('filhos-intro');
  const childrenBlock = document.getElementById('children-block');
  const boyTextContainer = document.getElementById('boy-text');
  const girlTextContainer = document.getElementById('girl-text');
  const btnSkip = document.getElementById('btn-skip-typing');
  const btnBack = document.getElementById('btn-back');
  
  playMusic();
  
  let subTyping1 = null;
  let subTyping2 = null;
  
  const mainTyping = typeHtml(introContainer, textData.filhos.content, undefined, () => {
    childrenBlock.style.display = 'flex';
    
    // Digita recursivamente o primeiro filho
    subTyping1 = typeHtml(boyTextContainer, textData.filhos.boy.text, undefined, () => {
      // Digita o segundo filho
      subTyping2 = typeHtml(girlTextContainer, textData.filhos.girl.text, undefined, () => {
        btnSkip.style.display = 'none';
        btnBack.style.display = 'inline-flex';
      });
    });
  });
  
  btnSkip.addEventListener('click', () => {
    mainTyping.skip();
    childrenBlock.style.display = 'flex';
    if (subTyping1) subTyping1.skip();
    else boyTextContainer.innerHTML = textData.filhos.boy.text;
    
    if (subTyping2) subTyping2.skip();
    else girlTextContainer.innerHTML = textData.filhos.girl.text;
    
    btnSkip.style.display = 'none';
    btnBack.style.display = 'inline-flex';
  });
}

// ==========================================
// PÁGINA: QR Code 3 - 15 Motivos
// ==========================================
function renderMotivos() {
  appElement.innerHTML = `
    <div class="glass-card" style="max-width: 550px;">
      <span class="crystal-heart" style="font-size: 3rem;">✨</span>
      <h2>${textData.motivos.title}</h2>
      <div class="subtitle">${textData.motivos.subtitle}</div>
      
      <div class="typewriter-content" id="motivos-intro"></div>
      
      <div class="crystals-container no-print" id="crystals-block" style="display: none;">
        ${Array.from({ length: 15 }, (_, i) => `
          <div class="crystal-item" data-index="${i}"><span>${i + 1}</span></div>
        `).join('')}
      </div>
      
      <!-- Caixa de exibição do motivo revelado -->
      <div class="child-card" id="reason-display-card" style="display: none; border-color: rgba(255, 123, 144, 0.15); margin-top: 15px; text-align: center;">
        <h4 style="font-family: var(--font-serif); color: var(--color-accent); font-size: 1.1rem; margin-bottom: 8px;" id="reason-num-title">Motivo</h4>
        <div id="reason-text" style="font-size: 1rem; color: var(--color-text); font-style: italic;"></div>
      </div>
      
      <div class="no-print" style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 25px;">
        <button class="btn-skip" id="btn-skip-typing">Pular</button>
        <a href="." class="btn-romantic" id="btn-back" style="display: none;">Voltar ao Portal 🏛️</a>
      </div>
    </div>
  `;
  
  const card = appElement.querySelector('.glass-card');
  applyCardSpotlight(card);
  
  const introContainer = document.getElementById('motivos-intro');
  const crystalsBlock = document.getElementById('crystals-block');
  const displayCard = document.getElementById('reason-display-card');
  const reasonTitle = document.getElementById('reason-num-title');
  const reasonText = document.getElementById('reason-text');
  
  const btnSkip = document.getElementById('btn-skip-typing');
  const btnBack = document.getElementById('btn-back');
  
  playMusic();
  
  const mainTyping = typeHtml(introContainer, textData.motivos.content, undefined, () => {
    crystalsBlock.style.display = 'grid';
    btnSkip.style.display = 'none';
    btnBack.style.display = 'inline-flex';
  });
  
  btnSkip.addEventListener('click', () => {
    mainTyping.skip();
    crystalsBlock.style.display = 'grid';
    btnSkip.style.display = 'none';
    btnBack.style.display = 'inline-flex';
  });
  
  // Lógica dos cliques nos Cristais
  let currentReasonTyping = null;
  const crystalElements = appElement.querySelectorAll('.crystal-item');
  
  crystalElements.forEach(crystal => {
    const handleTouch = e => {
      // Impede toque duplo (touch + click)
      if (e.type === 'touchstart') e.preventDefault();
      
      const index = parseInt(crystal.getAttribute('data-index'));
      
      // 1. Juicy UI: Efeito de faíscas no exato local do toque
      let clientX, clientY;
      if (e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      triggerTouchSparks(clientX, clientY);
      
      // 2. Destaca visualmente o cristal ativo
      crystalElements.forEach(el => el.classList.remove('active'));
      crystal.classList.add('active');
      
      // 3. Exibe o painel do motivo
      displayCard.style.display = 'block';
      reasonTitle.textContent = `Motivo nº ${index + 1} de 15`;
      
      // 4. Interrompe digitação anterior se houver e digita o novo motivo
      if (currentReasonTyping) {
        currentReasonTyping.skip();
      }
      
      // Digitação rápida para motivos curtos
      currentReasonTyping = typeHtml(reasonText, `"${textData.motivos.reasons[index]}"`, undefined);
    };
    
    crystal.addEventListener('click', handleTouch);
    crystal.addEventListener('touchstart', handleTouch, { passive: false });
  });
}

// ==========================================
// PÁGINA: QR Code 4 - Carta & Pétalas
// ==========================================
function renderCarta() {
  appElement.innerHTML = `
    <div class="glass-card" style="max-width: 550px;">
      <span class="crystal-heart" style="font-size: 3rem;">✉️</span>
      <h2>${textData.carta.title}</h2>
      <div class="subtitle">${textData.carta.subtitle}</div>
      
      <!-- Canvas local exclusivo de flores sobre o card para efeito mágico -->
      <canvas id="flower-rain-canvas" style="position: absolute; top:0; left:0; width:100%; height:100%; z-index:1; pointer-events:none; border-radius:24px;"></canvas>
      
      <div class="typewriter-content" id="carta-text" style="position: relative; z-index: 2;"></div>
      
      <div class="no-print" style="display: flex; flex-direction: column; align-items: center; gap: 10px; position: relative; z-index: 3;">
        <button class="btn-skip" id="btn-skip-typing">Pular digitação</button>
        <a href="." class="btn-romantic" id="btn-back" style="display: none;">Voltar ao Portal 🏛️</a>
      </div>
    </div>
  `;
  
  const card = appElement.querySelector('.glass-card');
  applyCardSpotlight(card);
  
  const textContainer = document.getElementById('carta-text');
  const btnSkip = document.getElementById('btn-skip-typing');
  const btnBack = document.getElementById('btn-back');
  const flowerCanvas = document.getElementById('flower-rain-canvas');
  
  playMusic();
  
  const typingController = typeHtml(textContainer, textData.carta.content, undefined, () => {
    btnSkip.style.display = 'none';
    btnBack.style.display = 'inline-flex';
    
    // Inicia a chuva maravilhosa de Pétalas de Rosas e Orquídeas!
    startFlowerRain(flowerCanvas);
  });
  
  btnSkip.addEventListener('click', () => {
    typingController.skip();
    btnSkip.style.display = 'none';
    btnBack.style.display = 'inline-flex';
    startFlowerRain(flowerCanvas);
  });
}

// 7. Eventos do Roteador
window.addEventListener('DOMContentLoaded', router);
window.addEventListener('popstate', router);

// Intercepta cliques de links locais para roteamento SPA sem recarregar
document.addEventListener('click', e => {
  const anchor = e.target.closest('a');
  if (anchor && anchor.getAttribute('href') && anchor.getAttribute('href').startsWith('?')) {
    e.preventDefault();
    const url = anchor.getAttribute('href');
    window.history.pushState({}, '', url);
    router();
  }
});
