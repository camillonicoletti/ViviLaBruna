import { useEffect, useRef } from 'react';
import ActivityMedia from './ActivityMedia';
import { buildDirectionsUrl, buildTelephoneHref } from './activityExplorerUtils';

export default function ActivityDetailDialog({
  activity,
  isFavorite,
  onClose,
  onToggleFavorite
}) {
  const closeButtonRef = useRef(null);
  const directionsUrl = buildDirectionsUrl(activity.coords);
  const telephoneHref = buildTelephoneHref(activity.phone);
  const titleId = `activity-detail-title-${activity.id}`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const handleBackdrop = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="activity-detail-overlay" onMouseDown={handleBackdrop}>
      <section
        className="activity-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <ActivityMedia
          activity={activity}
          active
          controls={Boolean(activity.video)}
          className="activity-detail-media"
        >
          <span className="activity-detail-media-label">
            {activity.video ? 'Video esperienza' : 'Anteprima cinematografica'}
          </span>
          <button
            type="button"
            className={`activity-detail-favorite${isFavorite ? ' is-active' : ''}`}
            aria-label={`${isFavorite ? 'Rimuovi' : 'Salva'} ${activity.title} ${isFavorite ? 'dai' : 'nei'} preferiti`}
            aria-pressed={isFavorite}
            onClick={() => onToggleFavorite(activity.id)}
          >
            <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
          </button>
        </ActivityMedia>

        <div className="activity-detail-content">
          <button
            ref={closeButtonRef}
            type="button"
            className="activity-detail-close"
            aria-label="Chiudi dettagli attività"
            onClick={onClose}
          >
            ×
          </button>

          <div className="activity-detail-scroll">
            <span className="activity-detail-kicker">{activity.categoryLabel}</span>
            <h2 id={titleId}>{activity.title}</h2>
            <p className="activity-detail-summary">{activity.summary}</p>

            <div className="activity-detail-facts" aria-label="Informazioni principali">
              <span>◷ {activity.duration}</span>
              <span>★ {activity.rating} ({activity.reviews})</span>
              <strong>{activity.price}</strong>
            </div>

            <div className="activity-detail-contact">
              <p>
                <span aria-hidden="true">⌖</span>
                <span><small>Dove</small>{activity.location}</span>
              </p>
              <p>
                <span aria-hidden="true">☎</span>
                <span><small>Telefono</small><a href={telephoneHref}>{activity.phone}</a></span>
              </p>
            </div>

            <div className="activity-detail-note">
              <span aria-hidden="true">✦</span>
              <p><strong>Cosa vivrai</strong>Un’esperienza locale selezionata per scoprire Matera in modo semplice e autentico.</p>
            </div>
          </div>

          <div className="activity-detail-actions">
            {directionsUrl && (
              <a href={directionsUrl} target="_blank" rel="noreferrer" className="activity-detail-map-link">
                Indicazioni
              </a>
            )}
            <a href={telephoneHref} className="activity-detail-call-link">Chiama ora</a>
          </div>
        </div>
      </section>
    </div>
  );
}
