import { useState } from 'react';
import { buildDirectionsUrl, buildTelephoneHref } from './activityExplorerUtils';

export default function ActivityCard({ activity, isFavorite, onToggleFavorite }) {
  const [imageFailed, setImageFailed] = useState(false);
  const directionsUrl = buildDirectionsUrl(activity.coords);
  const telephoneHref = buildTelephoneHref(activity.phone);

  return (
    <article className="activity-redesign-card">
      <div className={`activity-redesign-media${imageFailed ? ' image-fallback' : ''}`}>
        {!imageFailed && (
          <img
            src={activity.image}
            alt={`${activity.title} a Matera`}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        )}
        <span className="activity-redesign-category">{activity.categoryLabel}</span>
        <button
          type="button"
          className={`activity-redesign-favorite${isFavorite ? ' is-active' : ''}`}
          aria-label={`${isFavorite ? 'Rimuovi' : 'Salva'} ${activity.title} ${isFavorite ? 'dai' : 'nei'} preferiti`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(activity.id)}
        >
          <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
        </button>
      </div>

      <div className="activity-redesign-card-body">
        <h2>{activity.title}</h2>
        <p className="activity-redesign-summary">{activity.summary}</p>

        <div className="activity-redesign-facts" aria-label="Informazioni principali">
          <span>◷ {activity.duration}</span>
          <span>★ {activity.rating} ({activity.reviews})</span>
          <strong>{activity.price}</strong>
        </div>

        <div className="activity-redesign-contact">
          <p><span aria-hidden="true">⌖</span><span><small>Dove</small>{activity.location}</span></p>
          <p><span aria-hidden="true">☎</span><span><small>Telefono</small><a href={telephoneHref}>{activity.phone}</a></span></p>
        </div>

        <div className="activity-redesign-actions">
          {directionsUrl && (
            <a href={directionsUrl} target="_blank" rel="noreferrer" className="activity-redesign-map-link">
              Indicazioni
            </a>
          )}
          <a href={telephoneHref} className="activity-redesign-call-link">Chiama ora</a>
        </div>
      </div>
    </article>
  );
}
