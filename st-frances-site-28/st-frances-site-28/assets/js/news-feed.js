/*
  Renders live news posts from Firestore as blog-style cards into the
  #newsList element. Each card links to /post.html?id=<docId> for the
  full article.

  Each page that uses this sets window.NEWS_SCHOOL to "primary" or
  "secondary" before loading this script. Posts are pulled from the
  "news_posts" collection where school == NEWS_SCHOOL OR school == "group".

  No .orderBy() is used in the Firestore query on purpose -- combining a
  "where...in" filter with orderBy on a different field requires a
  composite index to be created manually in the Firebase console.
  Sorting client-side after fetching avoids that requirement entirely.

  If Firebase isn't configured yet, or the fetch fails (offline, no
  network access, placeholder config still in place), this script
  quietly restores the static fallback announcements already in the
  HTML -- nothing breaks for visitors. While the fetch is in flight,
  a loading spinner replaces that fallback content briefly.
*/
(function () {
  if (typeof firebase === "undefined" || !window.NEWS_SCHOOL) return;

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  } catch (e) {
    console.warn("News feed: Firebase not configured yet.", e);
    return;
  }

  const db = firebase.firestore();
  const school = window.NEWS_SCHOOL;
  const listEl = document.getElementById("newsList");
  if (!listEl) return;

  // Keep the static fallback markup so it can be put back if there
  // are no live posts yet, or the fetch fails.
  const fallbackHtml = listEl.innerHTML;
  listEl.classList.add("news-grid");
  listEl.innerHTML = '<div class="news-loading"><span class="spinner"></span><p>Loading news&hellip;</p></div>';

  db.collection("news_posts")
    .where("school", "in", [school, "group"])
    .limit(50)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) { listEl.innerHTML = fallbackHtml; return; } // keep static fallback

      const posts = snapshot.docs.map((doc) => Object.assign({ id: doc.id }, doc.data()));
      posts.sort((a, b) => {
        const aTime = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime; // newest first
      });

      listEl.classList.add("news-grid");
      listEl.innerHTML = "";
      posts.slice(0, 24).forEach((post) => {
        const excerpt = makeExcerpt(post.body || "", 130);
        const card = document.createElement("a");
        card.className = "news-card";
        card.href = "../post.html?id=" + encodeURIComponent(post.id);

        const imgHtml = post.imageUrl
          ? '<img src="' + escapeAttr(post.imageUrl) + '" alt="">'
          : placeholderIconSvg();

        card.innerHTML =
          '<div class="news-card-img">' + imgHtml + '</div>' +
          '<div class="news-card-body">' +
            (post.breaking ? '<span class="news-card-badge">Urgent</span>' : "") +
            '<div class="news-card-date">' + escapeHtml(post.date || "") + '</div>' +
            '<h4>' + escapeHtml(post.title || "Untitled") + '</h4>' +
            '<p>' + escapeHtml(excerpt) + '</p>' +
            '<span class="read-more">Read more &rarr;</span>' +
          '</div>';
        listEl.appendChild(card);
      });
    })
    .catch((err) => {
      console.warn("News feed: could not load live posts, showing fallback.", err);
      listEl.innerHTML = fallbackHtml;
    });

  function makeExcerpt(text, maxLen) {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= maxLen) return clean;
    return clean.slice(0, maxLen).trim() + "\u2026";
  }

  function placeholderIconSvg() {
    return '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.45">' +
      '<rect x="3" y="4" width="18" height="16" rx="2"></rect>' +
      '<path d="M3 15l5-5 4 4 3-3 6 6"></path>' +
      '<circle cx="8" cy="9" r="1.5"></circle>' +
      '</svg>';
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, "&quot;");
  }
})();
