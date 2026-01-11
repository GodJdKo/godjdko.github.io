// Sound effects
let clickSound, jingleSound, antijingleSound, clacSound, ticlicSound;

// Fullscreen management
let fullscreenRequested = false;

function requestFullscreen() {
	if (fullscreenRequested) return;
	
	const elem = document.documentElement;
	if (elem.requestFullscreen) {
		elem.requestFullscreen().catch(err => console.log('Fullscreen request failed:', err));
		fullscreenRequested = true;
	} else if (elem.webkitRequestFullscreen) { // Safari
		elem.webkitRequestFullscreen();
		fullscreenRequested = true;
	} else if (elem.mozRequestFullScreen) { // Firefox
		elem.mozRequestFullScreen();
		fullscreenRequested = true;
	} else if (elem.msRequestFullscreen) { // IE/Edge
		elem.msRequestFullscreen();
		fullscreenRequested = true;
	}
}

// Images
let btnPressedImg, lightMaskImg, backUI0Img, backUIImg, extUI0Img, extUIImg, btnavailImg;
let uiImages = {};
let firstFrameImages = [];
let noiseImages = [];
let isUsingWebGL = false; // Track which renderer mode we're using

// Cheater animation (idle hint animation)
let cheaterFrames = [];
const CHEATER_FRAME_COUNT = 8;
const CHEATER_FPS = 12; // Frames per second
const CHEATER_INACTIVITY_DELAY = 5000; // 5 seconds of not clicking button before showing
const CHEATER_OFFSET_X = -42; // X offset from button position
const CHEATER_OFFSET_Y = -42; // Y offset from button position
const CHEATER_SCALE = 3.0; // Scale multiplier (1.0 = same size as button area)
let cheaterCurrentFrame = 0;
let cheaterLastFrameChange = 0;
let cheaterFrameInterval = 1000 / CHEATER_FPS;
let lastButtonPressTime = 0;
let showCheaterAnimation = false;

// Main canvas reference (for styling)
let mainCanvas = null;

// Video elements and states
let video, reverseVideo, video2, reverseVideo2, video3, video5;
let videoLoaded = false;
let reverseVideoLoaded = false;
let video2Loaded = false;
let reverseVideo2Loaded = false;
let video3Loaded = false;
let video5Loaded = false;

// About Me section (replaces video4)
let aboutMeBgImg = null;
let aboutMeImg = null;
let aboutMeLoaded = false;
let playingReverseVideo = false;
let playingVideo2 = false;
let playingReverseVideo2 = false;
let playingVideo3 = false;
let playingVideo4 = false;
let playingVideo5 = false;
let isPlaying = false;

// Frame capture for smooth video transitions (prevent black flashes)
let video2TransitionFrame = null;
let reverseVideo2TransitionFrame = null;

// UI Navigation
const availableImages = ['p0', 'p1', 'p2', 'p3', 'p11', 'p111', 'p112', 'p12','p121','p122','p13','p14','p15','p16','p17','p18','p19'];
let currentUIState = 'p0';
let showingUI = false;

// First frame animation
let currentFirstFrame = 0;
let lastFirstFrameChange = 0;
let firstFrameInterval = 100;

// Button states
let buttonClicked = false;
let buttonPressed = false;
let waitingForButtonClick = true;
let lastTouchX = 0;
let lastTouchY = 0;
let keyboardArrowPressed = -1; // -1 = none, 0=down, 1=left, 2=up, 3=right
let spaceKeyPressed = false; // Track spacebar for button
let enterKeyPressed = false; // Track enter key for button

// Button click cooldown (prevent spam/double clicks)
let lastButtonClickTime = 0;
let lastArrowClickTime = 0; // Separate cooldown for arrow buttons
const BUTTON_CLICK_COOLDOWN = 50; // 50ms between clicks


// About Me scroll control
let aboutMeScrollY = 0; // Vertical scroll position of the about me text
let aboutMeMaxScroll = 0; // Maximum scroll value (calculated from image height)
let aboutMeIsUserInteracting = false; // Track if user is holding mouse/touch
let aboutMeUpKeyHeld = false; // Track if up arrow is held
let aboutMeDownKeyHeld = false; // Track if down arrow is held
let aboutMeLastKeyScrubTime = 0;
let aboutMeLastWheelTime = 0; // Throttle wheel events
let aboutMeLastTouchMoveTime = 0; // Throttle touch move events
let aboutMeLastScrollTime = 0;

// Perspective rendering cache (avoid per-frame allocations)
let aboutMeTextBuffer = null; // Reusable graphics buffer
let aboutMeTextBufferSize = { w: 0, h: 0 }; // Track buffer dimensions
let aboutMePerspectiveCache = null; // Cached slice calculations
let aboutMePerspectiveCacheKey = ''; // Cache invalidation key
const ABOUTME_SLICE_COUNT = 50; // Fewer slices = better performance (50 is visually identical to 100)
let aboutMeLastInteractionEndTime = 0; // When user stopped interacting
let aboutMeLastAutoPlayTime = 0;
let lastTouchYForScroll = 0;
let aboutMeScrollVelocity = 0; // Current scroll velocity for smooth animation
let aboutMeTargetVelocity = 0; // Target velocity to lerp towards
const aboutMeScrollSpeed = 1; // Pixels per scroll unit
const aboutMeAutoPlaySpeed = 1; // Pixels per second for auto-scroll
const aboutMeAutoPlayDelay = 200; // Wait 200ms after scroll before auto-playing
const aboutMeVelocitySmoothing = 0.15; // How fast velocity changes (0.1 = slow, 0.5 = fast)
const aboutMeKeyScrollSpeed = 50; // ms between key scroll updates
const aboutMeWheelThrottle = 16; // Min 16ms between wheel updates (~60fps)
const aboutMeTouchMoveThrottle = 32; // Min 32ms between touch updates on iOS (~30fps)
const aboutMeDesktopStartOffsetPixels = 1550; // Desktop only: pixels offset for text appearance (increase = appear sooner)

// About Me perspective settings (Star Wars-style effect)
const aboutMeTopWidthRatio = 0.3; // Width at top of screen (0.1 = very narrow, 1.0 = full width)
const aboutMeBottomWidthRatio = 1.0; // Width at bottom of screen (usually 1.0)
const aboutMeTopHeightRatio = 0.1; // Vertical compression at top (0.1 = very compressed, 1.0 = no compression)
const aboutMeTextWidthRatio = 0.6; // Base text width as ratio of background (0.6 = 60% of bg width)

// Resource management - track last use times for cleanup
let lastVideo2Use = 0;
let lastVideo3Use = 0;
let lastVideo5Use = 0;
let lastReverseVideo2Use = 0;
let video4FrameLastUse = []; // Track last use time for each frame
let lastCleanupTime = 0;
const RESOURCE_TIMEOUT = 3000; // Unload resources after 3 seconds of non-use
const CLEANUP_INTERVAL = 1000; // Run cleanup every second

function preload() {
	// Setup all videos - only load essential ones initially
	video = setupVideo('img/video.mp4', () => {
		videoLoaded = true;
	});
	
	reverseVideo = setupVideo('img/reversevideo.mp4', () => {
		reverseVideoLoaded = true;
	});
	
	// Videos 2, 3, 5 will be loaded on-demand to save memory
	video2 = null;
	reverseVideo2 = null;
	video3 = null;
	video5 = null;
	
	// Load About Me images
	aboutMeBgImg = loadImage('img/UI/about-me-bg.jpg');
	aboutMeImg = loadImage('img/UI/about-me.png', () => {
		aboutMeLoaded = true;
	});
	
	// Load sounds
	clickSound = loadSound('sound/clic.mp3');
	jingleSound = loadSound('sound/jingle.mp3');
	antijingleSound = loadSound('sound/antijingle.mp3');
	clacSound = loadSound('sound/clac.mp3');
	ticlicSound = loadSound('sound/ticlic.mp3');
	
	// Load images
	btnPressedImg = loadImage('img/btnpressed.jpg');
	lightMaskImg = loadImage('img/lightmask.png');
	backUI0Img = loadImage('img/UI/backUI0.png');
	backUIImg = loadImage('img/UI/backUI.png');
	extUI0Img = loadImage('img/UI/extUI0.png');
	extUIImg = loadImage('img/UI/extUI.png');
	btnavailImg = loadImage('img/btnavail.png');
	
	// Load UI navigation images
	for (let imgName of availableImages) {
		uiImages[imgName] = loadImage(`img/UI/${imgName}.jpg`);
	}
	
	// Load first frame animation images
	let firstFrameLoadCount = 0;
	for (let i = 0; i < 5; i++) {
		firstFrameImages[i] = loadImage(`img/firstframe/firstframe${i}.jpg`, () => {
			firstFrameLoadCount++;
			// Trigger resize when first frame loads (Android Chrome fix)
			if (firstFrameLoadCount === 1) {
				setTimeout(() => {
					let w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
					let h = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
					if (typeof resizeCanvas === 'function') {
						resizeCanvas(w, h);
						cachedDims = null;
						if (typeof applyNoSmoothing === 'function') applyNoSmoothing();
					}
				}, 100);
			}
		});
	}
	
	// Load noise images
	for (let i = 1; i <= 4; i++) {
		noiseImages[i - 1] = loadImage(`img/noise/noise${i}.png`);
	}
	
	// Load cheater animation frames
	for (let i = 0; i < CHEATER_FRAME_COUNT; i++) {
		cheaterFrames[i] = loadImage(`img/UI/cheater/cheater${i}.png`);
	}
}

function setup() {
	let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	
	// Get actual viewport dimensions (Android Chrome fix)
	let w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
	let h = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
	
	// Constrain canvas aspect ratio to 16:9 (landscape) or 9:16 (portrait)
	let constrainedDims = constrainAspectRatio(w, h);
	w = constrainedDims.width;
	h = constrainedDims.height;
	
	// Ensure dimensions are reasonable (prevent GPU issues with extreme sizes)
	w = Math.min(w, 4096);
	h = Math.min(h, 4096);
	
	console.log('Creating canvas:', w, 'x', h);
	
	// Try WEBGL with multiple fallback strategies
	let canvas;
	let rendererMode = 'WEBGL';
	
	try {
		// First attempt: WEBGL with antialias disabled
		setAttributes('antialias', false);
		canvas = createCanvas(w, h, WEBGL);
		isUsingWebGL = true;
		console.log('✓ Using WEBGL renderer (antialias off)');
	} catch (e) {
		console.warn('WebGL failed (antialias off):', e.message);
		try {
			// Second attempt: WEBGL with default attributes
			canvas = createCanvas(w, h, WEBGL);
			isUsingWebGL = true;
			console.log('✓ Using WEBGL renderer (default attributes)');
		} catch (e2) {
			console.warn('WebGL failed (default):', e2.message);
			try {
				// Final fallback: P2D mode
				canvas = createCanvas(w, h, P2D);
				rendererMode = 'P2D';
				isUsingWebGL = false;
				console.log('✓ Using P2D renderer (WebGL unavailable)');
			} catch (e3) {
				console.error('All renderers failed:', e3);
				// Show error to user
				document.body.innerHTML = '<div style="color:white;padding:40px;font-family:monospace;">Error: Unable to create canvas. Please try refreshing or use a different browser.</div>';
				throw e3;
			}
		}
	}
	
	mainCanvas = canvas;
	canvas.parent(document.body);
	canvas.style('display', 'block');
	canvas.style('position', 'fixed');
	canvas.style('top', '50%');
	canvas.style('left', '50%');
	canvas.style('transform', 'translate(-50%, -50%)');
	canvas.style('margin', '0');
	canvas.style('padding', '0');
	
	// Apply black background to body for bars
	document.body.style.backgroundColor = '#000000';
	
	applyNoSmoothing();
	
	// Optimize for iOS devices
	if (isIOS) {
		// Reduce frame rate on iOS for stability
		frameRate(20);
	} else {
		frameRate(VIDEO_FRAMERATE);
	}
	
	if (video) video.time(0);
	
	// Initialize button press timer for cheater animation
	lastButtonPressTime = millis();
	showCheaterAnimation = false;
	
	// Auto-fix mobile stretching issues
	let checkCount = 0;
	const checkResize = setInterval(() => {
		checkCount++;
		let currentW = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
		let currentH = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
		
		// Constrain aspect ratio
		let constrainedDims = constrainAspectRatio(currentW, currentH);
		currentW = constrainedDims.width;
		currentH = constrainedDims.height;
		
		// Fix if dimensions are wrong or aspect ratio is way off
		if (Math.abs(width - currentW) > 10 || Math.abs(height - currentH) > 10) {
			resizeCanvas(currentW, currentH);
			cachedDims = null;
			applyNoSmoothing();
		}
		
		// Stop checking after 3 seconds
		if (checkCount >= 15) {
			clearInterval(checkResize);
		}
	}, 200);
	
	// Prevent default touch behaviors
	document.documentElement.style.touchAction = 'none';
	document.documentElement.style.overflow = 'hidden';
	document.documentElement.style.position = 'fixed';
	document.documentElement.style.width = '100%';
	document.documentElement.style.height = '100%';
	document.documentElement.style.margin = '0';
	document.documentElement.style.padding = '0';
	
	document.body.style.touchAction = 'none';
	document.body.style.overflow = 'hidden';
	document.body.style.position = 'fixed';
	document.body.style.top = '0';
	document.body.style.left = '0';
	document.body.style.width = '100%';
	document.body.style.height = '100%';
	document.body.style.margin = '0';
	document.body.style.padding = '0';
	
	// Handle orientation changes
	window.addEventListener('orientationchange', () => {
		setTimeout(() => {
			let w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
			let h = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
			let constrainedDims = constrainAspectRatio(w, h);
			resizeCanvas(constrainedDims.width, constrainedDims.height);
			cachedDims = null;
			applyNoSmoothing();
		}, 400);
	});

	// Extra resize correction hooks (helps rare stretched boot)
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			// Pause all videos when page loses focus
			if (video && video.elt) video.pause();
			if (reverseVideo && reverseVideo.elt) reverseVideo.pause();
			if (video2 && video2.elt) video2.pause();
			if (reverseVideo2 && reverseVideo2.elt) reverseVideo2.pause();
			if (video3 && video3.elt) video3.pause();
			if (video5 && video5.elt) video5.pause();
			// Pause p5 draw loop
			noLoop();
		} else {
			// Resume when page becomes visible again
			triggerSafeResizeSoon();
			// Resume p5 draw loop
			loop();
			// Resume playing videos only if they should be playing
			if (isPlaying && video && video.elt) video.play();
			if (playingReverseVideo && reverseVideo && reverseVideo.elt) reverseVideo.play();
			if (playingVideo2 && video2 && video2.elt) video2.play();
			if (playingReverseVideo2 && reverseVideo2 && reverseVideo2.elt) reverseVideo2.play();
			if (playingVideo3 && video3 && video3.elt) video3.play();
			if (playingVideo5 && video5 && video5.elt) video5.play();
		}
	});
	const oneShotResize = () => {
		triggerSafeResizeSoon();
		window.removeEventListener('touchstart', oneShotResize);
		window.removeEventListener('mousedown', oneShotResize);
		window.removeEventListener('keydown', oneShotResize);
	};
	window.addEventListener('touchstart', oneShotResize, { passive: true });
	window.addEventListener('mousedown', oneShotResize, { passive: true });
	window.addEventListener('keydown', oneShotResize, { passive: true });
	
	// Enable audio on iOS with user interaction
	if (isIOS) {
		document.addEventListener('touchstart', function enableAudio() {
			if (clickSound && clickSound.isLoaded()) {
				clickSound.setVolume(0.01);
				clickSound.play();
				clickSound.stop();
			}
			document.removeEventListener('touchstart', enableAudio);
		}, { once: true });
	}
}


// Video and canvas constants
const VIDEO_FRAMERATE = 24;
const videoOriginalWidth = 1080;
const videoOriginalHeight = 1920;

// Button positions
const buttonOriginalX = 370;
const buttonOriginalY = 1269;
const buttonW = 40;
const buttonH = 70;

const buttonOriginalX2 = 290;
const buttonOriginalY2 = 1375;
const buttonW2 = 60;
const buttonH2 = 100;

const squareButtons = [
	{ x: 550, y: 1355, size: 70 },
	{ x: 615, y: 1355, size: 70 },
	{ x: 680, y: 1355, size: 70 },
	{ x: 745, y: 1355, size: 70 }
];

// Helper function: Setup video with iOS compatibility
function setupVideo(videoPath, onLoadCallback) {
	let vid = createVideo([videoPath], onLoadCallback);
	vid.hide();
	
	if (vid.elt) {
		let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		
		vid.elt.setAttribute('playsinline', 'true');
		vid.elt.setAttribute('webkit-playsinline', 'true');
		vid.elt.setAttribute('preload', isIOS ? 'none' : 'metadata');
		vid.elt.setAttribute('crossorigin', 'anonymous');
		vid.elt.muted = false;
		
		// Disable hardware acceleration to prevent additional WebGL context creation
		vid.elt.style.imageRendering = 'auto';
		vid.elt.style.transform = 'translateZ(0)';
		vid.elt.style.backfaceVisibility = 'hidden';
		vid.elt.style.webkitBackfaceVisibility = 'hidden';
		
		// iOS needs user interaction to enable sound
		if (isIOS) {
			vid.elt.load();
		}
		
		vid.elt.addEventListener('loadedmetadata', () => {
			onLoadCallback();
			vid.time(0);
		});
		
		vid.elt.addEventListener('loadeddata', () => {
			onLoadCallback();
			vid.time(0);
		});
		
		vid.elt.addEventListener('error', (e) => {
			console.error(`Video load error for ${videoPath}:`, e);
		});
		
		if (vid.elt.readyState >= 1) {
			onLoadCallback();
			vid.time(0);
		}
	}
	
	return vid;
}

// Helper function: Constrain aspect ratio to 16:9 or 9:16 max
function constrainAspectRatio(viewportWidth, viewportHeight) {
	const MAX_LANDSCAPE_RATIO = 16 / 9;  // 1.778
	const MAX_PORTRAIT_RATIO = 9 / 16;   // 0.5625
	
	let currentRatio = viewportWidth / viewportHeight;
	let width = viewportWidth;
	let height = viewportHeight;
	
	// Landscape mode: constrain to max 16:9
	if (currentRatio > 1) {
		if (currentRatio > MAX_LANDSCAPE_RATIO) {
			// Too wide, constrain width
			width = height * MAX_LANDSCAPE_RATIO;
		}
	}
	// Portrait mode: constrain to max 9:16
	else {
		if (currentRatio < MAX_PORTRAIT_RATIO) {
			// Too tall, constrain height
			height = width / MAX_PORTRAIT_RATIO;
		}
	}
	
	return { width: Math.round(width), height: Math.round(height) };
}

// Helper function: Load video on demand
function loadVideoOnDemand(videoPath, loadedFlag) {
	return new Promise((resolve) => {
		let vid = setupVideo(videoPath, () => {
			window[loadedFlag] = true;
			resolve(vid);
		});
	});
}

// Helper function: Calculate display dimensions for video/image
function getDisplayDimensions(sourceWidth, sourceHeight) {
	let aspect = sourceWidth / sourceHeight;
	let canvasAspect = width / height;
	let displayWidth, displayHeight, offsetX, offsetY;
	
	if (aspect > canvasAspect) {
		displayHeight = height;
		displayWidth = height * aspect;
		offsetX = (width - displayWidth) / 2;
		offsetY = 0;
	} else {
		displayWidth = width;
		displayHeight = width / aspect;
		offsetX = 0;
		offsetY = (height - displayHeight) / 2;
	}
	
	return { displayWidth, displayHeight, offsetX, offsetY };
}

// Helper function: Get button bounds for current video frame
function getButtonBounds() {
	let dims = getDisplayDimensions(video.width, video.height);
	let frame = Math.floor(video.time() * VIDEO_FRAMERATE);
	let bx, by, bw, bh;
	
	if (frame < 35) {
		bx = buttonOriginalX;
		by = buttonOriginalY;
		bw = buttonW;
		bh = buttonH;
	} else {
		bx = buttonOriginalX2;
		by = buttonOriginalY2;
		bw = buttonW2;
		bh = buttonH2;
	}
	
	let buttonX = dims.offsetX + (bx / videoOriginalWidth) * dims.displayWidth;
	let buttonY = dims.offsetY + (by / videoOriginalHeight) * dims.displayHeight;
	let buttonDisplayW = bw * (dims.displayWidth / videoOriginalWidth);
	let buttonDisplayH = bh * (dims.displayHeight / videoOriginalHeight);
	
	return { x: buttonX, y: buttonY, w: buttonDisplayW, h: buttonDisplayH, frame };
}

// Cache for dimension calculations
let cachedDims = null;
let lastCanvasSize = { w: 0, h: 0 };

// Helper: Draw random noise overlay
function drawNoise(dims) {
	if (noiseImages.length > 0) {
		let randomNoise = noiseImages[floor(random(noiseImages.length))];
		if (randomNoise) {
			blendMode(MULTIPLY);
			image(randomNoise, dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
			blendMode(BLEND);
		}
	}
}

function triggerSafeResizeSoon() {
	requestAnimationFrame(() => {
		setTimeout(() => {
			try {
				windowResized();
			} catch (e) {}
		}, 120);
	});
}

function applyNoSmoothing() {
	// p5-side (affects how p5 draws scaled images/textures)
	try { noSmooth(); } catch (e) {}
	try { forceWebGLNearestNeighbor(); } catch (e) {}

	// CSS-side: prevent browser filtering when the canvas is scaled
	const canvasEl = (mainCanvas && mainCanvas.elt) ? mainCanvas.elt : document.querySelector('canvas');
	if (!canvasEl) return;

	const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	const target = isIOS ? 'crisp-edges' : 'pixelated';
	if (canvasEl.dataset && canvasEl.dataset.noSmoothingApplied === '1' && canvasEl.dataset.imageRendering === target) {
		return;
	}
	canvasEl.style.setProperty('image-rendering', target);
	canvasEl.style.setProperty('-ms-interpolation-mode', 'nearest-neighbor');
	if (canvasEl.dataset) {
		canvasEl.dataset.noSmoothingApplied = '1';
		canvasEl.dataset.imageRendering = target;
	}
}

function forceWebGLNearestNeighbor() {
	// In WEBGL, image() uses textures. WebGL defaults to LINEAR filtering,
	// which makes UI images (like backUI.png) and frame sequences look smoothed.
	const gl = (typeof drawingContext !== 'undefined') ? drawingContext : null;
	if (!gl || typeof gl.texParameteri !== 'function') return;
	if (gl.__copilotNearestPatched) return;

	const originalTexParameteri = gl.texParameteri.bind(gl);
	gl.texParameteri = (target, pname, param) => {
		if (pname === gl.TEXTURE_MIN_FILTER || pname === gl.TEXTURE_MAG_FILTER) {
			if (param === gl.LINEAR) param = gl.NEAREST;
			else if (param === gl.LINEAR_MIPMAP_LINEAR || param === gl.LINEAR_MIPMAP_NEAREST || param === gl.NEAREST_MIPMAP_LINEAR) {
				param = gl.NEAREST_MIPMAP_NEAREST;
			}
		}
		return originalTexParameteri(target, pname, param);
	};

	gl.__copilotNearestPatched = true;
}

// Helper: Clean up unused resources to free memory
function cleanupUnusedResources() {
	let currentTime = millis();
	
	// Only run cleanup every CLEANUP_INTERVAL
	if (currentTime - lastCleanupTime < CLEANUP_INTERVAL) return;
	lastCleanupTime = currentTime;
	
	let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	
	// Determine which videos are needed for current state (to avoid premature unloading)
	let needsVideo2 = (currentUIState === 'p2' || currentUIState === 'p3') || playingVideo2;
	let needsReverseVideo2 = (currentUIState === 'p2' || currentUIState === 'p3') || playingReverseVideo2;
	let needsVideo3 = (currentUIState === 'p1' || currentUIState === 'p2') || playingVideo3;
	let needsVideo5 = (currentUIState === 'p1' || currentUIState === 'p2') || playingVideo5;
	
	// Unload video2 only if not needed and not used recently
	if (video2 && !needsVideo2 && currentTime - lastVideo2Use > RESOURCE_TIMEOUT) {
		if (video2.elt) {
			video2.elt.pause();
			video2.elt.removeAttribute('src');
			video2.remove();
		}
		video2 = null;
		video2Loaded = false;
	}
	
	// Unload reverseVideo2 only if not needed and not used recently
	if (reverseVideo2 && !needsReverseVideo2 && currentTime - lastReverseVideo2Use > RESOURCE_TIMEOUT) {
		if (reverseVideo2.elt) {
			reverseVideo2.elt.pause();
			reverseVideo2.elt.removeAttribute('src');
			reverseVideo2.remove();
		}
		reverseVideo2 = null;
		reverseVideo2Loaded = false;
	}
	
	// Unload video3 only if not needed and not used recently
	if (video3 && !needsVideo3 && currentTime - lastVideo3Use > RESOURCE_TIMEOUT) {
		if (video3.elt) {
			video3.elt.pause();
			video3.elt.removeAttribute('src');
			video3.remove();
		}
		video3 = null;
		video3Loaded = false;
	}
	
	// Unload video5 only if not needed and not used recently
	if (video5 && !needsVideo5 && currentTime - lastVideo5Use > RESOURCE_TIMEOUT) {
		if (video5.elt) {
			video5.elt.pause();
			video5.elt.removeAttribute('src');
			video5.remove();
		}
		video5 = null;
		video5Loaded = false;
	}
}

function draw() {
	// WebGL setup
	noSmooth();
	background(0);
	
	// Clean up unused resources periodically
	cleanupUnusedResources();
	
	// Reset WebGL transformations and use 2D-style coordinates
	// In WEBGL mode, origin is at center, so translate to top-left
	// In P2D mode, origin is already at top-left, so no transform needed
	push();
	if (isUsingWebGL) {
		translate(-width/2, -height/2);
	}
	
	// Cache dimensions to avoid recalculation every frame
	if (!cachedDims || lastCanvasSize.w !== width || lastCanvasSize.h !== height) {
		cachedDims = getDisplayDimensions(video.width, video.height);
		lastCanvasSize = { w: width, h: height };
	}
	let dims = cachedDims;
	
	// Fallback video load check
	if (!videoLoaded && video.width > 0 && video.elt.readyState >= 2) {
		videoLoaded = true;
		video.time(0);
	}
	
	// Render reverse video
	if (playingReverseVideo) {
		if (reverseVideoLoaded && reverseVideo && reverseVideo.elt && reverseVideo.elt.readyState >= 3) {
			image(reverseVideo, dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
			
			if (reverseVideo.time() >= reverseVideo.duration()) {
				reverseVideo.pause();
				reverseVideo.time(0);
				playingReverseVideo = false;
				video.pause();
				video.time(0);
				buttonClicked = false;
				waitingForButtonClick = true;
				// Reset cheater animation timer when returning to firstframe
				lastButtonPressTime = millis();
				showCheaterAnimation = false;
			}
		}
		// Fallback: keep showing the last available main video frame (avoid black flash)
		else if (videoLoaded && video && video.elt && video.elt.readyState >= 2) {
			image(video, dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
		}
		drawNoise(dims);
		return;
	}
	
	// Render reversevideo2
	if (playingReverseVideo2) {
		lastReverseVideo2Use = millis();
		if (reverseVideo2Loaded && reverseVideo2 && reverseVideo2.elt && reverseVideo2.elt.readyState >= 3) {
			// Video is ready, clear the transition frame
			if (reverseVideo2TransitionFrame) {
				reverseVideo2TransitionFrame.remove();
				reverseVideo2TransitionFrame = null;
			}
			
			// Calculate fresh dimensions for reverseVideo2
			let reverseVideo2Dims = getDisplayDimensions(reverseVideo2.width, reverseVideo2.height);
			image(reverseVideo2, reverseVideo2Dims.offsetX, reverseVideo2Dims.offsetY, reverseVideo2Dims.displayWidth, reverseVideo2Dims.displayHeight);
			
			if (reverseVideo2.time() >= reverseVideo2.duration()) {
				reverseVideo2.pause();
				reverseVideo2.time(0);
				playingReverseVideo2 = false;
				playingVideo2 = false;
				currentUIState = 'p3';
				showingUI = true;
			}
			drawNoise(reverseVideo2Dims);
		}
		// Fallback: show captured transition frame to prevent black flash
		else if (reverseVideo2TransitionFrame) {
			image(reverseVideo2TransitionFrame, 0, 0, width, height);
		}
		return;
	}
	
	// Render video5 (exit transition from aboutMe)
	if (playingVideo5) {
		lastVideo5Use = millis();
		if (video5Loaded && video5 && video5.elt && video5.elt.readyState >= 3) {
			// Calculate fresh dimensions for video5
			let video5Dims = getDisplayDimensions(video5.width, video5.height);
			image(video5, video5Dims.offsetX, video5Dims.offsetY, video5Dims.displayWidth, video5Dims.displayHeight);
			
			if (video5.time() >= video5.duration()) {
				video5.pause();
				video5.time(0);
				playingVideo5 = false;
				playingVideo4 = false;
				playingVideo3 = false;
				// Reset button states for UI interaction
				buttonPressed = false;
				buttonClicked = false;
				// Enter UI mode at p2 with buttons fully interactive
				currentUIState = 'p2';
				showingUI = true;
				// Ensure main video is paused
				if (video && video.elt) {
					video.pause();
					isPlaying = false;
				}
			}
			drawNoise(video5Dims);
		}
		// Fallback: keep showing the aboutMe content while video5 loads
		else {
			if (aboutMeLoaded && aboutMeBgImg && aboutMeImg) {
				// Draw background (fixed)
				let bgDims = getDisplayDimensions(aboutMeBgImg.width, aboutMeBgImg.height);
				image(aboutMeBgImg, bgDims.offsetX, bgDims.offsetY, bgDims.displayWidth, bgDims.displayHeight);
				
				// Draw scrolling text with Star Wars perspective (reuse cached buffer/calculations)
				let textWidth = bgDims.displayWidth * aboutMeTextWidthRatio;
				let textHeight = (aboutMeImg.height / aboutMeImg.width) * textWidth;
				
				let bufW = floor(bgDims.displayWidth);
				let bufH = floor(bgDims.displayHeight);
				if (!aboutMeTextBuffer || aboutMeTextBufferSize.w !== bufW || aboutMeTextBufferSize.h !== bufH) {
					if (aboutMeTextBuffer) aboutMeTextBuffer.remove();
					aboutMeTextBuffer = createGraphics(bufW, bufH);
					aboutMeTextBufferSize = { w: bufW, h: bufH };
				}
				aboutMeTextBuffer.clear();
				
				let topWidth = textWidth * aboutMeTopWidthRatio;
				let bottomWidth = textWidth * aboutMeBottomWidthRatio;
				
				// Use cached perspective calculations
				let cacheKey = `${aboutMeTopHeightRatio}-${bufH}-${ABOUTME_SLICE_COUNT}`;
				if (aboutMePerspectiveCacheKey !== cacheKey) {
					let sliceHeights = new Float32Array(ABOUTME_SLICE_COUNT);
					let sliceTs = new Float32Array(ABOUTME_SLICE_COUNT);
					let totalHeight = 0;
					
					for (let i = 0; i < ABOUTME_SLICE_COUNT; i++) {
						let t = i / (ABOUTME_SLICE_COUNT - 1);
						sliceTs[i] = t;
						let heightRatio = aboutMeTopHeightRatio + (1.0 - aboutMeTopHeightRatio) * t;
						sliceHeights[i] = heightRatio;
						totalHeight += heightRatio;
					}
					
					let scaleFactor = bufH / totalHeight;
					for (let i = 0; i < ABOUTME_SLICE_COUNT; i++) {
						sliceHeights[i] *= scaleFactor;
					}
					
					aboutMePerspectiveCache = { sliceHeights, sliceTs };
					aboutMePerspectiveCacheKey = cacheKey;
				}
				
				let { sliceHeights, sliceTs } = aboutMePerspectiveCache;
				let sourceSliceHeight = bufH / ABOUTME_SLICE_COUNT;
				let imgHeight = aboutMeImg.height;
				let imgWidth = aboutMeImg.width;
				let heightScale = imgHeight / textHeight;
				let widthDiff = bottomWidth - topWidth;
				let halfBufW = bufW / 2;
				
				aboutMeTextBuffer.push();
				aboutMeTextBuffer.imageMode(CORNER);
				
				let canvasY = 0;
				let sourceY = aboutMeScrollY;
				
				for (let i = 0; i < ABOUTME_SLICE_COUNT; i++) {
					let sliceHeight = sliceHeights[i];
					
					if (sourceY + sourceSliceHeight < 0 || sourceY > textHeight) {
						canvasY += sliceHeight;
						sourceY += sourceSliceHeight;
						continue;
					}
					
					let t = sliceTs[i];
					let currentWidth = topWidth + widthDiff * t;
					let currentX = halfBufW - currentWidth / 2;
					let sourceSliceY_pixels = sourceY * heightScale;
					let sourceSliceHeight_pixels = sourceSliceHeight * heightScale;
					
					aboutMeTextBuffer.image(
						aboutMeImg,
						currentX, canvasY, currentWidth, sliceHeight,
						0, sourceSliceY_pixels, imgWidth, sourceSliceHeight_pixels
					);
					
					canvasY += sliceHeight;
					sourceY += sourceSliceHeight;
				}
				
				aboutMeTextBuffer.pop();
				image(aboutMeTextBuffer, bgDims.offsetX, bgDims.offsetY);
			}
			drawNoise(dims);
		}
		return;
	}
	
	// Render About Me section with scrolling text
	if (playingVideo4) {
		if (aboutMeLoaded && aboutMeBgImg && aboutMeImg) {
			let currentTime = millis();
			let timeSinceScroll = currentTime - aboutMeLastScrollTime;
			
			// Draw background (fixed)
			let bgDims = getDisplayDimensions(aboutMeBgImg.width, aboutMeBgImg.height);
			image(aboutMeBgImg, bgDims.offsetX, bgDims.offsetY, bgDims.displayWidth, bgDims.displayHeight);
			
			// Calculate text dimensions based on background
			let textWidth = bgDims.displayWidth * aboutMeTextWidthRatio;
			let textHeight = (aboutMeImg.height / aboutMeImg.width) * textWidth;
			
			// Calculate max scroll: from bottom of viewport to completely scrolled off top
			// Start: -bgDims.displayHeight (text starts below screen)
			// End: textHeight (text ends above screen)
			aboutMeMaxScroll = textHeight;
			
			// Scale scroll speeds based on viewport size to maintain consistent reading speed
			// Base reference: 1000px viewport height
			let speedScale = bgDims.displayHeight / 1000;
			let scaledScrollSpeed = aboutMeScrollSpeed * speedScale;
			let scaledAutoPlaySpeed = aboutMeAutoPlaySpeed * speedScale;
			
			// Determine target velocity based on input
			if (aboutMeUpKeyHeld || aboutMeDownKeyHeld) {
				// Key held: set target velocity
				if (aboutMeUpKeyHeld) {
					aboutMeTargetVelocity = -scaledScrollSpeed * 3;
				} else if (aboutMeDownKeyHeld) {
					aboutMeTargetVelocity = scaledScrollSpeed * 3;
				}
				aboutMeLastScrollTime = currentTime;
			}
			// Auto-scroll if enough time has passed since user stopped interacting
			else if (!aboutMeIsUserInteracting && (currentTime - aboutMeLastInteractionEndTime) > aboutMeAutoPlayDelay && aboutMeScrollY < aboutMeMaxScroll) {
				aboutMeTargetVelocity = scaledAutoPlaySpeed;
			}
			else {
				// No input: gradually stop
				aboutMeTargetVelocity = 0;
			}
			
			// Reset user interaction flag after idle time and track when it ends
			if (aboutMeIsUserInteracting && timeSinceScroll > aboutMeAutoPlayDelay + 200) {
				aboutMeIsUserInteracting = false;
				aboutMeLastInteractionEndTime = currentTime; // Mark when user stopped interacting
			}
			
			// Smooth velocity towards target with easing (use higher smoothing for keys for snappier response)
			let smoothingFactor = (aboutMeUpKeyHeld || aboutMeDownKeyHeld) ? 0.25 : aboutMeVelocitySmoothing;
			aboutMeScrollVelocity = lerp(aboutMeScrollVelocity, aboutMeTargetVelocity, smoothingFactor);
			
			// Apply velocity to scroll position
			if (abs(aboutMeScrollVelocity) > 0.01) {
				aboutMeScrollY = constrain(aboutMeScrollY + aboutMeScrollVelocity, -bgDims.displayHeight, aboutMeMaxScroll);
			}
			
			// Draw scrolling text with Star Wars-style perspective distortion
			// Reuse graphics buffer to avoid per-frame allocation
			let bufW = floor(bgDims.displayWidth);
			let bufH = floor(bgDims.displayHeight);
			if (!aboutMeTextBuffer || aboutMeTextBufferSize.w !== bufW || aboutMeTextBufferSize.h !== bufH) {
				if (aboutMeTextBuffer) aboutMeTextBuffer.remove();
				aboutMeTextBuffer = createGraphics(bufW, bufH);
				aboutMeTextBufferSize = { w: bufW, h: bufH };
			}
			aboutMeTextBuffer.clear(); // Clear instead of recreating
			
			// Calculate perspective widths using configured ratios
			let topWidth = textWidth * aboutMeTopWidthRatio;
			let bottomWidth = textWidth * aboutMeBottomWidthRatio;
			
			// Cache key for perspective calculations (invalidate when settings change)
			let cacheKey = `${aboutMeTopHeightRatio}-${bufH}-${ABOUTME_SLICE_COUNT}`;
			
			// Pre-calculate slice heights only when parameters change
			if (aboutMePerspectiveCacheKey !== cacheKey) {
				let sliceHeights = new Float32Array(ABOUTME_SLICE_COUNT);
				let sliceTs = new Float32Array(ABOUTME_SLICE_COUNT);
				let totalHeight = 0;
				
				for (let i = 0; i < ABOUTME_SLICE_COUNT; i++) {
					let t = i / (ABOUTME_SLICE_COUNT - 1);
					sliceTs[i] = t;
					let heightRatio = aboutMeTopHeightRatio + (1.0 - aboutMeTopHeightRatio) * t; // Inline lerp
					sliceHeights[i] = heightRatio;
					totalHeight += heightRatio;
				}
				
				let scaleFactor = bufH / totalHeight;
				for (let i = 0; i < ABOUTME_SLICE_COUNT; i++) {
					sliceHeights[i] *= scaleFactor;
				}
				
				aboutMePerspectiveCache = { sliceHeights, sliceTs };
				aboutMePerspectiveCacheKey = cacheKey;
			}
			
			let { sliceHeights, sliceTs } = aboutMePerspectiveCache;
			let sourceSliceHeight = bufH / ABOUTME_SLICE_COUNT;
			let imgHeight = aboutMeImg.height;
			let imgWidth = aboutMeImg.width;
			let heightScale = imgHeight / textHeight;
			let widthDiff = bottomWidth - topWidth;
			let halfBufW = bufW / 2;
			
			aboutMeTextBuffer.push();
			aboutMeTextBuffer.imageMode(CORNER);
			
			let canvasY = 0;
			let sourceY = aboutMeScrollY;
			
			for (let i = 0; i < ABOUTME_SLICE_COUNT; i++) {
				let sliceHeight = sliceHeights[i];
				
				// Skip if completely outside source image bounds
				if (sourceY + sourceSliceHeight < 0 || sourceY > textHeight) {
					canvasY += sliceHeight;
					sourceY += sourceSliceHeight;
					continue;
				}
				
				// Clip partial slices at top/bottom to avoid stretching
				let clippedSourceY = max(0, sourceY);
				let clippedSourceEndY = min(textHeight, sourceY + sourceSliceHeight);
				let clippedSourceHeight = clippedSourceEndY - clippedSourceY;
				
				// Skip if no visible content after clipping
				if (clippedSourceHeight <= 0) {
					canvasY += sliceHeight;
					sourceY += sourceSliceHeight;
					continue;
				}
				
				// Calculate proportional destination height (avoid stretching)
				let sourceRatio = clippedSourceHeight / sourceSliceHeight;
				let clippedSliceHeight = sliceHeight * sourceRatio;
				let canvasYOffset = (sourceY < 0) ? sliceHeight * (-sourceY / sourceSliceHeight) : 0;
				
				let t = sliceTs[i];
				let currentWidth = topWidth + widthDiff * t; // Inline lerp
				let currentX = halfBufW - currentWidth / 2;
				
				// Convert to image pixel coordinates (inline calculations)
				let sourceSliceY_pixels = clippedSourceY * heightScale;
				let sourceSliceHeight_pixels = clippedSourceHeight * heightScale;
				
				aboutMeTextBuffer.image(
					aboutMeImg,
					currentX, canvasY + canvasYOffset, currentWidth, clippedSliceHeight,
					0, sourceSliceY_pixels, imgWidth, sourceSliceHeight_pixels
				);
				
				canvasY += sliceHeight;
				sourceY += sourceSliceHeight;
			}
			
			aboutMeTextBuffer.pop();
			
			// Draw buffer to main canvas
			image(aboutMeTextBuffer, bgDims.offsetX, bgDims.offsetY);
			
			// Draw back button while aboutMe is playing (but not when video5 is playing)
			if (!playingVideo5 && backUI0Img && backUIImg) {
				let smallestSide = min(width, height);
				let btnSize = smallestSide / 5;
				let btnX = width - btnSize - 30;
				let btnY = height - btnSize - 90;
				
				let isHovered = mouseX >= btnX && mouseX <= btnX + btnSize &&
				                mouseY >= btnY && mouseY <= btnY + btnSize;
				
				document.body.style.cursor = isHovered ? 'pointer' : 'default';
				image(isHovered ? backUIImg : backUI0Img, btnX, btnY, btnSize, btnSize);
			}
			
			drawNoise(bgDims);
		}
		return;
	}
	
	// Render video3 (entrance transition to aboutMe section)
	if (playingVideo3) {
		lastVideo3Use = millis();
		if (video3Loaded && video3 && video3.elt && video3.elt.readyState >= 3) {
			// Calculate fresh dimensions for video3
			let video3Dims = getDisplayDimensions(video3.width, video3.height);
			image(video3, video3Dims.offsetX, video3Dims.offsetY, video3Dims.displayWidth, video3Dims.displayHeight);
			
			if (video3.time() >= video3.duration()) {
				video3.pause();
				video3.time(video3.duration());
				playingVideo3 = false;
				// Start aboutMe section (ready for scroll control)
				if (aboutMeLoaded) {
					playingVideo4 = true;
					// Start with text just below viewport
					// Use bgDims for sizing since everything is scaled to background
					let bgDims = getDisplayDimensions(aboutMeBgImg.width, aboutMeBgImg.height);
					aboutMeScrollY = -bgDims.displayHeight;
					aboutMeLastAutoPlayTime = millis();
					aboutMeLastScrollTime = 0;
					aboutMeLastInteractionEndTime = millis(); // Start auto-play timer from beginning
				}
			}
			drawNoise(video3Dims);
		}
		// Fallback: keep showing UI until video3 is ready
		else if (showingUI && uiImages[currentUIState]) {
			let img = uiImages[currentUIState];
			let uiDims = getDisplayDimensions(img.width, img.height);
			image(img, uiDims.offsetX, uiDims.offsetY, uiDims.displayWidth, uiDims.displayHeight);
			drawNoise(uiDims);
		}
		return;
	}
	
	// Render video2 with back button
	if (playingVideo2) {
		lastVideo2Use = millis();
		if (video2Loaded && video2 && video2.elt && video2.elt.readyState >= 3) {
			// Video is ready, clear the transition frame
			if (video2TransitionFrame) {
				video2TransitionFrame.remove();
				video2TransitionFrame = null;
			}
			
			// Calculate fresh dimensions for video2
			let video2Dims = getDisplayDimensions(video2.width, video2.height);
			
			// Check if video is frozen at the end
			let isVideoFrozen = video2.time() >= video2.duration() - 0.1;
			
			// Enable smooth rendering when frozen on iOS to preserve text legibility
			let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
			if (isVideoFrozen && isIOS) {
				const canvasEl = (mainCanvas && mainCanvas.elt) ? mainCanvas.elt : document.querySelector('canvas');
				if (canvasEl) {
					canvasEl.style.setProperty('image-rendering', 'auto');
				}
			}
			
			// Render video2
			image(video2, video2Dims.offsetX, video2Dims.offsetY, video2Dims.displayWidth, video2Dims.displayHeight);
			
			// Re-apply pixelation after rendering if needed
			if (isVideoFrozen && isIOS) {
				applyNoSmoothing();
			}
			
			// Ensure video is paused at end (iPad fix)
			if (isVideoFrozen) {
				video2.pause();
				video2.time(video2.duration());
			}
		}
		// Fallback: show captured transition frame to prevent black flash
		else if (video2TransitionFrame) {
			image(video2TransitionFrame, 0, 0, width, height);
		}
		
		// Draw back button when video2 is at the end (but not when reverseVideo2 is playing)
		if (video2.time() >= video2.duration() - 0.1 && !playingReverseVideo2 && backUI0Img && backUIImg) {
			let smallestSide = min(width, height);
			let btnSize = smallestSide / 5;
			let btnX = width - btnSize - 30;
			let btnY = height - btnSize - 40;
			
			let isHovered = mouseX >= btnX && mouseX <= btnX + btnSize &&
			                mouseY >= btnY && mouseY <= btnY + btnSize;
			
			document.body.style.cursor = isHovered ? 'pointer' : 'default';
			image(isHovered ? backUIImg : backUI0Img, btnX, btnY, btnSize, btnSize);
		}
		
		if (video2Loaded && video2) {
			let video2Dims = getDisplayDimensions(video2.width, video2.height);
			drawNoise(video2Dims);
		}
		return;
	}
	
	// Render UI mode
	if (showingUI && uiImages[currentUIState]) {
		let img = uiImages[currentUIState];
		let uiDims = getDisplayDimensions(img.width, img.height);
		
		image(img, uiDims.offsetX, uiDims.offsetY, uiDims.displayWidth, uiDims.displayHeight);
		
		// Preload videos when user is in p1 or p2 state (before they need them)
		if (currentUIState === 'p1' || currentUIState === 'p2') {
			if (!video3 && !video3Loaded) {
				video3 = setupVideo('img/video3.mp4', () => { video3Loaded = true; });
				lastVideo3Use = millis();
			}
			if (!video5 && !video5Loaded) {
				video5 = setupVideo('img/video5.mp4', () => { video5Loaded = true; });
				lastVideo5Use = millis();
			}
		}
		if (currentUIState === 'p2' || currentUIState === 'p3') {
			if (!video2 && !video2Loaded) {
				video2 = setupVideo('img/video2.mp4', () => { video2Loaded = true; });
				lastVideo2Use = millis();
			}
			if (!reverseVideo2 && !reverseVideo2Loaded) {
				reverseVideo2 = setupVideo('img/reversevideo2.mp4', () => { reverseVideo2Loaded = true; });
				lastReverseVideo2Use = millis();
			}
		}
		
		// Render button press effects in UI mode
		if (buttonPressed) {
			renderButtonPressEffect(uiDims, true);
		}
		
		// Check cursor state for UI buttons
		let cursorOverUIButton = false;
		
		// Draw external link button if link is defined for current state
		const currentLink = navigationMap[currentUIState]?.link;
		if (currentLink && extUI0Img && extUIImg) {
			let smallestSide = min(width, height);
			let btnSize = smallestSide / 5;
			let btnX = 30; // Bottom left corner
			let btnY = height - btnSize - 40;
			
			let isHovered = mouseX >= btnX && mouseX <= btnX + btnSize &&
			                mouseY >= btnY && mouseY <= btnY + btnSize;
			
			if (isHovered) {
				cursorOverUIButton = true;
			}
			image(isHovered ? extUIImg : extUI0Img, btnX, btnY, btnSize, btnSize);
		}
		
		// Check if cursor is over arrow buttons
		let scaleFactor = uiDims.displayWidth / videoOriginalWidth;
		for (let btn of squareButtons) {
			let btnX = uiDims.offsetX + (btn.x / videoOriginalWidth) * uiDims.displayWidth;
			let btnY = uiDims.offsetY + (btn.y / videoOriginalHeight) * uiDims.displayHeight;
			let btnSize = btn.size * scaleFactor;
			if (mouseX >= btnX && mouseX <= btnX + btnSize &&
			    mouseY >= btnY && mouseY <= btnY + btnSize) {
				cursorOverUIButton = true;
				break;
			}
		}
		
		// Set cursor based on hover state
		document.body.style.cursor = cursorOverUIButton ? 'pointer' : 'default';
		
		// Draw btnavail indicators for available navigation directions
		if (btnavailImg) {
			let navData = navigationMap[currentUIState];
			if (navData) {
				// Map directions to button indices: 0=down, 1=left, 2=up, 3=right
				let directionMap = [
					{ key: 'down', index: 0 },
					{ key: 'left', index: 1 },
					{ key: 'up', index: 2 },
					{ key: 'right', index: 3 }
				];
				
				// Apply brightening effect
				if (isUsingWebGL) {
					// In WEBGL: use custom blend function for additive blending (lighten effect)
					drawingContext.blendFunc(drawingContext.SRC_ALPHA, drawingContext.ONE);
				} else {
					// In P2D: use ADD blend mode
					blendMode(ADD);
				}
				
				for (let dir of directionMap) {
					if (navData[dir.key]) {
						let btn = squareButtons[dir.index];
						let btnX = uiDims.offsetX + (btn.x / videoOriginalWidth) * uiDims.displayWidth;
						let btnY = uiDims.offsetY + (btn.y / videoOriginalHeight) * uiDims.displayHeight;
						let btnSize = btn.size * scaleFactor;
						image(btnavailImg, btnX, btnY, btnSize, btnSize);
					}
				}
				
				// Reset blend mode
				if (isUsingWebGL) {
					// Reset to default WEBGL blend function
					drawingContext.blendFunc(drawingContext.SRC_ALPHA, drawingContext.ONE_MINUS_SRC_ALPHA);
				} else {
					blendMode(BLEND);
				}
			}
		}
		
		// Render arrow button press effects
		renderArrowButtonEffects(uiDims);
		
		drawNoise(uiDims);
		return;
	}
	
	// Show loading if video not ready
	if (!videoLoaded) {
		push();
		fill(255);
		textAlign(CENTER, CENTER);
		textSize(16);
		text("Loading...", 0, 0); // WebGL center
		pop();
		drawNoise(dims);
		pop(); // Close main transformation
		return;
	}
	
	image(video, dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
	
	// Render first frame animation
	if (waitingForButtonClick) {
		let now = millis();
		if (now - lastFirstFrameChange >= firstFrameInterval) {
			currentFirstFrame = (currentFirstFrame + 1) % 5;
			lastFirstFrameChange = now;
		}
		
		if (firstFrameImages[currentFirstFrame]) {
			image(firstFrameImages[currentFirstFrame], dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
		}
		
		
		if (buttonPressed && btnPressedImg) {
			image(btnPressedImg, dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
		}
		
		// Check for inactivity and show cheater animation
		if (now - lastButtonPressTime >= CHEATER_INACTIVITY_DELAY) {
			showCheaterAnimation = true;
		}
		
		// Render cheater animation (only shows after inactivity, stops when button clicked)
		if (showCheaterAnimation && !buttonPressed) {
			if (now - cheaterLastFrameChange >= cheaterFrameInterval) {
				cheaterCurrentFrame = (cheaterCurrentFrame + 1) % CHEATER_FRAME_COUNT;
				cheaterLastFrameChange = now;
			}
			
			if (cheaterFrames[cheaterCurrentFrame]) {
				let bounds = getButtonBounds();
				// Scale offsets proportionally to match video scaling
				let scaleFactor = dims.displayWidth / videoOriginalWidth;
				let cheaterWidth = bounds.w * CHEATER_SCALE;
				let cheaterHeight = bounds.h * CHEATER_SCALE;
				let cheaterX = bounds.x + (CHEATER_OFFSET_X * scaleFactor);
				let cheaterY = bounds.y + (CHEATER_OFFSET_Y * scaleFactor);
				image(cheaterFrames[cheaterCurrentFrame], cheaterX, cheaterY, cheaterWidth, cheaterHeight);
			}
		}
		
		let bounds = getButtonBounds();
		document.body.style.cursor = (mouseX >= bounds.x && mouseX <= bounds.x + bounds.w &&
		                              mouseY >= bounds.y && mouseY <= bounds.y + bounds.h) ? 'pointer' : 'default';
		drawNoise(dims);
		return;
	}
	
	// Handle video playback - cache bounds calculation
	let bounds = getButtonBounds();
	let buttonMoved = bounds.frame >= 35;
	
	// Update cursor
	updateCursor(bounds, buttonMoved, dims);
	
	
	// Check if video ended
	if (isPlaying && video.time() >= video.duration()) {
		video.pause();
		video.time(video.duration());
		isPlaying = false;
		reverseVideo.pause();
		currentUIState = 'p0';
		showingUI = true;
	}
	
	// Reset buttonClicked when button moves
	if (buttonMoved && buttonClicked) {
		buttonClicked = false;
	}
	
	// Render button press effects
	if (buttonPressed) {
		renderButtonPressEffect(dims, buttonMoved);
	}
	
	// Render arrow button effects
	if (buttonMoved) {
		renderArrowButtonEffects(dims);
	}
	
	drawNoise(dims);
	pop(); // Close WebGL transformation
}

// Helper: Update cursor based on button/arrow hover
function updateCursor(bounds, buttonMoved, dims) {
	// Force default cursor during transition videos
	if (playingReverseVideo || playingReverseVideo2 || playingVideo3 || playingVideo4 || playingVideo5) {
		document.body.style.cursor = 'default';
		return;
	}
	
	let arrowHovered = false;
	
	if (buttonMoved) {
		let scaleFactor = dims.displayWidth / videoOriginalWidth;
		for (let btn of squareButtons) {
			let btnX = dims.offsetX + (btn.x / videoOriginalWidth) * dims.displayWidth;
			let btnY = dims.offsetY + (btn.y / videoOriginalHeight) * dims.displayHeight;
			let btnSize = btn.size * scaleFactor;
			if (mouseX >= btnX && mouseX <= btnX + btnSize &&
			    mouseY >= btnY && mouseY <= btnY + btnSize) {
				arrowHovered = true;
				break;
			}
		}
	}
	
	let onButton = (!buttonClicked || buttonMoved) && isInsideButton(mouseX, mouseY);
	document.body.style.cursor = (onButton || arrowHovered) ? 'pointer' : 'default';
}

// Helper: Render button press effects
function renderButtonPressEffect(dims, buttonMoved) {
	if (!lightMaskImg) return;
	
	if (buttonMoved) {
		let scaleX = dims.displayWidth / videoOriginalWidth;
		let scaleY = dims.displayHeight / videoOriginalHeight;
		let buttonX = dims.offsetX + (buttonOriginalX2 * scaleX);
		let buttonY = dims.offsetY + (buttonOriginalY2 * scaleY);
		let buttonDisplayW = buttonW2 * scaleX;
		let buttonDisplayH = buttonH2 * scaleY;
		let maskOffsetX = 12 * scaleX;
		let maskOffsetY = 23 * scaleY;
		let maskExtraW = 20 * scaleX;
		let maskExtraH = 39 * scaleY;
		image(lightMaskImg, buttonX - maskOffsetX, buttonY - maskOffsetY, 
		      buttonDisplayW + maskExtraW, buttonDisplayH + maskExtraH);
	} else if (btnPressedImg) {
		image(btnPressedImg, dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
	}
}

// Helper: Render arrow button press effects
function renderArrowButtonEffects(dims) {
	if (!lightMaskImg) return;
	
	let scaleFactor = dims.displayWidth / videoOriginalWidth;
	let maskInset = 10 * scaleFactor;
	
	for (let i = 0; i < squareButtons.length; i++) {
		let btn = squareButtons[i];
		let btnX = dims.offsetX + (btn.x / videoOriginalWidth) * dims.displayWidth;
		let btnY = dims.offsetY + (btn.y / videoOriginalHeight) * dims.displayHeight;
		let btnSize = btn.size * scaleFactor;
		
		let pressed = false;
		
		// Check keyboard press
		if (keyboardArrowPressed === i) {
			pressed = true;
		}
		
		// Check mouse press
		if (!pressed && mouseIsPressed && mouseButton === LEFT &&
		    mouseX >= btnX && mouseX <= btnX + btnSize &&
		    mouseY >= btnY && mouseY <= btnY + btnSize) {
			pressed = true;
		}
		
		// Check touch press
		if (!pressed && touches && touches.length > 0) {
			for (let t of touches) {
				if (t.x >= btnX && t.x <= btnX + btnSize &&
				    t.y >= btnY && t.y <= btnY + btnSize) {
					pressed = true;
					break;
				}
			}
		}
		
		if (pressed) {
			image(lightMaskImg, btnX + maskInset, btnY + maskInset, 
			      btnSize - (maskInset * 2), btnSize - (maskInset * 2));
		}
	}
}

// Helper: Check if point is inside button
function isInsideButton(px, py) {
	let bounds = getButtonBounds();
	let frame = bounds.frame;
	
	if (frame < 35 && buttonClicked) return false;
	
	return (px >= bounds.x && px <= bounds.x + bounds.w &&
	        py >= bounds.y && py <= bounds.y + bounds.h);
}

// Helper: Check if point is inside arrow button (returns index or -1)
function isInsideArrowButton(px, py) {
	let dims = getDisplayDimensions(video.width, video.height);
	let scaleFactor = dims.displayWidth / videoOriginalWidth;
	
	for (let i = 0; i < squareButtons.length; i++) {
		let btn = squareButtons[i];
		let btnX = dims.offsetX + (btn.x / videoOriginalWidth) * dims.displayWidth;
		let btnY = dims.offsetY + (btn.y / videoOriginalHeight) * dims.displayHeight;
		let btnSize = btn.size * scaleFactor;
		
		if (px >= btnX && px <= btnX + btnSize &&
		    py >= btnY && py <= btnY + btnSize) {
			return i;
		}
	}
	return -1;
}

function playClickSound() {
	if (clickSound && clickSound.isLoaded()) {
		clickSound.rate(random(0.95, 1.05));
		clickSound.play();
	}
}

// Helper: Play sound with volume control
function playSound(sound, volume = 0.2, rate = 1) {
	if (sound && sound.isLoaded()) {
		// Stop and reset to prevent overlap/crackling
		if (sound.isPlaying()) {
			sound.stop();
		}
		sound.setVolume(volume);
		sound.rate(rate);
		// Small delay on iOS to prevent crackling
		let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
		if (isIOS) {
			setTimeout(() => {
				if (sound && sound.isLoaded()) sound.play();
			}, 10);
		} else {
			sound.play();
		}
	}
}

// Helper: Stop sound
function stopSound(sound) {
	if (sound && sound.isLoaded()) {
		sound.stop();
	}
}

// Navigation functions
// Navigation map: define where each state goes for each direction
// Format: 'state': { up: 'targetState', down: 'targetState', left: 'targetState', right: 'targetState', link: 'https://example.com' }
// Use null or omit direction if it shouldn't change state
// Use 'VIDEO_3' or 'VIDEO_2' for special video transitions
// Add 'link' property to show external link button (opens in new tab)
const navigationMap = {
	'p0': { right: 'p1' },
	'p1': { left: 'p0', down: 'p2', right: 'p11' },
	'p2': { left: 'p0', up: 'p1', down: 'p3', right: 'VIDEO_3' },
	'p3': { left: 'p0', up: 'p2', right: 'VIDEO_2' },
	'p11': { left: 'p1', down: 'p12', right: 'p111', link: 'https://github.com/godjdko/portfolio26' },
	'p111': { left: 'p11', right: 'p112',  link: 'https://github.com/godjdko/portfolio26' },
	'p112': { left: 'p111', link: 'https://github.com/godjdko/portfolio26' },
	'p12': { left: 'p1',up: 'p11', down: 'p13', right: 'p121'},
	'p121': { left: 'p12', right: 'p122', link: 'https://en.wikipedia.org/wiki/Slow-scan_television#:~:text=Slow%2Dscan%20television%20(SSTV),reports%2C%20and%20amateur%20radio%20jargon' },
	'p122': { left: 'p121', link: 'https://www.youtube.com/watch?v=Vs3sSkjodmA&list=PLV2G_btnPZBsOsBFaB-murpPUUTB9IFef' },
	'p13': { left: 'p1', up: 'p12', down: 'p14',link: 'https://youtu.be/J8ULWEFgQmM?si=fgZuFVlBXw3WUzIR' },
	'p14': { left: 'p1', up: 'p13', down: 'p15'},
	'p15': { left: 'p1', up: 'p14', down: 'p16', link:'https://on.soundcloud.com/ckvNclWOCaTuxfjfnP'},
	'p16': { left: 'p1', up: 'p15', down: 'p17', link:'https://enzocetera.com/p5soundtests' },
	'p17': { left: 'p1', up: 'p16', down: 'p18', link:'https://youtu.be/wUkiri7TbtA?si=6wfRIt5k7Uo9SQ9R'},
	'p18': { left: 'p1', up: 'p17' , down: 'p19', link:'https://1drv.ms/f/c/8323e91841700ff4/IgDLr6ARuH8oSbIUXprhHjBeAQUrmS7qpjL-8xaTE3yC--M?e=KHroDI'},
	'p19': { left: 'p1', up: 'p18', link:'https://youtu.be/FpWlpK8DhlE?si=B0D7SLIsgjkdn3PA'},


	};







function navigateLeft() {
	const target = navigationMap[currentUIState]?.left;
	if (target && availableImages.includes(target)) {
		currentUIState = target;
	}
}

function navigateRight() {
	const target = navigationMap[currentUIState]?.right;
	
	// Handle special video transitions
	if (target === 'VIDEO_3') {
		showingUI = false;
		if (!video3) {
			video3 = setupVideo('img/video3.mp4', () => { video3Loaded = true; });
			lastVideo3Use = millis();
		}
		if (!video5) {
			video5 = setupVideo('img/video5.mp4', () => { video5Loaded = true; });
			lastVideo5Use = millis();
		}
		if (video3Loaded && video3) {
			video3.time(0);
			video3.play();
			playingVideo3 = true;
			lastVideo3Use = millis();
			cachedDims = null;
		}
		return;
	}
	
	if (target === 'VIDEO_2') {
		showingUI = false;
		
		// Capture current UI frame to prevent black flash during loading
		if (uiImages[currentUIState]) {
			let img = uiImages[currentUIState];
			let captureDims = getDisplayDimensions(img.width, img.height);
			let captureGraphics = createGraphics(width, height);
			captureGraphics.background(0);
			captureGraphics.image(img, captureDims.offsetX, captureDims.offsetY, captureDims.displayWidth, captureDims.displayHeight);
			video2TransitionFrame = captureGraphics;
		}
		
		if (!video2) {
			video2 = setupVideo('img/video2.mp4', () => { video2Loaded = true; });
			lastVideo2Use = millis();
		}
		if (!reverseVideo2) {
			reverseVideo2 = setupVideo('img/reversevideo2.mp4', () => { reverseVideo2Loaded = true; });
			lastReverseVideo2Use = millis();
		}
		if (video2Loaded && video2) {
			video2.time(0);
			video2.play();
			playingVideo2 = true;
			lastVideo2Use = millis();
			cachedDims = null;
		}
		return;
	}
	
	if (target && availableImages.includes(target)) {
		currentUIState = target;
	}
}

function navigateDown() {
	const target = navigationMap[currentUIState]?.down;
	if (target && availableImages.includes(target)) {
		currentUIState = target;
	}
}

function navigateUp() {
	const target = navigationMap[currentUIState]?.up;
	if (target && availableImages.includes(target)) {
		currentUIState = target;
	}
}

// Helper: Handle back button click
function handleBackButtonClick(x, y) {
	// Check external link button in UI mode
	if (showingUI) {
		const currentLink = navigationMap[currentUIState]?.link;
		if (currentLink && extUI0Img && extUIImg) {
			let smallestSide = min(width, height);
			let btnSize = smallestSide / 5;
			let btnX = 30; // Bottom left
			let btnY = height - btnSize - 90;
			
			if (x >= btnX && x <= btnX + btnSize && y >= btnY && y <= btnY + btnSize) {
				playSound(ticlicSound, 0.4);
				
				// iOS-friendly link opening with confirmation
				let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
				if (isIOS) {
					// Use confirm dialog to ensure user action, then navigate
					if (confirm('Open link in new tab?\n\n' + currentLink)) {
						// Try window.open first
						let newWindow = window.open(currentLink, '_blank');
						// Fallback: direct navigation if popup blocked
						if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
							window.location.href = currentLink;
						}
					}
				} else {
					// Standard browser behavior
					let newWindow = window.open(currentLink, '_blank');
					// Fallback if blocked
					if (!newWindow) {
						window.location.href = currentLink;
					}
				}
				return true;
			}
		}
	}
	
	// Check video2 back button (iPad timing fix)
	if (playingVideo2 && video2.time() >= video2.duration() - 0.1) {
		let smallestSide = min(width, height);
		let btnSize = smallestSide / 5;
		let btnX = width - btnSize - 30;
		let btnY = height - btnSize - 90;
		
		if (x >= btnX && x <= btnX + btnSize && y >= btnY && y <= btnY + btnSize) {
			playSound(ticlicSound, 0.4);
			document.body.style.cursor = 'default';
			
			// Capture current video2 frame to prevent black flash during loading
			if (video2 && video2.elt && video2.elt.readyState >= 2) {
				let video2Dims = getDisplayDimensions(video2.width, video2.height);
				let captureGraphics = createGraphics(width, height);
				captureGraphics.background(0);
				captureGraphics.image(video2, video2Dims.offsetX, video2Dims.offsetY, video2Dims.displayWidth, video2Dims.displayHeight);
				reverseVideo2TransitionFrame = captureGraphics;
			}
			
			if (reverseVideo2Loaded && reverseVideo2) {
				reverseVideo2.time(0);
				reverseVideo2.play();
				playingReverseVideo2 = true;
				cachedDims = null; // Clear cache for reverseVideo2 dimensions
			}
			return true;
		}
	}
	
	// Check video4 back button (frame-based)
	if (playingVideo4) {
		let smallestSide = min(width, height);
		let btnSize = smallestSide / 5;
		let btnX = width - btnSize - 30;
		let btnY = height - btnSize - 90;
		
		if (x >= btnX && x <= btnX + btnSize && y >= btnY && y <= btnY + btnSize) {
			playSound(ticlicSound, 0.4);
			document.body.style.cursor = 'default';
			if (video5Loaded && video5) {
				video5.time(0);
				video5.play();
				playingVideo5 = true;
				cachedDims = null; // Clear cache for video5 dimensions
			}
			return true;
		}
	}
	
	return false;
}

// Helper: Handle button press start
function handleButtonPressStart(x, y) {
	// Check cooldown to prevent spam/double clicks
	let currentTime = millis();
	if (currentTime - lastButtonClickTime < BUTTON_CLICK_COOLDOWN) {
		return;
	}
	
	if (handleBackButtonClick(x, y)) {
		lastButtonClickTime = currentTime;
		return;
	}
	
	// Don't allow button press when transition videos are playing
	if (playingReverseVideo || playingReverseVideo2 || playingVideo2 || playingVideo3 || playingVideo5) return;
	
	// Don't allow main button press during video4 (only back button works)
	if (playingVideo4) return;
	
	// Check if big button should be clickable (firstframe mode or frame 35+)
	let currentFrame = Math.floor(video.time() * VIDEO_FRAMERATE);
	let canPressButton = waitingForButtonClick || currentFrame >= 35;
	
	if (canPressButton && isInsideButton(x, y)) {
		playClickSound();
		// Reset cheater animation timer when button is pressed
		lastButtonPressTime = currentTime;
		showCheaterAnimation = false;
		buttonPressed = true;
		lastButtonClickTime = currentTime;
	}
	
	// Handle arrow button press (only when not in video2)
	if (!playingVideo2) {
		let bounds = getButtonBounds();
		if (bounds.frame >= 35) {
			let arrowIdx = isInsideArrowButton(x, y);
			if (arrowIdx !== -1) {
				playSound(ticlicSound, 0.4, 1.3);
			}
		}
	}
}

// Helper: Handle button release
function handleButtonRelease(x, y) {
	// Check cooldown to prevent spam/double clicks
	let currentTime = millis();
	if (currentTime - lastButtonClickTime < BUTTON_CLICK_COOLDOWN) {
		buttonPressed = false;
		return;
	}
	
	// Don't allow button release during transition videos
	if (playingReverseVideo || playingReverseVideo2 || playingVideo3 || playingVideo4 || playingVideo5) {
		buttonPressed = false;
		return;
	}
	
	if (!buttonPressed) {
		return;
	}
	
	// Play clac sound when button is released
	playSound(clacSound);
	clacSound.setVolume(1.3);
	
	// Check if release is inside button area
	if (!isInsideButton(x, y)) {
		buttonPressed = false;
		return;
	}
	
	lastButtonClickTime = currentTime; // Update cooldown timer
	
	// Starting from first frame state
	if (waitingForButtonClick) {
		playSound(jingleSound);
		stopSound(antijingleSound);
		reverseVideo.pause();
		video.play();
		isPlaying = true;
		waitingForButtonClick = false;
		buttonPressed = false;
		// Reset cheater animation for when we return to firstframe
		lastButtonPressTime = currentTime;
		showCheaterAnimation = false;
		return;
	}
	
	// Exiting UI mode
	if (showingUI) {
		showingUI = false;
		playSound(antijingleSound);
		stopSound(jingleSound);
		video.pause();
		isPlaying = false;
		if (reverseVideoLoaded && reverseVideo) {
			reverseVideo.time(0);
			reverseVideo.play();
			playingReverseVideo = true;
		}
		buttonPressed = false;
		return;
	}
	
	// During video playback
	let bounds = getButtonBounds();
	if (bounds.frame < 35 && !buttonClicked) {
		if (!isPlaying && !playingReverseVideo) {
			playSound(jingleSound);
			stopSound(antijingleSound);
			reverseVideo.pause();
			video.stop();
			video.play();
			isPlaying = true;
			buttonClicked = true;
		}
	} else {
		playSound(antijingleSound);
		stopSound(jingleSound);
		video.pause();
		isPlaying = false;
		if (reverseVideoLoaded && reverseVideo) {
			reverseVideo.time(0);
			reverseVideo.play();
			playingReverseVideo = true;
		}
	}
	
	buttonPressed = false;
}

// Helper: Handle arrow button navigation
function handleArrowNavigation(x, y) {
	// Don't allow arrow navigation during transition videos or video2
	if (playingReverseVideo || playingReverseVideo2 || playingVideo2 || playingVideo3 || playingVideo4 || playingVideo5) return;
	
	let bounds = getButtonBounds();
	if (bounds.frame < 30) return;
	
	let arrowIdx = isInsideArrowButton(x, y);
	if (arrowIdx !== -1) {
		// Check cooldown to prevent spam/double clicks (only at release)
		let currentTime = millis();
		if (currentTime - lastArrowClickTime < BUTTON_CLICK_COOLDOWN) {
			return;
		}
		
		// Always play release sound
		playSound(ticlicSound, 0.4, 0.8);
		
		// Update cooldown timer after release
		lastArrowClickTime = currentTime;
		
		// Only navigate if we're in UI mode (video has ended)
		if (showingUI) {
			const navFunctions = [navigateDown, navigateLeft, navigateUp, navigateRight];
			navFunctions[arrowIdx]();
		}
	}
}

function mousePressed() {
	// Request fullscreen on mobile on first interaction
	if (!fullscreenRequested && /iPad|iPhone|iPod|Android/i.test(navigator.userAgent)) {
		requestFullscreen();
	}
	
	if (playingVideo4) {
		aboutMeIsUserInteracting = true;
		aboutMeLastScrollTime = millis();
	}
	handleButtonPressStart(mouseX, mouseY);
}

function mouseReleased() {
	if (playingVideo4) {
		aboutMeIsUserInteracting = false;
		aboutMeLastScrollTime = millis();
	}
	handleButtonRelease(mouseX, mouseY);
	handleArrowNavigation(mouseX, mouseY);
}

function mouseWheel(event) {
	// Handle aboutMe scrolling with throttling
	if (playingVideo4 && aboutMeLoaded) {
		let currentTime = millis();
		if (currentTime - aboutMeLastWheelTime < aboutMeWheelThrottle) {
			return false; // Throttle updates
		}
		aboutMeLastWheelTime = currentTime;
		
		// Calculate scroll bounds
		let bgDims = getDisplayDimensions(aboutMeBgImg.width, aboutMeBgImg.height);
		let textWidth = bgDims.displayWidth * aboutMeTextWidthRatio;
		let textHeight = (aboutMeImg.height / aboutMeImg.width) * textWidth;
		
		// Scale scroll speed based on viewport size (reference: 1000px)
		let speedScale = bgDims.displayHeight / 1000;
		let scaledScrollSpeed = aboutMeScrollSpeed * speedScale;
		
		// Add scroll velocity from wheel
		let wheelVelocity = event.delta * scaledScrollSpeed;
		aboutMeScrollY += wheelVelocity;
		aboutMeScrollY = constrain(aboutMeScrollY, -bgDims.displayHeight, textHeight);
		
		// Set velocity to help smooth continuation (momentum)
		aboutMeScrollVelocity = wheelVelocity * 0.5; // Reduce momentum to avoid jitter
		aboutMeTargetVelocity = 0; // Stop auto-scroll
		aboutMeIsUserInteracting = true; // Mark as user interaction
		aboutMeLastScrollTime = currentTime; // Track scroll time to pause auto-play
		return false; // Prevent page scroll
	}
}

function touchStarted() {
	if (!touches || touches.length === 0) return false;
	lastTouchX = touches[0].x;
	lastTouchY = touches[0].y;
	lastTouchYForScroll = touches[0].y;
	if (playingVideo4) {
		aboutMeIsUserInteracting = true;
		aboutMeLastScrollTime = millis();
	}
	handleButtonPressStart(lastTouchX, lastTouchY);
	return false;
}

function touchMoved() {
	// Handle aboutMe scrolling on mobile with throttling
	if (playingVideo4 && aboutMeLoaded && touches && touches.length > 0) {
		let currentTime = millis();
		if (currentTime - aboutMeLastTouchMoveTime < aboutMeTouchMoveThrottle) {
			return false; // Throttle updates more aggressively on mobile
		}
		aboutMeLastTouchMoveTime = currentTime;
		
		let deltaY = lastTouchYForScroll - touches[0].y;
		
		// Calculate scroll bounds
		let bgDims = getDisplayDimensions(aboutMeBgImg.width, aboutMeBgImg.height);
		let textWidth = bgDims.displayWidth * aboutMeTextWidthRatio;
		let textHeight = (aboutMeImg.height / aboutMeImg.width) * textWidth;
		
		// Scale scroll speed based on viewport size (reference: 1000px)
		let speedScale = bgDims.displayHeight / 1000;
		let scrollMultiplier = 1.5 * speedScale; // Adjust for touch sensitivity
		
		// Update scroll position
		let touchVelocity = deltaY * scrollMultiplier;
		aboutMeScrollY += touchVelocity;
		aboutMeScrollY = constrain(aboutMeScrollY, -bgDims.displayHeight, textHeight);
		
		// Set velocity to help smooth continuation
		aboutMeScrollVelocity = touchVelocity * 0.5; // Reduce momentum
		aboutMeTargetVelocity = 0; // Stop auto-scroll
		aboutMeIsUserInteracting = true; // Mark as user interaction
		lastTouchYForScroll = touches[0].y;
		aboutMeLastScrollTime = currentTime; // Track scroll time to pause auto-play
		return false; // Prevent page scroll
	}
}

function touchEnded() {
	if (playingVideo4) {
		aboutMeIsUserInteracting = false;
		aboutMeLastScrollTime = millis();
	}
	handleButtonRelease(lastTouchX, lastTouchY);
	handleArrowNavigation(lastTouchX, lastTouchY);
	return false;
}

function keyPressed() {
	// Handle spacebar and enter for big button (only in firstframe mode or from frame 35+)
	if ((keyCode === 32 || keyCode === ENTER) && !playingReverseVideo && !playingReverseVideo2 && !playingVideo2 && !playingVideo3 && !playingVideo4 && !playingVideo5) {
		let currentFrame = Math.floor(video.time() * VIDEO_FRAMERATE);
		let canPress = waitingForButtonClick || currentFrame >= 35;
		
		if (canPress) {
			if (keyCode === 32 && !spaceKeyPressed) {
				spaceKeyPressed = true;
				playClickSound();
				buttonPressed = true;
				return false;
			} else if (keyCode === ENTER && !enterKeyPressed) {
				enterKeyPressed = true;
				playClickSound();
				buttonPressed = true;
				return false;
			}
		}
	}
	
	// Handle aboutMe scrolling with up/down arrows
	if (playingVideo4 && aboutMeLoaded) {
		if (keyCode === UP_ARROW) {
			if (!aboutMeUpKeyHeld) {
				// Calculate scroll bounds
				let bgDims = getDisplayDimensions(aboutMeBgImg.width, aboutMeBgImg.height);
				let textWidth = bgDims.displayWidth * aboutMeTextWidthRatio;
				let textHeight = (aboutMeImg.height / aboutMeImg.width) * textWidth;
				
				// Initial press - move immediately
				aboutMeScrollY = constrain(aboutMeScrollY - aboutMeScrollSpeed * 10, -bgDims.displayHeight, textHeight);
				aboutMeUpKeyHeld = true;
				aboutMeLastKeyScrubTime = millis();
				aboutMeLastScrollTime = millis();
			}
			return false;
		} else if (keyCode === DOWN_ARROW) {
			if (!aboutMeDownKeyHeld) {
				// Calculate scroll bounds
				let bgDims = getDisplayDimensions(aboutMeBgImg.width, aboutMeBgImg.height);
				let textWidth = bgDims.displayWidth * aboutMeTextWidthRatio;
				let textHeight = (aboutMeImg.height / aboutMeImg.width) * textWidth;
				
				// Initial press - move immediately
				aboutMeScrollY = constrain(aboutMeScrollY + aboutMeScrollSpeed * 10, -bgDims.displayHeight, textHeight);
				aboutMeDownKeyHeld = true;
				aboutMeLastKeyScrubTime = millis();
				aboutMeLastScrollTime = millis();
			}
			return false;
		}
	}
	
	// Handle left arrow for back button when video2 or video4 is active
	if (keyCode === LEFT_ARROW) {
		// Check if back button is available in video2 (frozen, and not playing reverseVideo2)
		if (playingVideo2 && video2.time() >= video2.duration() && !playingReverseVideo2) {
			playSound(clickSound, 0.2, random(0.95, 1.05));
			return false;
		}
		// Check if back button is available in video4 (and not playing video5)
		if (playingVideo4 && !playingVideo5) {
			playSound(clickSound, 0.2, random(0.95, 1.05));
			return false;
		}
	}
	
	// Handle arrow keys in UI mode or when frame >= 35
	let currentFrame = Math.floor(video.time() * VIDEO_FRAMERATE);
	let arrowsAvailable = showingUI || (!playingReverseVideo && !playingReverseVideo2 && !playingVideo2 && !playingVideo3 && !playingVideo4 && !playingVideo5 && currentFrame >= 35);
	
	if (arrowsAvailable && [37, 38, 39, 40].includes(keyCode)) {
		// Play ticlic sound at higher rate on key press
		playSound(ticlicSound, 0.4, 1.3);
		
		// Mark which arrow is pressed for visual feedback
		if (keyCode === DOWN_ARROW) keyboardArrowPressed = 0;
		else if (keyCode === LEFT_ARROW) keyboardArrowPressed = 1;
		else if (keyCode === UP_ARROW) keyboardArrowPressed = 2;
		else if (keyCode === RIGHT_ARROW) keyboardArrowPressed = 3;
		
		return false; // Prevent default scrolling
	}
}

function keyReleased() {
	// Handle spacebar and enter release for big button
	if ((keyCode === 32 || keyCode === ENTER) && !playingReverseVideo && !playingReverseVideo2 && !playingVideo3 && !playingVideo4 && !playingVideo5) {
		if (keyCode === 32 && spaceKeyPressed) {
			spaceKeyPressed = false;
			
			if (!buttonPressed) return false;
			
			// Play clac sound
			playSound(clacSound);
			clacSound.setVolume(1.3);
			
			// Starting from first frame state
			if (waitingForButtonClick) {
				playSound(jingleSound);
				stopSound(antijingleSound);
				reverseVideo.pause();
				video.play();
				isPlaying = true;
				waitingForButtonClick = false;
				buttonPressed = false;
				return false;
			}
			
			// Exiting UI mode
			if (showingUI) {
				showingUI = false;
				playSound(antijingleSound);
				stopSound(jingleSound);
				video.pause();
				isPlaying = false;
				if (reverseVideoLoaded && reverseVideo) {
					reverseVideo.time(0);
					reverseVideo.play();
					playingReverseVideo = true;
				}
				buttonPressed = false;
				return false;
			}
			
			// During video playback
			let bounds = getButtonBounds();
			if (bounds.frame < 30 && !buttonClicked) {
				if (!isPlaying && !playingReverseVideo) {
					playSound(jingleSound);
					stopSound(antijingleSound);
					reverseVideo.pause();
					video.stop();
					video.play();
					isPlaying = true;
					buttonClicked = true;
				}
			} else {
				playSound(antijingleSound);
				stopSound(jingleSound);
				video.pause();
				isPlaying = false;
				if (reverseVideoLoaded && reverseVideo) {
					reverseVideo.time(0);
					reverseVideo.play();
					playingReverseVideo = true;
				}
			}
			
			buttonPressed = false;
			return false;
		} else if (keyCode === ENTER && enterKeyPressed) {
			enterKeyPressed = false;
			
			if (!buttonPressed) return false;
			
			// Play clac sound
			playSound(clacSound);
			clacSound.setVolume(1.3);
			
			// Starting from first frame state
			if (waitingForButtonClick) {
				playSound(jingleSound);
				stopSound(antijingleSound);
				reverseVideo.pause();
				video.play();
				isPlaying = true;
				waitingForButtonClick = false;
				buttonPressed = false;
				return false;
			}
			
			// Exiting UI mode
			if (showingUI) {
				showingUI = false;
				playSound(antijingleSound);
				stopSound(jingleSound);
				video.pause();
				isPlaying = false;
				if (reverseVideoLoaded && reverseVideo) {
					reverseVideo.time(0);
					reverseVideo.play();
					playingReverseVideo = true;
				}
				buttonPressed = false;
				return false;
			}
			
			// During video playback
			let bounds = getButtonBounds();
			if (bounds.frame < 35 && !buttonClicked) {
				if (!isPlaying && !playingReverseVideo) {
					playSound(jingleSound);
					stopSound(antijingleSound);
					reverseVideo.pause();
					video.stop();
					video.play();
					isPlaying = true;
					buttonClicked = true;
				}
			} else {
				playSound(antijingleSound);
				stopSound(jingleSound);
				video.pause();
				isPlaying = false;
				if (reverseVideoLoaded && reverseVideo) {
					reverseVideo.time(0);
					reverseVideo.play();
					playingReverseVideo = true;
				}
			}
			
			buttonPressed = false;
			return false;
		}
	}
	
	// Clear aboutMe arrow key held states
	if (playingVideo4 && aboutMeLoaded) {
		if (keyCode === UP_ARROW) {
			aboutMeUpKeyHeld = false;
			return false;
		} else if (keyCode === DOWN_ARROW) {
			aboutMeDownKeyHeld = false;
			return false;
		}
	}
	
	// Handle left arrow for back button release
	if (keyCode === LEFT_ARROW) {
		// Check if back button is available in video2 (frozen, and not playing reverseVideo2)
		if (playingVideo2 && video2.time() >= video2.duration() && !playingReverseVideo2) {
			playSound(ticlicSound, 0.4);
			
			// Capture current video2 frame to prevent black flash during loading
			if (video2 && video2.elt && video2.elt.readyState >= 2) {
				let video2Dims = getDisplayDimensions(video2.width, video2.height);
				let captureGraphics = createGraphics(width, height);
				captureGraphics.background(0);
				captureGraphics.image(video2, video2Dims.offsetX, video2Dims.offsetY, video2Dims.displayWidth, video2Dims.displayHeight);
				reverseVideo2TransitionFrame = captureGraphics;
			}
			
			if (reverseVideo2Loaded && reverseVideo2) {
				reverseVideo2.time(0);
				reverseVideo2.play();
				playingReverseVideo2 = true;
			}
			return false;
		}
		// Check if back button is available in video4 (and not playing video5)
		if (playingVideo4 && !playingVideo5) {
			playSound(ticlicSound, 0.4);
			if (video5Loaded && video5) {
				video5.time(0);
				video5.play();
				playingVideo5 = true;
			}
			return false;
		}
	}
	
	// Clear keyboard arrow press state
	let wasPressed = keyboardArrowPressed;
	keyboardArrowPressed = -1;
	
	// Handle arrow key release when available (UI mode or frame >= 35)
	let currentFrame = Math.floor(video.time() * VIDEO_FRAMERATE);
	let arrowsAvailable = showingUI || (!playingReverseVideo && !playingReverseVideo2 && !playingVideo2 && !playingVideo3 && !playingVideo4 && !playingVideo5 && currentFrame >= 35);
	
	if (arrowsAvailable && wasPressed !== -1 && [37, 38, 39, 40].includes(keyCode)) {
		// Play ticlic sound at lower rate on key release
		playSound(ticlicSound, 0.4, 0.8);
		
		// Execute navigation only in UI mode
		if (showingUI) {
			if (keyCode === LEFT_ARROW) navigateLeft();
			else if (keyCode === RIGHT_ARROW) navigateRight();
			else if (keyCode === UP_ARROW) navigateUp();
			else if (keyCode === DOWN_ARROW) navigateDown();
		}
		
		return false;
	}
}

function windowResized() {
	let w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
	let h = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
	
	// Capture old background height before resize (if in aboutMe section)
	let oldBgHeight = null;
	if (playingVideo4 && aboutMeLoaded && aboutMeBgImg) {
		let oldBgDims = getDisplayDimensions(aboutMeBgImg.width, aboutMeBgImg.height);
		oldBgHeight = oldBgDims.displayHeight;
	}
	
	// Constrain aspect ratio
	let constrainedDims = constrainAspectRatio(w, h);
	resizeCanvas(constrainedDims.width, constrainedDims.height);
	
	// Clear dimension cache to force recalculation
	cachedDims = null;
	
	// Proportionally scale aboutMe scroll position to maintain relative position
	if (oldBgHeight !== null && aboutMeBgImg) {
		let newBgDims = getDisplayDimensions(aboutMeBgImg.width, aboutMeBgImg.height);
		let scrollRatio = aboutMeScrollY / oldBgHeight;
		aboutMeScrollY = scrollRatio * newBgDims.displayHeight;
	}
	
	applyNoSmoothing();
}


