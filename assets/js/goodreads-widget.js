/**
 * Goodreads Widget
 * Loads and displays currently reading book information
 */

async function loadCurrentBooks() {
    const booksContainer = document.getElementById('currently-reading-books');
    
    try {
      const proxies = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/get?url='
      ];
  
      const configuredUsername = (window.goodreadsUsername || '').trim();
        
      function cacheGetResolvedId(username) {
        try {
          const key = `gr_uid_${username}`;
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          if (!parsed || !parsed.id) return null;
          if (parsed.ts && (Date.now() - parsed.ts) < 30 * 24 * 60 * 60 * 1000) return parsed.id;
        } catch {}
        return null;
      }
  
      function cacheSetResolvedId(username, id) {
        try {
          const key = `gr_uid_${username}`;
          localStorage.setItem(key, JSON.stringify({ id, ts: Date.now() }));
        } catch {}
      }
  
      async function fetchTextViaProxy(base, targetUrl) {
        const url = base + encodeURIComponent(targetUrl);
        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (base.includes('corsproxy')) {
          return await resp.text();
        }
        const json = await resp.json();
        return json?.contents || '';
      }
  
      async function resolveGoodreadsUserId(username) {
        if (!username) return null;
  
        const cached = cacheGetResolvedId(username);
        if (cached) return cached;
  
        const candidateUrls = [
          `https://www.goodreads.com/user/show/${encodeURIComponent(username)}`,
          `https://www.goodreads.com/${encodeURIComponent(username)}`
        ];
  
        const patterns = [
          /\/user\/show\/(\d+)/,
          /og:url\"\s+content=\"https:\/\/www\.goodreads\.com\/user\/show\/(\d+)[^\"]*\"/,
          /rel=\"canonical\"[^>]*href=\"https:\/\/www\.goodreads\.com\/user\/show\/(\d+)[^\"]*\"/,
          /href=\"https:\/\/www\.goodreads\.com\/user\/show\/(\d+)[^\"]*\"/,
          /data-user-id=\"(\d+)\"/
        ];
  
        for (const target of candidateUrls) {
          for (const proxy of proxies) {
            try {
              const html = await fetchTextViaProxy(proxy, target);
              if (!html) continue;
              for (const pat of patterns) {
                const m = html.match(pat);
                if (m && m[1]) {
                  cacheSetResolvedId(username, m[1]);
                  return m[1];
                }
              }
            } catch {}
          }
        }
        return null;
      }
  
      // Require a resolvable username; otherwise keep widget hidden
      if (!configuredUsername) {
        return;
      }
  
      const resolvedId = await resolveGoodreadsUserId(configuredUsername);
      if (!resolvedId) {
        return;
      }
  
      const targetUrl = `https://www.goodreads.com/review/list_rss/${resolvedId}?shelf=currently-reading`;
  
      async function fetchViaProxy(base) {
        const url = base + encodeURIComponent(targetUrl);
        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (base.includes('corsproxy')) {
          return { contents: await resp.text() };
        }
        return await resp.json();
      }
  
      const attempts = proxies.map(p => fetchViaProxy(p).catch(() => null));
      let data = null;
      for (const attempt of attempts) {
        try {
          const res = await attempt;
          if (res && res.contents) { data = res; break; }
        } catch {}
      }
  
      if (!data?.contents) throw new Error('No data received');
      
      const parser = new DOMParser();
      const xml = parser.parseFromString(data.contents, 'text/xml');
      const items = xml.querySelectorAll('item');
      
      if (items.length === 0) {
        return;
      }
      
      let mostRecentItem = items[0];
      let mostRecentDate = new Date(mostRecentItem.querySelector('pubDate').textContent);
      for (let i = 1; i < items.length; i++) {
        const currentDate = new Date(items[i].querySelector('pubDate').textContent);
        if (currentDate > mostRecentDate) {
          mostRecentDate = currentDate;
          mostRecentItem = items[i];
        }
      }
      
      const title = mostRecentItem.querySelector('title')?.textContent || '';
      const author = mostRecentItem.querySelector('author_name')?.textContent || '';
      const imageUrl = mostRecentItem.querySelector('book_medium_image_url')?.textContent || '';
      const publishYear = mostRecentItem.querySelector('book_published')?.textContent || '';
  
      const readingColumn = document.querySelector('.reading-column');
      if (readingColumn) readingColumn.classList.remove('widget-loading');
  
      booksContainer.innerHTML = `
        <article class="content-item goodreads-book-card">
          <div class="content-item-image goodreads-book-image">
            <img src="${imageUrl}" alt="Cover image for ${title}" loading="lazy" />
          </div>
          <div class="content-item-content goodreads-book-content">
            <h4>${title}</h4>
            <div class="content-meta goodreads-book-author-date">
              ${author} · ${publishYear}
            </div>
          </div>
        </article>`;
      
    } catch (error) {
      console.error('Error loading books:', error);
      // Keep widget hidden (widget-loading class remains)
    }
  }
  
  document.addEventListener('DOMContentLoaded', loadCurrentBooks);