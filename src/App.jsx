import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
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
  title: 'Journey to Kepler 186F',
  artist: 'Afterlife Theory Labs · Experiment 001',
  path: '/music/kepler-186f/',
  keywords: 'music house journey kepler kepler186f kepler18f kepler 18f afterlife theory labs space planet travel astronaut release experiment 001',
}];

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
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    const dialog = searchDialogRef.current;
    if (!dialog) return;

    if (searchOpen && !dialog.open) {
      dialog.showModal();
    } else if (!searchOpen && dialog.open) {
      dialog.close();
    }
  }, [searchOpen]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.volume = volume;

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [volume]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      setIsPlaying(false);
      if (error instanceof DOMException && error.name === 'NotSupportedError') {
        console.warn('Audio source is missing or unsupported. Add the track to /public/music/kepler-186f/kepler186f.mpeg.');
      }
    }
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(event.target.value);
    setCurrentTime(audio.currentTime);
  };

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
        <Link to="/" className="brand" aria-label="Afterlife Theory Labs home">
          <span className="brand-mark" aria-hidden="true">a</span>
          <span>Afterlife Theory Labs</span>
        </Link>
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

          <section className="release" aria-labelledby="release-heading">
            <div className="section-label"><h2 id="release-heading">THE FIRST RELEASE</h2><span>001 — Journey to Kepler 186F</span></div>
            <div className="featured-release">
              <Link to="/music/kepler-186f/" className="release-art" aria-label="Explore Journey to Kepler 186F">
                <img src="/assets/kepler186f.png" alt="An astronaut gazing across the landscape of an imagined planet" width="840" height="472" />
                <span className="art-stamp">ALT / 001</span>
                <span className="art-coordinate">KEPLER 186F<br />AN IMAGINED JOURNEY</span>
              </Link>
              <div className="release-copy">
                <div className="release-meta"><span className="release-status">Allen Thomson</span><span>HOUSE MUSIC</span></div>
                <h3>JOURNEY TO<br />KEPLER <span>186F</span></h3>
                <p>One departure. Everything beyond.</p>
                <Link to="/music/kepler-186f/" className="release-link">Explore the release</Link>
              </div>
            </div>
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
                  <img src="/assets/kepler186f.png" alt="" width="74" height="58" />
                  <span className="release-name">{item.title}<small>{item.artist}</small></span>
                </Link>
              ))
            ) : (
              <p className="empty-result">No tracks found.<br />Try “Kepler” or “Afterlife”.</p>
            )}
          </div>
          <p className="search-foot">Afterlife Theory Labs / SOUND ARCHIVE</p>
      </dialog>

      <div className="player" aria-label="Music player">
        <Link to="/music/kepler-186f/" className="player-title">Journey to Kepler 186F<small>Afterlife Theory Labs</small></Link>
        <button type="button" aria-label={isPlaying ? 'Pause track' : 'Play track'} onClick={togglePlayback}>{isPlaying ? '❚❚' : '▷'}</button>
        <span className="time">{formatTime(currentTime)}</span>
        <input type="range" min="0" max={duration || 0} value={Math.min(currentTime, duration || 0)} step="0.1" aria-label="Seek within track" onChange={handleSeek} />
        <span className="time">{formatTime(duration)}</span>
        <label className="volume-label" htmlFor="home-volume">Volume</label>
        <input id="home-volume" className="volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => {
          const value = Number(event.target.value);
          setVolume(value);
          if (audioRef.current) audioRef.current.volume = value;
        }} />
        <audio ref={audioRef} preload="metadata" src="/music/kepler-186f/kepler186f.mpeg" type="audio/mpeg" onError={() => console.warn('Audio source is missing or unsupported. Add the track to /public/music/kepler-186f/kepler186f.mpeg.')} />
      </div>
    </>
  );
}

function SongPage() {
  const location = useLocation();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [reactionState, setReactionState] = useState({ like: false, dislike: false });
  const [reactionCounts, setReactionCounts] = useState({ likes: 0, dislikes: 0 });
  const [dbReady, setDbReady] = useState(false);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [audioStatus, setAudioStatus] = useState('The journey begins here. Music is ready to play.');

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    audio.volume = volume;

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [volume]);

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
        const trackRef = doc(db, 'music', 'kepler-186f');
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
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
        setAudioStatus('Playing track.');
      } else {
        audio.pause();
        setIsPlaying(false);
        setAudioStatus('Playback paused.');
      }
    } catch (error) {
      setIsPlaying(false);
      const message = error instanceof DOMException && error.name === 'NotSupportedError'
        ? 'Audio source is missing or unsupported. Add the song to /public/music/kepler-186f/kepler186f.mpeg.'
        : 'The track could not be played right now.';
      setAudioStatus(message);
    }
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(event.target.value);
    setCurrentTime(audio.currentTime);
  };

  const handleReaction = async (type) => {
    if (!dbReady || reactionBusy) return;
    setReactionBusy(true);
    try {
      const user = await getFirebaseUser();
      const db = getFirebaseDb();
      const trackRef = doc(db, 'music', 'kepler-186f');
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
        <Link to="/" className="brand" aria-label="Afterlife Theory Labs home">
          <span className="brand-mark" aria-hidden="true">a</span>
          <span>Afterlife Theory Labs</span>
        </Link>
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
              <img src="/assets/kepler186f.png" alt="An astronaut overlooking an imagined planetary landscape" width="800" height="800" />
              <span className="cover-caption">Allen Thomson<strong>JOURNEY TO<br />KEPLER 186F</strong><span>001 / HOUSE MUSIC</span></span>
            </div>

            <div className="song-info">
              <span className="eyebrow release-status">HOUSE MUSIC / RELEASE 001</span>
              <h1>JOURNEY TO<br />KEPLER <span>186F</span></h1>
              <p className="artist">ALLEN THOMSON</p>
              <p className="song-description">The first musical departure from Afterlife Theory Labs.</p>

              <div className="music-controller" aria-label="Music controls">
                <button className="controller-toggle" type="button" aria-label={isPlaying ? 'Pause track' : 'Play track'} onClick={togglePlayback}>{isPlaying ? '❚❚' : '▷'}</button>
                <span className="controller-time" id="controller-current">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={Math.min(currentTime, duration || 0)}
                  step="1"
                  aria-label="Seek within track"
                  onChange={handleSeek}
                />
                <span className="controller-time" id="controller-duration">{formatTime(duration)}</span>
                <label className="sr-only" htmlFor="controller-volume">Volume</label>
                <input
                  id="controller-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  aria-label="Volume"
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setVolume(value);
                    if (audioRef.current) audioRef.current.volume = value;
                  }}
                />
              </div>

              <p className="audio-note" role="status">{audioStatus}</p>

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
            <div><span>RELEASE</span><p>001</p></div>
            <div><span>PRODUCTION</span><p>Afterlife Theory Labs</p></div>
            <div><span>DESTINATION</span><p>Kepler 186F</p></div>
            <div><span>STATUS</span><p id="detail-status">RELEASED</p></div>
          </div>
        </section>
      </main>

      <div className="player" hidden={!location.pathname.startsWith('/music/kepler-186f')}>
        <Link to="/music/kepler-186f/" className="player-title">Journey to Kepler 186F<small>Afterlife Theory Labs</small></Link>
        <button type="button" aria-label={isPlaying ? 'Pause track' : 'Play track'} onClick={togglePlayback}>{isPlaying ? '❚❚' : '▷'}</button>
        <span className="time">{formatTime(currentTime)}</span>
        <input type="range" min="0" max={duration || 0} value={Math.min(currentTime, duration || 0)} step="0.1" aria-label="Seek within track" onChange={handleSeek} />
        <span className="time">{formatTime(duration)}</span>
        <label className="volume-label" htmlFor="volume">Volume</label>
        <input id="volume" className="volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => {
          const value = Number(event.target.value);
          setVolume(value);
          if (audioRef.current) audioRef.current.volume = value;
        }} />
        <audio
          ref={audioRef}
          preload="metadata"
          src="/music/kepler-186f/kepler186f.mpeg"
          type="audio/mpeg"
          onError={() => setAudioStatus('Audio source is missing or unsupported. Add the song to /public/music/kepler-186f/kepler186f.mpeg.')}
        />
      </div>
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

export default function App() {
  const location = useLocation();

  useEffect(() => {
    document.title = location.pathname.startsWith('/music/kepler-186f') ? 'Journey to Kepler 186F — Afterlife Theory Labs' : 'Afterlife Theory Labs — Sound beyond the familiar';
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/music/kepler-186f/*" element={<SongPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
