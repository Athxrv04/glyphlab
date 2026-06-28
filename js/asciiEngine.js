

const AsciiEngine = (() => {

    const PRESETS = {
        classic:  ' .:-=+*#%@',
        detailed: ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
        terminal: ' ░▒▓█',
        pixel:    ' ▫▪□■',
    };


    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });


    function convert(image, options = {}) {
        const startTime = performance.now();

        const {
            width = 120,
            fontSize = 10,
            contrast = 100,
            brightness = 100,
            preset = 'classic',
            customChars = '',
            invert = false,
            colored = false,
        } = options;


        let chars = customChars.length > 1 ? customChars : (PRESETS[preset] || PRESETS.classic);
        if (invert) chars = chars.split('').reverse().join('');


        const aspectRatio = image.height / image.width;
        const charAspect = 0.55;
        const cols = Math.max(10, Math.min(width, 300));
        const rows = Math.max(5, Math.round(cols * aspectRatio * charAspect));


        canvas.width = cols;
        canvas.height = rows;
        ctx.clearRect(0, 0, cols, rows);
        ctx.drawImage(image, 0, 0, cols, rows);


        const imageData = ctx.getImageData(0, 0, cols, rows);
        const pixels = imageData.data;


        const contrastFactor = (contrast / 100);
        const brightnessFactor = (brightness / 100);

        let asciiText = '';
        const coloredLines = [];
        const charCount = chars.length;

        for (let y = 0; y < rows; y++) {
            let line = '';
            const colorLine = [];

            for (let x = 0; x < cols; x++) {
                const idx = (y * cols + x) * 4;
                let r = pixels[idx];
                let g = pixels[idx + 1];
                let b = pixels[idx + 2];
                const a = pixels[idx + 3];


                if (a < 30) {
                    line += ' ';
                    colorLine.push({ char: ' ', color: 'transparent' });
                    continue;
                }


                r = Math.min(255, r * brightnessFactor);
                g = Math.min(255, g * brightnessFactor);
                b = Math.min(255, b * brightnessFactor);


                r = Math.min(255, Math.max(0, ((r / 255 - 0.5) * contrastFactor + 0.5) * 255));
                g = Math.min(255, Math.max(0, ((g / 255 - 0.5) * contrastFactor + 0.5) * 255));
                b = Math.min(255, Math.max(0, ((b / 255 - 0.5) * contrastFactor + 0.5) * 255));


                const lum = 0.299 * r + 0.587 * g + 0.114 * b;


                const charIdx = Math.min(charCount - 1, Math.floor((lum / 255) * (charCount - 1)));
                const ch = chars[charIdx];
                line += ch;

                colorLine.push({
                    char: ch,
                    color: `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`,
                });
            }

            asciiText += line + '\n';
            coloredLines.push(colorLine);
        }

        const elapsed = performance.now() - startTime;

        return {
            text: asciiText,
            colored: coloredLines,
            lines: rows,
            chars: cols * rows,
            time: elapsed.toFixed(1),
            width: cols,
            height: rows,
            srcWidth: image.naturalWidth || image.width,
            srcHeight: image.naturalHeight || image.height,
        };
    }


    function getPresets() {
        return Object.keys(PRESETS);
    }


    function getPresetChars(name) {
        return PRESETS[name] || PRESETS.classic;
    }

    return { convert, getPresets, getPresetChars, PRESETS };
})();
