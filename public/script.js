document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const openTabsBtn = document.getElementById('openTabsBtn');
    const formatLinksBtn = document.getElementById('formatLinksBtn');
    const openIframesBtn = document.getElementById('openIframesBtn');
    
    const gallery = document.getElementById('gallery');
    const formattedLinks = document.getElementById('formattedLinks');

    function getUrls() {
        const text = urlInput.value;
        const urls = text.split('\n').map(line => line.trim()).filter(line => line !== '');
        
        return urls.map(url => {
            if (!/^https?:\/\//i.test(url)) {
                return 'https://' + url;
            }
            return url;
        });
    }

    // 1. Open Tabs
    openTabsBtn.addEventListener('click', () => {
        const urls = getUrls();
        urls.forEach(url => {
            window.open(url, '_blank');
        });
    });

    // 2. Format Links
    formatLinksBtn.addEventListener('click', () => {
        const urls = getUrls();
        formattedLinks.innerHTML = ''; // Clear previous links
        
        if (urls.length > 0) {
            formattedLinks.style.display = 'flex';
            const heading = document.createElement('h3');
            heading.textContent = 'Formatted Clickable Links:';
            heading.style.color = 'var(--text-secondary)';
            heading.style.fontFamily = 'var(--font-heading)';
            heading.style.margin = '0 0 0.5rem 0';
            formattedLinks.appendChild(heading);
        } else {
            formattedLinks.style.display = 'none';
        }

        urls.forEach(url => {
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.className = 'formatted-link-item';
            
            // Link icon & text
            a.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg> 
                <span>${url}</span>
            `;
            
            formattedLinks.appendChild(a);
        });
    });

    // 3. Open in Iframes
    openIframesBtn.addEventListener('click', () => {
        const urls = getUrls();
        gallery.innerHTML = ''; // Clear existing gallery
        
        urls.forEach(url => {
            createIframeCard(url);
        });
    });

    function createIframeCard(targetUrl) {
        // Create main card container
        const card = document.createElement('div');
        card.className = 'iframe-card';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'card-header';
        
        // Create URL bar (looks like a browser address bar)
        const urlBar = document.createElement('div');
        urlBar.className = 'card-url-bar';
        
        const lockIcon = document.createElement('span');
        lockIcon.className = 'lock-icon';
        lockIcon.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
        
        const title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = targetUrl;
        title.title = targetUrl; // Tooltip for full URL
        
        urlBar.appendChild(lockIcon);
        urlBar.appendChild(title);
        
        // Create actions container
        const actions = document.createElement('div');
        actions.className = 'card-actions';
        
        // Refresh Button
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'action-btn';
        refreshBtn.title = 'Refresh';
        refreshBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>';
        
        // Open in New Tab Button
        const externalLinkBtn = document.createElement('button');
        externalLinkBtn.className = 'action-btn';
        externalLinkBtn.title = 'Open in New Tab';
        externalLinkBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';

        // Remove Button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'action-btn close';
        removeBtn.title = 'Close';
        removeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        
        actions.appendChild(refreshBtn);
        actions.appendChild(externalLinkBtn);
        actions.appendChild(removeBtn);
        
        header.appendChild(urlBar);
        header.appendChild(actions);
        
        // Create wrapper for iframe to handle loading state
        const wrapper = document.createElement('div');
        wrapper.className = 'iframe-wrapper';
        
        const iframe = document.createElement('iframe');
        
        // Configure proxy endpoint mapping
        iframe.src = `/proxy?url=${encodeURIComponent(targetUrl)}`;
        
        // Handle loading state
        iframe.onload = () => {
            iframe.classList.add('loaded');
        };

        // Button Event Listeners
        refreshBtn.onclick = () => {
            iframe.classList.remove('loaded');
            iframe.src = iframe.src;
        };

        externalLinkBtn.onclick = () => {
            window.open(targetUrl, '_blank');
        };

        removeBtn.onclick = () => {
            card.style.transform = 'scale(0.9)';
            card.style.opacity = '0';
            setTimeout(() => {
                card.remove();
            }, 300);
        };

        wrapper.appendChild(iframe);
        card.appendChild(header);
        card.appendChild(wrapper);
        
        // Add to gallery (at the beginning)
        gallery.insertBefore(card, gallery.firstChild);
    }
});
