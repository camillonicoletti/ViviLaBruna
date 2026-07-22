import ActivityMedia from './ActivityMedia';
import { buildTelephoneHref } from './activityExplorerUtils';

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

  return (
    <article
      className="activity-redesign-card"
      onPointerEnter={() => onPreviewChange(activity.id)}
      onPointerLeave={() => onPreviewChange(null)}
      onFocusCapture={() => onPreviewChange(activity.id)}
      onBlurCapture={handleBlur}
    >
      <ActivityMedia
        activity={activity}
        active={previewActive}
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
        <span className="activity-redesign-media-status" aria-hidden="true">
          <span>▶</span>{activity.video ? 'Video' : 'In movimento'}
        </span>
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
          <p><span aria-hidden="true">⌖</span><span><small>Dove</small>{activity.location}</span></p>
          <p><span aria-hidden="true">☎</span><span><small>Telefono</small><a href={telephoneHref}>{activity.phone}</a></span></p>
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
