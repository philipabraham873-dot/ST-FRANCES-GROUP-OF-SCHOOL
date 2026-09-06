/*
  Firebase config for the news feed.

  This site shares the "smsp-3c741" Firebase project used by the rest
  of PhilTech — these are the real credentials from that project's
  registered web app.

  This one file is loaded by every page that needs the news feed
  (primary/news.html, secondary/news.html), so you only need to edit
  it once. The standalone news admin panel (deployed separately) has
  its own copy of this same config inlined in its own file.
*/
const firebaseConfig = {
  apiKey: "AIzaSyDmj8LMaHpJYL3w_UsenYCwiTNwc5qHpvY",
  authDomain: "smsp-3c741.firebaseapp.com",
  projectId: "smsp-3c741",
  storageBucket: "smsp-3c741.firebasestorage.app",
  messagingSenderId: "930783818569",
  appId: "1:930783818569:web:17297bda9c9fc3b1a0a098"
};

