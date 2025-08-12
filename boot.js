// // boot.js – ESM-Loader
// import * as THREE_NS from './lib/three.module.js';
// import { OrbitControls as OrbitControlsClass } from './lib/OrbitControls.js';

// // global machen, damit app.js wie gewohnt mit window.THREE arbeiten kann
// window.THREE = THREE_NS;
// THREE.OrbitControls = OrbitControlsClass;

// // dann die eigentliche App laden
// import './app.js';

// boot.js – nur THREE laden und App starten
import * as THREE_NS from './lib/three.module.js';
window.THREE = THREE_NS;
import './app.js';