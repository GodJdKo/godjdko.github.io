// Sound effects
let clickSound, jingleSound, antijingleSound, clacSound, ticlicSound;

// Images
let btnPressedImg, lightMaskImg, backUI0Img, backUIImg;
let uiImages = {};
let firstFrameImages = [];

// Video elements and states
let video, reverseVideo, video2, reverseVideo2, video3, video5;
let videoLoaded = false;
let reverseVideoLoaded = false;
let video2Loaded = false;
let reverseVideo2Loaded = false;
let video3Loaded = false;
let video5Loaded = false;

// Video4 frames (image sequence)
let video4Frames = [];
let video4FrameCount = 424; // video4-000.jpg to video4-423.jpg
let video4FramesLoaded = 0;
let video4Loaded = false;
let playingReverseVideo = false;
let playingVideo2 = false;
let playingReverseVideo2 = false;
let playingVideo3 = false;
let playingVideo4 = false;
let playingVideo5 = false;
let isPlaying = false;

// UI Navigation
const availableImages = ['p0', 'p1', 'p2', 'p3'];
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

// Video4 scroll control
let video4ScrollPosition = 0;
let video4CurrentFrame = 0;
let video4PrevFrame = 0;
let video4LastDisplayedFrame = 0;
let lastTouchYForScroll = 0;
let lastVideo4UpdateTime = 0;
let video4ScrollVelocity = 0;
let video4NeedsUpdate = false;
let video4LastAutoPlayTime = 0;
let video4LastScrollTime = 0;
let video4IsUserInteracting = false; // Track if user is holding mouse/touch
const video4ScrollSpeed = 0.02; // Frames per scroll unit
const video4MinFrameInterval = 50; // Min 50ms between updates
const video4AutoPlaySpeed = 100; // ms per frame for auto-play
const video4AutoPlayDelay = 1000; // Wait 1s after scroll before auto-playing

function preload() {
	// Setup all videos
	video = setupVideo('img/video.mp4', () => {
		videoLoaded = true;
	});
	
	reverseVideo = setupVideo('img/reversevideo.mp4', () => {
		reverseVideoLoaded = true;
	});
	
	video2 = setupVideo('img/video2.mp4', () => {
		video2Loaded = true;
	});
	
	reverseVideo2 = setupVideo('img/reversevideo2.mp4', () => {
		reverseVideo2Loaded = true;
	});
	
	video3 = setupVideo('img/video3.mp4', () => {
		video3Loaded = true;
	});
	
	// Video4 frames load on-demand for better performance
	video4Loaded = true;
	
	video5 = setupVideo('img/video5.mp4', () => {
		video5Loaded = true;
	});
	
	// Load sounds
	clickSound = loadSound('sound/clic.wav');
	jingleSound = loadSound('sound/jingle.wav');
	antijingleSound = loadSound('sound/antijingle.wav');
	clacSound = loadSound('sound/clac.wav');
	ticlicSound = loadSound('sound/ticlic.wav');
	
	// Load images
	btnPressedImg = loadImage('img/btnpressed.jpg');
	lightMaskImg = loadImage('img/lightmask.png');
	backUI0Img = loadImage('img/UI/backUI0.png');
	backUIImg = loadImage('img/UI/backUI.png');
	
	// Load UI navigation images
	for (let imgName of availableImages) {
		uiImages[imgName] = loadImage(`img/UI/${imgName}.jpg`);
	}
	
	// Load first frame animation images
	for (let i = 0; i < 5; i++) {
		firstFrameImages[i] = loadImage(`img/firstframe/firstframe${i}.jpg`);
	}
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	noiseGfx = createGraphics(windowWidth, windowHeight);
	noiseGfx.pixelDensity(1);
	frameRate(VIDEO_FRAMERATE);
	if (video) video.time(0);
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
		vid.elt.setAttribute('playsinline', 'true');
		vid.elt.setAttribute('webkit-playsinline', 'true');
		vid.elt.setAttribute('preload', 'auto');
		vid.elt.muted = false;
		
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
	
	if (frame < 30) {
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

function draw() {
	noSmooth();
	background(0);
	
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
		if (reverseVideoLoaded && reverseVideo) {
			image(reverseVideo, dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
			
			if (reverseVideo.time() >= reverseVideo.duration()) {
				reverseVideo.pause();
				reverseVideo.time(0);
				playingReverseVideo = false;
				video.pause();
				video.time(0);
				buttonClicked = false;
				waitingForButtonClick = true;
			}
		}
		drawFilmNoise();
		return;
	}
	
	// Render reversevideo2
	if (playingReverseVideo2) {
		if (reverseVideo2Loaded && reverseVideo2) {
			image(reverseVideo2, dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
			
			if (reverseVideo2.time() >= reverseVideo2.duration()) {
				reverseVideo2.pause();
				reverseVideo2.time(0);
				playingReverseVideo2 = false;
				playingVideo2 = false;
				currentUIState = 'p3';
				showingUI = true;
			}
		}
		drawFilmNoise();
		return;
	}
	
	// Render video5 (exit transition from video4)
	if (playingVideo5) {
		if (video5Loaded && video5) {
			image(video5, dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
			
			if (video5.time() >= video5.duration()) {
				video5.pause();
				video5.time(0);
				playingVideo5 = false;
				playingVideo4 = false;
				playingVideo3 = false;
				currentUIState = 'p2';
				showingUI = true;
			}
		}
		drawFilmNoise();
		return;
	}
	
	// Render video4 with back button (using frame sequence)
	if (playingVideo4) {
		if (video4Loaded) {
			// Auto-play frames slowly if not scrolling and not interacting
			let currentTime = millis();
			let timeSinceScroll = currentTime - video4LastScrollTime;
			
			// If enough time has passed since last scroll and user is not interacting, auto-play
			if (!video4IsUserInteracting && timeSinceScroll > video4AutoPlayDelay) {
				let timeSinceAutoPlay = currentTime - video4LastAutoPlayTime;
				if (timeSinceAutoPlay >= video4AutoPlaySpeed) {
					video4CurrentFrame = constrain(video4CurrentFrame + 1, 0, video4FrameCount - 1);
					video4LastAutoPlayTime = currentTime;
				}
			}
			
			// Get current frame index
			let frameIndex = floor(constrain(video4CurrentFrame, 0, video4FrameCount - 1));
			
			// Smart preloading: adaptive radius based on device and only load if frame changed
			if (frameIndex !== video4PrevFrame) {
				// Smaller radius on mobile for better performance
				let preloadRadius = (width < 768) ? 15 : 30;
				
				// Prioritize forward loading (direction of auto-play)
				for (let i = 0; i <= preloadRadius; i++) {
					let preloadIndex = frameIndex + i;
					if (preloadIndex >= 0 && preloadIndex < video4FrameCount && !video4Frames[preloadIndex]) {
						let frameNum = nf(preloadIndex, 3);
						video4Frames[preloadIndex] = loadImage(`img/video4/video4-${frameNum}.jpg`, 
							() => {}, // Success callback (silent)
							() => { // Error callback - retry once after delay
								setTimeout(() => {
									if (!video4Frames[preloadIndex] || video4Frames[preloadIndex].width === 0) {
										video4Frames[preloadIndex] = loadImage(`img/video4/video4-${frameNum}.jpg`);
									}
								}, 1000);
							}
						);
					}
				}
				
				// Load behind (smaller radius)
				let backRadius = Math.floor(preloadRadius / 2);
				for (let i = 1; i <= backRadius; i++) {
					let preloadIndex = frameIndex - i;
					if (preloadIndex >= 0 && preloadIndex < video4FrameCount && !video4Frames[preloadIndex]) {
						let frameNum = nf(preloadIndex, 3);
						video4Frames[preloadIndex] = loadImage(`img/video4/video4-${frameNum}.jpg`);
					}
				}
				
				video4PrevFrame = frameIndex;
			}
			
			// Display the current frame if loaded, otherwise show last displayed frame
			if (video4Frames[frameIndex] && video4Frames[frameIndex].width > 0) {
				image(video4Frames[frameIndex], dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
				video4LastDisplayedFrame = frameIndex;
			} else if (video4Frames[video4LastDisplayedFrame] && video4Frames[video4LastDisplayedFrame].width > 0) {
				// Show last successfully displayed frame while new one loads
				image(video4Frames[video4LastDisplayedFrame], dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
			}
		}
		drawFilmNoise();
		
		// Draw back button while video4 is playing
		if (backUI0Img && backUIImg) {
			let smallestSide = min(width, height);
			let btnSize = smallestSide / 6;
			let btnX = width - btnSize - 20;
			let btnY = height - btnSize - 20;
			
			let isHovered = mouseX >= btnX && mouseX <= btnX + btnSize &&
			                mouseY >= btnY && mouseY <= btnY + btnSize;
			
			document.body.style.cursor = isHovered ? 'pointer' : 'default';
			image(isHovered ? backUIImg : backUI0Img, btnX, btnY, btnSize, btnSize);
		}
		
		return;
	}
	
	// Render video3 (entrance transition to video4)
	if (playingVideo3) {
		if (video3Loaded && video3) {
			image(video3, dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
			
			if (video3.time() >= video3.duration()) {
				video3.pause();
				video3.time(video3.duration());
				playingVideo3 = false;
				// Start video4 (frame-based, ready for scroll control)
				if (video4Loaded) {
					playingVideo4 = true;
					video4CurrentFrame = 0;
					video4PrevFrame = 0;
					video4LastDisplayedFrame = 0;
					video4LastAutoPlayTime = millis();
					video4LastScrollTime = 0;
				}
			}
		}
		drawFilmNoise();
		return;
	}
	
	// Render video2 with back button
	if (playingVideo2) {
		if (video2Loaded && video2) {
			image(video2, dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
			
			if (video2.time() >= video2.duration()) {
				video2.pause();
				video2.time(video2.duration());
			}
		}
		drawFilmNoise();
		
		// Draw back button when video2 is frozen
		if (video2.time() >= video2.duration() && backUI0Img && backUIImg) {
			let smallestSide = min(width, height);
			let btnSize = smallestSide / 6;
			let btnX = width - btnSize - 20;
			let btnY = height - btnSize - 20;
			
			let isHovered = mouseX >= btnX && mouseX <= btnX + btnSize &&
			                mouseY >= btnY && mouseY <= btnY + btnSize;
			
			document.body.style.cursor = isHovered ? 'pointer' : 'default';
			image(isHovered ? backUIImg : backUI0Img, btnX, btnY, btnSize, btnSize);
		}
		
		return;
	}
	
	// Render UI mode
	if (showingUI && uiImages[currentUIState]) {
		let img = uiImages[currentUIState];
		let uiDims = getDisplayDimensions(img.width, img.height);
		
		image(img, uiDims.offsetX, uiDims.offsetY, uiDims.displayWidth, uiDims.displayHeight);
		
		// Render button press effects in UI mode
		if (buttonPressed) {
			renderButtonPressEffect(uiDims, true);
		}
		
		// Render arrow button press effects
		renderArrowButtonEffects(uiDims);
		
		drawFilmNoise();
		return;
	}
	
	// Show loading if video not ready
	if (!videoLoaded) {
		fill(255);
		textAlign(CENTER, CENTER);
		textSize(16);
		text("Loading...", width/2, height/2);
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
		
		drawFilmNoise();
		
		if (buttonPressed && btnPressedImg) {
			image(btnPressedImg, dims.offsetX, dims.offsetY, dims.displayWidth, dims.displayHeight);
		}
		
		let bounds = getButtonBounds();
		document.body.style.cursor = (mouseX >= bounds.x && mouseX <= bounds.x + bounds.w &&
		                              mouseY >= bounds.y && mouseY <= bounds.y + bounds.h) ? 'pointer' : 'default';
		return;
	}
	
	// Handle video playback - cache bounds calculation
	let bounds = getButtonBounds();
	let buttonMoved = bounds.frame >= 30;
	
	// Update cursor
	updateCursor(bounds, buttonMoved, dims);
	
	drawFilmNoise();
	
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
}

// Helper: Update cursor based on button/arrow hover
function updateCursor(bounds, buttonMoved, dims) {
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
	
	for (let btn of squareButtons) {
		let btnX = dims.offsetX + (btn.x / videoOriginalWidth) * dims.displayWidth;
		let btnY = dims.offsetY + (btn.y / videoOriginalHeight) * dims.displayHeight;
		let btnSize = btn.size * scaleFactor;
		
		let pressed = false;
		if (mouseIsPressed && mouseButton === LEFT &&
		    mouseX >= btnX && mouseX <= btnX + btnSize &&
		    mouseY >= btnY && mouseY <= btnY + btnSize) {
			pressed = true;
		}
		
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
	
	if (frame < 30 && buttonClicked) return false;
	
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
		sound.stop();
		sound.setVolume(volume);
		sound.rate(rate);
		sound.play();
	}
}

// Helper: Stop sound
function stopSound(sound) {
	if (sound && sound.isLoaded()) {
		sound.stop();
	}
}

// Navigation functions
function navigateLeft() {
	let depth = currentUIState.replace('p', '').length;
	
	if (depth === 1 && currentUIState === 'p1') {
		currentUIState = 'p0';
	} else if (depth > 1) {
		let base = currentUIState.slice(0, -1);
		let lastDigit = parseInt(currentUIState.slice(-1));
		let newState = base + (lastDigit - 1);
		if (lastDigit > 1 && availableImages.includes(newState)) {
			currentUIState = newState;
		}
	}
}

function navigateRight() {
	let depth = currentUIState.replace('p', '').length;
	
	if (depth === 1) {
		if (currentUIState === 'p0') {
			currentUIState = 'p1';
		} else if (currentUIState === 'p2') {
			showingUI = false;
			if (video3Loaded && video3) {
				video3.time(0);
				video3.play();
				playingVideo3 = true;
			}
		} else if (currentUIState === 'p3') {
			showingUI = false;
			if (video2Loaded && video2) {
				video2.time(0);
				video2.play();
				playingVideo2 = true;
			}
		}
	} else {
		let base = currentUIState.slice(0, -1);
		let lastDigit = parseInt(currentUIState.slice(-1));
		let newState = base + (lastDigit + 1);
		if (availableImages.includes(newState)) {
			currentUIState = newState;
		}
	}
}

function navigateDown() {
	let depth = currentUIState.replace('p', '').length;
	
	if (depth === 1) {
		if (currentUIState === 'p1') currentUIState = 'p2';
		else if (currentUIState === 'p2') currentUIState = 'p3';
	} else if (depth < 3) {
		let newState = currentUIState + '1';
		if (availableImages.includes(newState)) {
			currentUIState = newState;
			showingUI = true;
			if (video && video.elt) video.pause();
		}
	}
}

function navigateUp() {
	let depth = currentUIState.replace('p', '').length;
	
	if (depth === 1) {
		if (currentUIState === 'p3') currentUIState = 'p2';
		else if (currentUIState === 'p2') currentUIState = 'p1';
	} else if (depth > 1) {
		let newState = currentUIState.slice(0, -1);
		if (availableImages.includes(newState)) {
			currentUIState = newState;
		}
	}
}

// Helper: Handle back button click
function handleBackButtonClick(x, y) {
	// Check video2 back button
	if (playingVideo2 && video2.time() >= video2.duration()) {
		let smallestSide = min(width, height);
		let btnSize = smallestSide / 6;
		let btnX = width - btnSize - 20;
		let btnY = height - btnSize - 20;
		
		if (x >= btnX && x <= btnX + btnSize && y >= btnY && y <= btnY + btnSize) {
			playSound(ticlicSound, 0.4);
			if (reverseVideo2Loaded && reverseVideo2) {
				reverseVideo2.time(0);
				reverseVideo2.play();
				playingReverseVideo2 = true;
			}
			return true;
		}
	}
	
	// Check video4 back button (frame-based)
	if (playingVideo4) {
		let smallestSide = min(width, height);
		let btnSize = smallestSide / 6;
		let btnX = width - btnSize - 20;
		let btnY = height - btnSize - 20;
		
		if (x >= btnX && x <= btnX + btnSize && y >= btnY && y <= btnY + btnSize) {
			playSound(ticlicSound, 0.4);
			if (video5Loaded && video5) {
				video5.time(0);
				video5.play();
				playingVideo5 = true;
			}
			return true;
		}
	}
	
	return false;
}

// Helper: Handle button press start
function handleButtonPressStart(x, y) {
	if (handleBackButtonClick(x, y)) return;
	
	// Don't allow button press when reverseVideo is playing
	if (playingReverseVideo) return;
	
	if (isInsideButton(x, y)) {
		playClickSound();
		buttonPressed = true;
	}
	
	let bounds = getButtonBounds();
	if (bounds.frame >= 30) {
		let arrowIdx = isInsideArrowButton(x, y);
		if (arrowIdx !== -1) {
			playSound(ticlicSound, 0.4, 1.3);
		}
	}
}

// Helper: Handle button release
function handleButtonRelease(x, y) {
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
	
	// Starting from first frame state
	if (waitingForButtonClick) {
		playSound(jingleSound);
		stopSound(antijingleSound);
		reverseVideo.pause();
		video.play();
		isPlaying = true;
		waitingForButtonClick = false;
		buttonPressed = false;
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
}

// Helper: Handle arrow button navigation
function handleArrowNavigation(x, y) {
	let bounds = getButtonBounds();
	if (bounds.frame < 30) return;
	
	let arrowIdx = isInsideArrowButton(x, y);
	if (arrowIdx !== -1) {
		// Always play release sound
		playSound(ticlicSound, 0.4, 0.8);
		
		// Only navigate if we're in UI mode (video has ended)
		if (showingUI) {
			const navFunctions = [navigateDown, navigateLeft, navigateUp, navigateRight];
			navFunctions[arrowIdx]();
		}
	}
}

function mousePressed() {
	if (playingVideo4) {
		video4IsUserInteracting = true;
		video4LastScrollTime = millis();
	}
	handleButtonPressStart(mouseX, mouseY);
}

function mouseReleased() {
	if (playingVideo4) {
		video4IsUserInteracting = false;
		video4LastScrollTime = millis();
	}
	handleButtonRelease(mouseX, mouseY);
	handleArrowNavigation(mouseX, mouseY);
}

function mouseWheel(event) {
	// Handle video4 scrolling
	if (playingVideo4 && video4Loaded) {
		// Update frame position
		video4CurrentFrame += event.delta * video4ScrollSpeed;
		video4CurrentFrame = constrain(video4CurrentFrame, 0, video4FrameCount - 1);
		video4LastScrollTime = millis(); // Track scroll time to pause auto-play
		return false; // Prevent page scroll
	}
}

function touchStarted() {
	if (!touches || touches.length === 0) return false;
	lastTouchX = touches[0].x;
	lastTouchY = touches[0].y;
	lastTouchYForScroll = touches[0].y;
	if (playingVideo4) {
		video4IsUserInteracting = true;
		video4LastScrollTime = millis();
	}
	handleButtonPressStart(lastTouchX, lastTouchY);
	return false;
}

function touchMoved() {
	// Handle video4 scrolling on mobile
	if (playingVideo4 && video4Loaded && touches && touches.length > 0) {
		let deltaY = lastTouchYForScroll - touches[0].y;
		// Update frame position
		video4CurrentFrame += deltaY * 0.2;
		video4CurrentFrame = constrain(video4CurrentFrame, 0, video4FrameCount - 1);
		lastTouchYForScroll = touches[0].y;
		video4LastScrollTime = millis(); // Track scroll time to pause auto-play
		return false; // Prevent page scroll
	}
}

function touchEnded() {
	if (playingVideo4) {
		video4IsUserInteracting = false;
		video4LastScrollTime = millis();
	}
	handleButtonRelease(lastTouchX, lastTouchY);
	handleArrowNavigation(lastTouchX, lastTouchY);
	return false;
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	noiseGfx = createGraphics(windowWidth, windowHeight);
	noiseGfx.pixelDensity(1);
	// Clear dimension cache to force recalculation
	cachedDims = null;
}

// Film noise optimization
let noiseFrameCounter = 0;
let cachedNoiseFrame = null;

function drawFilmNoise() {
	// Reduce noise generation frequency on mobile for better performance
	const updateFrequency = (width < 768) ? 2 : 1;
	
	if (noiseFrameCounter % updateFrequency === 0) {
		noiseGfx.clear();
		noiseGfx.noStroke();
		
		const dotSize = 2;
		const density = waitingForButtonClick ? 0.015 : 0.03;
		const alphaVal = waitingForButtonClick ? 12.75 : 25.5;
		const numDots = int(width * height * density * 0.25);
		const w = width;
		const h = height;
		
		// Batch fill operations for better performance
		for (let i = 0; i < numDots; i++) {
			noiseGfx.fill(random(180, 255), alphaVal);
			noiseGfx.rect(int(random(w)), int(random(h)), dotSize, dotSize);
		}
	}
	
	noiseFrameCounter++;
	image(noiseGfx, 0, 0);
}
