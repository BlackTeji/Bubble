const COLORS = ['#6C63FF', '#00C48C', '#A78BFA', '#34D399', '#818CF8'];
const PARTICLE_COUNT = 60;

class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = -10;
        this.size = Math.random() * 6 + 3;
        this.speedY = Math.random() * 2 + 1.5;
        this.speedX = (Math.random() - 0.5) * 1.5;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 4;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.opacity = 1;
        this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        if (this.y > this.canvas.height * 0.7) {
            this.opacity = Math.max(0, this.opacity - 0.03);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);

        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.5);
        }

        ctx.restore();
    }
}

export const launchConfetti = (intensity = 'medium') => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const count = intensity === 'big' ? PARTICLE_COUNT : intensity === 'subtle' ? 20 : 40;

    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = `
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    z-index: var(--z-toast);
  `;

    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const particles = Array.from({ length: count }, () => new Particle(canvas));

    let frame;
    let startTime = null;
    const duration = intensity === 'big' ? 2800 : 1800;

    const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => { p.update(); p.draw(ctx); });

        if (elapsed < duration && particles.some((p) => p.opacity > 0)) {
            frame = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(frame);
            canvas.remove();
        }
    };

    frame = requestAnimationFrame(animate);
};