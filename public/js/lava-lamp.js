// ============================================
// التحكم في تأثير Lava Lamp (مصباح الحمم)
// ============================================

class LavaLampController {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.intensity = options.intensity || 'medium';
        this.interactive = options.interactive !== false;
        this.autoColor = options.autoColor !== false;
        
        this.blobs = [];
        this.mouseX = 0.5;
        this.mouseY = 0.5;
        this.animationId = null;
        this.colorInterval = null;
        
        if (this.enabled) {
            this.init();
        }
    }

    init() {
        // إنشاء حاوية Lava Lamp
        this.container = document.createElement('div');
        this.container.className = 'lava-lamp-background';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
        `;
        
        // إنشاء الفقاعات حسب الشدة
        this.createBlobs();
        document.body.insertBefore(this.container, document.body.firstChild);
        
        // إضافة تأثير التفاعل مع الماوس
        if (this.interactive) {
            document.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX / window.innerWidth;
                this.mouseY = e.clientY / window.innerHeight;
            });
        }
        
        // تحديث الألوان بشكل عشوائي
        if (this.autoColor) {
            this.colorInterval = setInterval(() => {
                this.randomizeColors();
            }, 8000);
        }
        
        // بدء الحركة
        this.animate();
        
        // تحديث عند تغيير حجم النافذة
        window.addEventListener('resize', () => this.resize());
    }

    createBlobs() {
        // تحديد عدد الفقاعات حسب الشدة
        const blobCount = this.intensity === 'high' ? 8 : this.intensity === 'medium' ? 6 : 4;
        
        for (let i = 0; i < blobCount; i++) {
            const blob = document.createElement('div');
            const size = 150 + Math.random() * 200;
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const delay = Math.random() * 10;
            const duration = 15 + Math.random() * 20;
            
            blob.className = `lava-blob blob-${i}`;
            blob.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.2));
                filter: blur(40px);
                opacity: 0.6;
                left: ${left}%;
                top: ${top}%;
                animation: lavaFloat ${duration}s infinite ease-in-out;
                animation-delay: ${delay}s;
                pointer-events: none;
            `;
            
            this.container.appendChild(blob);
            this.blobs.push({
                element: blob,
                x: left,
                y: top,
                size: size,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                phaseX: Math.random() * Math.PI * 2,
                phaseY: Math.random() * Math.PI * 2
            });
        }
        
        // إضافة أنيمشنات CSS
        this.addAnimationStyles();
    }

    addAnimationStyles() {
        if (document.getElementById('lava-lamp-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'lava-lamp-styles';
        style.textContent = `
            @keyframes lavaFloat {
                0% {
                    transform: translate(0, 0) scale(1);
                    opacity: 0.4;
                }
                25% {
                    transform: translate(${this.interactive ? '2%' : '3%'}, ${this.interactive ? '-3%' : '-4%'}) scale(1.05);
                    opacity: 0.6;
                }
                50% {
                    transform: translate(${this.interactive ? '-2%' : '-4%'}, ${this.interactive ? '3%' : '5%'}) scale(1.1);
                    opacity: 0.5;
                }
                75% {
                    transform: translate(${this.interactive ? '3%' : '2%'}, ${this.interactive ? '-2%' : '-3%'}) scale(1.02);
                    opacity: 0.7;
                }
                100% {
                    transform: translate(0, 0) scale(1);
                    opacity: 0.4;
                }
            }
        `;
        document.head.appendChild(style);
    }

    animate() {
        if (!this.enabled) return;
        
        // تحديث مواقع الفقاعات بناءً على الماوس
        if (this.interactive) {
            this.blobs.forEach((blob, index) => {
                const speed = (index + 1) * 0.03;
                const offsetX = (this.mouseX - 0.5) * 80 * speed;
                const offsetY = (this.mouseY - 0.5) * 80 * speed;
                
                blob.element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            });
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    randomizeColors() {
        const colorSchemes = [
            ['rgba(59, 130, 246, 0.4)', 'rgba(139, 92, 246, 0.2)'],   // أزرق/بنفسجي
            ['rgba(236, 72, 153, 0.35)', 'rgba(219, 39, 119, 0.2)'],  // وردي
            ['rgba(16, 185, 129, 0.35)', 'rgba(5, 150, 105, 0.2)'],   // أخضر
            ['rgba(245, 158, 11, 0.35)', 'rgba(217, 119, 6, 0.2)'],   // برتقالي
            ['rgba(168, 85, 247, 0.35)', 'rgba(124, 58, 237, 0.2)'],   // بنفسجي
            ['rgba(239, 68, 68, 0.35)', 'rgba(220, 38, 38, 0.2)']      // أحمر
        ];
        
        this.blobs.forEach((blob, index) => {
            const colors = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
            blob.element.style.background = `radial-gradient(circle at 30% 30%, ${colors[0]}, ${colors[1]})`;
        });
    }
    
    resize() {
        // إعادة توزيع الفقاعات عند تغيير حجم النافذة
        this.blobs.forEach(blob => {
            const newLeft = Math.min(Math.max(blob.x + (Math.random() - 0.5) * 10, 0), 100);
            const newTop = Math.min(Math.max(blob.y + (Math.random() - 0.5) * 10, 0), 100);
            blob.element.style.left = `${newLeft}%`;
            blob.element.style.top = `${newTop}%`;
            blob.x = newLeft;
            blob.y = newTop;
        });
    }
    
    stop() {
        this.enabled = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.colorInterval) {
            clearInterval(this.colorInterval);
            this.colorInterval = null;
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
    
    restart(options = {}) {
        this.stop();
        this.enabled = options.enabled !== false;
        this.intensity = options.intensity || this.intensity;
        this.interactive = options.interactive !== false;
        this.autoColor = options.autoColor !== false;
        
        if (this.enabled) {
            this.init();
        }
    }
}

// ============================================
// تهيئة Lava Lamp حسب إعدادات الخادم
// ============================================

let lavaLampInstance = null;

function initLavaLamp() {
    // الحصول على الإعدادات من الخادم
    const enableLava = typeof enableLavaLamp !== 'undefined' ? enableLavaLamp : true;
    const lavaOptions = typeof lavaLampOptions !== 'undefined' ? lavaLampOptions : { 
        intensity: 'medium', 
        interactive: true, 
        autoColor: true 
    };
    
    if (enableLava && !lavaLampInstance) {
        lavaLampInstance = new LavaLampController({
            enabled: true,
            intensity: lavaOptions.intensity || 'medium',
            interactive: lavaOptions.interactive !== false,
            autoColor: lavaOptions.autoColor !== false
        });
    } else if (!enableLava && lavaLampInstance) {
        lavaLampInstance.stop();
        lavaLampInstance = null;
    }
}

// دالة لتفعيل/إلغاء تفعيل Lava Lamp
window.toggleLavaLamp = function() {
    if (lavaLampInstance) {
        lavaLampInstance.stop();
        lavaLampInstance = null;
        console.log('🎨 تم إيقاف تأثير Lava Lamp');
    } else {
        lavaLampInstance = new LavaLampController({
            enabled: true,
            intensity: 'medium',
            interactive: true,
            autoColor: true
        });
        console.log('🎨 تم تفعيل تأثير Lava Lamp');
    }
};

// دالة لتغيير سرعة الحركة
window.setLavaSpeed = function(speed) {
    const blobs = document.querySelectorAll('.lava-blob');
    const duration = 20 / speed;
    blobs.forEach(blob => {
        blob.style.animationDuration = `${duration}s`;
    });
};

// دالة لتغيير شدة التأثير
window.setLavaIntensity = function(intensity) {
    if (lavaLampInstance) {
        const currentOptions = {
            enabled: true,
            intensity: intensity,
            interactive: lavaLampInstance.interactive,
            autoColor: lavaLampInstance.autoColor
        };
        lavaLampInstance.restart(currentOptions);
    }
};

// تهيئة Lava Lamp عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initLavaLamp();
    console.log('✨ تأثير Lava Lamp جاهز للعمل');
});

// تصدير للاستخدام العالمي
window.LavaLampController = LavaLampController;
window.initLavaLamp = initLavaLamp;