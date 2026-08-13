/**
 * Goodreads Widget
 * Loads and displays currently reading book information
 */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadCurrentBooks() {
  const booksContainer = document.getElementById('currently-reading-books');
  if (!booksContainer) return;

  const userId = (booksContainer.dataset.goodreadsUserId || '').trim();
  if (!userId) return;

  try {
    const proxies = [
      'https://corsproxy.io/?',
      'https://api.allorigins.win/get?url='
    ];

    const targetUrl = `https://www.goodreads.com/review/list_rss/${encodeURIComponent(userId)}?shelf=currently-reading`;

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
          <img src="${escapeHtml(imageUrl)}" alt="Cover image for ${escapeHtml(title)}" loading="lazy" />
        </div>
        <div class="content-item-content goodreads-book-content">
          <h4>${escapeHtml(title)}</h4>
          <div class="content-meta goodreads-book-author-date">
            ${escapeHtml(author)} · ${escapeHtml(publishYear)}
          </div>
        </div>
      </article>`;

  } catch (error) {
    console.error('Error loading books:', error);
    // Keep widget hidden (widget-loading class remains)
  }
}

document.addEventListener('DOMContentLoaded', loadCurrentBooks);
