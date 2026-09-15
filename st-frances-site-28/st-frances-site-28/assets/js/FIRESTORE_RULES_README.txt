These are the Firestore rules for the "news_posts" collection used by
the news feed (primary/news.html, secondary/news.html, the standalone
news admin panel). Add this block into your existing rules for the
smsp-3c741 project, alongside your other collections' rules.

    match /news_posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.token.email == "philipabraham873@gmail.com";
    }

STATUS: the standalone admin panel now signs in with real Firebase
Authentication (email + password) instead of the old PIN — only
philipabraham873@gmail.com can sign in and use it. The rule above is
what actually enforces that on Firebase's side; the login screen
alone is just the UI. Full setup steps (enabling Email/Password
sign-in, creating the account, this exact rule) are in the standalone
admin panel's own SETUP.txt.

If you ever change the admin email, three things need to match: the
ADMIN_EMAIL constant in the standalone panel, the Firebase
Authentication user, and the email in this rule. See "CHANGING THE
ADMIN EMAIL LATER" in that SETUP.txt.

Worth doing next, not urgent: Firebase App Check, to block automated
bots from hitting Firestore directly even without a login.


============================================================
PHOTOS — no extra setup needed
============================================================
News post photos do NOT use Firebase Storage, on purpose — Storage now
requires the paid Blaze plan even for tiny usage, and this site is
built to run entirely on the free Spark plan.

Instead, when you pick a photo in the news admin panel, it's resized and
compressed right there in the browser, then saved directly inside the
Firestore post itself (Firestore, unlike Storage, is fine on the free
tier). There's nothing to configure — the Firestore rule above already
covers it, since it's just part of the same document.

The only limit worth knowing: Firestore caps each document at 1MB.
The built-in resize/compress step keeps typical photos well under
that automatically, but if a save ever fails with a "longer than"
error, it means the photo was unusually large (very high resolution or
detailed) — just try a smaller or simpler image.

