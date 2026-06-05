import { useCallback, useEffect, useMemo, useState } from 'react';
import './WeatherAdvisor.css';

const MATERA_WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=40.6667&longitude=16.6043&current=temperature_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=Europe%2FRome';
const RAIN_WEATHER_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const CLOUD_WEATHER_CODES = new Set([1, 2, 3, 45, 48]);

const roundValue = (value, digits = 0) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
};

const getConditionLabel = (code, isRainy) => {
  if (isRainy) return 'Pioggia';
  if (code === 0) return 'Sereno';
  if (CLOUD_WEATHER_CODES.has(code)) return 'Nuvoloso';
  return 'Variabile';
};

const getIconVariant = (report, status) => {
  if (status === 'loading') return 'loading';
  if (!report) return 'unknown';
  if (report.isRainy) return 'rain';
  if (report.code === 0) return 'sun';
  return 'cloud';
};

const formatUpdatedAt = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });
};

const normalizeWeather = (payload) => {
  const current = payload?.current;
  if (!current) return null;

  const code = Number(current.weather_code);
  const precipitation = roundValue(current.precipitation, 1) ?? 0;
  const rain = roundValue(current.rain, 1) ?? 0;
  const isRainy = RAIN_WEATHER_CODES.has(code) || rain > 0 || precipitation > 0.1;

  return {
    code,
    isRainy,
    condition: isRainy ? 'rain' : 'clear',
    conditionLabel: getConditionLabel(code, isRainy),
    temperature: roundValue(current.temperature_2m),
    precipitation,
    rain,
    wind: roundValue(current.wind_speed_10m),
    updatedAt: current.time,
    location: 'Matera',
    source: 'Open-Meteo',
  };
};

function WeatherVisual({ variant }) {
  return (
    <span className={`weather-visual weather-visual--${variant}`} aria-hidden="true">
      <span className="weather-sun"></span>
      <span className="weather-cloud"></span>
      {variant === 'rain' && (
        <span className="weather-drops">
          <i></i>
          <i></i>
          <i></i>
        </span>
      )}
    </span>
  );
}

export default function WeatherAdvisor({ onWeatherChange }) {
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('loading');
  const [isOpen, setIsOpen] = useState(false);

  const loadWeather = useCallback(async (signal) => {
    setStatus('loading');
    try {
      const response = await fetch(MATERA_WEATHER_URL, { signal });
      if (!response.ok) throw new Error('Meteo non disponibile');

      const payload = await response.json();
      const normalized = normalizeWeather(payload);
      if (!normalized) throw new Error('Dati meteo non validi');

      setReport(normalized);
      setStatus('ready');
      onWeatherChange?.(normalized);
    } catch (error) {
      if (error.name === 'AbortError') return;
      setStatus('error');
      setReport(null);
      onWeatherChange?.(null);
    }
  }, [onWeatherChange]);

  useEffect(() => {
    const controller = new AbortController();

    loadWeather(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadWeather]);

  const handleOrbClick = () => {
    loadWeather();
    setIsOpen((value) => !value);
  };

  const iconVariant = getIconVariant(report, status);
  const updatedAt = useMemo(() => formatUpdatedAt(report?.updatedAt), [report?.updatedAt]);
  const statusText = status === 'loading'
    ? 'Meteo'
    : report?.conditionLabel || 'Meteo';
  const panel = (
    <div className="weather-panel">
      <div className="weather-panel-head">
        <span>Matera ora</span>
        <strong>{statusText}</strong>
      </div>

      {status === 'error' ? (
        <p className="weather-copy">
          Non riesco a leggere il meteo live. Il programma resta quello scelto.
        </p>
      ) : (
        <>
          <div className="weather-metrics">
            <span>{report?.temperature ?? '--'}°C</span>
            <span>{report?.precipitation ?? 0} mm</span>
            <span className="weather-wind">{report?.wind ?? '--'} km/h</span>
          </div>
          {report?.isRainy && (
            <p className="weather-copy">
              Pioggia rilevata: programma al coperto.
            </p>
          )}
          {updatedAt && <span className="weather-updated">Aggiornato alle {updatedAt}</span>}
        </>
      )}
    </div>
  );

  return (
    <div className={`weather-advisor weather-advisor--${iconVariant}`}>
      <button
        type="button"
        className="weather-orb"
        aria-expanded={isOpen}
        aria-label="Meteo intelligente Matera"
        onClick={handleOrbClick}
      >
        <WeatherVisual variant={iconVariant} />
        <span className="weather-temp">
          {status === 'loading' ? '...' : report?.temperature !== null && report?.temperature !== undefined ? `${report.temperature}°` : '--'}
        </span>
      </button>

      {isOpen && panel}
    </div>
  );
}
