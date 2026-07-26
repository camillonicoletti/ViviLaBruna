import ActivityMedia from './ActivityMedia';
import {
  buildTelephoneHref,
  shouldOpenActivityCard
} from './activityExplorerUtils';

export default function ActivityCard({
  activity,
  isFavorite,
  previewActive,
  onPreviewChange,
  onOpen,
  onToggleFavorite
}) {
  const telephoneHref = buildTelephoneHref(activity.phone);

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      onPreviewChange(null);
    }
  };

  const handleCardClick = (event) => {
    const isMobile = window.matchMedia?.('(max-width: 760px)')?.matches ?? false;
    const isInteractiveTarget = Boolean(event.target.closest?.('button, a'));

    if (shouldOpenActivityCard({ isMobile, isInteractiveTarget })) {
      onOpen(activity, event.currentTarget);
    }
  };

  return (
    <article
      className="activity-redesign-card"
      onClick={handleCardClick}
      onPointerEnter={() => onPreviewChange(activity.id)}
      onPointerLeave={() => onPreviewChange(null)}
      onFocusCapture={() => onPreviewChange(activity.id)}
      onBlurCapture={handleBlur}
    >
      <ActivityMedia
        activity={activity}
        active={previewActive}
        autoplayWhenVisible
        className={previewActive ? 'is-active' : ''}
      >
        <span className="activity-redesign-category">{activity.categoryLabel}</span>
        <button
          type="button"
          className={`activity-redesign-favorite${isFavorite ? ' is-active' : ''}`}
          aria-label={`${isFavorite ? 'Rimuovi' : 'Salva'} ${activity.title} ${isFavorite ? 'dai' : 'nei'} preferiti`}
          aria-pressed={isFavorite}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(activity.id);
          }}
        >
          <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
        </button>
      </ActivityMedia>

      <div className="activity-redesign-card-body">
        <span className="activity-redesign-card-kicker">Esperienza a Matera</span>
        <h2>{activity.title}</h2>
        <p className="activity-redesign-summary">{activity.summary}</p>

        <div className="activity-redesign-facts" aria-label="Informazioni principali">
          <span>◷ {activity.duration}</span>
          <span>★ {activity.rating} ({activity.reviews})</span>
          <strong>{activity.price}</strong>
        </div>

        <div className="activity-redesign-quick-info">
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
          className="activity-redesign-discover"
          onClick={(event) => onOpen(activity, event.currentTarget)}
        >
          <span>Scopri l’esperienza</span>
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  );
}
