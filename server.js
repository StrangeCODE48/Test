const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).send('No target URL provided.');
    }

    try {
        const response = await axios.get(targetUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            },
            // Do not throw on 4xx/5xx responses
            validateStatus: () => true,
            // Follow redirects
            maxRedirects: 5
        });

        // Forward headers from the target site
        for (const [key, value] of Object.entries(response.headers)) {
            // Avoid forwarding headers that might cause issues
            const lowerKey = key.toLowerCase();
            if (['transfer-encoding', 'content-encoding', 'connection'].includes(lowerKey)) {
                continue;
            }
            res.setHeader(key, value);
        }

        // STEP C: The "Header Surgery"
        // Delete security headers that prevent framing
        res.removeHeader('x-frame-options');
        res.removeHeader('content-security-policy');
        res.removeHeader('content-security-policy-report-only');
        res.removeHeader('x-content-type-options');

        res.setHeader('Access-Control-Allow-Origin', '*');

        const contentType = response.headers['content-type'] || '';

        // Only manipulate the body if it's HTML
        if (contentType.includes('text/html')) {
            const html = response.data.toString('utf8');
            const $ = cheerio.load(html);

            // STEP D: The URL Patching (Rewriting)
            // Inject base tag to fix relative paths for images, CSS, JS
            const urlObj = new URL(targetUrl);
            const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname === '/' ? '' : urlObj.pathname}`;
            
            // Check if there's already a base tag
            if ($('head base').length === 0) {
                $('head').prepend(`<base href="${baseUrl}">`);
            } else {
                // Modify existing base tag
                $('head base').attr('href', baseUrl);
            }

            // Optional Step: Remove JS frame-busting scripts
            // This is a naive attempt to remove simple framebusting
            $('script').each((i, el) => {
                const scriptContent = $(el).html();
                if (scriptContent && (scriptContent.includes('top.location') || scriptContent.includes('top != self'))) {
                    $(el).html('/* frame busting removed by proxy */');
                }
            });

            res.send($.html());
        } else {
            // Send binary or non-HTML data directly
            res.send(response.data);
        }

    } catch (error) {
        console.error('Error fetching URL:', error.message);
        res.status(500).send(`
            <div style="font-family: sans-serif; padding: 20px; color: #ef4444;">
                <h2>Proxy Error</h2>
                <p>Failed to fetch: ${targetUrl}</p>
                <p>${error.message}</p>
            </div>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;
