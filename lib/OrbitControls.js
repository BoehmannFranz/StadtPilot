// OrbitControls.js – Three.js r160 (angepasst für lokale Nutzung)
// Quelle: https://github.com/mrdoob/three.js/blob/r160/examples/jsm/controls/OrbitControls.js
// Anpassung: Import aus './three.module.js' statt 'three'

import {
	EventDispatcher,
	MOUSE,
	TOUCH,
	Quaternion,
	Spherical,
	Vector2,
	Vector3,
	MathUtils,
	Ray
} from './three.module.js';

const _changeEvent = { type: 'change' };
const _startEvent = { type: 'start' };
const _endEvent = { type: 'end' };

class OrbitControls extends EventDispatcher {

	constructor( object, domElement ) {

		super();

		if ( domElement === undefined ) console.warn( 'OrbitControls: The second parameter "domElement" is mandatory.' );
		if ( domElement === document ) console.error( 'OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.' );

		this.object = object;
		this.domElement = domElement;

		// API
		this.enabled = true;
		this.target = new Vector3();
		this.minDistance = 0;
		this.maxDistance = Infinity;
		this.minZoom = 0;
		this.maxZoom = Infinity;
		this.minPolarAngle = 0;
		this.maxPolarAngle = Math.PI;
		this.minAzimuthAngle = - Infinity;
		this.maxAzimuthAngle = Infinity;
		this.enableDamping = false;
		this.dampingFactor = 0.05;
		this.enableZoom = true;
		this.zoomSpeed = 1.0;
		this.enableRotate = true;
		this.rotateSpeed = 1.0;
		this.enablePan = true;
		this.panSpeed = 1.0;
		this.screenSpacePanning = true;
		this.keyPanSpeed = 7.0;
		this.autoRotate = false;
		this.autoRotateSpeed = 2.0;
		this.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };
		this.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };
		this.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };
		// internals
		const scope = this;
		const EPS = 0.000001;

		let lastPosition = new Vector3();
		let lastQuaternion = new Quaternion();

		let spherical = new Spherical();
		let sphericalDelta = new Spherical();

		let scale = 1;
		let panOffset = new Vector3();
		let zoomChanged = false;

		let rotateStart = new Vector2();
		let rotateEnd = new Vector2();
		let rotateDelta = new Vector2();

		let panStart = new Vector2();
		let panEnd = new Vector2();
		let panDelta = new Vector2();

		let dollyStart = new Vector2();
		let dollyEnd = new Vector2();
		let dollyDelta = new Vector2();

		let state = STATE.NONE;

		const STATE = {
			NONE: -1,
			ROTATE: 0,
			DOLLY: 1,
			PAN: 2,
			TOUCH_ROTATE: 3,
			TOUCH_PAN: 4,
			TOUCH_DOLLY_PAN: 5,
			TOUCH_DOLLY_ROTATE: 6
		};

		this.getPolarAngle = function () {
			return spherical.phi;
		};

		this.getAzimuthalAngle = function () {
			return spherical.theta;
		};

		this.saveState = function () {
			scope.target0 = scope.target.clone();
			scope.position0 = scope.object.position.clone();
			scope.zoom0 = scope.object.zoom;
		};

		this.reset = function () {
			scope.target.copy(scope.target0);
			scope.object.position.copy(scope.position0);
			scope.object.zoom = scope.zoom0;
			scope.object.updateProjectionMatrix();
			scope.dispatchEvent(_changeEvent);
			scope.update();
			state = STATE.NONE;
		};

		this.update = function () {
			const offset = new Vector3();

			// so camera.up is the orbit axis
			const quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0));
			const quatInverse = quat.clone().invert();

			const lastPosition = new Vector3();
			const lastQuaternion = new Quaternion();

			return function update() {
				const position = scope.object.position;

				offset.copy(position).sub(scope.target);
				offset.applyQuaternion(quat);

				spherical.setFromVector3(offset);

				if (scope.autoRotate && state === STATE.NONE) {
					rotateLeft(getAutoRotationAngle());
				}

				spherical.theta += sphericalDelta.theta;
				spherical.phi += sphericalDelta.phi;

				spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
				spherical.makeSafe();

				spherical.radius *= scale;
				spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));

				scope.target.add(panOffset);

				offset.setFromSpherical(spherical);
				offset.applyQuaternion(quatInverse);

				position.copy(scope.target).add(offset);
				scope.object.lookAt(scope.target);

				if (scope.enableDamping) {
					sphericalDelta.theta *= (1 - scope.dampingFactor);
					sphericalDelta.phi *= (1 - scope.dampingFactor);
					panOffset.multiplyScalar(1 - scope.dampingFactor);
				} else {
					sphericalDelta.set(0, 0, 0);
					panOffset.set(0, 0, 0);
				}

				scale = 1;

				if (zoomChanged ||
					lastPosition.distanceToSquared(scope.object.position) > EPS ||
					8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {
					scope.dispatchEvent(_changeEvent);
					lastPosition.copy(scope.object.position);
					lastQuaternion.copy(scope.object.quaternion);
					zoomChanged = false;
					return true;
				}

				return false;
			};
		}();
		// ————————— Hilfsfunktionen —————————

		function getAutoRotationAngle() {
			return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
		}

		function getZoomScale() {
			return Math.pow(0.95, scope.zoomSpeed);
		}

		function rotateLeft(angle) {
			sphericalDelta.theta -= angle;
		}

		function rotateUp(angle) {
			sphericalDelta.phi -= angle;
		}

		const panLeft = (function () {
			const v = new Vector3();
			return function panLeft(distance, objectMatrix) {
				v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
				v.multiplyScalar(-distance);
				panOffset.add(v);
			};
		}());

		const panUp = (function () {
			const v = new Vector3();
			return function panUp(distance, objectMatrix) {
				if (scope.screenSpacePanning === true) {
					v.setFromMatrixColumn(objectMatrix, 1);
				} else {
					v.setFromMatrixColumn(objectMatrix, 0);
					v.crossVectors(scope.object.up, v);
				}
				v.multiplyScalar(distance);
				panOffset.add(v);
			};
		}());

		// delta in pixels
		const pan = (function () {
			const offset = new Vector3();
			return function pan(deltaX, deltaY) {
				const element = scope.domElement;
				if (scope.object.isPerspectiveCamera) {
					const position = scope.object.position;
					offset.copy(position).sub(scope.target);
					let targetDistance = offset.length();

					// half of the fov is center to top of screen
					targetDistance *= Math.tan((scope.object.fov / 2) * Math.PI / 180.0);

					panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix);
					panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix);
				} else if (scope.object.isOrthographicCamera) {
					panLeft(deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element.clientWidth, scope.object.matrix);
					panUp(deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element.clientHeight, scope.object.matrix);
				} else {
					// camera neither orthographic nor perspective
					console.warn('OrbitControls: Unsupported camera type.');
					scope.enablePan = false;
				}
			};
		}());

		function dollyOut(dollyScale) {
			if (scope.object.isPerspectiveCamera) {
				scale /= dollyScale;
			} else if (scope.object.isOrthographicCamera) {
				scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom * dollyScale));
				scope.object.updateProjectionMatrix();
				zoomChanged = true;
			} else {
				console.warn('OrbitControls: dolly only supported for Perspective/Orthographic cameras.');
				scope.enableZoom = false;
			}
		}

		function dollyIn(dollyScale) {
			if (scope.object.isPerspectiveCamera) {
				scale *= dollyScale;
			} else if (scope.object.isOrthographicCamera) {
				scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / dollyScale));
				scope.object.updateProjectionMatrix();
				zoomChanged = true;
			} else {
				console.warn('OrbitControls: dolly only supported for Perspective/Orthographic cameras.');
				scope.enableZoom = false;
			}
		}

		// ————————— Maus-Events —————————

		function handleMouseDownRotate(event) {
			rotateStart.set(event.clientX, event.clientY);
		}

		function handleMouseDownDolly(event) {
			dollyStart.set(event.clientX, event.clientY);
		}

		function handleMouseDownPan(event) {
			panStart.set(event.clientX, event.clientY);
		}

		function handleMouseMoveRotate(event) {
			rotateEnd.set(event.clientX, event.clientY);
			rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);

			const element = scope.domElement;
			rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight);
			rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);

			rotateStart.copy(rotateEnd);
			scope.update();
		}

		function handleMouseMoveDolly(event) {
			dollyEnd.set(event.clientX, event.clientY);
			dollyDelta.subVectors(dollyEnd, dollyStart);

			if (dollyDelta.y > 0) {
				dollyOut(getZoomScale());
			} else if (dollyDelta.y < 0) {
				dollyIn(getZoomScale());
			}

			dollyStart.copy(dollyEnd);
			scope.update();
		}

		function handleMouseMovePan(event) {
			panEnd.set(event.clientX, event.clientY);
			panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);

			pan(panDelta.x, panDelta.y);
			panStart.copy(panEnd);
			scope.update();
		}

		function handleMouseWheel(event) {
			if (event.deltaY < 0) {
				dollyIn(getZoomScale());
			} else if (event.deltaY > 0) {
				dollyOut(getZoomScale());
			}
			scope.update();
		}

		function handleKeyDown(event) {
			let needsUpdate = false;
			switch (event.key) {
				case scope.keys.UP:    pan(0,  12); needsUpdate = true; break;
				case scope.keys.BOTTOM:pan(0, -12); needsUpdate = true; break;
				case scope.keys.LEFT:  pan( 12, 0); needsUpdate = true; break;
				case scope.keys.RIGHT: pan(-12, 0); needsUpdate = true; break;
			}
			if (needsUpdate) scope.update();
		}

		// ————————— Touch-Events —————————

		function handleTouchStartRotate(event) {
			if (event.touches.length == 1) {
				rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
			} else {
				const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
				const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
				rotateStart.set(x, y);
			}
		}

		function handleTouchStartPan(event) {
			if (event.touches.length == 1) {
				panStart.set(event.touches[0].pageX, event.touches[0].pageY);
			} else {
				const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
				const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
				panStart.set(x, y);
			}
		}

		function handleTouchStartDollyPan(event) {
			if (scope.enableZoom) {
				const dx = event.touches[0].pageX - event.touches[1].pageX;
				const dy = event.touches[0].pageY - event.touches[1].pageY;
				const distance = Math.sqrt(dx * dx + dy * dy);
				dollyStart.set(0, distance);
			}
			if (scope.enablePan) {
				const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
				const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
				panStart.set(x, y);
			}
		}

		function handleTouchMoveRotate(event) {
			if (event.touches.length == 1) {
				rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
			} else {
				const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
				const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
				rotateEnd.set(x, y);
			}
			rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
			const element = scope.domElement;
			rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight);
			rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
			rotateStart.copy(rotateEnd);
			scope.update();
		}

		function handleTouchMovePan(event) {
			if (event.touches.length == 1) {
				panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
			} else {
				const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
				const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
				panEnd.set(x, y);
			}
			panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
			pan(panDelta.x, panDelta.y);
			panStart.copy(panEnd);
			scope.update();
		}

		function handleTouchMoveDollyPan(event) {
			const dx = event.touches[0].pageX - event.touches[1].pageX;
			const dy = event.touches[0].pageY - event.touches[1].pageY;
			const distance = Math.sqrt(dx * dx + dy * dy);
			dollyEnd.set(0, distance);
			dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, 1));
			if (dollyDelta.y > 1) dollyOut(dollyDelta.y);
			else if (dollyDelta.y < 1) dollyIn(1 / dollyDelta.y);
			dollyStart.copy(dollyEnd);
			scope.update();
		}
		// ————————— Event-Handler registrieren —————————

		function onMouseDown( event ) {
			if ( scope.enabled === false ) return;

			switch ( event.button ) {
				case 0: // LEFT
					if ( scope.enableRotate ) {
						handleMouseDownRotate( event );
						state = STATE.ROTATE;
					}
					break;
				case 1: // MIDDLE
					if ( scope.enableZoom ) {
						handleMouseDownDolly( event );
						state = STATE.DOLLY;
					}
					break;
				case 2: // RIGHT
					if ( scope.enablePan ) {
						handleMouseDownPan( event );
						state = STATE.PAN;
					}
					break;
			}

			if ( state !== STATE.NONE ) {
				scope.domElement.ownerDocument.addEventListener( 'mousemove', onMouseMove );
				scope.domElement.ownerDocument.addEventListener( 'mouseup', onMouseUp );
				scope.dispatchEvent( _startEvent );
			}
		}

		function onMouseMove( event ) {
			if ( scope.enabled === false ) return;

			switch ( state ) {
				case STATE.ROTATE:
					if ( scope.enableRotate ) handleMouseMoveRotate( event );
					break;
				case STATE.DOLLY:
					if ( scope.enableZoom ) handleMouseMoveDolly( event );
					break;
				case STATE.PAN:
					if ( scope.enablePan ) handleMouseMovePan( event );
					break;
			}
		}

		function onMouseUp() {
			scope.domElement.ownerDocument.removeEventListener( 'mousemove', onMouseMove );
			scope.domElement.ownerDocument.removeEventListener( 'mouseup', onMouseUp );
			scope.dispatchEvent( _endEvent );
			state = STATE.NONE;
		}

		function onMouseWheel( event ) {
			if ( scope.enabled === false || scope.enableZoom === false ) return;
			event.preventDefault();
			handleMouseWheel( event );
			scope.dispatchEvent( _startEvent );
			scope.dispatchEvent( _endEvent );
		}

		function onKeyDown( event ) {
			if ( scope.enabled === false || scope.enablePan === false ) return;
			handleKeyDown( event );
		}

		function onTouchStart( event ) {
			if ( scope.enabled === false ) return;
			switch ( event.touches.length ) {
				case 1:
					if ( scope.enableRotate ) {
						handleTouchStartRotate( event );
						state = STATE.TOUCH_ROTATE;
					}
					break;
				case 2:
					if ( scope.enableZoom || scope.enablePan ) {
						handleTouchStartDollyPan( event );
						state = STATE.TOUCH_DOLLY_PAN;
					}
					break;
				default:
					state = STATE.NONE;
			}
			if ( state !== STATE.NONE ) scope.dispatchEvent( _startEvent );
		}

		function onTouchMove( event ) {
			if ( scope.enabled === false ) return;

			switch ( state ) {
				case STATE.TOUCH_ROTATE:
					if ( scope.enableRotate ) handleTouchMoveRotate( event );
					break;
				case STATE.TOUCH_DOLLY_PAN:
					if ( scope.enableZoom || scope.enablePan ) handleTouchMoveDollyPan( event );
					break;
				default:
					break;
			}
		}

		function onTouchEnd() {
			if ( scope.enabled === false ) return;
			scope.dispatchEvent( _endEvent );
			state = STATE.NONE;
		}

		function onContextMenu( event ) {
			if ( scope.enabled === false ) return;
			event.preventDefault();
		}

		// ————————— Listener binden —————————

		this.domElement.addEventListener( 'contextmenu', onContextMenu );
		this.domElement.addEventListener( 'mousedown', onMouseDown );
		this.domElement.addEventListener( 'wheel', onMouseWheel, { passive: false } );

		this.domElement.addEventListener( 'touchstart', onTouchStart, { passive: false } );
		this.domElement.addEventListener( 'touchend', onTouchEnd );
		this.domElement.addEventListener( 'touchmove', onTouchMove, { passive: false } );

		window.addEventListener( 'keydown', onKeyDown );

		// API: dispose
		this.dispose = function () {
			scope.domElement.removeEventListener( 'contextmenu', onContextMenu );
			scope.domElement.removeEventListener( 'mousedown', onMouseDown );
			scope.domElement.removeEventListener( 'wheel', onMouseWheel );

			scope.domElement.removeEventListener( 'touchstart', onTouchStart );
			scope.domElement.removeEventListener( 'touchend', onTouchEnd );
			scope.domElement.removeEventListener( 'touchmove', onTouchMove );

			window.removeEventListener( 'keydown', onKeyDown );
		};

		// initial state
		this.saveState();
		this.update();
	}
}

// Export
export { OrbitControls };
