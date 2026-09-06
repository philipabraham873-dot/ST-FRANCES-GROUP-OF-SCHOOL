/*
  Shows a popup modal for the latest post marked "breaking" in
  the standalone news admin panel, the moment a visitor lands on a relevant page.

  Each page sets window.NEWS_SCHOOL to "primary", "secondary", or
  "group" before loading this script. Only posts with breaking == true
  and school == NEWS_SCHOOL (or "group") are eligible.

  A dismissed post won't pop up again for the rest of that browser tab's
  session (sessionStorage) -- closing and reopening the browser, or a
  new tab, will show it again if it's still marked breaking.

  Uses two separate equality/"in" filters with no orderBy, which
  Firestore can serve without requiring a manual composite index.
*/
(function () {
  if (typeof firebase === "undefined" || !window.NEWS_SCHOOL) return;

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  } catch (e) {
    return; // Firebase not configured yet -- fail quietly
  }

  const db = firebase.firestore();
  const school = window.NEWS_SCHOOL;
  const depth = document.body.getAttribute("data-root-depth") || "";

  db.collection("news_posts")
    .where("breaking", "==", true)
    .where("school", "in", [school, "group"])
    .limit(10)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) return;

      const posts = snapshot.docs.map((doc) => Object.assign({ id: doc.id }, doc.data()));
      posts.sort((a, b) => {
        const aTime = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });
      const post = posts[0];

      const dismissKey = "bnDismissed_" + post.id;
      if (sessionStorage.getItem(dismissKey)) return;

      showModal(post, dismissKey, depth);
    })
    .catch((err) => {
      console.warn("Breaking news: could not check for announcements.", err);
    });

  function showModal(post, dismissKey, depth) {
    const overlay = document.createElement("div");
    overlay.className = "bn-overlay";

    const excerpt = (post.body || "").replace(/\s+/g, " ").trim();
    const shortExcerpt = excerpt.length > 160 ? excerpt.slice(0, 160).trim() + "\u2026" : excerpt;
    const imgHtml = post.imageUrl
      ? '<img class="bn-img" src="' + escapeAttr(post.imageUrl) + '" alt="">'
      : "";

    overlay.innerHTML =
      '<div class="bn-modal" role="dialog" aria-modal="true">' +
        '<button class="bn-close" aria-label="Close">&times;</button>' +
        imgHtml +
        '<div class="bn-body">' +
          '<div class="bn-eyebrow">Urgent Announcement</div>' +
          '<h3>' + escapeHtml(post.title || "") + '</h3>' +
          '<p>' + escapeHtml(shortExcerpt) + '</p>' +
          '<div class="bn-actions">' +
            '<a class="bn-read" href="' + depth + 'post.html?id=' + encodeURIComponent(post.id) + '">Read full story</a>' +
            '<button class="bn-dismiss" type="button">Dismiss</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("open"));

    function close() {
      overlay.classList.remove("open");
      sessionStorage.setItem(dismissKey, "1");
      setTimeout(() => overlay.remove(), 200);
    }

    overlay.querySelector(".bn-close").addEventListener("click", close);
    overlay.querySelector(".bn-dismiss").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
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
