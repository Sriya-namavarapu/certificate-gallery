// Remove the Three.js import since we're using CDN
// import * as THREE from 'three';

class CertificateSlider {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.certificates = [];
        this.currentIndex = 0;
        this.isAnimating = false;
        this.loadedImages = 0;
        this.totalCertificates = 13;
        this.spacing = 6.0;
        this.baseScale = 1.3;
        this.centerScale = 2.8;
        this.depthFactor = 2;
        this.targetZ = 1.0;
        this.sliderYOffset = 2.0;
        this.rotationFactor = 0.3;
        this.animationDuration = 1200;
        this.floatAmplitude = 0.15;
        this.floatSpeed = 0.002;
        this.startPositions = {};
        this.targetPositions = {};
        this.startRotations = {};
        this.targetRotations = {};
        this.startScales = {};
        this.targetScales = {};
        this.startOpacities = {};
        this.targetOpacities = {};

        // Add responsive properties
        this.baseWidth = 3.5;  // Original width
        this.baseHeight = 2.3; // Original height
        this.minScale = 0.5;   // Minimum scale for mobile
        this.maxScale = 2.8;   // Maximum scale for desktop
        
        // Calculate initial responsive values
        this.updateResponsiveValues();
        
        this.init();
        
        // Debug logging
        window.slider = this; // Makes it accessible in console
    }

    updateResponsiveValues() {
        // Adjust values based on screen size
        const screenWidth = window.innerWidth;
        
        if (screenWidth <= 480) { // Mobile
            this.spacing = 4.0;
            this.baseScale = 0.8;
            this.centerScale = 1.8;
            this.depthFactor = 1.5;
            this.sliderYOffset = 1.0;
            this.camera.position.z = 10;
        } else if (screenWidth <= 768) { // Tablet
            this.spacing = 5.0;
            this.baseScale = 1.0;
            this.centerScale = 2.2;
            this.depthFactor = 1.8;
            this.sliderYOffset = 1.5;
            this.camera.position.z = 9;
        } else { // Desktop
            this.spacing = 6.0;
            this.baseScale = 1.3;
            this.centerScale = 2.8;
            this.depthFactor = 2;
            this.sliderYOffset = 2.0;
            this.camera.position.z = 8;
        }
    }

    init() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 1);
        document.querySelector('.canvas-container').appendChild(this.renderer.domElement);

        // Adjust camera for better 3D view
        this.camera.position.z = 8;
        this.camera.position.y = this.sliderYOffset;
        this.camera.position.x = 0;
        this.camera.lookAt(0, this.sliderYOffset, 0);

        // Enhanced lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        const frontLight = new THREE.DirectionalLight(0xffffff, 0.3);
        frontLight.position.set(0, 0, 5);
        
        this.scene.add(ambientLight, frontLight);

        this.loadCertificates();
        this.setupEventListeners();
        this.animate();
    }

    loadCertificates() {
        const loader = new THREE.TextureLoader();
        const certificateUrls = Array.from(
            { length: this.totalCertificates }, 
            (_, i) => `assets/image${i + 1}.png`
        );
        
        certificateUrls.forEach((url, index) => {
            const mesh = this.createCertificateMesh(url, index);
            this.certificates[index] = mesh;
            this.scene.add(mesh);
            this.loadedImages++;
            this.updateProgressBar();
        });
    }

    updateProgressBar() {
        const progress = this.loadedImages / this.totalCertificates;
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
    }

    setupEventListeners() {
        let lastScrollTime = 0;
        const scrollDelay = 200; // Increased delay for smoother scrolling

        window.addEventListener('wheel', (event) => {
            event.preventDefault();
            
            const now = Date.now();
            if (!this.isAnimating && now - lastScrollTime > scrollDelay) {
                lastScrollTime = now;
                const direction = Math.sign(event.deltaY);
                const nextIndex = this.currentIndex + direction;
                
                if (nextIndex >= 0 && nextIndex < this.totalCertificates) {
                    this.navigateTo(nextIndex);
                }
            }
        }, { passive: false });

        window.addEventListener('keydown', (event) => {
            if (!this.isAnimating) {
                if (event.key === 'ArrowRight' && this.currentIndex < this.totalCertificates - 1) {
                    this.navigateTo(this.currentIndex + 1);
                } else if (event.key === 'ArrowLeft' && this.currentIndex > 0) {
                    this.navigateTo(this.currentIndex - 1);
                }
            }
        });

        window.addEventListener('resize', () => {
            this.updateResponsiveValues();
            
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            
            // Update all certificates with new positions
            this.certificates.forEach((cert, i) => {
                if (cert) {
                    cert.scale.set(this.baseScale, this.baseScale, 1);
                    cert.position.x = i * this.spacing;
                    cert.position.y = this.sliderYOffset;
                }
            });
            
            // Refresh current view
            this.navigateTo(this.currentIndex);
        });

        // Add touch support for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, false);
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            const swipeDistance = touchEndX - touchStartX;
            
            if (Math.abs(swipeDistance) > 50) { // Minimum swipe distance
                if (!this.isAnimating) {
                    if (swipeDistance > 0 && this.currentIndex > 0) {
                        this.navigateTo(this.currentIndex - 1);
                    } else if (swipeDistance < 0 && this.currentIndex < this.totalCertificates - 1) {
                        this.navigateTo(this.currentIndex + 1);
                    }
                }
            }
        }, false);
    }

    createCertificateMesh(imagePath, index) {
        // Use base dimensions but apply responsive scaling
        const geometry = new THREE.PlaneGeometry(this.baseWidth, this.baseHeight);
        const material = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load(imagePath),
            side: THREE.DoubleSide,
            transparent: true
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = index * this.spacing;
        mesh.position.y = this.sliderYOffset;
        mesh.scale.set(this.baseScale, this.baseScale, 1);
        return mesh;
    }

    navigateTo(index) {
        if (this.isAnimating || !this.certificates[index]) return;
        
        this.isAnimating = true;
        this.animationStartTime = Date.now();
        
        this.certificates.forEach((cert, i) => {
            if (cert) {
                const distanceFromCenter = Math.abs(i - index);
                
                const zPos = i === index ? 
                    this.targetZ : 
                    -distanceFromCenter * this.depthFactor;
                
                const rotation = i === index ? 
                    0 : 
                    (i < index ? this.rotationFactor : -this.rotationFactor) * distanceFromCenter;

                cert.userData.startPos = {
                    x: cert.position.x,
                    y: cert.position.y,
                    z: cert.position.z
                };
                
                cert.userData.targetPos = {
                    x: -index * this.spacing + (i * this.spacing),
                    y: this.sliderYOffset,
                    z: zPos
                };

                cert.userData.startRot = { y: cert.rotation.y };
                cert.userData.targetRot = { y: rotation };

                const scale = i === index ? 
                    this.centerScale :
                    Math.max(0.7, this.baseScale - (distanceFromCenter * 0.25));

                cert.userData.startScale = cert.scale.x;
                cert.userData.targetScale = scale;
            }
        });

        this.currentIndex = index;
    }

    updateAnimation() {
        // Vertical floating animation
        this.certificates.forEach((cert, index) => {
            if (cert) {
                const distanceFromCenter = Math.abs(index - this.currentIndex);
                const floatScale = 1 - (distanceFromCenter * 0.2); // Reduce floating for distant certificates
                
                const baseY = this.sliderYOffset;
                cert.position.y = baseY + 
                    Math.sin(Date.now() * this.floatSpeed + index) * 
                    this.floatAmplitude * floatScale;
            }
        });

        if (this.isAnimating) {
            const elapsed = Date.now() - this.animationStartTime;
            let progress = Math.min(elapsed / this.animationDuration, 1);
            progress = this.ease(progress);

            this.certificates.forEach(cert => {
                if (cert && cert.userData.startPos) {
                    // Smoother interpolation
                    cert.position.x = cert.userData.startPos.x + (cert.userData.targetPos.x - cert.userData.startPos.x) * progress;
                    cert.position.z = cert.userData.startPos.z + (cert.userData.targetPos.z - cert.userData.startPos.z) * progress;
                    cert.rotation.y = cert.userData.startRot.y + (cert.userData.targetRot.y - cert.userData.startRot.y) * progress;
                    const scale = cert.userData.startScale + (cert.userData.targetScale - cert.userData.startScale) * progress;
                    cert.scale.set(scale, scale, 1);
                }
            });

            if (progress === 1) {
                this.isAnimating = false;
            }
        }
    }

    ease(t) {
        // Cubic easing - smoother acceleration and deceleration
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.updateAnimation();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when Three.js is loaded
window.addEventListener('load', () => {
    if (window.THREE) {
        new CertificateSlider();
    } else {
        console.error('Three.js not loaded');
    }
});