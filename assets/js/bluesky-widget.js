/**
 * Bluesky Widget
 * Loads and displays the most recent Bluesky post
 */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Resolve a DID to its current handle, or null if the lookup fails
async function fetchHandle(did) {
  try {
    const resp = await fetch(`https://bsky.social/xrpc/com.atproto.repo.describeRepo?repo=${did}`, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;
    return (await resp.json()).handle || null;
  } catch {
    return null;
  }
}

// Fetch a profile's display name by DID, or null if the lookup fails
async function fetchDisplayName(did) {
  try {
    const resp = await fetch(`https://bsky.social/xrpc/com.atproto.repo.getRecord?repo=${did}&collection=app.bsky.actor.profile&rkey=self`, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;
    return (await resp.json()).value?.displayName || null;
  } catch {
    return null;
  }
}

async function loadBlueskyPosts() {
  const container = document.getElementById('bluesky-feed');

  if (!container) return;

  const handle = (container.dataset.blueskyHandle || '').trim();
  if (!handle) return;

  try {
    // Resolve handle to DID
    const resolveResponse = await fetch(`https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`, { signal: AbortSignal.timeout(8000) });
    const { did } = await resolveResponse.json();

    // Get recent posts (fetch more to find standalone posts)
    const feedResponse = await fetch(`https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=app.bsky.feed.post&limit=10`, { signal: AbortSignal.timeout(8000) });
    const { records } = await feedResponse.json();

    // Find the most recent standalone post (not a reply)
    const standalonePost = records.find(record => !record.value.reply);

    if (!standalonePost) {
      // No standalone posts found, hide the section
      const socialColumn = document.querySelector('.social-column');
      if (socialColumn) socialColumn.style.display = 'none';
      return;
    }

    const post = standalonePost.value;
    const displayName = (await fetchDisplayName(did)) || handle;
    const postDate = new Date(post.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // Helper function to convert UTF-8 byte position to character position
    function byteToCharIndex(text, byteIndex) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Get bytes up to the target position
      const textBytes = encoder.encode(text);
      const bytesUpToIndex = textBytes.slice(0, byteIndex);

      // Decode back to get character position
      const textUpToIndex = decoder.decode(bytesUpToIndex);
      return textUpToIndex.length;
    }

    // Process mentions and links in the post text.
    // Plain-text segments are HTML-escaped; facet segments become anchors
    // whose text content is escaped and whose hrefs are attribute-escaped.
    let processedText = '';
    if (post.facets && post.facets.length > 0) {
      // Sort facets left-to-right so we can walk the text with a cursor
      const sortedFacets = [...post.facets].sort((a, b) => a.index.byteStart - b.index.byteStart);
      let cursor = 0;

      for (const facet of sortedFacets) {
        // Convert byte positions to character positions
        let start = byteToCharIndex(post.text, facet.index.byteStart);
        const end = byteToCharIndex(post.text, facet.index.byteEnd);
        let facetText = post.text.slice(start, end);

        // Look for mention features first
        const mentionFeature = facet.features.find(f => f.$type === 'app.bsky.richtext.facet#mention');
        const linkFeature = facet.features.find(f => f.$type === 'app.bsky.richtext.facet#link');

        // Check if the mention facet includes the "@" symbol, if not, adjust to include it
        if (mentionFeature && start > 0 && post.text.charAt(start - 1) === '@' && !facetText.startsWith('@')) {
          start = start - 1;
          facetText = post.text.slice(start, end);
        }

        // Emit any plain text preceding this facet (escaped)
        if (start > cursor) {
          processedText += escapeHtml(post.text.slice(cursor, start));
        }

        if (mentionFeature) {
          const mentionHandle = await fetchHandle(mentionFeature.did);
          if (mentionHandle) {
            const profileUrl = `https://bsky.app/profile/${mentionHandle}`;
            processedText += `<a href="${escapeHtml(profileUrl)}" target="_blank">${escapeHtml(facetText)}</a>`;
          } else {
            // Keep original text if we can't resolve the mention
            processedText += escapeHtml(facetText);
          }
        } else if (linkFeature) {
          processedText += `<a href="${escapeHtml(linkFeature.uri)}" target="_blank">${escapeHtml(facetText)}</a>`;
        } else {
          processedText += escapeHtml(facetText);
        }

        cursor = end;
      }

      // Emit any trailing plain text (escaped)
      if (cursor < post.text.length) {
        processedText += escapeHtml(post.text.slice(cursor));
      }
    } else {
      processedText = escapeHtml(post.text);
    }

    // Quote posts: credit and link the quoted author when resolvable
    const isQuoteReply = post.embed && post.embed.$type === 'app.bsky.embed.record';
    let quoteInfo = '';

    if (isQuoteReply) {
      const quotedRecord = post.embed.record;
      const quotedAuthorDid = quotedRecord.uri.split('/')[2]; // Extract DID from AT-URI
      const quotedName = (await fetchDisplayName(quotedAuthorDid)) || 'user';
      const quotedHandle = await fetchHandle(quotedAuthorDid);

      if (quotedHandle) {
        const quotedProfileUrl = `https://bsky.app/profile/${quotedHandle}`;
        const quotedPostUrl = `${quotedProfileUrl}/post/${quotedRecord.uri.split('/').pop()}`;
        quoteInfo = `↳ Quoting <a href="${escapeHtml(quotedProfileUrl)}" target="_blank">${escapeHtml(quotedName)}</a>'s <a href="${escapeHtml(quotedPostUrl)}" target="_blank">post</a>: `;
      } else {
        quoteInfo = `↳ Quoting ${escapeHtml(quotedName)}: `;
      }
    }

    const postHtml = `
      <blockquote>
        <p>${quoteInfo}${isQuoteReply ? '<br>' : ''}<span style="${isQuoteReply ? 'margin-top: var(--space-sm); display: block;' : ''}">"${processedText}"</span></p>
        <footer>
          — <a href="https://bsky.app/profile/${handle}"
               target="_blank">
               ${escapeHtml(displayName)} (@${handle})
             </a>
          • <span style="margin-left: var(--space-xs);">${postDate}</span>
        </footer>
      </blockquote>
    `;

    container.innerHTML = postHtml;

    // Remove the loading class to show the widget
    const socialColumn = document.querySelector('.social-column');
    if (socialColumn) socialColumn.classList.remove('widget-loading');

  } catch (error) {
    // Hide the entire Bluesky section on error
    const socialColumn = document.querySelector('.social-column');
    if (socialColumn) socialColumn.style.display = 'none';
  }
}

// Load posts when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadBlueskyPosts);
} else {
  loadBlueskyPosts();
}
