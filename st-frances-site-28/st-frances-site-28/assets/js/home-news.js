/*
  Homepage-only news preview. Unlike news-feed.js (which filters to one
  school + "group" posts for a section's own News page), this pulls
  from every school so the homepage can show the group's 3 most recent
  posts regardless of which school they came from.

  Each card links to /post.html?id=<docId> (this script only runs on
  the root index.html, so no "../" prefix is needed).

  If Firebase isn't configured yet, or the fetch fails or returns no
  posts, the static fallback cards already in the HTML are left in
  place -- nothing breaks for visitors.
*/
(function () {
  if (typeof firebase === "undefined") return;

  const listEl = document.getElementById("homeNewsList");
  if (!listEl) return;

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  } catch (e) {
    console.warn("Home news preview: Firebase not configured yet.", e);
    return;
  }

  const db = firebase.firestore();
  const fallbackHtml = listEl.innerHTML;
  const schoolLabels = {
    primary: "Omolere Primary",
    secondary: "St. Frances' Academy",
    group: "Group-wide"
  };

  db.collection("news_posts")
    .limit(50)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) return; // keep static fallback

      const posts = snapshot.docs.map((doc) => Object.assign({ id: doc.id }, doc.data()));
      posts.sort((a, b) => {
        const aTime = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime; // newest first
      });

      listEl.innerHTML = "";
      posts.slice(0, 3).forEach((post) => {
        const excerpt = makeExcerpt(post.body || "", 110);
        const label = schoolLabels[post.school] || "Group-wide";
        const card = document.createElement("a");
        card.className = "news-card";
        card.href = "post.html?id=" + encodeURIComponent(post.id);

        const imgHtml = post.imageUrl
          ? '<img src="' + escapeAttr(post.imageUrl) + '" alt="">'
          : placeholderIconSvg();

        card.innerHTML =
          '<div class="news-card-img">' + imgHtml + "</div>" +
          '<div class="news-card-body">' +
            (post.breaking ? '<span class="news-card-badge">Urgent</span>' : "") +
            '<div class="news-card-date">' + escapeHtml(label) + (post.date ? " &middot; " + escapeHtml(post.date) : "") + "</div>" +
            "<h4>" + escapeHtml(post.title || "Untitled") + "</h4>" +
            "<p>" + escapeHtml(excerpt) + "</p>" +
            '<span class="read-more">Read more &rarr;</span>' +
          "</div>";
        listEl.appendChild(card);
      });
    })
    .catch((err) => {
      console.warn("Home news preview: could not load live posts, showing fallback.", err);
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
      "</svg>";
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
