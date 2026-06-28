const UI = (() => {

    function toast(message, type = 'success') {
        const el = document.createElement('div');
        el.className = `toast toast--${type}`;
        el.innerHTML = `<span class="toast__icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span><span>${message}</span>`;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('toast--visible'));
        setTimeout(() => {
            el.classList.remove('toast--visible');
            setTimeout(() => el.remove(), 400);
        }, 2600);
    }

    function scrollTo(id) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function typeReveal(container, text, maxDuration = 600) {
        container.textContent = '';
        const fragment = document.createDocumentFragment();
        const pre = document.createElement('span');
        fragment.appendChild(pre);
        container.appendChild(fragment);

        const len = text.length;
        const totalFrames = Math.max(1, Math.floor(maxDuration / 16));
        const chunkSize = Math.max(1, Math.ceil(len / totalFrames));
        let pos = 0;

        function step() {
            const end = Math.min(pos + chunkSize, len);
            pre.textContent += text.slice(pos, end);
            pos = end;
            if (pos < len) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function renderColored(container, coloredLines) {
        container.innerHTML = '';
        const frag = document.createDocumentFragment();
        for (const line of coloredLines) {
            for (const { char, color } of line) {
                if (char === ' ') {
                    frag.appendChild(document.createTextNode(' '));
                } else {
                    const span = document.createElement('span');
                    span.style.color = color;
                    span.textContent = char;
                    frag.appendChild(span);
                }
            }
            frag.appendChild(document.createTextNode('\n'));
        }
        container.appendChild(frag);
    }

    function showLoading(container) {
        const existing = container.querySelector('.loading-bar');
        if (existing) return existing;
        const bar = document.createElement('div');
        bar.className = 'loading-bar';
        bar.innerHTML = `
            <div class="loading-bar__label">Converting Image...</div>
            <div class="loading-bar__track"><div class="loading-bar__fill"></div></div>
            <div class="loading-bar__ascii">[██████████░░░░░░░░░░] 50%</div>`;
        container.appendChild(bar);
        return bar;
    }

    function hideLoading(container) {
        const bar = container.querySelector('.loading-bar');
        if (bar) bar.remove();
    }

    function openAbout() {
        const overlay = document.getElementById('aboutModal');
        if (overlay) {
            overlay.classList.add('modal--open');
            overlay.setAttribute('aria-hidden', 'false');
        }
    }
    
    function closeAbout() {
        const overlay = document.getElementById('aboutModal');
        if (overlay) {
            overlay.classList.remove('modal--open');
            overlay.setAttribute('aria-hidden', 'true');
        }
    }

    function toggleFullscreen(element) {
        if (!document.fullscreenElement) {
            element.requestFullscreen?.() || element.webkitRequestFullscreen?.();
        } else {
            document.exitFullscreen?.() || document.webkitExitFullscreen?.();
        }
    }

    function debounce(fn, delay = 150) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }

    function initParticles(canvasEl) {
        const ctx = canvasEl.getContext('2d');
        const baseChars = '@#$%&*+=~<>[]{}|/\\!?;:,.\'"`^_-░▒▓█';
        const particles = [];
        const COUNT = 60;

        function resize() {
            canvasEl.width = canvasEl.parentElement.offsetWidth;
            canvasEl.height = canvasEl.parentElement.offsetHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        for (let i = 0; i < COUNT; i++) {
            particles.push({
                x: Math.random() * canvasEl.width,
                y: Math.random() * canvasEl.height,
                char: baseChars[Math.floor(Math.random() * baseChars.length)],
                speed: 0.15 + Math.random() * 0.4,
                opacity: 0.05 + Math.random() * 0.15,
                size: 10 + Math.random() * 14,
            });
        }

        function draw() {
            ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
            ctx.font = '14px "JetBrains Mono", monospace';

            let activeChars = baseChars;
            try {
                const galleryChars = typeof HeroGallery !== 'undefined' ? HeroGallery.getBackgroundChars() : '';
                if (galleryChars && galleryChars.length > 0) {
                    activeChars = galleryChars.repeat(3) + baseChars.slice(0, 10);
                }
            } catch (e) {}

            for (const p of particles) {
                ctx.globalAlpha = p.opacity;
                const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FFFFFF';
                ctx.fillStyle = accent;
                ctx.font = `${p.size}px "JetBrains Mono", monospace`;
                ctx.fillText(p.char, p.x, p.y);
                p.y -= p.speed;
                if (p.y < -20) {
                    p.y = canvasEl.height + 20;
                    p.x = Math.random() * canvasEl.width;
                    p.char = activeChars[Math.floor(Math.random() * activeChars.length)];
                }
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(draw);
        }
        draw();
    }

    function initTheme() {
        const saved = localStorage.getItem('glyphlab-theme') || 'white';
        applyTheme(saved);

        const btn = document.getElementById('themeToggleBtn');
        const dropdown = document.getElementById('themeDropdown');
        if (!btn || !dropdown) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        document.addEventListener('click', () => dropdown.classList.remove('open'));

        dropdown.querySelectorAll('.theme-option').forEach(opt => {
            opt.addEventListener('click', () => {
                applyTheme(opt.dataset.theme);
                dropdown.classList.remove('open');
            });
        });
    }

    function applyTheme(name) {
        if (name === 'white') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', name);
        }
        localStorage.setItem('glyphlab-theme', name);
    }

    const AOTD_GALLERY = [
        {
            title: 'Crescent Moon',
            art: `
                    @@@@@@@@               
                @@@@@@@@@@@@@@@@           
              @@@@@@@@@@@@@@@@@@@@         
            @@@@@@@@@@@@@@@@@@              
           @@@@@@@@@@@@@@@@@                
          @@@@@@@@@@@@@@@@@                 
         @@@@@@@@@@@@@@@@@@                 
         @@@@@@@@@@@@@@@@@@                 
         @@@@@@@@@@@@@@@@@@                 
          @@@@@@@@@@@@@@@@@                 
           @@@@@@@@@@@@@@@@@                
            @@@@@@@@@@@@@@@@@@              
              @@@@@@@@@@@@@@@@@@@@         
                @@@@@@@@@@@@@@@@           
                    @@@@@@@@               `
        },
        {
            title: 'Pixel Cat',
            art: `
        /\\_/\\    ___________________
       ( o.o )  |                   |
        > ^ <   | Hello from        |
       /|   |\\  | GLYPHLAB!         |
      (_|   |_) |___________________|
        |   |  /
        |___|_/
        (_____)
         |   |
        _|   |_
       (_____)  `
        },
        {
            title: 'Retro Computer',
            art: `
         .----------------------------.
         |     ____________________   |
         |    |                    |  |
         |    |   C:\\>GLYPHLAB_    |  |
         |    |   LOADING...      |  |
         |    |   [████████████]  |  |
         |    |   READY.          |  |
         |    |____________________|  |
         |   ________________________|
         |  /  ____      ____        /
         | /  |    |    |    |      /
         |/   |____|    |____|     /
          '----------------------------'`
        },
        {
            title: 'Planet Earth',
            art: `
               ,,,,,,,,,,,,,,,,
           ,,,@@@@@@@@@@@@@@@@,,,
         ,,@@@@@@  @@@@@@  @@@@@@,,
       ,,@@@@     @@@@@@     @@@@@@,,
      ,@@@@   @@@@@@@@@@@@@   @@@@@@,
     ,@@@   @@@@@@@@@@@@@@@@@   @@@@@,
     ,@@  @@@@@@@@@@@@@@@@@@@@@  @@@@,
     ,@@  @@@@@@@@@@@@@@@@@@@@@  @@@@,
     ,@@@   @@@@@@@@@@@@@@@@@   @@@@@,
      ,@@@@   @@@@@@@@@@@@@   @@@@@@,
       ,,@@@@     @@@@@@     @@@@@@,,
         ,,@@@@@@  @@@@@@  @@@@@@,,
           ,,,@@@@@@@@@@@@@@@@,,,
               ,,,,,,,,,,,,,,,,`
        },
        {
            title: 'Skull',
            art: `
            ██████████████████
          ██                  ██
        ██   ████████████████   ██
       ██  ██                ██  ██
      ██  ██  ████    ████  ██  ██
      ██  ██  ████    ████  ██  ██
      ██  ██                ██  ██
       ██  ██    ████████  ██  ██
        ██   ██          ██   ██
          ██   ██ ██ ██ ██  ██
            ██   ██  ██   ██
              ████████████`
        }
    ];

    function initAOTD() {
        const artEl = document.getElementById('aotdArt');
        const captionEl = document.getElementById('aotdCaption');
        const dateEl = document.getElementById('aotdDate');
        if (!artEl || !captionEl) return;

        const pick = AOTD_GALLERY[Math.floor(Math.random() * AOTD_GALLERY.length)];
        artEl.textContent = pick.art;
        captionEl.textContent = `"${pick.title}" — ASCII Art`;

        const now = new Date();
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        dateEl.textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    }

    let webcamStream = null;
    let webcamInterval = null;
    let lastAsciiFrame = '';
    const webcamCanvas = document.createElement('canvas');
    const webcamCtx = webcamCanvas.getContext('2d', { willReadFrequently: true });

    let isRecording = false;
    let mediaRecorder = null;
    let recordedChunks = [];
    let recordCanvas = null;
    let recordCtx = null;
    let recordAnimFrame = null;
    let recordStartTime = 0;

    let capturedAscii = '';
    let capturedVideoBlob = null;
    let capturedVideoUrl = null;
    let capturedTimestamp = '';

    function initWebcam() {
        const startBtn = document.getElementById('webcamStartBtn');
        const stopBtn = document.getElementById('webcamStopBtn');
        const captureBtn = document.getElementById('webcamCaptureBtn');
        const timerSelect = document.getElementById('webcamTimerSelect');
        const timerBtn = document.getElementById('webcamTimerBtn');
        const recordBtn = document.getElementById('webcamRecordBtn');
        const recordStopBtn = document.getElementById('webcamRecordStopBtn');

        const saveTxtBtn = document.getElementById('saveTxtBtn');
        const savePngBtn = document.getElementById('savePngBtn');
        const saveVideoBtn = document.getElementById('saveVideoBtn');

        if (startBtn) startBtn.addEventListener('click', startWebcam);
        if (stopBtn) stopBtn.addEventListener('click', stopWebcam);
        if (captureBtn) captureBtn.addEventListener('click', captureFrame);
        if (timerBtn) timerBtn.addEventListener('click', () => {
            const seconds = parseInt(timerSelect?.value || '3');
            startTimer(seconds);
        });
        if (recordBtn) recordBtn.addEventListener('click', startRecording);
        if (recordStopBtn) recordStopBtn.addEventListener('click', stopRecording);

        if (saveTxtBtn) saveTxtBtn.addEventListener('click', saveCaptureTxt);
        if (savePngBtn) savePngBtn.addEventListener('click', saveCapturePng);
        if (saveVideoBtn) saveVideoBtn.addEventListener('click', saveCaptureVideo);
    }

    async function startWebcam() {
        const video = document.getElementById('webcamVideo');
        const output = document.getElementById('webcamAsciiOutput');
        const empty = document.getElementById('webcamEmpty');
        const status = document.getElementById('webcamStatus');
        const startBtn = document.getElementById('webcamStartBtn');
        const stopBtn = document.getElementById('webcamStopBtn');
        const actionBar = document.getElementById('webcamActionBar');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast('Webcam access requires a secure context (http://localhost or https). If you opened this file directly, please run a local server.', 'error');
            console.error('navigator.mediaDevices.getUserMedia is not supported on this context (e.g. file:// protocol or non-localhost HTTP).');
            return;
        }

        try {
            webcamStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 320 }, height: { ideal: 240 } }
            });
            video.srcObject = webcamStream;
            
            const startRenderLoop = () => {
                if (!webcamInterval) {
                    webcamInterval = setInterval(() => renderWebcamFrame(video, output), 100);
                }
            };

            video.onloadedmetadata = startRenderLoop;
            video.onplay = startRenderLoop;
            
            await video.play();
            video.style.display = 'none';
            empty.style.display = 'none';
            output.classList.add('active');
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
            if (actionBar) actionBar.style.display = 'flex';
            status.textContent = 'Camera Active';
            status.classList.add('active');

            if (video.videoWidth > 0 || video.readyState >= 2) {
                startRenderLoop();
            }
        } catch (err) {
            console.error('Camera access error:', err);
            toast(`Camera access error: ${err.message || 'Denied or unavailable.'}`, 'error');
        }
    }

    function renderWebcamFrame(video, output) {
        if (!video.videoWidth) return;
        const cols = 120;
        const aspectRatio = video.videoHeight / video.videoWidth;
        const rows = Math.round(cols * aspectRatio * 0.55);

        webcamCanvas.width = cols;
        webcamCanvas.height = rows;
        webcamCtx.drawImage(video, 0, 0, cols, rows);

        const imageData = webcamCtx.getImageData(0, 0, cols, rows);
        const pixels = imageData.data;
        const chars = ' .:-=+*#%@';
        let ascii = '';

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const idx = (y * cols + x) * 4;
                const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                const ci = Math.min(chars.length - 1, Math.floor((lum / 255) * (chars.length - 1)));
                ascii += chars[ci];
            }
            ascii += '\n';
        }
        output.textContent = ascii;
        lastAsciiFrame = ascii;
    }

    function stopWebcam() {
        if (isRecording) stopRecording();

        if (webcamInterval) { clearInterval(webcamInterval); webcamInterval = null; }
        if (webcamStream) {
            webcamStream.getTracks().forEach(t => t.stop());
            webcamStream = null;
        }
        const video = document.getElementById('webcamVideo');
        const output = document.getElementById('webcamAsciiOutput');
        const empty = document.getElementById('webcamEmpty');
        const status = document.getElementById('webcamStatus');
        const startBtn = document.getElementById('webcamStartBtn');
        const stopBtn = document.getElementById('webcamStopBtn');
        const actionBar = document.getElementById('webcamActionBar');

        if (video) { video.srcObject = null; video.style.display = 'none'; }
        if (output) { output.classList.remove('active'); output.textContent = ''; }
        if (empty) empty.style.display = 'flex';
        if (startBtn) startBtn.style.display = 'inline-flex';
        if (stopBtn) stopBtn.style.display = 'none';
        if (actionBar) actionBar.style.display = 'none';
        if (status) { status.textContent = 'Camera Stopped'; status.classList.remove('active'); }
        lastAsciiFrame = '';
    }

    function captureFrame() {
        if (!lastAsciiFrame) { toast('No live frame to capture.', 'error'); return; }

        const preview = document.getElementById('webcamPreview');
        if (preview) {
            preview.classList.add('cam-flash');
            setTimeout(() => preview.classList.remove('cam-flash'), 400);
        }

        openCapturePreview('image', lastAsciiFrame);
        toast('📸 Frame captured!');
    }

    function renderCapturePNG(ascii, timestamp) {
        const lines = ascii.split('\n').filter(l => l.length > 0);
        const fontSize = 10;
        const lineHeight = fontSize * 1.2;
        const charWidth = fontSize * 0.6;
        const padding = 20;
        const maxCols = Math.max(...lines.map(l => l.length));

        const c = document.createElement('canvas');
        c.width = maxCols * charWidth + padding * 2;
        c.height = lines.length * lineHeight + padding * 2;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.font = `${fontSize}px "JetBrains Mono", "Courier New", monospace`;
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FFFFFF';

        lines.forEach((line, i) => {
            ctx.fillText(line, padding, padding + (i + 1) * lineHeight);
        });

        c.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `glyphlab-capture-${timestamp}.png`;
            a.click();
            URL.revokeObjectURL(url);
            toast('💾 PNG image saved!');
        }, 'image/png');
    }

    function openCapturePreview(type, data, rawBlob = null) {
        const modal = document.getElementById('capturePreviewModal');
        const title = document.getElementById('captureModalTitle');
        const imgPrev = document.getElementById('captureImagePreview');
        const asciiText = document.getElementById('captureAsciiText');
        const vidPrev = document.getElementById('captureVideoPreview');
        const vidEl = document.getElementById('captureVideoElement');

        const saveTxtBtn = document.getElementById('saveTxtBtn');
        const savePngBtn = document.getElementById('savePngBtn');
        const saveVideoBtn = document.getElementById('saveVideoBtn');

        if (!modal) return;

        imgPrev.style.display = 'none';
        vidPrev.style.display = 'none';
        if (vidEl) { vidEl.src = ''; }
        if (saveTxtBtn) saveTxtBtn.style.display = 'none';
        if (savePngBtn) savePngBtn.style.display = 'none';
        if (saveVideoBtn) saveVideoBtn.style.display = 'none';

        capturedTimestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

        if (type === 'image') {
            if (title) title.textContent = '📸 Captured Snapshot';
            capturedAscii = data;
            if (asciiText) asciiText.textContent = data;
            imgPrev.style.display = 'block';
            if (saveTxtBtn) saveTxtBtn.style.display = 'inline-flex';
            if (savePngBtn) savePngBtn.style.display = 'inline-flex';
        } else if (type === 'video') {
            if (title) title.textContent = '🎬 Captured Recording';
            capturedVideoUrl = data;
            capturedVideoBlob = rawBlob;
            if (vidEl) {
                vidEl.src = data;
                vidEl.load();
                vidEl.play().catch(() => {});
            }
            vidPrev.style.display = 'block';
            if (saveVideoBtn) saveVideoBtn.style.display = 'inline-flex';
        }

        modal.classList.add('modal--open');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeCapturePreview() {
        const modal = document.getElementById('capturePreviewModal');
        if (!modal) return;
        modal.classList.remove('modal--open');
        modal.setAttribute('aria-hidden', 'true');

        if (capturedVideoUrl) {
            URL.revokeObjectURL(capturedVideoUrl);
            capturedVideoUrl = null;
        }
        capturedVideoBlob = null;
        capturedAscii = '';
        const vidEl = document.getElementById('captureVideoElement');
        if (vidEl) vidEl.src = '';
    }

    function saveCaptureTxt() {
        if (!capturedAscii) return;
        const blob = new Blob([capturedAscii], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glyphlab-capture-${capturedTimestamp}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast('💾 ASCII text saved!');
    }

    function saveCapturePng() {
        if (!capturedAscii) return;
        renderCapturePNG(capturedAscii, capturedTimestamp);
    }

    // Keep this comment, or remove it as well: 
    function saveCaptureVideo() {
        if (!capturedVideoBlob) return;
        const a = document.createElement('a');
        a.href = capturedVideoUrl;
        a.download = `glyphlab-recording-${capturedTimestamp}.webm`;
        a.click();
        toast('💾 Video saved!');
    }

    let timerCountdown = null;

    function startTimer(seconds) {
        if (!webcamStream) { toast('Start the camera first.', 'error'); return; }
        if (timerCountdown) return;

        const overlay = document.getElementById('webcamTimerOverlay');
        const countEl = document.getElementById('webcamTimerCount');
        if (!overlay || !countEl) return;

        let remaining = seconds;
        overlay.classList.add('active');
        countEl.textContent = remaining;

        timerCountdown = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(timerCountdown);
                timerCountdown = null;
                overlay.classList.remove('active');
                captureFrame();
            } else {
                countEl.textContent = remaining;
            }
        }, 1000);
    }

    function startRecording() {
        if (!webcamStream) { toast('Start the camera first.', 'error'); return; }
        if (isRecording) return;

        const output = document.getElementById('webcamAsciiOutput');
        const recordBtn = document.getElementById('webcamRecordBtn');
        const recordStopBtn = document.getElementById('webcamRecordStopBtn');
        const recordTimer = document.getElementById('webcamRecordTimer');

        recordCanvas = document.createElement('canvas');
        const fontSize = 10;
        const lineHeight = fontSize * 1.2;
        const charWidth = fontSize * 0.6;
        const cols = 120;
        const lines = lastAsciiFrame.split('\n').filter(l => l.length > 0);
        const rows = lines.length || 36;

        recordCanvas.width = Math.max(cols * charWidth + 40, 800);
        recordCanvas.height = Math.max(rows * lineHeight + 40, 500);
        recordCtx = recordCanvas.getContext('2d');

        const stream = recordCanvas.captureStream(10);
        try {
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 2500000,
            });
        } catch {
            try {
                mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            } catch {
                toast('Recording not supported in this browser.', 'error');
                return;
            }
        }

        recordedChunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            openCapturePreview('video', url, blob);
        };

        mediaRecorder.start(100);
        isRecording = true;
        recordStartTime = Date.now();

        if (recordBtn) recordBtn.style.display = 'none';
        if (recordStopBtn) recordStopBtn.style.display = 'inline-flex';
        if (recordTimer) { recordTimer.style.display = 'inline'; recordTimer.textContent = '00:00'; }

        function renderRecordFrame() {
            if (!isRecording) return;
            const ctx = recordCtx;
            const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FFFFFF';
            ctx.fillStyle = '#0A0A0A';
            ctx.fillRect(0, 0, recordCanvas.width, recordCanvas.height);
            ctx.font = `${fontSize}px "JetBrains Mono", "Courier New", monospace`;
            ctx.fillStyle = accent;

            const frameLines = (output.textContent || '').split('\n');
            frameLines.forEach((line, i) => {
                ctx.fillText(line, 20, 20 + (i + 1) * lineHeight);
            });

            if (recordTimer) {
                const elapsed = Math.floor((Date.now() - recordStartTime) / 1000);
                const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
                const secs = String(elapsed % 60).padStart(2, '0');
                recordTimer.textContent = `${mins}:${secs}`;
            }

            recordAnimFrame = requestAnimationFrame(renderRecordFrame);
        }
        renderRecordFrame();

        toast('🔴 Recording started...');
    }

    function stopRecording() {
        if (!isRecording) return;
        isRecording = false;

        if (recordAnimFrame) { cancelAnimationFrame(recordAnimFrame); recordAnimFrame = null; }
        if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();

        const recordBtn = document.getElementById('webcamRecordBtn');
        const recordStopBtn = document.getElementById('webcamRecordStopBtn');
        const recordTimer = document.getElementById('webcamRecordTimer');

        if (recordBtn) recordBtn.style.display = 'inline-flex';
        if (recordStopBtn) recordStopBtn.style.display = 'none';
        if (recordTimer) recordTimer.style.display = 'none';
    }

    return {
        toast, scrollTo, typeReveal, renderColored,
        showLoading, hideLoading,
        openAbout, closeAbout,
        toggleFullscreen, debounce, initParticles,
        initTheme, applyTheme, initAOTD,
        initWebcam, startWebcam, stopWebcam,
        captureFrame, startTimer, startRecording, stopRecording,
        openCapturePreview, closeCapturePreview,
    };
})();
