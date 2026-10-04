import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { doc, getFirestore, onSnapshot, runTransaction } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

const releases = [{
  id: 'chill',
  number: '002',
  title: 'Chilling with Soman',
  artist: 'Afterlife Theory Labs · Experiment 002',
  path: '/music/chill/',
  artwork: '/music/chill/chill.jpeg',
  audio: '/music/chill/chillingwithsoman.mpeg',
  artAlt: 'Artwork for Chilling with Soman',
  heading: <>CHILLING WITH<br /><span>SOMAN</span></>,
  description: 'Chilling with Soman, a house music release from Afterlife Theory Labs.',
  detailLabel: 'TITLE',
  detailValue: 'Chilling with Soman',
  teaser: 'Another sound from Afterlife Theory Labs.',
  keywords: 'music house chill chilling with soman afterlife theory labs release experiment 002',
}, {
  id: 'kepler-186f',
  number: '001',
  title: 'Journey to Kepler 186F',
  artist: 'Afterlife Theory Labs · Experiment 001',
  path: '/music/kepler-186f/',
  artwork: '/assets/kepler186f.png',
  audio: '/music/kepler-186f/kepler186f.mpeg',
  artAlt: 'An astronaut overlooking an imagined planetary landscape',
  heading: <>JOURNEY TO<br />KEPLER <span>186F</span></>,
  description: 'The first musical departure from Afterlife Theory Labs.',
  detailLabel: 'DESTINATION',
  detailValue: 'Kepler 186F',
  teaser: 'One departure. Everything beyond.',
  keywords: 'music house journey kepler kepler186f kepler18f kepler 18f afterlife theory labs space planet travel astronaut release experiment 001',
}];

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Afterlife Theory Labs music home">
      <img className="brand-icon" src="/favicon.svg" alt="" width="32" height="32" />
      <span>Afterlife Theory Labs</span>
    </Link>
  );
}

function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

function getFirebaseDb() {
  return getFirestore(getFirebaseApp());
}

let anonymousSignInPromise;

async function getFirebaseUser() {
  const auth = getAuth(getFirebaseApp());
  if (auth.currentUser) return auth.currentUser;

  anonymousSignInPromise ??= signInAnonymously(auth)
    .then(({ user }) => user)
    .finally(() => {
      anonymousSignInPromise = undefined;
    });

  return anonymousSignInPromise;
}

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

function HomePage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchDialogRef = useRef(null);

  useEffect(() => {
    const dialog = searchDialogRef.current;
    if (!dialog) return;

    if (searchOpen && !dialog.open) {
      dialog.showModal();
    } else if (!searchOpen && dialog.open) {
      dialog.close();
    }
  }, [searchOpen]);

  const results = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const words = query.split(/\s+/);
    return releases.filter((release) => {
      const haystack = `${release.title} ${release.artist} ${release.keywords}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }, [searchQuery]);

  return (
    <>
      <header className="header">
        <Brand />
        <nav aria-label="Main navigation">
          <Link to="/" className="nav-home">MUSIC<span className="nav-dot" /></Link>
          <button className="search-trigger" aria-haspopup="dialog" aria-expanded={searchOpen} aria-label="Search music" onClick={() => setSearchOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
            <span>Search</span>
            <kbd>/</kbd>
          </button>
        </nav>
        <span className="header-note">BEATS BY ALLEN</span>
      </header>

      <main id="main" tabIndex="-1">
        <section className="home view">
          <div className="hero">
            <div className="hero-top"><span>EXPLORATIONS / VOL. 001</span><span>EST. ON EARTH</span></div>
            <div className="hero-bottom">
              <p>Beyond Silicon<br /><span>&amp; Binary</span></p>
              <p className="hero-note" />
            </div>
          </div>

          <section className="release" aria-labelledby="house-heading">
            <div className="section-label"><h2 id="house-heading">HOUSE MUSIC</h2><span>{releases.length} RELEASES / NEWEST FIRST</span></div>
            {releases.map((release) => (
              <div className="featured-release" key={release.id}>
                <Link to={release.path} className="release-art" aria-label={`Explore ${release.title}`}>
                  <img src={release.artwork} alt={release.artAlt} width="1122" height="884" />
                  <span className="art-stamp">ALT / {release.number}</span>
                </Link>
                <div className="release-copy">
                  <div className="release-meta"><span className="release-status">Allen Thomson</span><span>HOUSE MUSIC / {release.number}</span></div>
                  <h3>{release.heading}</h3>
                  <p>{release.teaser}</p>
                  <Link to={release.path} className="release-link">Explore the release</Link>
                </div>
              </div>
            ))}
          </section>
        </section>
      </main>

      <dialog
        ref={searchDialogRef}
        aria-labelledby="search-title"
        className="search-dialog"
        onCancel={(event) => {
          event.preventDefault();
          setSearchOpen(false);
        }}
      >
          <div className="search-top">
            <h2 id="search-title">FIND YOUR SOUND.</h2>
            <button type="button" id="close-search" aria-label="Close search" onClick={() => setSearchOpen(false)}>✕</button>
          </div>
          <label htmlFor="search-input">SEARCH MUSIC</label>
          <input id="search-input" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search a title or artist…" autoComplete="off" autoFocus />
          <div id="search-results" aria-live="polite">
            {results.length ? (
              results.map((item) => (
                <Link key={item.title} to={item.path} className="release-row" onClick={() => setSearchOpen(false)}>
                  <img src={item.artwork} alt="" width="74" height="58" />
                  <span className="release-name">{item.title}<small>{item.artist}</small></span>
                </Link>
              ))
            ) : (
              <p className="empty-result">No tracks found.<br />Try “Kepler” or “Soman”.</p>
            )}
          </div>
          <p className="search-foot">Afterlife Theory Labs / SOUND ARCHIVE</p>
      </dialog>

    </>
  );
}

function SongPage({ release, player }) {
  const isCurrent = player.selectedId === release.id;
  const [reactionState, setReactionState] = useState({ like: false, dislike: false });
  const [reactionCounts, setReactionCounts] = useState({ likes: 0, dislikes: 0 });
  const [dbReady, setDbReady] = useState(false);
  const [reactionBusy, setReactionBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
    if (!hasFirebaseConfig) {
      setDbReady(false);
      console.error('Firebase reactions are unavailable: check the VITE_FIREBASE_* or NEXT_PUBLIC_FIREBASE_* variables in .env.');
      return () => {
        active = false;
      };
    }

    const connectReactions = async () => {
      try {
        const user = await getFirebaseUser();
        if (!active) return;
        const db = getFirebaseDb();
        const trackRef = doc(db, 'music', release.id);
        const voteRef = doc(trackRef, 'votes', user.uid);

        const unsubscribeVote = onSnapshot(
          voteRef,
          (snapshot) => {
            if (!active) return;
            const vote = snapshot.data()?.vote;
            setReactionState({ like: vote === 'like', dislike: vote === 'dislike' });
            setDbReady(true);
          },
          (error) => {
            console.error('Could not load the current track vote from Firestore.', error);
            if (active) setDbReady(false);
          },
        );
        const unsubscribeCounts = onSnapshot(
          trackRef,
          (snapshot) => {
            if (!active) return;
            const data = snapshot.data();
            setReactionCounts({
              likes: Number(data?.likes) || 0,
              dislikes: Number(data?.dislikes) || 0,
            });
          },
          (error) => {
            console.error('Could not load track reaction counts from Firestore.', error);
          },
        );

        return () => {
          unsubscribeVote();
          unsubscribeCounts();
        };
      } catch (error) {
        console.error('Could not load track reactions from Firestore.', error);
        if (!active) return;
        setDbReady(false);
      }
    };

    let unsubscribe;
    connectReactions().then((cleanup) => {
      unsubscribe = cleanup;
      if (!active) unsubscribe?.();
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [release.id]);

  const handleReaction = async (type) => {
    if (!dbReady || reactionBusy) return;
    setReactionBusy(true);
    try {
      const user = await getFirebaseUser();
      const db = getFirebaseDb();
      const trackRef = doc(db, 'music', release.id);
      const voteRef = doc(trackRef, 'votes', user.uid);
      const nextVote = await runTransaction(db, async (transaction) => {
        const [trackSnapshot, voteSnapshot] = await Promise.all([
          transaction.get(trackRef),
          transaction.get(voteRef),
        ]);
        const currentVote = voteSnapshot.data()?.vote;
        const previousVote = currentVote === 'like' || currentVote === 'dislike'
          ? currentVote
          : 'none';
        const updatedVote = previousVote === type ? 'none' : type;
        const currentCounts = trackSnapshot.data() || {};
        const likes = Number(currentCounts.likes) || 0;
        const dislikes = Number(currentCounts.dislikes) || 0;
        const nextCounts = {
          likes: Math.max(0, likes + Number(updatedVote === 'like') - Number(previousVote === 'like')),
          dislikes: Math.max(0, dislikes + Number(updatedVote === 'dislike') - Number(previousVote === 'dislike')),
        };

        if (updatedVote === 'none') {
          transaction.delete(voteRef);
        } else {
          transaction.set(voteRef, { vote: updatedVote });
        }
        transaction.set(trackRef, nextCounts, { merge: true });

        return { vote: updatedVote, counts: nextCounts };
      });

      setReactionState({ like: nextVote.vote === 'like', dislike: nextVote.vote === 'dislike' });
      setReactionCounts(nextVote.counts);
    } catch (error) {
      console.error('Could not save track reaction to Firestore.', error);
    } finally {
      setReactionBusy(false);
    }
  };

  return (
    <>
      <header className="header">
        <Brand />
        <nav aria-label="Main navigation">
          <Link to="/" className="nav-home">MUSIC<span className="nav-dot" /></Link>
        </nav>
        <span className="header-note">BEATS BY ALLEN</span>
      </header>

      <main id="main" tabIndex="-1">
        <section className="song view">
          <Link to="/" className="back-link">All music</Link>

          <div className="song-grid">
            <div className="cover">
              <img src={release.artwork} alt={release.artAlt} width="800" height="800" />
              <span className="cover-caption">Allen Thomson<strong>{release.heading}</strong><span>{release.number} / HOUSE MUSIC</span></span>
            </div>

            <div className="song-info">
              <span className="eyebrow release-status">HOUSE MUSIC / RELEASE {release.number}</span>
              <h1>{release.heading}</h1>
              <p className="artist">ALLEN THOMSON</p>
              <p className="song-description">{release.description}</p>

              <div className="music-controller" aria-label="Music controls">
                <button className="track-skip" type="button" aria-label="Previous track" onClick={() => player.skip(-1)}>⏮</button>
                <button className="controller-toggle" type="button" aria-label={isCurrent && player.isPlaying ? 'Pause track' : `Play ${release.title}`} onClick={() => player.toggleFor(release.id)}>{isCurrent && player.isPlaying ? '❚❚' : '▷'}</button>
                <button className="track-skip" type="button" aria-label="Next track" onClick={() => player.skip(1)}>⏭</button>
                <span className="controller-time">{formatTime(isCurrent ? player.currentTime : 0)}</span>
                <input
                  type="range"
                  min="0"
                  max={isCurrent ? player.duration || 0 : 0}
                  value={isCurrent ? Math.min(player.currentTime, player.duration || 0) : 0}
                  step="1"
                  aria-label="Seek within track"
                  disabled={!isCurrent}
                  onChange={(event) => player.seek(Number(event.target.value))}
                />
                <span className="controller-time">{formatTime(isCurrent ? player.duration : 0)}</span>
                <label className="sr-only" htmlFor="controller-volume">Volume</label>
                <input
                  id="controller-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={player.volume}
                  aria-label="Volume"
                  onChange={(event) => player.setVolume(Number(event.target.value))}
                />
              </div>

              <div className="song-actions" aria-label="Rate this track">
                <button
                  className="reaction"
                  type="button"
                  aria-label={reactionState.like ? 'Unlike this track' : 'Like this track'}
                  aria-pressed={reactionState.like}
                  disabled={!dbReady || reactionBusy}
                  onClick={() => handleReaction('like')}
                >
                  <svg className="reaction-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 10v11H3V10h4Zm0 0 5-8c3 0 3 3 2 7h5a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 2H7" />
                  </svg>
                  <span className="reaction-count">{reactionCounts.likes}</span>
                </button>
                <button
                  className="reaction"
                  type="button"
                  aria-label={reactionState.dislike ? 'Undo dislike for this track' : 'Dislike this track'}
                  aria-pressed={reactionState.dislike}
                  disabled={!dbReady || reactionBusy}
                  onClick={() => handleReaction('dislike')}
                >
                  <svg className="reaction-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 14V3H3v11h4Zm0 0 5 8c3 0 3-3 2-7h5a2 2 0 0 0 2-2l-2-8a2 2 0 0 0-2-2H7" />
                  </svg>
                  <span className="reaction-count">{reactionCounts.dislikes}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="song-details">
            <div><span>RELEASE</span><p>{release.number}</p></div>
            <div><span>PRODUCTION</span><p>Afterlife Theory Labs</p></div>
            <div><span>{release.detailLabel}</span><p>{release.detailValue}</p></div>
            <div><span>STATUS</span><p id="detail-status">RELEASED</p></div>
          </div>
        </section>
      </main>

    </>
  );
}

function NotFoundPage() {
  return (
    <main className="not-found view">
      <span className="eyebrow">SIGNAL LOST</span>
      <h1>UNCHARTED SPACE.</h1>
      <Link to="/">Return to the music</Link>
    </main>
  );
}

function SongRoute({ player }) {
  const { slug } = useParams();
  const release = releases.find((item) => item.id === slug);
  return release ? <SongPage key={release.id} release={release} player={player} /> : <NotFoundPage />;
}

export default function App() {
  const location = useLocation();
  const audioRef = useRef(null);
  const [selectedId, setSelectedId] = useState(() => releases.find((release) => location.pathname.startsWith(release.path))?.id || releases[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const selectedRelease = releases.find((release) => release.id === selectedId);

  useEffect(() => {
    const audio = audioRef.current;
    audio.src = selectedRelease.audio;
    audio.volume = 0.8;
    audio.load();
  }, []);

  const play = async () => {
    try {
      await audioRef.current.play();
    } catch (error) {
      console.error('Could not play the selected track.', error);
    }
  };

  const selectTrack = (id, shouldPlay) => {
    const release = releases.find((item) => item.id === id);
    const audio = audioRef.current;
    if (!release || !audio) return;
    if (id === selectedId) {
      if (shouldPlay) play();
      return;
    }
    audio.pause();
    audio.src = release.audio;
    audio.load();
    setSelectedId(id);
    setCurrentTime(0);
    setDuration(0);
    if (shouldPlay) play();
  };

  const toggleFor = (id) => {
    const audio = audioRef.current;
    if (id !== selectedId) {
      selectTrack(id, true);
    } else if (audio.paused) {
      play();
    } else {
      audio.pause();
    }
  };

  const skip = (direction, forcePlay = false) => {
    const index = releases.findIndex((release) => release.id === selectedId);
    const next = releases[(index + direction + releases.length) % releases.length];
    selectTrack(next.id, forcePlay || !audioRef.current.paused);
  };

  const seek = (seconds) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = seconds;
    setCurrentTime(audio.currentTime);
  };

  const changeVolume = (value) => {
    setVolume(value);
    audioRef.current.volume = value;
  };

  const player = { selectedId, isPlaying, currentTime, duration, volume, toggleFor, skip, seek, setVolume: changeVolume };

  useEffect(() => {
    const release = releases.find((item) => location.pathname.startsWith(item.path));
    document.title = release ? `${release.title} — Afterlife Theory Labs` : 'Afterlife Theory Labs — Sound beyond the familiar';
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/music/:slug/*" element={<SongRoute player={player} />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <div className="player" aria-label="Music player">
        <Link to={selectedRelease.path} className="player-title">{selectedRelease.title}<small>Afterlife Theory Labs</small></Link>
        <div className="player-buttons">
          <button type="button" aria-label="Previous track" onClick={() => skip(-1)}>⏮</button>
          <button type="button" aria-label={isPlaying ? 'Pause track' : 'Play track'} onClick={() => toggleFor(selectedId)}>{isPlaying ? '❚❚' : '▷'}</button>
          <button type="button" aria-label="Next track" onClick={() => skip(1)}>⏭</button>
        </div>
        <span className="time">{formatTime(currentTime)}</span>
        <input className="player-progress" type="range" min="0" max={duration || 0} value={Math.min(currentTime, duration || 0)} step="0.1" aria-label="Seek within track" onChange={(event) => seek(Number(event.target.value))} />
        <span className="time">{formatTime(duration)}</span>
        <label className="volume-label" htmlFor="volume">Volume</label>
        <input id="volume" className="volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => changeVolume(Number(event.target.value))} />
        <audio
          ref={audioRef}
          preload="metadata"
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => skip(1, true)}
          onError={() => console.error(`Audio source is missing or unsupported: ${audioRef.current?.src}`)}
        />
      </div>
    </>
  );
}
