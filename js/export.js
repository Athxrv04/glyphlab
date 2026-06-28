

const ExportManager = (() => {


    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {

            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            return true;
        }
    }


    function downloadTXT(text, filename = 'ascii-art.txt') {
        _download(new Blob([text], { type: 'text/plain' }), filename);
    }


    function downloadHTML(coloredLines, options = {}) {
        const { bgColor = '#0A0A0A', fontSize = 10 } = options;
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ASCII Art</title>
<style>
body{margin:0;padding:20px;background:${bgColor};display:flex;justify-content:center}
pre{font-family:'JetBrains Mono',monospace;font-size:${fontSize}px;line-height:1.1;letter-spacing:0}
</style>
</head>
<body><pre>`;

        for (const line of coloredLines) {
            for (const { char, color } of line) {
                if (char === ' ') {
                    html += ' ';
                } else {
                    html += `<span style="color:${color}">${_escapeHtml(char)}</span>`;
                }
            }
            html += '\n';
        }

        html += '</pre></body></html>';
        _download(new Blob([html], { type: 'text/html' }), 'ascii-art.html');
    }


    function downloadPNG(text, options = {}) {
        const {
            fontSize = 10,
            fontFamily = 'JetBrains Mono, monospace',
            fgColor = '#F5F5F5',
            bgColor = '#0A0A0A',
            colored = false,
            coloredLines = null,
            bgMode = 'dark',
        } = options;

        const cnv = document.createElement('canvas');
        const c = cnv.getContext('2d');
        c.font = `${fontSize}px ${fontFamily}`;

        const lines = text.split('\n').filter(l => l.length > 0);
        const charW = c.measureText('M').width;
        const lineH = fontSize * 1.15;
        const maxCols = Math.max(...lines.map(l => l.length));

        cnv.width = Math.ceil(charW * maxCols) + 20;
        cnv.height = Math.ceil(lineH * lines.length) + 20;


        if (bgMode !== 'transparent') {
            c.fillStyle = bgMode === 'light' ? '#F5F5F5' : bgColor;
            c.fillRect(0, 0, cnv.width, cnv.height);
        }

        c.font = `${fontSize}px ${fontFamily}`;
        c.textBaseline = 'top';

        if (colored && coloredLines) {
            for (let y = 0; y < coloredLines.length; y++) {
                let x = 10;
                for (const { char, color } of coloredLines[y]) {
                    c.fillStyle = color;
                    c.fillText(char, x, 10 + y * lineH);
                    x += charW;
                }
            }
        } else {
            c.fillStyle = fgColor;
            for (let i = 0; i < lines.length; i++) {
                c.fillText(lines[i], 10, 10 + i * lineH);
            }
        }

        cnv.toBlob(blob => {
            if (blob) _download(blob, 'ascii-art.png');
        }, 'image/png');
    }


    function downloadSVG(text, options = {}) {
        const {
            fontSize = 10,
            fgColor = '#F5F5F5',
            bgColor = '#0A0A0A',
            bgMode = 'dark',
        } = options;

        const lines = text.split('\n').filter(l => l.length > 0);
        const charW = fontSize * 0.6;
        const lineH = fontSize * 1.15;
        const maxCols = Math.max(...lines.map(l => l.length));
        const w = Math.ceil(charW * maxCols) + 20;
        const h = Math.ceil(lineH * lines.length) + 20;

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;

        if (bgMode !== 'transparent') {
            const bg = bgMode === 'light' ? '#F5F5F5' : bgColor;
            svg += `<rect width="100%" height="100%" fill="${bg}"/>`;
        }

        svg += `<text font-family="'JetBrains Mono',monospace" font-size="${fontSize}" fill="${fgColor}" xml:space="preserve">`;

        for (let i = 0; i < lines.length; i++) {
            svg += `<tspan x="10" y="${10 + fontSize + i * lineH}">${_escapeHtml(lines[i])}</tspan>`;
        }

        svg += '</text></svg>';
        _download(new Blob([svg], { type: 'image/svg+xml' }), 'ascii-art.svg');
    }


    function _download(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    function _escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    return { copyToClipboard, downloadTXT, downloadHTML, downloadPNG, downloadSVG };
})();
