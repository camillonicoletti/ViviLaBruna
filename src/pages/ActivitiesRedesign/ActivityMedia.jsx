import { useEffect, useRef, useState } from 'react';
import { resolveActivityMedia } from './activityExplorerUtils';

export default function ActivityMedia({
  activity,
  active = false,
  controls = false,
  className = '',
  children
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const videoRef = useRef(null);
  const media = resolveActivityMedia(activity);
  const showVideo = Boolean(media.video) && !videoFailed;

  useEffect(() => {
    setVideoFailed(false);
    setImageFailed(false);
  }, [activity.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    if (active) {
      video.play().catch(() => setVideoFailed(true));
    } else {
      video.pause();
      video.currentTime = 0;
    }

    return undefined;
  }, [active, showVideo]);

  return (
    <div className={`activity-redesign-media${imageFailed ? ' image-fallback' : ''}${className ? ` ${className}` : ''}`}>
      {showVideo ? (
        <video
          ref={videoRef}
          src={media.video}
          poster={media.poster || undefined}
          preload="metadata"
          muted
          loop
          playsInline
          controls={controls}
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
      {children}
    </div>
  );
}
