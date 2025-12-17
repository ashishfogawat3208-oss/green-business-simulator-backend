// backend/services/forecast.js
export function linearForecast(points, futureSteps = 6) {
  // points: [{x: number, y: number}, ...]  (x = time index)
  if (!Array.isArray(points) || points.length < 2) return [];

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return [];

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const forecasts = [];
  const lastX = points[points.length - 1].x;
  for (let i = 1; i <= futureSteps; i++) {
    const x = lastX + i;
    const y = intercept + slope * x;
    forecasts.push({ x, y });
  }
  return forecasts;
}