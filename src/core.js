const EARTH_RADIUS_KM = 6371.0088;

/**
 * Convert degrees to radians.
 *
 * Keeping this as a tiny helper makes the call sites read like the formula.
 * It also lets us clamp the latitude before conversion in one place.
 */
export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Normalise a longitude into the half-open interval [-180, 180).
 *
 * Longitudes are periodic, so two coordinates that differ by a multiple of
 * 360 degrees describe the same meridian. Normalising here means the haversine
 * formula never has to reason about wrapping and the caller gets a stable
 * answer for 190 and -170 alike.
 */
export function normalizeLongitude(degrees) {
  const wrapped = ((degrees + 180) % 360 + 360) % 360 - 180;
  return wrapped;
}

/**
 * Clamp a latitude into [-90, 90].
 *
 * Any value outside that range is not a real latitude. Clamping is preferable
 * to throwing because callers who accumulate floating-point error near the
 * poles should still get the pole, not an exception.
 */
export function clampLatitude(degrees) {
  if (degrees > 90) return 90;
  if (degrees < -90) return -90;
  return degrees;
}

/**
 * Great-circle distance between two points on a sphere, in kilometres.
 *
 * The points are { lat, lon } in degrees. Latitude is clamped to [-90, 90]
 * and longitude is normalised to [-180, 180) before the formula runs, so
 * off-by-360 inputs and mild out-of-range values still produce the distance
 * a human would expect.
 *
 * The haversine form is used rather than the spherical law of cosines because
 * it stays accurate for short distances, where the law of cosines loses
 * precision to floating-point cancellation.
 *
 * The Earth is treated as a sphere of radius 6371.0088 km (the IUGG mean
 * radius). Real terrain is an ellipsoid, so this is a model, not a survey.
 * The trade-off is deliberate: a few lines of arithmetic with no dependencies,
 * accurate to roughly 0.5% for the distances most callers care about.
 */
export function haversineDistance(from, to) {
  const lat1 = toRadians(clampLatitude(from.lat));
  const lat2 = toRadians(clampLatitude(to.lat));
  const dLat = lat2 - lat1;
  const dLon = toRadians(
    normalizeLongitude(to.lon) - normalizeLongitude(from.lon)
  );

  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);

  const a =
    sinHalfLat * sinHalfLat +
    Math.cos(lat1) * Math.cos(lat2) * sinHalfLon * sinHalfLon;

  // The min(1, ...) guards against a slightly negative result from rounding
  // when the two points are antipodal; asin would otherwise be NaN.
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(a)));

  return EARTH_RADIUS_KM * c;
}
