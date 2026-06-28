const HeroGallery = (() => {
    'use strict';

    const SLIDES = [
        { name: 'Mona Lisa',                 src: 'assets/gallery/mona_lisa.png',     preset: 'detailed', bgChars: '@#%&' },
        { name: 'The Starry Night',           src: 'assets/gallery/starry_night.png',  preset: 'classic',  bgChars: '.*+~' },
        { name: 'The Great Wave',             src: 'assets/gallery/great_wave.png',    preset: 'terminal', bgChars: '░▒▓~' },
        { name: 'Girl with a Pearl Earring',  src: 'assets/gallery/pearl_earring.png', preset: 'detailed', bgChars: '.·°*' },
        { name: 'The Scream',                 src: 'assets/gallery/the_scream.png',    preset: 'classic',  bgChars: '!?~@' },
        { name: 'Earth from Space',           src: 'assets/gallery/earth_space.png',   preset: 'terminal', bgChars: '·*+°' },
        { name: 'Tiger',                      src: 'assets/gallery/tiger.png',         preset: 'pixel',    bgChars: '▓▒█░' },
        { name: 'Eagle',                      src: 'assets/gallery/eagle.png',         preset: 'classic',  bgChars: '#*+=' },
        { name: 'Taj Mahal',                  src: 'assets/gallery/taj_mahal.png',     preset: 'detailed', bgChars: '.·▫□' },
    ];

    let currentIndex = 0;
    let autoplayTimer = null;
    let isHovering = false;
    let slidesData = [];
    let totalChars = 0;
    let totalTime = 0;
    let isAnimating = false;
    let touchStartX = 0;
    let touchEndX = 0;

    let container, compOriginal, compAscii, compSlider, compWrapper;
    let infoName, infoPreset, infoChars, infoTime;
    let dotsContainer;
    let metricImages, metricChars, metricTime, metricAccuracy;

    const AUTOPLAY_INTERVAL = 6000;
    const ANIMATION_DURATION = 1000;
    const ASCII_WIDTH = 100;

    async function init() {
        container = document.getElementById('heroGallery');
        if (!container) return;

        compWrapper   = container.querySelector('.hero-gallery__comparison');
        compOriginal  = container.querySelector('.hero-gallery__comp-original');
        compAscii     = container.querySelector('.hero-gallery__comp-ascii');
        compSlider    = container.querySelector('.hero-gallery__comp-slider');
        infoName      = container.querySelector('.hero-gallery__info-name');
        infoPreset    = container.querySelector('.hero-gallery__info-preset');
        infoChars     = container.querySelector('.hero-gallery__info-chars');
        infoTime      = container.querySelector('.hero-gallery__info-time');
        dotsContainer = container.querySelector('.hero-gallery__dots');

        metricImages   = document.getElementById('metricImages');
        metricChars    = document.getElementById('metricChars');
        metricTime     = document.getElementById('metricTime');
        metricAccuracy = document.getElementById('metricAccuracy');

        buildDots();
        await preloadAllSlides();
        showSlide(0, false);
        startAutoplay();
        bindSliderInteraction();
        bindNavigation();
        bindKeyboard();
        bindTouch();
        bindHover();
        observeMetrics();

        window.addEventListener('resize', () => {
            const data = slidesData[currentIndex];
            if (data) {
                const pre = compAscii.querySelector('pre');
                if (pre) scaleAsciiPre(pre);
            }
        });
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    async function preloadAllSlides() {
        const promises = SLIDES.map(async (slide) => {
            try {
                const img = await loadImage(slide.src);
                const result = AsciiEngine.convert(img, {
                    width: ASCII_WIDTH,
                    preset: slide.preset,
                    contrast: 110,
                    brightness: 105,
                });
                totalChars += result.chars;
                totalTime += parseFloat(result.time);
                return { img, asciiResult: result, slide };
            } catch (e) {
                console.warn(`Failed to load: ${slide.src}`, e);
                return null;
            }
        });

        const results = await Promise.all(promises);
        slidesData = results.filter(Boolean);

        if (metricImages)   metricImages.dataset.target = slidesData.length;
        if (metricChars)    metricChars.dataset.target = totalChars;
        if (metricTime)     metricTime.dataset.target = (totalTime / slidesData.length).toFixed(0);
        if (metricAccuracy) metricAccuracy.dataset.target = 100;
    }

    function buildDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        SLIDES.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'hero-gallery__dot';
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });
    }

    function updateDots() {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.hero-gallery__dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
    }

    function showSlide(index, animate = true) {
        if (!slidesData.length) return;
        if (isAnimating && animate) return;

        currentIndex = ((index % slidesData.length) + slidesData.length) % slidesData.length;
        const data = slidesData[currentIndex];
        if (!data) return;

        updateDots();
        updateBackground(data.slide);

        if (animate) {
            isAnimating = true;
            compWrapper.classList.add('hero-gallery__comparison--fading');

            setTimeout(() => {
                renderSlideContent(data);
                compWrapper.classList.remove('hero-gallery__comparison--fading');
                compWrapper.classList.add('hero-gallery__comparison--entering');
                animateAsciiConversion(data);

                setTimeout(() => {
                    compWrapper.classList.remove('hero-gallery__comparison--entering');
                    isAnimating = false;
                }, ANIMATION_DURATION);
            }, 300);
        } else {
            renderSlideContent(data);
            renderAsciiImmediate(data);
        }
    }

    function renderSlideContent(data) {
        compOriginal.innerHTML = '';
        const img = data.img.cloneNode();
        img.alt = data.slide.name;
        img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block';
        compOriginal.appendChild(img);

        compWrapper.style.aspectRatio = `${data.img.naturalWidth} / ${data.img.naturalHeight}`;

        if (infoName) infoName.textContent = data.slide.name;
        if (infoPreset) infoPreset.textContent = data.slide.preset.charAt(0).toUpperCase() + data.slide.preset.slice(1) + ' Preset';
        if (infoChars) infoChars.textContent = data.asciiResult.chars.toLocaleString() + ' Characters';
        if (infoTime) infoTime.textContent = 'Rendered in ' + data.asciiResult.time + 'ms';

        updateCompSlider(50);
    }

    function renderAsciiImmediate(data) {
        compAscii.innerHTML = '';
        const pre = createAsciiPre(data);
        UI.renderColored(pre, data.asciiResult.colored);
        compAscii.appendChild(pre);
        scaleAsciiPre(pre);
    }

    function animateAsciiConversion(data) {
        compAscii.innerHTML = '';
        const pre = createAsciiPre(data);
        compAscii.appendChild(pre);

        const text = data.asciiResult.text;
        const lines = text.split('\n');
        const totalLines = lines.length;
        let currentLine = 0;

        pre.textContent = lines.map(l => ' '.repeat(l.length)).join('\n');
        scaleAsciiPre(pre);

        function revealLine() {
            if (currentLine >= totalLines) {
                UI.renderColored(pre, data.asciiResult.colored);
                return;
            }

            if (currentLine < totalLines) {
                const batchSize = Math.max(1, Math.ceil(totalLines / (ANIMATION_DURATION / 16)));
                for (let b = 1; b < batchSize && currentLine < totalLines; b++) {
                    currentLine++;
                }
                const revealedBatch = lines.slice(0, currentLine);
                const hiddenBatch = lines.slice(currentLine).map(l => {
                    return l.split('').map(c => c === ' ' ? ' ' : String.fromCharCode(33 + Math.floor(Math.random() * 94))).join('');
                });
                pre.textContent = [...revealedBatch, ...hiddenBatch].join('\n');
                requestAnimationFrame(revealLine);
            } else {
                UI.renderColored(pre, data.asciiResult.colored);
            }
        }
        requestAnimationFrame(revealLine);
    }

    function createAsciiPre(data) {
        const pre = document.createElement('pre');
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FFFFFF';
        pre.style.cssText = `
            font-family: var(--font-ui);
            font-size: 10px;
            line-height: 1.05;
            white-space: pre;
            margin: 0;
            padding: 0;
            color: ${accent};
            background: #0A0A0A;
            position: absolute;
            left: 50%;
            top: 50%;
            transform-origin: center center;
        `;
        return pre;
    }

    function scaleAsciiPre(pre) {
        pre.style.transform = 'none';
        requestAnimationFrame(() => {
            const preW = pre.offsetWidth || pre.scrollWidth;
            const preH = pre.offsetHeight || pre.scrollHeight;
            const contW = compAscii.clientWidth;
            const contH = compAscii.clientHeight;
            if (preW > 0 && preH > 0 && contW > 0 && contH > 0) {
                const scale = Math.min(contW / preW, contH / preH);
                pre.style.transform = `translate(-50%, -50%) scale(${scale})`;
            } else {
                pre.style.transform = 'translate(-50%, -50%)';
            }
        });
    }

    function updateCompSlider(pct) {
        if (!compSlider || !compAscii) return;
        compSlider.style.left = pct + '%';
        compAscii.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    }

    function bindSliderInteraction() {
        if (!compSlider || !compWrapper) return;

        let dragging = false;

        compSlider.addEventListener('mousedown', (e) => { e.preventDefault(); dragging = true; });
        compSlider.addEventListener('touchstart', (e) => { dragging = true; }, { passive: true });

        document.addEventListener('mouseup', () => dragging = false);
        document.addEventListener('touchend', () => dragging = false);

        function moveSlider(clientX) {
            const rect = compWrapper.getBoundingClientRect();
            let pct = ((clientX - rect.left) / rect.width) * 100;
            pct = Math.max(5, Math.min(95, pct));
            updateCompSlider(pct);
        }

        document.addEventListener('mousemove', (e) => { if (dragging) moveSlider(e.clientX); });
        document.addEventListener('touchmove', (e) => { if (dragging) moveSlider(e.touches[0].clientX); }, { passive: true });

        compWrapper.addEventListener('dblclick', () => {
            updateCompSlider(50);
        });
    }

    function goToSlide(index) {
        resetAutoplay();
        showSlide(index);
    }

    function nextSlide() {
        resetAutoplay();
        showSlide(currentIndex + 1);
    }

    function prevSlide() {
        resetAutoplay();
        showSlide(currentIndex - 1);
    }

    function bindNavigation() {
        const prevBtn = container.querySelector('.hero-gallery__nav-prev');
        const nextBtn = container.querySelector('.hero-gallery__nav-next');
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    }

    function bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (!container || !isElementInViewport(container)) return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextSlide();
            }
        });
    }

    function bindTouch() {
        if (!compWrapper) return;
        compWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        compWrapper.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) nextSlide();
                else prevSlide();
            }
        }, { passive: true });
    }

    function bindHover() {
        if (!container) return;
        container.addEventListener('mouseenter', () => {
            isHovering = true;
            stopAutoplay();
        });
        container.addEventListener('mouseleave', () => {
            isHovering = false;
            startAutoplay();
        });
    }

    function startAutoplay() {
        if (isHovering) return;
        stopAutoplay();
        autoplayTimer = setInterval(() => {
            if (!isHovering && !isAnimating) {
                showSlide(currentIndex + 1);
            }
        }, AUTOPLAY_INTERVAL);
    }

    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function resetAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    function updateBackground(slide) {
        const heroSection = document.getElementById('hero');
        if (!heroSection) return;
        heroSection.dataset.galleryChars = slide.bgChars || '';
    }

    function observeMetrics() {
        const metricsSection = document.getElementById('heroMetrics');
        if (!metricsSection) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateMetrics();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.3 });

        observer.observe(metricsSection);
    }

    function animateMetrics() {
        const counters = document.querySelectorAll('.hero-metric__value[data-target]');
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.target);
            const suffix = counter.dataset.suffix || '';
            const prefix = counter.dataset.prefix || '';
            const duration = 1500;
            const start = performance.now();

            function update(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(eased * target);
                counter.textContent = prefix + current.toLocaleString() + suffix;

                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }
            requestAnimationFrame(update);
        });
    }

    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    }

    function getBackgroundChars() {
        if (!slidesData.length) return '';
        return slidesData[currentIndex]?.slide?.bgChars || '';
    }

    return { init, getBackgroundChars };
})();
