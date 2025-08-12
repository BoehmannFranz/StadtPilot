// // app.js – 3D Kleinstadt Simulation (ESM-Setup mit boot.js)

// (() => {
//   // Ab hier setzen wir voraus, dass boot.js bereits THREE & OrbitControls global gemacht hat
//   const THREE = window.THREE;

//   // === Szenenparameter ===
//   const UNITS_PER_METER = 0.1;      // 1 m = 0.1 Einheiten => 1 Einheit = 10 m
//   const CITY_SIZE_M = 3000;         // m
//   const CITY_SIZE_U = CITY_SIZE_M * UNITS_PER_METER; // 300 Einheiten
//   const TILE_SIZE_M = 50;           // m
//   const TILE_SIZE_U = TILE_SIZE_M * UNITS_PER_METER; // 5 Einheiten
//   const GRID = Math.floor(CITY_SIZE_M / TILE_SIZE_M); // 60

//   // Radien in Metern
//   const RAD = {
//     fire:   2000 * UNITS_PER_METER, // Feuerwache
//     kita:    100 * UNITS_PER_METER, // Kita
//     school:  600 * UNITS_PER_METER  // Schule
//   };
//   const WEIGHT = { fire: 1/3, kita: 1/3, school: 1/3 };

//   // === Three.js Grundsetup ===
//   const scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xdfe7ec);

//   const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 4000);
//   camera.position.set(130, 180, 180);

//   const renderer = new THREE.WebGLRenderer({ antialias: true });
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
//   document.body.appendChild(renderer.domElement);

//   const controls = new THREE.OrbitControls(camera, renderer.domElement);
//   controls.target.set(0, 0, 0);
//   controls.enableDamping = true;

//   // Licht
//   const hemi = new THREE.HemisphereLight(0xffffff, 0xa2c39b, 0.85);
//   scene.add(hemi);
//   const dir = new THREE.DirectionalLight(0xffffff, 0.9);
//   dir.position.set(200, 300, 200);
//   dir.castShadow = true;
//   scene.add(dir);

//   // Boden
//   const groundGeo = new THREE.PlaneGeometry(CITY_SIZE_U, CITY_SIZE_U, 1, 1);
//   const groundMat = new THREE.MeshLambertMaterial({ color: 0xdce9dc });
//   const ground = new THREE.Mesh(groundGeo, groundMat);
//   ground.rotation.x = -Math.PI/2;
//   ground.receiveShadow = true;
//   ground.name = 'ground';
//   scene.add(ground);

//   // Heatmap-Gitter
//   const tileGroup = new THREE.Group();
//   scene.add(tileGroup);

//   const tiles = []; // {mesh, i, j, center: THREE.Vector3, score}
//   const startOffset = -CITY_SIZE_U/2 + TILE_SIZE_U/2;
//   const tileGeo = new THREE.PlaneGeometry(TILE_SIZE_U*0.98, TILE_SIZE_U*0.98);

//   function heatColor(score) {
//     const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
//     score = clamp(score, 0, 1);
//     let r,g,b;
//     if (score < 0.5) {
//       const t = score / 0.5;           // rot -> gelb
//       r = 217 + (247-217)*t; g = 45 + (144-45)*t; b = 32 + (9-32)*t;
//     } else {
//       const t = (score - 0.5) / 0.5;   // gelb -> grün
//       r = 247 + (18-247)*t; g = 144 + (183-144)*t; b = 9 + (106-9)*t;
//     }
//     return new THREE.Color(r/255,g/255,b/255);
//   }

//   for (let i=0; i<GRID; i++) {
//     for (let j=0; j<GRID; j++) {
//       const x = startOffset + i*TILE_SIZE_U;
//       const z = startOffset + j*TILE_SIZE_U;
//       const m = new THREE.Mesh(
//         tileGeo,
//         new THREE.MeshBasicMaterial({ color: heatColor(0), transparent: true, opacity: 0.5, side: THREE.DoubleSide })
//       );
//       m.rotation.x = -Math.PI/2;
//       m.position.set(x, 0.01, z);
//       tileGroup.add(m);
//       tiles.push({ mesh: m, i, j, center: new THREE.Vector3(x, 0, z), score: 0 });
//     }
//   }

//   // Stadtdekor: Straßen, Häuser, Wälder
//   const decor = new THREE.Group();
//   scene.add(decor);

//   const roadMat = new THREE.MeshLambertMaterial({ color: 0x5f6673 });
//   function addRoad(x, z, w, h) {
//     const geo = new THREE.BoxGeometry(w, 0.2, h);
//     const mesh = new THREE.Mesh(geo, roadMat);
//     mesh.position.set(x, 0.1, z);
//     mesh.receiveShadow = true;
//     decor.add(mesh);
//   }

//   const lanes = 8;
//   const laneWidth = 4.2;
//   for (let k=0; k<lanes; k++) {
//     const pos = -CITY_SIZE_U/2 + (k+1)*(CITY_SIZE_U/(lanes+1));
//     addRoad(0, pos, CITY_SIZE_U, laneWidth); // horizontal
//     addRoad(pos, 0, laneWidth, CITY_SIZE_U); // vertikal
//   }

//   const houseMat1 = new THREE.MeshLambertMaterial({ color: 0x9fb7cc });
//   const houseMat2 = new THREE.MeshLambertMaterial({ color: 0xbfd0df });
//   function addHouse(x,z) {
//     const w = 2.2 + Math.random()*3.8;
//     const d = 2.0 + Math.random()*3.6;
//     const h = 3   + Math.random()*10;
//     const geo = new THREE.BoxGeometry(w, h, d);
//     const mat = Math.random() > 0.5 ? houseMat1 : houseMat2;
//     const mesh = new THREE.Mesh(geo, mat);
//     mesh.castShadow = true; mesh.receiveShadow = true;
//     mesh.position.set(x, h/2, z);
//     decor.add(mesh);
//   }

//   function isRoadBand(x,z) {
//     const band = laneWidth * 1.2;
//     for (let k=0; k<lanes; k++) {
//       const pos = -CITY_SIZE_U/2 + (k+1)*(CITY_SIZE_U/(lanes+1));
//       if (Math.abs(z - pos) < band || Math.abs(x - pos) < band) return true;
//     }
//     return false;
//   }

//   for (let n=0; n<900; n++) {
//     const x = (Math.random()-0.5)*CITY_SIZE_U*0.94;
//     const z = (Math.random()-0.5)*CITY_SIZE_U*0.94;
//     if (!isRoadBand(x,z)) addHouse(x,z);
//   }

//   const treeMat = new THREE.MeshLambertMaterial({ color: 0x4c956c });
//   function addTree(x,z) {
//     const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,1.1,8), new THREE.MeshLambertMaterial({color:0x8b5a2b}));
//     trunk.position.set(x, 0.55, z);
//     trunk.castShadow = true; trunk.receiveShadow = true;
//     const crown = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.2, 9), treeMat);
//     crown.position.set(x, 2.6, z);
//     crown.castShadow = true; crown.receiveShadow = true;
//     decor.add(trunk); decor.add(crown);
//   }
//   function addForest(cx, cz, r, density) {
//     for (let i=0; i<density; i++) {
//       const ang = Math.random()*Math.PI*2;
//       const rr = Math.sqrt(Math.random())*r;
//       const x = cx + Math.cos(ang)*rr;
//       const z = cz + Math.sin(ang)*rr;
//       if (!isRoadBand(x,z)) addTree(x,z);
//     }
//   }
//   addForest(-CITY_SIZE_U*0.25,  CITY_SIZE_U*0.28, 18, 150);
//   addForest( CITY_SIZE_U*0.22, -CITY_SIZE_U*0.30, 22, 180);

//   // Platzierbare Gebäude & UI
//   const placed = []; // { type, mesh, position: Vector3 }
//   const ringGroup = new THREE.Group();
//   scene.add(ringGroup);

//   const types = {
//     fire:   { label: 'Feuerwache', color: 0xd7263d, radius: RAD.fire   },
//     kita:   { label: 'Kita',       color: 0x2d9bf0, radius: RAD.kita   },
//     school: { label: 'Schule',     color: 0x12b76a, radius: RAD.school }
//   };
//   let currentType = 'fire';

//   const hud   = document.getElementById('hud');
//   const ghost = document.getElementById('ghost');

//   function setActive(type) { currentType = type; showHUD(); }

//   // Drag & Drop
//   function bindDrag(id, type) {
//     const el = document.getElementById(id);
//     if (!el) return;
//     el.addEventListener('dragstart', (e)=>{
//       e.dataTransfer.setData('text/plain', type);
//       if (ghost) {
//         ghost.style.display = 'block';
//         ghost.querySelector('.pill').textContent = `${types[type].label} platzieren …`;
//       }
//     });
//     el.addEventListener('dragend', ()=>{ if (ghost) ghost.style.display = 'none'; });
//     el.addEventListener('click', ()=> setActive(type));
//   }
//   bindDrag('tool-fire','fire');
//   bindDrag('tool-kita','kita');
//   bindDrag('tool-school','school');

//   document.addEventListener('dragover', (e)=>{
//     if (!ghost) return;
//     ghost.style.left = (e.clientX + 12) + 'px';
//     ghost.style.top  = (e.clientY + 12) + 'px';
//   });
//   renderer.domElement.addEventListener('dragover', (e)=>{ e.preventDefault(); });
//   renderer.domElement.addEventListener('drop', (e)=>{
//     e.preventDefault();
//     const type = e.dataTransfer.getData('text/plain') || currentType;
//     const p = getGroundPoint(e.clientX, e.clientY);
//     if (p) placeAt(p, type);
//     if (ghost) ghost.style.display = 'none';
//   });

//   const btnErase = document.getElementById('erase');
//   const btnReset = document.getElementById('reset');
//   if (btnErase) btnErase.onclick = ()=>{ const last = placed.pop(); if (last) { scene.remove(last.mesh); updateHeat(); showHUD(); } };
//   if (btnReset) btnReset.onclick = ()=>{ while (placed.length) { const it = placed.pop(); scene.remove(it.mesh); } updateHeat(); showHUD(); };

//   setActive('fire');

//   // Gebäudegeometrien
//   const geoFire   = new THREE.CylinderGeometry(2.0, 2.0, 4, 24);
//   const geoKita   = new THREE.BoxGeometry(2.5, 1.2, 2.5);
//   const geoSchool = new THREE.BoxGeometry(3.2, 2.0, 2.8);

//   function makeBuilding(type) {
//     const info = types[type];
//     let geo = geoFire; if (type==='kita') geo = geoKita; if (type==='school') geo = geoSchool;
//     const mat = new THREE.MeshLambertMaterial({ color: info.color });
//     const mesh = new THREE.Mesh(geo, mat);
//     mesh.castShadow = true; mesh.receiveShadow = true;
//     return mesh;
//   }

//   // Raycasting
//   const raycaster = new THREE.Raycaster();
//   const mouse = new THREE.Vector2();

//   function getGroundPoint(clientX, clientY) {
//     mouse.x = (clientX / window.innerWidth) * 2 - 1;
//     mouse.y = -(clientY / window.innerHeight) * 2 + 1;
//     raycaster.setFromCamera(mouse, camera);
//     const hits = raycaster.intersectObjects([ground], false);
//     return (hits.length>0) ? hits[0].point : null;
//   }

//   // Platzieren per Klick
//   window.addEventListener('pointerdown', (e)=>{
//     const path = e.composedPath?.() || [];
//     if (path.some(node => node && node.id && (String(node.id).startsWith('tool-') || node.id==='ui' || node.className==='ctrl'))) return;
//     const p = getGroundPoint(e.clientX, e.clientY);
//     if (p) placeAt(p, currentType);
//   });

//   function placeAt(p, type) {
//     const m = makeBuilding(type);
//     m.position.copy(p);
//     m.position.y += (type==='fire' ? 2 : type==='school' ? 1 : 0.6);
//     scene.add(m);
//     placed.push({ type, mesh: m, position: p.clone() });

//     flashRing(p, types[type].radius, types[type].color);
//     updateHeat();
//     showHUD();
//   }

//   // Radius-Impuls
//   function flashRing(center, radius, color) {
//     const seg = 192;
//     const ringGeo = new THREE.RingGeometry(radius*0.98, radius, seg);
//     const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
//     const ring = new THREE.Mesh(ringGeo, ringMat);
//     ring.rotation.x = -Math.PI/2;
//     ring.position.set(center.x, 0.02, center.z);
//     ringGroup.add(ring);

//     const start = performance.now();
//     const duration = 1200;
//     (function fade(){
//       const t = (performance.now()-start)/duration;
//       ring.material.opacity = Math.max(0, 0.35*(1-t));
//       if (t < 1) requestAnimationFrame(fade);
//       else { ringGroup.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }
//     })();
//   }

//   // Heatmap
//   function updateHeat() {
//     const listFire   = placed.filter(p=>p.type==='fire');
//     const listKita   = placed.filter(p=>p.type==='kita');
//     const listSchool = placed.filter(p=>p.type==='school');

//     for (const t of tiles) {
//       let s = 0;
//       if (covered(t.center, listFire,   RAD.fire))   s += WEIGHT.fire;
//       if (covered(t.center, listKita,   RAD.kita))   s += WEIGHT.kita;
//       if (covered(t.center, listSchool, RAD.school)) s += WEIGHT.school;
//       t.score = Math.max(0, Math.min(1, s));
//       t.mesh.material.color = heatColor(t.score);
//     }
//   }
//   function covered(pos, list, radius) {
//     for (const it of list) { if (pos.distanceTo(it.position) <= radius) return true; }
//     return false;
//   }

//   function showHUD() {
//     const counts = { fire:0, kita:0, school:0 };
//     for (const p of placed) counts[p.type]++;
//     const avg = tiles.reduce((a,t)=>a+t.score,0)/tiles.length;
//     const pct = Math.round(avg*100);
//     if (hud) {
//       hud.innerHTML =
//         `Aktiv: <b>${types[currentType].label}</b><br>`+
//         `Gebäude: 🚒 ${counts.fire} &nbsp; 👶 ${counts.kita} &nbsp; 🏫 ${counts.school}<br>`+
//         `Durchschnittliche Zufriedenheit (flächig): <b>${pct}%</b>`;
//     }
//   }
//   updateHeat(); showHUD();

//   // Render-Loop
//   (function animate() {
//     controls.update();
//     renderer.render(scene, camera);
//     requestAnimationFrame(animate);
//   })();

//   // Resize
//   window.addEventListener('resize', ()=>{
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
//   });

// })();

// app.js – 3D Kleinstadt Simulation mit eingebauten SimpleOrbitControls (ohne externe OrbitControls.js)

(() => {
  const THREE = window.THREE;

  // ---- SimpleOrbitControls (eingebaut) ----
  class SimpleOrbitControls {
    constructor(camera, domElement) {
      this.camera = camera;
      this.dom = domElement;
      this.target = new THREE.Vector3(0, 0, 0);

      this.rotateSpeed = 0.0035;
      this.panSpeed = 0.005;
      this.zoomSpeed = 1.1;

      // Startposition in Kugelkoordinaten ableiten
      const off = new THREE.Vector3().copy(camera.position).sub(this.target);
      this.radius = off.length();
      this.theta = Math.atan2(off.x, off.z); // horizontal
      this.phi = Math.acos(off.y / this.radius); // vertikal [0..PI]

      this.state = 'none';
      this.prev = { x: 0, y: 0 };

      this._onDown = this.onPointerDown.bind(this);
      this._onMove = this.onPointerMove.bind(this);
      this._onUp   = this.onPointerUp.bind(this);
      this._onWheel= this.onWheel.bind(this);

      domElement.addEventListener('mousedown', this._onDown);
      window.addEventListener('mousemove', this._onMove);
      window.addEventListener('mouseup', this._onUp);
      domElement.addEventListener('wheel', this._onWheel, { passive: false });

      // Touch
      domElement.addEventListener('touchstart', (e) => {
        this.state = 'rotate';
        this.prev.x = e.touches[0].clientX;
        this.prev.y = e.touches[0].clientY;
      }, { passive: false });
      domElement.addEventListener('touchmove', (e) => {
        if (e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - this.prev.x;
        const dy = e.touches[0].clientY - this.prev.y;
        this.theta -= dx * this.rotateSpeed;
        this.phi   += dy * this.rotateSpeed;
        this.phi = Math.max(0.001, Math.min(Math.PI - 0.001, this.phi));
        this.prev.x = e.touches[0].clientX;
        this.prev.y = e.touches[0].clientY;
        e.preventDefault();
      }, { passive: false });
      domElement.addEventListener('touchend', ()=>{ this.state='none'; });
    }
    onPointerDown(e) {
      this.prev.x = e.clientX; this.prev.y = e.clientY;
      if (e.button === 0 && !e.ctrlKey) this.state = 'rotate';
      else this.state = 'pan'; // right click oder ctrl+left
    }
    onPointerMove(e) {
      if (this.state === 'none') return;
      const dx = e.clientX - this.prev.x;
      const dy = e.clientY - this.prev.y;
      if (this.state === 'rotate') {
        this.theta -= dx * this.rotateSpeed;
        this.phi   += dy * this.rotateSpeed;
        this.phi = Math.max(0.001, Math.min(Math.PI - 0.001, this.phi));
      } else if (this.state === 'pan') {
        // Pan relativ zur Bildschirmgröße
        const pan = new THREE.Vector3();
        const right = new THREE.Vector3(1,0,0);
        const up = new THREE.Vector3(0,1,0);
        // Skaliere Pan mit aktuellem Abstand
        const s = this.radius * this.panSpeed;
        pan.addScaledVector(right, -dx * s);
        pan.addScaledVector(up,    dy * s);
        this.target.add(pan);
      }
      this.prev.x = e.clientX; this.prev.y = e.clientY;
    }
    onPointerUp() { this.state = 'none'; }
    onWheel(e) {
      e.preventDefault();
      const delta = Math.sign(e.deltaY);
      if (delta > 0) this.radius *= this.zoomSpeed;
      else this.radius /= this.zoomSpeed;
      this.radius = Math.max(5, Math.min(1000, this.radius));
    }
    update() {
      // Kugel → kartesisch
      const sinPhi = Math.sin(this.phi);
      const x = this.radius * sinPhi * Math.sin(this.theta);
      const y = this.radius * Math.cos(this.phi);
      const z = this.radius * sinPhi * Math.cos(this.theta);
      this.camera.position.set(this.target.x + x, this.target.y + y, this.target.z + z);
      this.camera.lookAt(this.target);
    }
    dispose() {
      this.dom.removeEventListener('mousedown', this._onDown);
      window.removeEventListener('mousemove', this._onMove);
      window.removeEventListener('mouseup', this._onUp);
      this.dom.removeEventListener('wheel', this._onWheel);
    }
  }
  // ---- Ende SimpleOrbitControls ----

  // === Szenenparameter ===
  const UNITS_PER_METER = 0.1;
  const CITY_SIZE_M = 3000;
  const CITY_SIZE_U = CITY_SIZE_M * UNITS_PER_METER;
  const TILE_SIZE_M = 50;
  const TILE_SIZE_U = TILE_SIZE_M * UNITS_PER_METER;
  const GRID = Math.floor(CITY_SIZE_M / TILE_SIZE_M);

  const RAD = {
    fire:   2000 * UNITS_PER_METER,
    kita:    100 * UNITS_PER_METER,
    school:  600 * UNITS_PER_METER
  };
  const WEIGHT = { fire: 1/3, kita: 1/3, school: 1/3 };

  // === Three Setup ===
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdfe7ec);

  const camera = new THREE.PerspectiveCamera(65, innerWidth/innerHeight, 0.1, 4000);
  camera.position.set(130,180,180);

  const renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  document.body.appendChild(renderer.domElement);

  const controls = new SimpleOrbitControls(camera, renderer.domElement);

  // Licht
  const hemi = new THREE.HemisphereLight(0xffffff, 0xa2c39b, 0.85);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(200,300,200);
  dir.castShadow = true;
  scene.add(dir);

  // Boden
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY_SIZE_U, CITY_SIZE_U),
    new THREE.MeshLambertMaterial({ color: 0xdce9dc })
  );
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  ground.name = 'ground';
  scene.add(ground);

  // Heatmap
  const tileGroup = new THREE.Group(); scene.add(tileGroup);
  const tiles = [];
  const startOffset = -CITY_SIZE_U/2 + TILE_SIZE_U/2;
  const tileGeo = new THREE.PlaneGeometry(TILE_SIZE_U*0.98, TILE_SIZE_U*0.98);

  function heatColor(score){
    const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
    score = clamp(score,0,1);
    let r,g,b;
    if(score<0.5){ const t=score/0.5; r=217+(247-217)*t; g=45+(144-45)*t; b=32+(9-32)*t; }
    else { const t=(score-0.5)/0.5; r=247+(18-247)*t; g=144+(183-144)*t; b=9+(106-9)*t; }
    return new THREE.Color(r/255,g/255,b/255);
  }

  for(let i=0;i<GRID;i++){
    for(let j=0;j<GRID;j++){
      const x = startOffset + i*TILE_SIZE_U;
      const z = startOffset + j*TILE_SIZE_U;
      const m = new THREE.Mesh(
        tileGeo,
        new THREE.MeshBasicMaterial({ color: heatColor(0), transparent:true, opacity:0.5, side:THREE.DoubleSide })
      );
      m.rotation.x = -Math.PI/2; m.position.set(x,0.01,z);
      tileGroup.add(m);
      tiles.push({ mesh:m, i, j, center:new THREE.Vector3(x,0,z), score:0 });
    }
  }

  // Stadtdekor
  const decor = new THREE.Group(); scene.add(decor);

  const roadMat = new THREE.MeshLambertMaterial({ color: 0x5f6673 });
  function addRoad(x,z,w,h){
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,0.2,h), roadMat);
    mesh.position.set(x,0.1,z); mesh.receiveShadow=true; decor.add(mesh);
  }
  const lanes=8, laneWidth=4.2;
  for(let k=0;k<lanes;k++){
    const pos = -CITY_SIZE_U/2 + (k+1)*(CITY_SIZE_U/(lanes+1));
    addRoad(0,pos,CITY_SIZE_U,laneWidth);
    addRoad(pos,0,laneWidth,CITY_SIZE_U);
  }

  const houseMat1 = new THREE.MeshLambertMaterial({ color: 0x9fb7cc });
  const houseMat2 = new THREE.MeshLambertMaterial({ color: 0xbfd0df });
  function addHouse(x,z){
    const w=2.2+Math.random()*3.8, d=2.0+Math.random()*3.6, h=3+Math.random()*10;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), Math.random()>0.5?houseMat1:houseMat2);
    mesh.castShadow=true; mesh.receiveShadow=true; mesh.position.set(x,h/2,z); decor.add(mesh);
  }
  function isRoadBand(x,z){
    const band = laneWidth*1.2;
    for(let k=0;k<lanes;k++){
      const pos = -CITY_SIZE_U/2 + (k+1)*(CITY_SIZE_U/(lanes+1));
      if (Math.abs(z-pos)<band || Math.abs(x-pos)<band) return true;
    }
    return false;
  }
  for(let n=0;n<900;n++){
    const x=(Math.random()-0.5)*CITY_SIZE_U*0.94;
    const z=(Math.random()-0.5)*CITY_SIZE_U*0.94;
    if(!isRoadBand(x,z)) addHouse(x,z);
  }

  const treeMat = new THREE.MeshLambertMaterial({ color: 0x4c956c });
  function addTree(x,z){
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,1.1,8), new THREE.MeshLambertMaterial({color:0x8b5a2b}));
    trunk.position.set(x,0.55,z); trunk.castShadow=true; trunk.receiveShadow=true;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.3,3.2,9), treeMat);
    crown.position.set(x,2.6,z); crown.castShadow=true; crown.receiveShadow=true;
    decor.add(trunk); decor.add(crown);
  }
  function addForest(cx,cz,r,density){
    for(let i=0;i<density;i++){
      const ang=Math.random()*Math.PI*2;
      const rr=Math.sqrt(Math.random())*r;
      const x=cx+Math.cos(ang)*rr;
      const z=cz+Math.sin(ang)*rr;
      if(!isRoadBand(x,z)) addTree(x,z);
    }
  }
  addForest(-CITY_SIZE_U*0.25, CITY_SIZE_U*0.28, 18, 150);
  addForest( CITY_SIZE_U*0.22,-CITY_SIZE_U*0.30, 22, 180);

  // Platzierbare Gebäude + UI
  const placed = [];
  const ringGroup = new THREE.Group(); scene.add(ringGroup);
  const types = {
    fire:   { label:'Feuerwache', color:0xd7263d, radius:RAD.fire },
    kita:   { label:'Kita',       color:0x2d9bf0, radius:RAD.kita },
    school: { label:'Schule',     color:0x12b76a, radius:RAD.school }
  };
  let currentType = 'fire';
  const hud = document.getElementById('hud');
  const ghost = document.getElementById('ghost');

  function setActive(type){ currentType=type; showHUD(); }
  function bindDrag(id, type){
    const el = document.getElementById(id); if(!el) return;
    el.addEventListener('dragstart',(e)=>{ e.dataTransfer.setData('text/plain', type); if(ghost){ ghost.style.display='block'; ghost.querySelector('.pill').textContent=`${types[type].label} platzieren …`; }});
    el.addEventListener('dragend',()=>{ if(ghost) ghost.style.display='none'; });
    el.addEventListener('click',()=> setActive(type));
  }
  bindDrag('tool-fire','fire'); bindDrag('tool-kita','kita'); bindDrag('tool-school','school');

  document.addEventListener('dragover',(e)=>{ if(!ghost) return; ghost.style.left=(e.clientX+12)+'px'; ghost.style.top=(e.clientY+12)+'px'; });
  renderer.domElement.addEventListener('dragover',(e)=>{ e.preventDefault(); });
  renderer.domElement.addEventListener('drop',(e)=>{
    e.preventDefault();
    const type=e.dataTransfer.getData('text/plain')||currentType;
    const p=getGroundPoint(e.clientX,e.clientY);
    if(p) placeAt(p,type);
    if(ghost) ghost.style.display='none';
  });

  const btnErase=document.getElementById('erase');
  const btnReset=document.getElementById('reset');
  if(btnErase) btnErase.onclick=()=>{ const last=placed.pop(); if(last){ scene.remove(last.mesh); updateHeat(); showHUD(); } };
  if(btnReset) btnReset.onclick=()=>{ while(placed.length){ const it=placed.pop(); scene.remove(it.mesh);} updateHeat(); showHUD(); };

  // Geometrien
  const geoFire   = new THREE.CylinderGeometry(2.0,2.0,4,24);
  const geoKita   = new THREE.BoxGeometry(2.5,1.2,2.5);
  const geoSchool = new THREE.BoxGeometry(3.2,2.0,2.8);

  function makeBuilding(type){
    const info = types[type];
    let geo=geoFire; if(type==='kita') geo=geoKita; if(type==='school') geo=geoSchool;
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: info.color }));
    mesh.castShadow=true; mesh.receiveShadow=true;
    return mesh;
  }

  // Raycasting
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  function getGroundPoint(clientX, clientY){
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects([ground], false);
    return hits.length ? hits[0].point : null;
  }

  // Klick-Platzierung
  window.addEventListener('pointerdown',(e)=>{
    const path = e.composedPath?.() || [];
    if (path.some(node => node && node.id && (String(node.id).startsWith('tool-') || node.id==='ui' || node.className==='ctrl'))) return;
    const p = getGroundPoint(e.clientX, e.clientY);
    if (p) placeAt(p, currentType);
  });

  function placeAt(p, type){
    const m = makeBuilding(type);
    m.position.copy(p); m.position.y += (type==='fire'?2: type==='school'?1:0.6);
    scene.add(m); placed.push({ type, mesh:m, position:p.clone() });
    flashRing(p, types[type].radius, types[type].color);
    updateHeat(); showHUD();
  }

  function flashRing(center, radius, color){
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius*0.98, radius, 192),
      new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.35, side:THREE.DoubleSide })
    );
    ring.rotation.x=-Math.PI/2; ring.position.set(center.x,0.02,center.z); ringGroup.add(ring);
    const start=performance.now(), duration=1200;
    (function fade(){
      const t=(performance.now()-start)/duration;
      ring.material.opacity=Math.max(0, 0.35*(1-t));
      if(t<1) requestAnimationFrame(fade); else { ringGroup.remove(ring); ring.geometry.dispose(); ring.material.dispose(); }
    })();
  }

  function updateHeat(){
    const listFire=placed.filter(p=>p.type==='fire');
    const listKita=placed.filter(p=>p.type==='kita');
    const listSchool=placed.filter(p=>p.type==='school');
    for(const t of tiles){
      let s=0;
      if(covered(t.center,listFire, RAD.fire)) s+=WEIGHT.fire;
      if(covered(t.center,listKita, RAD.kita)) s+=WEIGHT.kita;
      if(covered(t.center,listSchool, RAD.school)) s+=WEIGHT.school;
      t.score=Math.max(0,Math.min(1,s));
      t.mesh.material.color=heatColor(t.score);
    }
  }
  function covered(pos, list, radius){
    for(const it of list){ if(pos.distanceTo(it.position)<=radius) return true; }
    return false;
  }

  function showHUD(){
    const counts={fire:0,kita:0,school:0}; for(const p of placed) counts[p.type]++;
    const avg=tiles.reduce((a,t)=>a+t.score,0)/tiles.length; const pct=Math.round(avg*100);
    if(hud){ hud.innerHTML = `Aktiv: <b>${types[currentType].label}</b><br>`+
      `Gebäude: 🚒 ${counts.fire} &nbsp; 👶 ${counts.kita} &nbsp; 🏫 ${counts.school}<br>`+
      `Durchschnittliche Zufriedenheit (flächig): <b>${pct}%</b>`; }
  }
  updateHeat(); showHUD();

  // Loop
  (function animate(){
    controls.update();
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  })();

  // Resize
  addEventListener('resize', ()=>{
    camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
})();
