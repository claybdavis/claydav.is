/**
 * Bluesky Widget
 * Loads and displays the most recent Bluesky post
 */

async function loadBlueskyPosts() {
    console.log('Loading Bluesky posts...');
    const container = document.getElementById('bluesky-feed');
    const handle = 'claydav.is';
    
    console.log('Container found:', container);
    if (!container) {
      console.error('bluesky-feed container not found');
      return;
    }
    
    try {
      // Resolve handle to DID
      const resolveResponse = await fetch(`https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`);
      const { did } = await resolveResponse.json();
      
      // Get recent posts (fetch more to find standalone posts)
      const feedResponse = await fetch(`https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=app.bsky.feed.post&limit=10`);
      const { records } = await feedResponse.json();
      
      // Find the most recent standalone post (not a reply)
      const standalonePost = records.find(record => !record.value.reply);
      
      if (!standalonePost) {
        // No standalone posts found, hide the section
        const socialColumn = document.querySelector('.social-column');
        if (socialColumn) socialColumn.style.display = 'none';
        return;
      }
      
      // Get profile info
      const profileResponse = await fetch(`https://bsky.social/xrpc/com.atproto.repo.getRecord?repo=${did}&collection=app.bsky.actor.profile&rkey=self`);
      const profileData = await profileResponse.json();
      const profile = profileData.value;
      
      // Clear container
      container.innerHTML = '';
      
      // Create post HTML for the standalone post
      const record = standalonePost;
      const post = record.value;
      const postDate = new Date(post.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      const postId = record.uri.split('/').pop();
      const postUrl = `https://bsky.app/profile/${handle}/post/${postId}`;
      
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
  
      // Process mentions in the post text
      let processedText = post.text;
      if (post.facets && post.facets.length > 0) {
        // Sort facets by index in reverse order to avoid offset issues when replacing
        const sortedFacets = [...post.facets].sort((a, b) => b.index.byteStart - a.index.byteStart);
        
        for (const facet of sortedFacets) {
          // Convert byte positions to character positions
          let start = byteToCharIndex(post.text, facet.index.byteStart);
          let end = byteToCharIndex(post.text, facet.index.byteEnd);
          let facetText = processedText.slice(start, end);
          
          // Look for mention features first
          const mentionFeature = facet.features.find(f => f.$type === 'app.bsky.richtext.facet#mention');
          const linkFeature = facet.features.find(f => f.$type === 'app.bsky.richtext.facet#link');
          
          if (mentionFeature) {
            // Check if the facet includes the "@" symbol, if not, adjust to include it
            if (start > 0 && processedText.charAt(start - 1) === '@' && !facetText.startsWith('@')) {
              start = start - 1;
              facetText = processedText.slice(start, end);
            }
            const mentionDid = mentionFeature.did;
            
            try {
              // Get handle for the mentioned user
              const mentionRepoResponse = await fetch(`https://bsky.social/xrpc/com.atproto.repo.describeRepo?repo=${mentionDid}`);
              if (mentionRepoResponse.ok) {
                const mentionRepoData = await mentionRepoResponse.json();
                const mentionHandle = mentionRepoData.handle;
                
                if (mentionHandle) {
                  const mentionProfileUrl = `https://bsky.app/profile/${mentionHandle}`;
                  const linkHtml = `<a href="${mentionProfileUrl}" target="_blank">${facetText}</a>`;
                  processedText = processedText.slice(0, start) + linkHtml + processedText.slice(end);
                }
              }
            } catch (error) {
              console.error('Error resolving mention:', error);
              // Keep original text if we can't resolve the mention
            }
          } else if (linkFeature) {
            const linkUrl = linkFeature.uri;
            const linkHtml = `<a href="${linkUrl}" target="_blank">${facetText}</a>`;
            processedText = processedText.slice(0, start) + linkHtml + processedText.slice(end);
          }
        }
      }
      
      // Check if this is a quote reply
      const isQuoteReply = post.embed && post.embed.$type === 'app.bsky.embed.record';
      let quoteInfo = '';
      
      if (isQuoteReply) {
        // Extract the quoted post's author DID
        const quotedRecord = post.embed.record;
        const quotedAuthorDid = quotedRecord.uri.split('/')[2]; // Extract DID from AT-URI
        
        try {
          // Get the profile of the quoted author to get their handle
          const quotedProfileResponse = await fetch(`https://bsky.social/xrpc/com.atproto.repo.getRecord?repo=${quotedAuthorDid}&collection=app.bsky.actor.profile&rkey=self`);
          if (quotedProfileResponse.ok) {
            const quotedProfileData = await quotedProfileResponse.json();
            const quotedProfile = quotedProfileData.value;
            const quotedName = quotedProfile?.displayName || 'user';
            
            // Get their handle for creating profile and post URLs
            try {
              const repoResponse = await fetch(`https://bsky.social/xrpc/com.atproto.repo.describeRepo?repo=${quotedAuthorDid}`);
              if (repoResponse.ok) {
                const repoData = await repoResponse.json();
                const quotedHandle = repoData.handle;
                
                if (quotedHandle) {
                  // Create the profile URL and quoted post URL
                  const quotedProfileUrl = `https://bsky.app/profile/${quotedHandle}`;
                  const quotedPostId = quotedRecord.uri.split('/').pop();
                  const quotedPostUrl = `https://bsky.app/profile/${quotedHandle}/post/${quotedPostId}`;
                  
                  quoteInfo = `↳ Quoting <a href="${quotedProfileUrl}" target="_blank">${quotedName}</a>'s <a href="${quotedPostUrl}" target="_blank">post</a>: `;
                } else {
                  quoteInfo = `↳ Quoting ${quotedName}: `;
                }
              } else {
                quoteInfo = `↳ Quoting ${quotedName}: `;
              }
            } catch (linkError) {
              // Fallback without links if we can't resolve handle
              quoteInfo = `↳ Quoting ${quotedName}: `;
            }
          } else {
            quoteInfo = '↳ Quote reply: ';
          }
        } catch (error) {
          console.error('Error fetching quoted author profile:', error);
          quoteInfo = '↳ Quote reply: ';
        }
      }
      
      const postHtml = `
        <div class="blockquote">
          <p>${quoteInfo}${isQuoteReply ? '<br>' : ''}<span style="${isQuoteReply ? 'margin-top: var(--space-sm); display: block;' : ''}">"${processedText}"</span></p>
          <footer>
            — <a href="https://bsky.app/profile/${handle}" 
                 target="_blank">
                 ${profile.displayName || handle} (@${handle})
               </a>
            • <span style="margin-left: var(--space-xs);">${postDate}</span>
          </footer>
        </div>
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