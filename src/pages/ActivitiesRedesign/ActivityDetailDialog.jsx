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
    const isMobile = window.matchMedia?.('(max-width: 760px)')?.matches ?? false;
    if (!isMobile) closeButtonRef.current?.focus();

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
        <button
          ref={closeButtonRef}
          type="button"
          className="activity-detail-close"
          aria-label="Chiudi dettagli attività"
          onClick={onClose}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M7 7l10 10M17 7 7 17" />
          </svg>
        </button>

        <ActivityMedia
          activity={activity}
          active
          controls={Boolean(activity.video)}
          customMobileControls={Boolean(activity.video)}
          className="activity-detail-media"
        >
          <button
            type="button"
            className={`activity-detail-favorite activity-detail-favorite-desktop${isFavorite ? ' is-active' : ''}`}
            aria-label={`${isFavorite ? 'Rimuovi' : 'Salva'} ${activity.title} ${isFavorite ? 'dai' : 'nei'} preferiti`}
            aria-pressed={isFavorite}
            onClick={() => onToggleFavorite(activity.id)}
          >
            <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
          </button>
          <span className="activity-detail-scroll-hint" aria-hidden="true">
            Scorri
            <span>↓</span>
          </span>
        </ActivityMedia>

        <div className="activity-detail-content">
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
                <svg className="activity-redesign-info-icon" aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12 21s6-5.25 6-11a6 6 0 1 0-12 0c0 5.75 6 11 6 11Z" />
                  <circle cx="12" cy="10" r="2.1" />
                </svg>
                <span><small>Dove</small>{activity.location}</span>
              </p>
              <p>
                <svg className="activity-redesign-info-icon" aria-hidden="true" viewBox="0 0 24 24">
                  <rect x="7" y="2.5" width="10" height="19" rx="2" />
                  <path d="M10 5h4M11 18.5h2" />
                </svg>
                <span><small>Telefono</small><a href={telephoneHref}>{activity.phone}</a></span>
              </p>
            </div>

            <button
              type="button"
              className={`activity-detail-favorite-mobile${isFavorite ? ' is-active' : ''}`}
              aria-label={`${isFavorite ? 'Rimuovi' : 'Aggiungi'} ${activity.title} ${isFavorite ? 'dai' : 'ai'} preferiti`}
              aria-pressed={isFavorite}
              onClick={() => onToggleFavorite(activity.id)}
            >
              <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
              {isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            </button>

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
