import * as THREE from 'three';
import gsap from 'gsap';

let scene, camera, renderer;
let canvas;
let activeObjects = [];
let currentWholeObject = null;
let currentShards = [];

export function initThreeScene() {
  if (canvas) return; // Já inicializado

  canvas = document.createElement('canvas');
  canvas.id = 'three-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none'; // Permite cliques nos botões HTML abaixo/acima
  canvas.style.zIndex = '50'; // Alto o suficiente para sobrepor os cards durante a animação
  document.body.appendChild(canvas);

  scene = new THREE.Scene();
  
  // Câmera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 10;

  // Renderizador
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Luzes para efeito cinematográfico
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0xffaaff, 2, 20);
  pointLight.position.set(-2, 0, 4);
  scene.add(pointLight);
  
  const backLight = new THREE.PointLight(0xffffff, 1, 20);
  backLight.position.set(0, 5, -5);
  scene.add(backLight);

  window.addEventListener('resize', onWindowResize);

  // Loop de animação via GSAP (muito mais eficiente e sincronizado com as tweens)
  gsap.ticker.add(render);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
  renderer.render(scene, camera);
}

function clearScene() {
  activeObjects.forEach(obj => {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
        if(Array.isArray(obj.material)) {
             obj.material.forEach(m => m.dispose());
        } else {
             obj.material.dispose();
        }
    }
  });
  activeObjects = [];
}

// ==========================================
// ANIMAÇÃO 1: Cristal se Partindo
// ==========================================
export function mountCrystal3D() {
  clearScene();
  
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xefd0d0, metalness: 0.2, roughness: 0.1, transmission: 0.9, 
    thickness: 1.5, ior: 2.0, clearcoat: 1.0, transparent: true
  });

  // Um cristal inteiro flutuando
  const geometry = new THREE.IcosahedronGeometry(1.4, 0); 
  currentWholeObject = new THREE.Mesh(geometry, material);
  currentWholeObject.position.y = 1.5; 
  scene.add(currentWholeObject);
  activeObjects.push(currentWholeObject);
  
  // Rotação contínua
  gsap.to(currentWholeObject.rotation, {
     y: Math.PI * 2, x: Math.PI * 2, duration: 15, repeat: -1, ease: "none"
  });
  // Flutuação
  gsap.to(currentWholeObject.position, {
     y: 1.8, duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut"
  });
}

export function triggerCrystalShatter3D(onComplete) {
  if (!currentWholeObject) return onComplete();

  gsap.killTweensOf(currentWholeObject.rotation);
  gsap.killTweensOf(currentWholeObject.position);

  const material = currentWholeObject.material;
  const startPos = currentWholeObject.position.clone();
  
  scene.remove(currentWholeObject);

  const shardCount = 80;
  const shards = [];

  for (let i = 0; i < shardCount; i++) {
    const size = Math.random() * 0.4 + 0.1;
    const geometry = new THREE.TetrahedronGeometry(size);
    const shard = new THREE.Mesh(geometry, material);
    
    // Começam no centro do cristal inteiro
    shard.position.copy(startPos);
    shard.position.x += (Math.random() - 0.5) * 0.8;
    shard.position.y += (Math.random() - 0.5) * 0.8;
    shard.position.z += (Math.random() - 0.5) * 0.8;
    
    shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

    scene.add(shard);
    activeObjects.push(shard);
    shards.push(shard);
  }

  const tl = gsap.timeline();
  
  // Flash de luz antes de explodir
  const flashLight = new THREE.PointLight(0xffffff, 0, 15);
  flashLight.position.copy(startPos);
  scene.add(flashLight);
  activeObjects.push(flashLight);

  tl.to(flashLight, { intensity: 8, duration: 0.1, ease: "power2.out" });
  tl.to(flashLight, { intensity: 0, duration: 0.8, ease: "power2.in" });

  // Explosão em câmera lenta
  tl.addLabel('explode', 0.1);
  
  shards.forEach((shard) => {
    const dir = new THREE.Vector3().subVectors(shard.position, startPos).normalize();
    if (dir.lengthSq() === 0) dir.set(0,1,0);
    
    if (Math.random() > 0.3) {
        dir.z += Math.random() * 4 + 1; // Voa para a câmera
    }
    
    const distance = Math.random() * 15 + 8;
    const duration = 2.5 + Math.random() * 1.5; // MAIS LENTO
    
    tl.to(shard.position, {
      x: startPos.x + dir.x * distance,
      y: startPos.y + dir.y * distance,
      z: startPos.z + dir.z * distance,
      duration: duration,
      // ease: 'power3.out' // Rápido no início, vai freando
    }, 'explode');

    tl.to(shard.rotation, {
      x: '+=' + (Math.random() * 10 - 5),
      y: '+=' + (Math.random() * 10 - 5),
      z: '+=' + (Math.random() * 10 - 5),
      duration: duration,
      ease: 'power1.out'
    }, 'explode');
    
    tl.to(shard.material, {
        opacity: 0,
        duration: 1.0,
        delay: duration - 1.2
    }, 'explode');
  });

  setTimeout(onComplete, 2200); 
}

// ==========================================
// ANIMAÇÃO 2: Rosa se Desmanchando
// ==========================================
export function mountRose3D() {
  clearScene();
  // A rosa inicial agora é o Emoji CSS 2D (muito mais belo)
}

export function triggerRoseDissolve3D(onComplete) {
  const petalMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4b6b, roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide, transparent: true
  });

  const petalCount = 40;
  const petals = [];

  for (let i = 0; i < petalCount; i++) {
    const geometry = new THREE.PlaneGeometry(0.6, 1.0, 4, 4);
    
    const positions = geometry.attributes.position;
    for (let j = 0; j < positions.count; j++) {
       const x = positions.getX(j);
       const y = positions.getY(j);
       const z = Math.sin(x * Math.PI) * 0.3 - Math.cos(y * Math.PI) * 0.15;
       positions.setZ(j, z);
    }
    geometry.computeVertexNormals();

    const petal = new THREE.Mesh(geometry, petalMaterial);
    
    const angle = (i / petalCount) * Math.PI * 6;
    const radius = 0.1 + (i / petalCount) * 1.0;
    petal.position.set(
      Math.cos(angle) * radius,
      1.5 + (Math.random() - 0.5) * 0.6, // Centro da tela
      Math.sin(angle) * radius
    );
    
    petal.lookAt(0, petal.position.y, 0);
    petal.rotateX(Math.PI / 6); 

    scene.add(petal);
    activeObjects.push(petal);
    petals.push(petal);
  }

  const tl = gsap.timeline();
  
  petals.forEach((petal) => {
    // Espiral lenta
    tl.to(petal.position, {
      x: petal.position.x * (6 + Math.random() * 4),
      y: 4 + Math.random() * 6,
      z: 5 + Math.random() * 8, 
      duration: 3.5 + Math.random() * 1.5, // MAIS LENTO
      ease: 'power2.out'
    }, 0);

    tl.to(petal.rotation, {
      x: '+=' + (Math.random() * 12),
      y: '+=' + (Math.random() * 12),
      z: '+=' + (Math.random() * 12),
      duration: 3.5 + Math.random() * 1.5,
      ease: 'none'
    }, 0);
    
    tl.to(petal.material, {
        opacity: 0,
        duration: 1.5,
        delay: 2.0 + Math.random()
    }, 0);
  });

  setTimeout(onComplete, 2500);
}

// ==========================================
// ANIMAÇÃO 3: Carta se Abrindo
// ==========================================
export function mountEnvelope3D() {
  clearScene();
  
  const envelopeMat = new THREE.MeshStandardMaterial({ color: 0xe5c0b4, side: THREE.DoubleSide, transparent: true });
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xfff9f5, transparent: true });
  const heartMat = new THREE.MeshStandardMaterial({ color: 0xff4b6b, transparent: true });

  const envelopeGroup = new THREE.Group();
  scene.add(envelopeGroup);
  activeObjects.push(envelopeGroup);
  currentWholeObject = envelopeGroup;

  const bodyGeo = new THREE.PlaneGeometry(3.6, 2.4);
  const body = new THREE.Mesh(bodyGeo, envelopeMat);
  body.position.z = -0.01;
  envelopeGroup.add(body);

  const leftGeo = new THREE.BufferGeometry();
  const leftVertices = new Float32Array([ -1.8, 1.2, 0,  -1.8, -1.2, 0,  0, 0, 0 ]);
  leftGeo.setAttribute('position', new THREE.BufferAttribute(leftVertices, 3));
  leftGeo.computeVertexNormals();
  const leftFlap = new THREE.Mesh(leftGeo, envelopeMat);
  leftFlap.position.z = 0.01;
  envelopeGroup.add(leftFlap);

  const rightGeo = new THREE.BufferGeometry();
  const rightVertices = new Float32Array([ 1.8, 1.2, 0,  0, 0, 0,  1.8, -1.2, 0 ]);
  rightGeo.setAttribute('position', new THREE.BufferAttribute(rightVertices, 3));
  rightGeo.computeVertexNormals();
  const rightFlap = new THREE.Mesh(rightGeo, envelopeMat);
  rightFlap.position.z = 0.01;
  envelopeGroup.add(rightFlap);

  const botGeo = new THREE.BufferGeometry();
  const botVertices = new Float32Array([ -1.8, -1.2, 0,  1.8, -1.2, 0,  0, 0.3, 0 ]);
  botGeo.setAttribute('position', new THREE.BufferAttribute(botVertices, 3));
  botGeo.computeVertexNormals();
  const botFlap = new THREE.Mesh(botGeo, envelopeMat);
  botFlap.position.z = 0.02;
  envelopeGroup.add(botFlap);

  const topGeo = new THREE.BufferGeometry();
  const topVertices = new Float32Array([ -1.8, 0, 0,  1.8, 0, 0,  0, -1.4, 0 ]);
  topGeo.setAttribute('position', new THREE.BufferAttribute(topVertices, 3));
  topGeo.computeVertexNormals();
  const topFlap = new THREE.Mesh(topGeo, envelopeMat);
  topFlap.position.y = 1.2;
  topFlap.position.z = 0.03;
  envelopeGroup.add(topFlap);

  const letterGeo = new THREE.PlaneGeometry(3.2, 2.0);
  const letter = new THREE.Mesh(letterGeo, paperMat);
  letter.position.z = 0; 
  envelopeGroup.add(letter);

  const heartShape = new THREE.Shape();
  const x = 0, y = 0;
  heartShape.moveTo( x + .25, y + .25 );
  heartShape.bezierCurveTo( x + .25, y + .25, x + .20, y, x, y );
  heartShape.bezierCurveTo( x - .30, y, x - .30, y + .35,x - .30,y + .35 );
  heartShape.bezierCurveTo( x - .30, y + .55, x - .10, y + .77, x + .25, y + .95 );
  heartShape.bezierCurveTo( x + .60, y + .77, x + .80, y + .55, x + .80, y + .35 );
  heartShape.bezierCurveTo( x + .80, y + .35, x + .80, y, x + .50, y );
  heartShape.bezierCurveTo( x + .35, y, x + .25, y + .25, x + .25, y + .25 );

  const extrudeSettings = { depth: 0.05, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
  const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  const heartMesh = new THREE.Mesh(heartGeo, heartMat);
  heartMesh.scale.set(0.4, -0.4, 0.4); 
  heartMesh.position.set(-0.1, 0.15, 0.04);
  topFlap.add(heartMesh); 

  envelopeGroup.rotation.x = 0.15;
  envelopeGroup.rotation.y = -0.15;
  envelopeGroup.scale.set(1.0, 1.0, 1.0);
  envelopeGroup.position.y = 1.0;

  currentShards = { heartMesh, topFlap, letter, envelopeGroup };

  gsap.to(envelopeGroup.position, {
     y: 1.3, duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut"
  });
  
  gsap.to(heartMesh.scale, {
    x: 0.45, y: -0.45, z: 0.45, duration: 0.6, repeat: -1, yoyo: true, ease: "power1.inOut"
  });
}

export function triggerEnvelopeOpen3D(onComplete) {
  if (!currentWholeObject) return onComplete();
  const { heartMesh, topFlap, letter, envelopeGroup } = currentShards;

  gsap.killTweensOf(envelopeGroup.position);
  gsap.killTweensOf(heartMesh.scale);

  const tl = gsap.timeline();

  tl.to(heartMesh.scale, { x: 0, y: 0, z: 0, duration: 0.4, ease: 'back.in(1.5)' });
  tl.to(topFlap.rotation, { x: Math.PI * 0.9, duration: 1.0, ease: 'power2.inOut' }, 0.3);
  
  tl.to(letter.position, { y: 2.5, duration: 1.2, ease: 'power2.out' }, 0.8);
  tl.to(letter.position, { z: 12, y: -1, duration: 1.8, ease: 'power3.in' }, 1.7);
  tl.to(letter.material, { opacity: 0, duration: 0.8 }, 2.5);
  
  tl.to(envelopeGroup.position, { y: -8, duration: 1.8, ease: 'power2.in' }, 1.4);
  tl.to(envelopeGroup.rotation, { x: 1, y: 1, duration: 1.8, ease: 'none' }, 1.4);

  setTimeout(onComplete, 3000); // MAIS LENTO
}
