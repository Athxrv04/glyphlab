(function () {
    'use strict';

    const state = {
        image: null,
        result: null,
        zoomLevel: 1,
        fileName: '',
        fileSize: 0,
        isNewUpload: false,
        previewMode: 'standard',
    };

    const $ = (id) => document.getElementById(id);
    const uploadZone = $('uploadZone');
    const fileInput = $('fileInput');
    const densitySlider = $('densitySlider');
    const fontSlider = $('fontSlider');
    const contrastSlider = $('contrastSlider');
    const brightnessSlider = $('brightnessSlider');
    const presetSelect = $('presetSelect');
    const customChars = $('customChars');
    const invertToggle = $('invertToggle');
    const coloredToggle = $('coloredToggle');
    const bgSelect = $('bgSelect');
    const asciiOutput = $('asciiOutput');
    const asciiEmpty = $('asciiEmpty');
    const asciiBody = $('asciiBody');
    const originalBody = $('originalBody');
    const statsBar = $('statsBar');
    const dragOverlay = $('dragOverlay');

    function init() {
        UI.initTheme();
        bindUpload();
        bindControls();
        bindExport();
        bindKeyboard();
        bindZoom();
        bindComparison();
        bindPreviewModeSwitch();
        bindAboutModal();
    }

    function bindUpload() {
        const VALID_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        const MAX_SIZE = 20 * 1024 * 1024;

        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) handleFile(e.target.files[0]);
        });

        uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('upload--dragover'); });
        uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('upload--dragover'));
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault(); uploadZone.classList.remove('upload--dragover');
            dragOverlay.classList.remove('visible');
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        });

        let dragCounter = 0;
        document.addEventListener('dragenter', (e) => { e.preventDefault(); dragCounter++; dragOverlay.classList.add('visible'); });
        document.addEventListener('dragleave', (e) => { e.preventDefault(); dragCounter--; if (dragCounter <= 0) { dragCounter = 0; dragOverlay.classList.remove('visible'); } });
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => {
            e.preventDefault(); dragCounter = 0; dragOverlay.classList.remove('visible');
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        });

        document.addEventListener('paste', (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith('image/')) { handleFile(item.getAsFile()); break; }
            }
        });

        function handleFile(file) {
            if (!VALID_TYPES.includes(file.type)) { UI.toast('Unsupported format. Use PNG, JPG, or WEBP.', 'error'); return; }
            if (file.size > MAX_SIZE) { UI.toast('Image too large (max 20 MB).', 'error'); return; }
            if (file.size > 10 * 1024 * 1024) UI.toast('Large image — conversion may take a moment.', 'info');
            state.fileName = file.name;
            state.fileSize = file.size;
            state.isNewUpload = true;
            const reader = new FileReader();
            reader.onload = (ev) => loadImage(ev.target.result);
            reader.readAsDataURL(file);
        }
    }

    function loadImage(src) {
        const img = new Image();
        img.onload = () => {
            state.image = img;
            showOriginal(img);
            runConversion();
            UI.scrollTo('preview-section');
        };
        img.onerror = () => UI.toast('Failed to load image.', 'error');
        img.src = src;
    }

    function showOriginal(img) {
        originalBody.innerHTML = '';
        const clone = img.cloneNode();
        clone.alt = 'Original uploaded image';
        clone.style.cssText = 'max-width:100%;max-height:500px;object-fit:contain;border-radius:4px';
        originalBody.appendChild(clone);
    }

    const debouncedConvert = UI.debounce(runConversion, 80);

    function getOptions() {
        return {
            width: parseInt(densitySlider.value),
            fontSize: parseInt(fontSlider.value),
            contrast: parseInt(contrastSlider.value),
            brightness: parseInt(brightnessSlider.value),
            preset: presetSelect.value,
            customChars: customChars.value,
            invert: invertToggle.classList.contains('active'),
            colored: coloredToggle.classList.contains('active'),
        };
    }

    function runConversion() {
        if (!state.image) return;
        const shouldAnimate = state.isNewUpload;
        state.isNewUpload = false;

        UI.showLoading(asciiBody);
        asciiEmpty.style.display = 'none';
        asciiOutput.style.display = 'none';

        requestAnimationFrame(() => {
            const opts = getOptions();
            const result = AsciiEngine.convert(state.image, opts);
            state.result = result;

            UI.hideLoading(asciiBody);
            asciiOutput.style.display = 'block';
            asciiOutput.style.fontSize = opts.fontSize + 'px';

            asciiOutput.className = 'ascii-output';
            const bg = bgSelect.value;
            if (bg === 'light') asciiOutput.classList.add('ascii-output--light');
            else if (bg === 'transparent') asciiOutput.classList.add('ascii-output--transparent');

            if (opts.colored) {
                UI.renderColored(asciiOutput, result.colored);
            } else if (shouldAnimate) {
                UI.typeReveal(asciiOutput, result.text, 600);
            } else {
                asciiOutput.textContent = result.text;
            }

            asciiOutput.style.transform = `scale(${state.zoomLevel})`;
            asciiOutput.style.transformOrigin = 'top left';
            updateStats(result, opts);
            updateComparisonContent();
        });
    }

    function updateStats(result, opts) {
        statsBar.style.display = 'flex';
        $('statChars').textContent = result.chars.toLocaleString();
        $('statLines').textContent = result.lines;
        $('statTime').textContent = result.time + ' ms';
        $('statRes').textContent = `${result.srcWidth}×${result.srcHeight}`;

        const presetName = opts.customChars && opts.customChars.length > 1
            ? 'Custom' : (opts.preset.charAt(0).toUpperCase() + opts.preset.slice(1));
        $('statPreset').textContent = presetName;
        $('statDensity').textContent = opts.width;

        const totalPixels = result.srcWidth * result.srcHeight;
        const ratio = totalPixels > 0 ? ((1 - result.chars / totalPixels) * 100).toFixed(1) : '—';
        $('statCompression').textContent = totalPixels > 0 ? ratio + '%' : '—';

        if (state.fileSize > 0) {
            $('statFileSize').textContent = state.fileSize >= 1024 * 1024
                ? (state.fileSize / (1024 * 1024)).toFixed(1) + ' MB'
                : Math.round(state.fileSize / 1024) + ' KB';
        }
        $('statColorMode').textContent = opts.colored ? 'Colored' : 'Monochrome';
        $('statBgMode').textContent = bgSelect.value.charAt(0).toUpperCase() + bgSelect.value.slice(1);
    }

    function bindControls() {
        const sliders = [
            { el: densitySlider, valEl: $('densityVal'), suffix: '' },
            { el: fontSlider, valEl: $('fontVal'), suffix: 'px' },
            { el: contrastSlider, valEl: $('contrastVal'), suffix: '%' },
            { el: brightnessSlider, valEl: $('brightnessVal'), suffix: '%' },
        ];
        for (const s of sliders) {
            s.el.addEventListener('input', () => { s.valEl.textContent = s.el.value + s.suffix; debouncedConvert(); });
        }

        presetSelect.addEventListener('change', () => {
            customChars.style.display = presetSelect.value === 'custom' ? 'block' : 'none';
            debouncedConvert();
        });
        customChars.addEventListener('input', debouncedConvert);

        function bindToggle(btn) {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                btn.setAttribute('aria-checked', btn.classList.contains('active'));
                debouncedConvert();
            });
        }
        bindToggle(invertToggle);
        bindToggle(coloredToggle);
        bgSelect.addEventListener('change', debouncedConvert);
    }

    function bindZoom() {
        $('zoomIn').addEventListener('click', () => { state.zoomLevel = Math.min(3, state.zoomLevel + 0.2); applyZoom(); });
        $('zoomOut').addEventListener('click', () => { state.zoomLevel = Math.max(0.3, state.zoomLevel - 0.2); applyZoom(); });
        $('zoomReset').addEventListener('click', () => { state.zoomLevel = 1; applyZoom(); });
    }
    
    function applyZoom() {
        asciiOutput.style.transform = `scale(${state.zoomLevel})`;
        asciiOutput.style.transformOrigin = 'top left';
    }

    function updateSliderPosition(pct) {
        const slider = $('compSlider');
        const asciiSide = $('compAscii');
        if (!slider || !asciiSide) return;
        slider.style.left = pct + '%';
        asciiSide.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
        slider.setAttribute('aria-valuenow', Math.round(pct));
    }

    function resizeComparisonAscii() {
        const compAscii = $('compAscii');
        if (!compAscii || !state.image || !state.result) return;
        const pre = compAscii.querySelector('pre');
        if (!pre) return;

        pre.style.transform = 'none';
        pre.style.position = 'absolute';
        pre.style.margin = '0';
        pre.style.left = '50%';
        pre.style.top = '50%';

        const preWidth = pre.offsetWidth || pre.scrollWidth;
        const preHeight = pre.offsetHeight || pre.scrollHeight;

        const containerWidth = compAscii.clientWidth;
        const containerHeight = compAscii.clientHeight;

        if (preWidth > 0 && preHeight > 0 && containerWidth > 0 && containerHeight > 0) {
            const scaleX = containerWidth / preWidth;
            const scaleY = containerHeight / preHeight;
            const scale = Math.min(scaleX, scaleY);
            pre.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
    }

    function bindComparison() {
        const comp = $('comparisonView');
        const slider = $('compSlider');
        if (!comp || !slider) return;
        
        let dragging = false;
        
        slider.addEventListener('mousedown', () => dragging = true);
        slider.addEventListener('touchstart', () => dragging = true);
        document.addEventListener('mouseup', () => dragging = false);
        document.addEventListener('touchend', () => dragging = false);
        
        function moveSlider(clientX) {
            const rect = comp.getBoundingClientRect();
            let pct = ((clientX - rect.left) / rect.width) * 100;
            pct = Math.max(5, Math.min(95, pct));
            updateSliderPosition(pct);
        }
        
        document.addEventListener('mousemove', (e) => { if (dragging) moveSlider(e.clientX); });
        document.addEventListener('touchmove', (e) => { if (dragging) moveSlider(e.touches[0].clientX); });
        
        slider.addEventListener('keydown', (e) => {
            let pct = parseFloat(slider.style.left) || 50;
            if (e.key === 'ArrowLeft') {
                pct = Math.max(5, pct - 2);
                updateSliderPosition(pct);
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                pct = Math.min(95, pct + 2);
                updateSliderPosition(pct);
                e.preventDefault();
            } else if (e.key === 'Home') {
                updateSliderPosition(5);
                e.preventDefault();
            } else if (e.key === 'End') {
                updateSliderPosition(95);
                e.preventDefault();
            }
        });

        window.addEventListener('resize', () => {
            if (state.previewMode === 'comparison') {
                resizeComparisonAscii();
            }
        });
    }

    function updateComparisonContent() {
        const comp = $('comparisonView');
        const compOriginal = $('compOriginal');
        const compAscii = $('compAscii');
        if (!compOriginal || !compAscii || !state.image || !state.result || !comp) return;

        comp.style.aspectRatio = `${state.image.naturalWidth} / ${state.image.naturalHeight}`;

        compOriginal.innerHTML = '';
        const img = state.image.cloneNode();
        img.alt = 'Original image for comparison';
        img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block';
        compOriginal.appendChild(img);

        compAscii.innerHTML = '';
        const pre = document.createElement('pre');
        const opts = getOptions();

        pre.style.fontFamily = 'var(--font-ui)';
        pre.style.fontSize = opts.fontSize + 'px';
        pre.style.lineHeight = '1.05';
        pre.style.whiteSpace = 'pre';
        pre.style.margin = '0';
        pre.style.padding = '0';

        const bg = bgSelect.value;
        if (bg === 'light') {
            pre.style.color = '#0A0A0A';
            pre.style.background = '#F5F5F5';
            compAscii.style.background = '#F5F5F5';
        } else if (bg === 'transparent') {
            pre.style.color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FFFFFF';
            pre.style.background = 'transparent';
            compAscii.style.background = 'transparent';
        } else {
            pre.style.color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#FFFFFF';
            pre.style.background = '#0A0A0A';
            compAscii.style.background = '#0A0A0A';
        }

        if (opts.colored && state.result.colored) {
            UI.renderColored(pre, state.result.colored);
        } else {
            pre.textContent = state.result.text;
        }

        compAscii.appendChild(pre);
        resizeComparisonAscii();
    }

    function bindPreviewModeSwitch() {
        const stdBtn = $('modeStandard');
        const cmpBtn = $('modeComparison');
        const previewGrid = $('previewGrid');
        const compView = $('comparisonView');
        const slider = $('compSlider');
        const asciiSide = $('compAscii');

        if (!stdBtn || !cmpBtn || !compView || !slider || !asciiSide) return;

        stdBtn.addEventListener('click', () => {
            state.previewMode = 'standard';
            stdBtn.classList.add('active'); 
            cmpBtn.classList.remove('active');
            previewGrid.style.display = ''; 
            compView.classList.remove('active');
        });

        cmpBtn.addEventListener('click', () => {
            state.previewMode = 'comparison';
            cmpBtn.classList.add('active'); 
            stdBtn.classList.remove('active');
            previewGrid.style.display = 'none'; 
            compView.classList.add('active');
            
            updateComparisonContent();

            slider.style.left = '0%';
            asciiSide.style.clipPath = 'inset(0 100% 0 0)';
            
            slider.offsetHeight;

            slider.classList.add('sliding');
            asciiSide.classList.add('sliding');

            slider.style.left = '50%';
            asciiSide.style.clipPath = 'inset(0 50% 0 0)';
            slider.setAttribute('aria-valuenow', '50');

            setTimeout(() => {
                slider.classList.remove('sliding');
                asciiSide.classList.remove('sliding');
            }, 650);
        });
    }

    function bindExport() {
        $('exportCopy').addEventListener('click', async () => {
            if (!state.result) { UI.toast('No ASCII art to copy.', 'error'); return; }
            await ExportManager.copyToClipboard(state.result.text);
            UI.toast('Copied to clipboard!');
        });
        $('exportTxt').addEventListener('click', () => {
            if (!state.result) { UI.toast('No ASCII art to export.', 'error'); return; }
            ExportManager.downloadTXT(state.result.text); UI.toast('TXT downloaded!');
        });
        $('exportHtml').addEventListener('click', () => {
            if (!state.result) { UI.toast('No ASCII art to export.', 'error'); return; }
            ExportManager.downloadHTML(state.result.colored, {
                bgColor: bgSelect.value === 'light' ? '#F5F5F5' : '#0A0A0A', fontSize: getOptions().fontSize,
            }); UI.toast('HTML downloaded!');
        });
        $('exportPng').addEventListener('click', () => {
            if (!state.result) { UI.toast('No ASCII art to export.', 'error'); return; }
            const opts = getOptions();
            ExportManager.downloadPNG(state.result.text, {
                fontSize: opts.fontSize, fgColor: bgSelect.value === 'light' ? '#0A0A0A' : '#F5F5F5',
                bgColor: '#0A0A0A', colored: opts.colored, coloredLines: state.result.colored, bgMode: bgSelect.value,
            }); UI.toast('PNG downloaded!');
        });
        $('exportSvg').addEventListener('click', () => {
            if (!state.result) { UI.toast('No ASCII art to export.', 'error'); return; }
            const opts = getOptions();
            ExportManager.downloadSVG(state.result.text, {
                fontSize: opts.fontSize, fgColor: bgSelect.value === 'light' ? '#0A0A0A' : '#F5F5F5',
                bgColor: '#0A0A0A', bgMode: bgSelect.value,
            }); UI.toast('SVG downloaded!');
        });
    }

    function bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'o': e.preventDefault(); fileInput.click(); break;
                    case 's': e.preventDefault();
                        if (state.result) { ExportManager.downloadTXT(state.result.text); UI.toast('TXT downloaded!'); }
                        break;
                }
            }
        });
    }

    function bindAboutModal() {
        const modal = $('aboutModal');
        if (!modal) return;
        modal.addEventListener('click', (e) => { if (e.target === modal) UI.closeAbout(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') UI.closeAbout(); });
    }

    init();
})();
