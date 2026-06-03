import QRCode from 'qrcode';
import { defaultTextData } from './textData.js';
import { initBackgroundParticles } from './particles.js';

// 1. Tenta carregar do localStorage ou usa o padrão com merge seguro
const STORAGE_KEY = 'amor_homenagem_data';
const savedData = localStorage.getItem(STORAGE_KEY);
let currentData = defaultTextData;
if (savedData) {
  try {
    const parsed = JSON.parse(savedData);
    currentData = {};
    for (const key in defaultTextData) {
      if (parsed[key] !== undefined) {
        if (typeof defaultTextData[key] === 'object' && !Array.isArray(defaultTextData[key]) && defaultTextData[key] !== null) {
          currentData[key] = { ...defaultTextData[key], ...parsed[key] };
        } else {
          currentData[key] = parsed[key];
        }
      } else {
        currentData[key] = defaultTextData[key];
      }
    }
  } catch (e) {
    console.error("Erro ao carregar rascunho do localStorage:", e);
  }
}

// 2. Elementos Globais do DOM
const bgCanvas = document.getElementById('bg-canvas');
const baseUrlInput = document.getElementById('base-url');
const musicUrlInput = document.getElementById('music-url');

// Elementos Form I: História
const histTitulo = document.getElementById('historia-titulo');
const histSub = document.getElementById('historia-subtitulo');
const histConteudo = document.getElementById('historia-conteudo');

// Elementos Form II: Filhos
const filhosIntro = document.getElementById('filhos-conteudo');
const filhoNome = document.getElementById('filho-nome');
const filhoIdade = document.getElementById('filho-idade');
const filhoTexto = document.getElementById('filho-texto');
const filhaNome = document.getElementById('filha-nome');
const filhaIdade = document.getElementById('filha-idade');
const filhaTexto = document.getElementById('filha-texto');

// Elementos Form III: Motivos
const motivosIntro = document.getElementById('motivos-conteudo');
const motivosContainer = document.getElementById('motivos-inputs-container');

// Elementos Form IV: Carta
const cartaConteudo = document.getElementById('carta-conteudo');

// Elementos Form V a X: Poemas
const poema1Conteudo = document.getElementById('poema1-conteudo');
const poema2Conteudo = document.getElementById('poema2-conteudo');
const poema3Conteudo = document.getElementById('poema3-conteudo');
const poema4Conteudo = document.getElementById('poema4-conteudo');
const poema5Conteudo = document.getElementById('poema5-conteudo');
const poema6Conteudo = document.getElementById('poema6-conteudo');

// Botões & Modais
const btnSave = document.getElementById('btn-save-draft');
const btnExport = document.getElementById('btn-export-prod');
const btnPrint = document.getElementById('btn-print-tags');
const exportBox = document.getElementById('export-box');
const exportCode = document.getElementById('export-code');
const btnCopyCode = document.getElementById('btn-copy-code');
const printableGrid = document.getElementById('printable-tags-grid');

// Destinos de URL exibidos em texto
const destHistoria = document.getElementById('dest-historia');
const destFilhos = document.getElementById('dest-filhos');
const destMotivos = document.getElementById('dest-motivos');
const destCarta = document.getElementById('dest-carta');
const destPoema1 = document.getElementById('dest-poema1');
const destPoema2 = document.getElementById('dest-poema2');
const destPoema3 = document.getElementById('dest-poema3');
const destPoema4 = document.getElementById('dest-poema4');
const destPoema5 = document.getElementById('dest-poema5');
const destPoema6 = document.getElementById('dest-poema6');

// 3. Inicializar Tela Administrativa
function initAdmin() {
  // Inicializa partículas de fundo
  initBackgroundParticles(bgCanvas);
  
  // Recupera URL do localStorage se existir
  const savedUrl = localStorage.getItem('amor_base_url');
  if (savedUrl) {
    baseUrlInput.value = savedUrl;
  }
  
  // Preenche música
  musicUrlInput.value = currentData.musicUrl || '/music/music.mp3';
  
  // Preenche Formulário I: História
  histTitulo.value = currentData.historia.title;
  histSub.value = currentData.historia.subtitle;
  histConteudo.value = currentData.historia.content;
  
  // Preenche Formulário II: Filhos
  filhosIntro.value = currentData.filhos.content;
  filhoNome.value = currentData.filhos.boy.name;
  filhoIdade.value = currentData.filhos.boy.age;
  filhoTexto.value = currentData.filhos.boy.text;
  filhaNome.value = currentData.filhos.girl.name;
  filhaIdade.value = currentData.filhos.girl.age;
  filhaTexto.value = currentData.filhaTexto ? currentData.filhaTexto : (currentData.filhos.girl.text || '');
  
  // Preenche Formulário III: Motivos
  motivosIntro.value = currentData.motivos.content;
  renderMotivosInputs();
  
  // Preenche Formulário IV: Carta
  cartaConteudo.value = currentData.carta.content;
  
  // Preenche Formulários de Poemas (V a X)
  poema1Conteudo.value = currentData.poema1.content;
  poema2Conteudo.value = currentData.poema2 ? currentData.poema2.content : (defaultTextData.poema2 ? defaultTextData.poema2.content : '');
  poema3Conteudo.value = currentData.poema3 ? currentData.poema3.content : (defaultTextData.poema3 ? defaultTextData.poema3.content : '');
  poema4Conteudo.value = currentData.poema4 ? currentData.poema4.content : (defaultTextData.poema4 ? defaultTextData.poema4.content : '');
  poema5Conteudo.value = currentData.poema5 ? currentData.poema5.content : (defaultTextData.poema5 ? defaultTextData.poema5.content : '');
  poema6Conteudo.value = currentData.poema6 ? currentData.poema6.content : (defaultTextData.poema6 ? defaultTextData.poema6.content : '');
  
  // Atualiza previews de QR Codes em tempo real
  updateQrCodes();
  
  // Listeners de atualização em tempo real
  baseUrlInput.addEventListener('input', updateQrCodes);
  
  // Listeners para os botões de ação
  btnSave.addEventListener('click', saveDraft);
  btnExport.addEventListener('click', exportProductionJSON);
  btnPrint.addEventListener('click', prepareAndPrint);
  btnCopyCode.addEventListener('click', copyExportedCode);
}

// 4. Renderizar Inputs Dinâmicos dos 16 Motivos
function renderMotivosInputs() {
  motivosContainer.innerHTML = '';
  currentData.motivos.reasons.forEach((reason, index) => {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.style.marginBottom = '12px';
    div.innerHTML = `
      <label style="font-size: 0.8rem; color: var(--color-lavender);">Motivo nº ${index + 1}</label>
      <input type="text" class="form-control motivo-input" data-index="${index}" value="${reason.replace(/"/g, '&quot;')}" />
    `;
    motivosContainer.appendChild(div);
  });
}

// 5. Coletar os Textos do Formulário de Volta para um Objeto
function collectFormData() {
  const data = JSON.parse(JSON.stringify(defaultTextData)); // Deep clone
  
  data.musicUrl = musicUrlInput.value;
  
  data.historia.title = histTitulo.value;
  data.historia.subtitle = histSub.value;
  data.historia.content = histConteudo.value;
  
  data.filhos.content = filhosIntro.value;
  data.filhos.boy.name = filhoNome.value;
  data.filhos.boy.age = filhoIdade.value;
  data.filhos.boy.text = filhoTexto.value;
  data.filhos.girl.name = filhaNome.value;
  data.filhos.girl.age = filhaIdade.value;
  data.filhos.girl.text = filhaTexto.value;
  
  data.motivos.content = motivosIntro.value;
  const inputs = document.querySelectorAll('.motivo-input');
  inputs.forEach(input => {
    const index = parseInt(input.getAttribute('data-index'));
    data.motivos.reasons[index] = input.value;
  });
  
  data.carta.content = cartaConteudo.value;
  
  data.poema1.content = poema1Conteudo.value;
  
  // Inicializa chaves para novos poemas se não existirem
  if (!data.poema2) data.poema2 = { title: "Promessas" };
  if (!data.poema3) data.poema3 = { title: "Para meu amor ♡ ♡ ♡" };
  if (!data.poema4) data.poema4 = { title: "Mais um ano de vida!" };
  if (!data.poema5) data.poema5 = { title: "Renovação" };
  if (!data.poema6) data.poema6 = { title: "Ilusão" };
  
  data.poema2.content = poema2Conteudo.value;
  data.poema3.content = poema3Conteudo.value;
  data.poema4.content = poema4Conteudo.value;
  data.poema5.content = poema5Conteudo.value;
  data.poema6.content = poema6Conteudo.value;
  
  return data;
}

// 6. Geração de QR Codes nos previews da tela
function updateQrCodes() {
  const baseUrl = baseUrlInput.value.replace(/\/$/, ''); // Remove barra no final se houver
  localStorage.setItem('amor_base_url', baseUrl);
  
  const url1 = `${baseUrl}?p=historia`;
  const url2 = `${baseUrl}?p=filhos`;
  const url3 = `${baseUrl}?p=motivos`;
  const url4 = `${baseUrl}?p=carta`;
  const url5 = `${baseUrl}?p=poema1`;
  const url6 = `${baseUrl}?p=poema2`;
  const url7 = `${baseUrl}?p=poema3`;
  const url8 = `${baseUrl}?p=poema4`;
  const url9 = `${baseUrl}?p=poema5`;
  const url10 = `${baseUrl}?p=poema6`;
  
  destHistoria.textContent = url1;
  destFilhos.textContent = url2;
  destMotivos.textContent = url3;
  destCarta.textContent = url4;
  destPoema1.textContent = url5;
  destPoema2.textContent = url6;
  destPoema3.textContent = url7;
  destPoema4.textContent = url8;
  destPoema5.textContent = url9;
  destPoema6.textContent = url10;
  
  // Desenha os QR Codes nos placeholders na tela
  generateQrCodeOnHolder('qr-historia-preview', url1);
  generateQrCodeOnHolder('qr-filhos-preview', url2);
  generateQrCodeOnHolder('qr-motivos-preview', url3);
  generateQrCodeOnHolder('qr-carta-preview', url4);
  generateQrCodeOnHolder('qr-poema1-preview', url5);
  generateQrCodeOnHolder('qr-poema2-preview', url6);
  generateQrCodeOnHolder('qr-poema3-preview', url7);
  generateQrCodeOnHolder('qr-poema4-preview', url8);
  generateQrCodeOnHolder('qr-poema5-preview', url9);
  generateQrCodeOnHolder('qr-poema6-preview', url10);
}

// Auxiliar para gerar QR no canvas local
function generateQrCodeOnHolder(holderId, text) {
  const holder = document.getElementById(holderId);
  holder.innerHTML = ''; // Limpa anterior
  
  const canvas = document.createElement('canvas');
  holder.appendChild(canvas);
  
  QRCode.toCanvas(canvas, text, {
    width: 120,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  }, err => {
    if (err) console.error("Erro ao gerar QR Code:", err);
  });
}

// 7. Salvar Rascunho no LocalStorage
function saveDraft() {
  const data = collectFormData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  
  alert("💾 Rascunho salvo com sucesso! Agora você pode visualizar as alterações na página principal (index.html) deste computador.");
}

// 8. Exportar JSON de Produção formatado para colar em textData.js
function exportProductionJSON() {
  const data = collectFormData();
  
  // Gera o código JS exportável idêntico a textData.js
  const formattedCode = `// Banco de dados de textos da Homenagem (Customizado pelo Cassio no Painel Admin)

export const defaultTextData = ${JSON.stringify(data, null, 2)};
`;
  
  exportCode.value = formattedCode;
  exportBox.classList.add('visible');
  exportBox.scrollIntoView({ behavior: 'smooth' });
}

// Copiar código exportado
function copyExportedCode() {
  exportCode.select();
  document.execCommand('copy');
  
  const oldText = btnCopyCode.textContent;
  btnCopyCode.textContent = "Copiado com sucesso! ✔️";
  setTimeout(() => {
    btnCopyCode.textContent = oldText;
  }, 2000);
}

// ==========================================
// 9. Preparar Folha de Tags e Abrir Impressora
// ==========================================
function prepareAndPrint() {
  const baseUrl = baseUrlInput.value.replace(/\/$/, '');
  
  // Textos e descrições dos cartões de presentes chiques para os 10 capítulos
  const tagsData = [
    {
      title: "A Nossa História",
      url: `${baseUrl}?p=historia`,
      instruction: "Abra no início do nosso dia de comemoração 🌹"
    },
    {
      title: "Os Nossos Frutos",
      url: `${baseUrl}?p=filhos`,
      instruction: "Abra durante o nosso almoço em família 👨‍👩‍👧‍👦"
    },
    {
      title: "16 Motivos Para Te Amar",
      url: `${baseUrl}?p=motivos`,
      instruction: "Abra após a sobremesa do nosso jantar ✨"
    },
    {
      title: "Carta Para o Futuro",
      url: `${baseUrl}?p=carta`,
      instruction: "Abra ao final do nosso brinde romântico 🍷"
    },
    {
      title: "Vida e Sonhos",
      url: `${baseUrl}?p=poema1`,
      instruction: "Abra no momento de maior intimidade e reflexão ❤️"
    },
    {
      title: "Promessas",
      url: `${baseUrl}?p=poema2`,
      instruction: "Abra para lembrar do nosso compromisso eterno ✨"
    },
    {
      title: "Para meu amor",
      url: `${baseUrl}?p=poema3`,
      instruction: "Abra para recordar o dia em que te escolhi 💖"
    },
    {
      title: "Mais um ano",
      url: `${baseUrl}?p=poema4`,
      instruction: "Abra para celebrar seu dia especial e seus 30 anos 🎂"
    },
    {
      title: "Renovação",
      url: `${baseUrl}?p=poema5`,
      instruction: "Abra para celebrar o nosso recomeço abençoado 🌱"
    },
    {
      title: "Ilusão",
      url: `${baseUrl}?p=poema6`,
      instruction: "Abra para ler as minhas reflexões mais profundas 🌌"
    }
  ];
  
  printableGrid.innerHTML = ''; // Limpa anterior
  
  // Renderiza cada tag no grid imprimível
  tagsData.forEach((tag, index) => {
    const giftTag = document.createElement('div');
    giftTag.className = 'gift-tag';
    giftTag.innerHTML = `
      <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='M50 95 C 20 70 5 50 5 30 C 5 10 25 5 35 5 C 45 5 50 20 50 20 C 50 20 55 5 65 5 C 75 5 95 10 95 30 C 95 50 80 70 50 95 Z' fill='none' stroke='%23999' stroke-width='1' stroke-dasharray='2,2'/></svg>" class="tag-heart-bg" />
      <div style="z-index: 2; position: relative;">
        <div class="tag-hole"></div>
        <div class="tag-title" style="font-size: 1.1rem; margin-bottom: 5px; margin-top: 15px;">${tag.title}</div>
      </div>
      
      <div class="tag-qr-holder" id="print-qr-${index}" style="margin: 5px 0; z-index: 2; position: relative;"></div>
      
      <div style="z-index: 2; position: relative;">
        <div class="tag-anniversary-footer" style="font-size: 0.65rem; margin-bottom: 25px;">💍 16 Anos de Casados (Bodas de Cristal)</div>
      </div>
    `;
    
    printableGrid.appendChild(giftTag);
    
    // Gera o QR Code de impressão de alta qualidade com margem correta
    const holder = document.getElementById(`print-qr-${index}`);
    const canvas = document.createElement('canvas');
    holder.appendChild(canvas);
    
    QRCode.toCanvas(canvas, tag.url, {
      width: 130,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  });
  
  // Salva no localStorage para garantir que não se perca nada antes de abrir
  saveDraft();
  
  // Abre o prompt de impressão nativo
  setTimeout(() => {
    window.print();
  }, 500);
}

// Inicia no carregamento do DOM
window.addEventListener('DOMContentLoaded', initAdmin);
