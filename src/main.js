import { defaultTextData } from './textData.js';
import { 
  initBackgroundParticles, 
  triggerTouchSparks, 
  startFlowerRain, 
  stopFlowerRain 
} from './particles.js';
import { 
  initThreeScene, 
  mountEnvelope3D,
  triggerEnvelopeOpen3D, 
  mountCrystal3D,
  triggerCrystalShatter3D, 
  mountRose3D,
  triggerRoseDissolve3D 
} from './threeScene.js';

// 1. Inicializar os Textos (Carrega do localStorage com merge seguro dos dados padrão)
const savedData = localStorage.getItem('amor_homenagem_data');
let textData = defaultTextData;
if (savedData) {
  try {
    const parsed = JSON.parse(savedData);
    textData = {};
    for (const key in defaultTextData) {
      if (parsed[key] !== undefined) {
        if (typeof defaultTextData[key] === 'object' && !Array.isArray(defaultTextData[key]) && defaultTextData[key] !== null) {
          textData[key] = { ...defaultTextData[key], ...parsed[key] };
        } else {
          textData[key] = parsed[key];
        }
      } else {
        textData[key] = defaultTextData[key];
      }
    }
  } catch (e) {
    console.error("Erro ao carregar textos salvos do localStorage:", e);
  }
}

// 2. Elementos Globais do DOM
const appElement = document.getElementById('app');
const bgCanvas = document.getElementById('bg-canvas');

// 3. Gerenciamento do Reprodutor de Música Romântica
let audio = null;
let musicController = null;

function setupMusic() {
  if (audio) return; // Já configurado
  
  const defaultTrack = 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Erik_Satie_-_Gymnop%C3%A9die_No._1_-_piano.mp3';
  const customTrack = textData.musicUrl || '/music/music.mp3';
  
  // Criar elemento de áudio com a trilha personalizada
  audio = new Audio(customTrack);
  audio.loop = true;
  
  // Fallback suave para a trilha externa padrão em caso de erro (ex: 404 local)
  audio.addEventListener('error', function onError(e) {
    console.warn(`Erro ao carregar trilha customizada (${customTrack}). Usando trilha padrão de Satie.`, e);
    audio.removeEventListener('error', onError);
    audio.src = defaultTrack;
    audio.load();
    if (sessionStorage.getItem('music_playing') === 'true') {
      audio.play().catch(err => console.log("Erro ao tocar fallback:", err));
    }
  });
  
  // Criar botão do controlador de música flutuante
  musicController = document.createElement('div');
  musicController.className = 'music-controller no-print';
  musicController.innerHTML = `
    <span class="icon">🎵</span>
    <span class="text">Tocar Música</span>
  `;
  document.body.appendChild(musicController);
  
  musicController.addEventListener('click', toggleMusic);
  
  // Configura ouvinte global para iniciar música na primeira interação da página
  // para contornar o bloqueio de autoplay dos celulares de forma transparente
  function startMusicOnFirstInteraction() {
    if (sessionStorage.getItem('music_playing') !== 'false') {
      playMusic();
    }
    document.removeEventListener('click', startMusicOnFirstInteraction);
    document.removeEventListener('touchstart', startMusicOnFirstInteraction);
  }
  
  document.addEventListener('click', startMusicOnFirstInteraction);
  document.addEventListener('touchstart', startMusicOnFirstInteraction);
  
  // Verifica se o estado de reprodução foi salvo na sessão
  if (sessionStorage.getItem('music_playing') === 'true') {
    playMusic();
  }
}

let fadeInterval = null;

function playMusic() {
  if (!audio) return;
  
  // Se a música já estiver tocando, mantém a reprodução contínua e suave
  if (!audio.paused) return;
  
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }
  
  audio.volume = 0;
  audio.play()
    .then(() => {
      musicController.classList.add('playing');
      musicController.querySelector('.text').textContent = 'Pausar Música';
      sessionStorage.setItem('music_playing', 'true');
      
      let vol = 0;
      fadeInterval = setInterval(() => {
        vol += 0.02; // Aumenta 2% a cada 100ms -> 100% em 5 segundos
        if (vol >= 1) {
          audio.volume = 1;
          clearInterval(fadeInterval);
          fadeInterval = null;
        } else {
          audio.volume = vol;
        }
      }, 100);
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
function typeHtml(targetElement, htmlString, speed = 90, onComplete = null) {
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
    
    // Revela dinamicamente decorações/bordas do elemento pai à medida que a digitação começa
    if (task.node && task.node.parentElement) {
      task.node.parentElement.classList.add('revealed');
    }
    
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
      // Adiciona class 'revealed' para todos os elementos filhos ao pular
      targetElement.querySelectorAll('*').forEach(el => {
        el.classList.add('revealed');
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

// 5.5. Exibir Capa Inicial do Capítulo com Animações 3D Cinematográficas
function showChapterCover(containerElement, type, label, onStart) {
  // Ocultamos a sujeira das antigas animações HTML/CSS,
  // usaremos apenas o botão CTA. O WebGL cuidará de toda a renderização da capa.
  let emojiHTML = '';
  if (type === 'rose') {
    emojiHTML = `<div class="emoji-float rose-emoji">🌹</div>`;
  }

  containerElement.innerHTML = `
    <div class="chapter-cover-container">
      <div class="cover-interactive-area" style="min-height: 250px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; padding-bottom: 20px;">
        ${emojiHTML}
        <button class="btn-reveal-chapter" style="position: relative; z-index: 100; margin-top: ${type === 'envelope' ? '120px' : '20px'};">${label}</button>
      </div>
    </div>
  `;

  // Monta o objeto 3D flutuando antes do clique
  if (type === 'envelope') {
    mountEnvelope3D();
  } else if (type === 'crystal') {
    mountCrystal3D();
  } else if (type === 'rose') {
    mountRose3D();
  }

  const interactive = containerElement.querySelector('.cover-interactive-area');

  const startReveal = () => {
    // Previne duplo disparo
    interactive.removeEventListener('click', startReveal);

    // 1. Toca a música com fade-in suave
    playMusic();

    // 2. Esconde o botão suavemente
    const btn = interactive.querySelector('.btn-reveal-chapter');
    if (btn) {
      btn.style.transition = 'opacity 0.3s, transform 0.3s';
      btn.style.opacity = '0';
      btn.style.transform = 'scale(0.8)';
    }

    // Esconde o emoji também
    const emoji = interactive.querySelector('.emoji-float');
    if (emoji) {
      emoji.style.transition = 'opacity 0.2s, transform 0.2s';
      emoji.style.opacity = '0';
      emoji.style.transform = 'scale(1.5)';
    }

    // 3. Dispara a animação 3D correspondente
    if (type === 'envelope') {
      triggerEnvelopeOpen3D(onStart);
    } else if (type === 'crystal') {
      triggerCrystalShatter3D(onStart);
    } else if (type === 'rose') {
      triggerRoseDissolve3D(onStart);
    }
  };

  interactive.addEventListener('click', startReveal);
  interactive.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startReveal();
  }, { passive: false });
}

// 6. Roteador SPA (Single Page Application Router)
function router() {
  stopFlowerRain(); // Para a chuva de pétalas por padrão ao mudar de página
  
  const params = new URLSearchParams(window.location.search);
  const page = params.get('p');
  
  // Inicializa o canvas de fundo
  initBackgroundParticles(bgCanvas);
  
  // Inicializa a cena 3D global
  initThreeScene();
  
  // Garante que a música está configurada após qualquer interação
  setupMusic();

  if (page === 'historia')
    renderHistoria();
  else if (page === 'filhos')
    renderFilhos();
  else if (page === 'motivos')
    renderMotivos();
  else if (page === 'carta')
    renderCarta();
  else if (page === 'poema1')
    renderPoema('poema1', '🌟');
  else if (page === 'poema2')
    renderPoema('poema2', '🍀');
  else if (page === 'poema3')
    renderPoema('poema3', '💖');
  else if (page === 'poema4')
    renderPoema('poema4', '🎂');
  else if (page === 'poema5')
    renderPoema('poema5', '🍀');
  else if (page === 'poema6')
    renderPoema('poema6', '💎');
  else
    renderPortal();
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
          <p class="subtitle" style="margin-bottom: 15px;">Escolha um capítulo ou escaneie o QR Code físico</p>
          
          <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; max-height: 380px; overflow-y: auto; padding-right: 5px; box-sizing: border-box;">
            <a href="?p=historia" class="btn-romantic" style="justify-content: center; margin: 0;">A Nossa História 💍</a>
            <a href="?p=filhos" class="btn-romantic" style="justify-content: center; margin: 0;">Os Nossos Frutos 👨‍👩‍👧‍👦</a>
            <a href="?p=motivos" class="btn-romantic" style="justify-content: center; margin: 0;">16 Motivos Para Te Amar ✨</a>
            <a href="?p=carta" class="btn-romantic" style="justify-content: center; margin: 0;">Carta Para o Futuro 💌</a>
            <a href="?p=poema1" class="btn-romantic" style="justify-content: center; margin: 0;">Vida e Sonhos 🌟</a>
            <a href="?p=poema2" class="btn-romantic" style="justify-content: center; margin: 0;">Promessas 🤝</a>
            <a href="?p=poema3" class="btn-romantic" style="justify-content: center; margin: 0;">Para meu amor ♡ ♡ ♡ 💖</a>
            <a href="?p=poema4" class="btn-romantic" style="justify-content: center; margin: 0;">Mais um ano de vida! 🎂</a>
            <a href="?p=poema5" class="btn-romantic" style="justify-content: center; margin: 0;">Renovação 🍀</a>
            <a href="?p=poema6" class="btn-romantic" style="justify-content: center; margin: 0;">Ilusão 🌌</a>
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
      <div id="chapter-content-wrapper"></div>
    </div>
  `;
  
  const card = appElement.querySelector('.glass-card');
  applyCardSpotlight(card);
  const wrapper = document.getElementById('chapter-content-wrapper');
  
  showChapterCover(wrapper, 'crystal', 'Uhibbuk ❤️', () => {
    wrapper.innerHTML = `
      <span class="crystal-heart" style="font-size: 3rem;">💍</span>
      <h2>${textData.historia.title}</h2>
      
      <div class="typewriter-content" id="historia-text"></div>
      
      <div class="no-print" style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
        <button class="btn-skip" id="btn-skip-typing">Pular digitação</button>
      </div>
    `;
    
    const textContainer = document.getElementById('historia-text');
    const btnSkip = document.getElementById('btn-skip-typing');
    const btnBack = document.getElementById('btn-back');
    
    const typingController = typeHtml(textContainer, textData.historia.content, undefined, () => {
      btnSkip.style.display = 'none';
      btnBack.style.display = 'inline-flex';
    });
    
    btnSkip.addEventListener('click', () => {
      typingController.skip();
    });
  });
}

// ==========================================
// PÁGINA: QR Code 2 - Filhos
// ==========================================
function renderFilhos() {
  appElement.innerHTML = `
    <div class="glass-card" style="max-width: 550px;">
      <div id="chapter-content-wrapper"></div>
    </div>
  `;
  
  const card = appElement.querySelector('.glass-card');
  applyCardSpotlight(card);
  const wrapper = document.getElementById('chapter-content-wrapper');
  
  showChapterCover(wrapper, 'crystal', 'Uhibbuk ❤️', () => {
    wrapper.innerHTML = `
      <span class="crystal-heart" style="font-size: 3rem;">💝</span>
      <h2>${textData.filhos.title}</h2>
      
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
      </div>
    `;
    
    const introContainer = document.getElementById('filhos-intro');
    const childrenBlock = document.getElementById('children-block');
    const boyTextContainer = document.getElementById('boy-text');
    const girlTextContainer = document.getElementById('girl-text');
    const btnSkip = document.getElementById('btn-skip-typing');
    const btnBack = document.getElementById('btn-back');
    
    let subTyping1 = null;
    let subTyping2 = null;
    
    const mainTyping = typeHtml(introContainer, textData.filhos.content, undefined, () => {
      childrenBlock.style.display = 'flex';
      
      subTyping1 = typeHtml(boyTextContainer, textData.filhos.boy.text, undefined, () => {
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
  });
}

// ==========================================
// PÁGINA: QR Code 3 - 16 Motivos
// ==========================================
function renderMotivos() {
  appElement.innerHTML = `
    <div class="glass-card" style="max-width: 550px;">
      <div id="chapter-content-wrapper"></div>
    </div>
  `;
  
  const card = appElement.querySelector('.glass-card');
  applyCardSpotlight(card);
  const wrapper = document.getElementById('chapter-content-wrapper');
  
  showChapterCover(wrapper, 'crystal', 'Uhibbuk ❤️', () => {
    wrapper.innerHTML = `
      <span class="crystal-heart" style="font-size: 3rem;">💎</span>
      <h2>${textData.motivos.title}</h2>
      
      <div class="typewriter-content" id="motivos-intro"></div>
      
      <div class="crystals-container no-print" id="crystals-block" style="display: none;">
        ${Array.from({ length: 16 }, (_, i) => `
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
      </div>
    </div>
  `;
  
  const introContainer = document.getElementById('motivos-intro');
  const crystalsBlock = document.getElementById('crystals-block');
  const displayCard = document.getElementById('reason-display-card');
  const reasonTitle = document.getElementById('reason-num-title');
  const reasonText = document.getElementById('reason-text');
  
  const btnSkip = document.getElementById('btn-skip-typing');
  const btnBack = document.getElementById('btn-back');
  
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
      reasonTitle.textContent = `Motivo nº ${index + 1} de 16`;
      
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
});
}

// ==========================================
// PÁGINA: QR Code 4 - Carta & Pétalas
// ==========================================
function renderCarta() {
  appElement.innerHTML = `
    <div class="glass-card" style="max-width: 550px;">
      <div id="chapter-content-wrapper"></div>
    </div>
  `;
  
  const card = appElement.querySelector('.glass-card');
  applyCardSpotlight(card);
  const wrapper = document.getElementById('chapter-content-wrapper');
  
  showChapterCover(wrapper, 'envelope', 'Abra quando estiver pronta 💌', () => {
    wrapper.innerHTML = `
      <span style="font-size: 3rem;">💌</span>
      <h2>${textData.carta.title}</h2>
      
      <!-- Canvas local exclusivo de flores sobre o card para efeito mágico -->
      <canvas id="flower-rain-canvas" style="position: absolute; top:0; left:0; width:100%; height:100%; z-index:1; pointer-events:none; border-radius:24px;"></canvas>
      
      <div class="typewriter-content" id="carta-text" style="position: relative; z-index: 2;"></div>
      
      <div class="no-print" style="display: flex; flex-direction: column; align-items: center; gap: 10px; position: relative; z-index: 3;">
        <button class="btn-skip" id="btn-skip-typing">Pular digitação</button>
      </div>
    `;
    
    const textContainer = document.getElementById('carta-text');
    const btnSkip = document.getElementById('btn-skip-typing');
    const btnBack = document.getElementById('btn-back');
    const flowerCanvas = document.getElementById('flower-rain-canvas');
    
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
  });
}

// ==========================================
// PÁGINA: Renderizador Genérico de Poemas
// ==========================================
const poemConfigs = {
  poema1: { type: 'crystal', label: 'Uhibbuk ❤️' },
  poema2: { type: 'rose', label: 'Para você ❤️' },
  poema3: { type: 'envelope', label: 'Abra quando estiver pronta 💌' },
  poema4: { type: 'rose', label: 'Para você ❤️' },
  poema5: { type: 'rose', label: 'Para você ❤️' },
  poema6: { type: 'crystal', label: 'Habibti ❤️' }
};

function renderPoema(dataKey, icon = '🌟') {
  appElement.innerHTML = `
    <div class="glass-card" style="max-width: 550px;">
      <div id="chapter-content-wrapper"></div>
    </div>
  `;
  
  const card = appElement.querySelector('.glass-card');
  applyCardSpotlight(card);
  const wrapper = document.getElementById('chapter-content-wrapper');
  
  const config = poemConfigs[dataKey] || { type: 'rose', label: 'Para você ❤️' };
  
  showChapterCover(wrapper, config.type, config.label, () => {
    wrapper.innerHTML = `
      <span class="crystal-heart" style="font-size: 3rem;">${icon}</span>
      <h2>${textData[dataKey].title}</h2>
      
      <!-- Canvas local exclusivo de flores sobre o card para efeito mágico -->
      <canvas id="flower-rain-canvas" style="position: absolute; top:0; left:0; width:100%; height:100%; z-index:1; pointer-events:none; border-radius:24px;"></canvas>
      
      <div class="typewriter-content" id="poema-text" style="position: relative; z-index: 2;"></div>
      
      <div class="no-print" style="display: flex; flex-direction: column; align-items: center; gap: 10px; position: relative; z-index: 3;">
        <button class="btn-skip" id="btn-skip-typing">Pular digitação</button>
      </div>
    `;
    
    const textContainer = document.getElementById('poema-text');
    const btnSkip = document.getElementById('btn-skip-typing');
    const btnBack = document.getElementById('btn-back');
    const flowerCanvas = document.getElementById('flower-rain-canvas');
    
    const typingController = typeHtml(textContainer, textData[dataKey].content, undefined, () => {
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
