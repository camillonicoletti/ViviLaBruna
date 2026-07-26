import { useEffect, useRef, useState } from 'react';
import { resolveActivityMedia } from './activityExplorerUtils';
import { shouldAutoplayActivityMedia } from './activityMediaPolicy';
import {
  canFullscreenActivityVideo,
  enterActivityVideoFullscreen
} from './activityVideoControls';

const MOBILE_MEDIA_QUERY = '(max-width: 760px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function readMediaQuery(query) {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(query).matches;
}

export default function ActivityMedia({
  activity,
  active = false,
  autoplayWhenVisible = false,
  controls = false,
  customMobileControls = false,
  className = '',
  children
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const [isMobile, setIsMobile] = useState(() => readMediaQuery(MOBILE_MEDIA_QUERY));
  const [reduceMotion, setReduceMotion] = useState(() => readMediaQuery(REDUCED_MOTION_QUERY));
  const [visibility, setVisibility] = useState({ known: false, visible: false });
  const wrapperRef = useRef(null);
  const videoRef = useRef(null);
  const media = resolveActivityMedia(activity);
  const showVideo = Boolean(media.video) && !videoFailed;
  const autoplayEnabled = autoplayWhenVisible && isMobile && !reduceMotion;
  const shouldAutoplay = autoplayWhenVisible && shouldAutoplayActivityMedia({
    isMobile,
    isVisible: visibility.visible,
    reduceMotion
  });
  const shouldPlay = active || shouldAutoplay;

  useEffect(() => {
    setVideoFailed(false);
    setImageFailed(false);
    setIsPlaying(false);
    setIsMuted(true);
  }, [activity.id]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;

    const mobileQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const updateQueries = () => {
      setIsMobile(mobileQuery.matches);
      setReduceMotion(motionQuery.matches);
    };

    updateQueries();
    mobileQuery.addEventListener?.('change', updateQueries);
    motionQuery.addEventListener?.('change', updateQueries);

    return () => {
      mobileQuery.removeEventListener?.('change', updateQueries);
      motionQuery.removeEventListener?.('change', updateQueries);
    };
  }, []);

  useEffect(() => {
    if (!autoplayWhenVisible || !wrapperRef.current) {
      setVisibility({ known: true, visible: false });
      return undefined;
    }

    if (!('IntersectionObserver' in window)) {
      setVisibility({ known: true, visible: true });
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setVisibility({
        known: true,
        visible: entry.isIntersecting && entry.intersectionRatio >= 0.6
      });
    }, { threshold: [0, 0.6, 1] });

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [autoplayWhenVisible, activity.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    if (autoplayEnabled && !visibility.known && !active) {
      return undefined;
    }

    if (shouldPlay) {
      video.play().catch((error) => {
        if (error?.name !== 'AbortError') setVideoFailed(true);
      });
    } else {
      video.pause();
      if (!autoplayEnabled) video.currentTime = 0;
    }

    return undefined;
  }, [active, autoplayEnabled, shouldPlay, showVideo, visibility.known]);

  useEffect(() => {
    const video = videoRef.current;
    setFullscreenAvailable(
      Boolean(customMobileControls && isMobile && canFullscreenActivityVideo(video))
    );
  }, [customMobileControls, isMobile, showVideo]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch((error) => {
        if (error?.name !== 'AbortError') setVideoFailed(true);
      });
    } else {
      video.pause();
    }
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleFullscreen = () => {
    enterActivityVideoFullscreen(videoRef.current);
  };

  return (
    <div
      ref={wrapperRef}
      className={`activity-redesign-media${imageFailed ? ' image-fallback' : ''}${className ? ` ${className}` : ''}`}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          src={media.video}
          poster={autoplayEnabled ? undefined : (media.poster || undefined)}
          preload="metadata"
          autoPlay={autoplayEnabled}
          muted={isMuted}
          loop
          playsInline
          controls={controls && !(customMobileControls && isMobile)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onVolumeChange={(event) => setIsMuted(event.currentTarget.muted)}
          onLoadedMetadata={(event) => {
            setFullscreenAvailable(Boolean(
              customMobileControls
              && isMobile
              && canFullscreenActivityVideo(event.currentTarget)
            ));
          }}
          onError={() => setVideoFailed(true)}
        />
      ) : !imageFailed && media.image ? (
        <img
          src={media.image}
          alt={`${activity.title} a Matera`}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : null}
      {showVideo && customMobileControls && isMobile && (
        <div className="activity-video-controls" role="group" aria-label="Controlli video">
          <button
            type="button"
            className="activity-video-control"
            aria-label={isPlaying ? 'Metti in pausa il video' : 'Riproduci il video'}
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M8 6v12M16 6v12" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path className="activity-video-control-fill" d="m9 6 9 6-9 6Z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="activity-video-control"
            aria-label={isMuted ? 'Attiva audio' : 'Disattiva audio'}
            aria-pressed={!isMuted}
            onClick={handleMuteToggle}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M5 10v4h4l4 4V6L9 10H5Z" />
              {isMuted ? (
                <path d="m16 9 5 6M21 9l-5 6" />
              ) : (
                <path d="M16 9.5c1.3 1.4 1.3 3.6 0 5M19 7c2.7 2.8 2.7 7.2 0 10" />
              )}
            </svg>
          </button>
          <button
            type="button"
            className="activity-video-control"
            aria-label="Apri video a tutto schermo"
            disabled={!fullscreenAvailable}
            onClick={handleFullscreen}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M9 5H5v4M15 5h4v4M19 15v4h-4M9 19H5v-4" />
            </svg>
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
