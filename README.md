# haversine-ts

Great-circle distance between two points on Earth, in kilometres, with no dependencies.

```js
import { haversineDistance } from 'haversine-ts';

const london = { lat: 51.5074, lon: -0.1278 };
const paris = { lat: 48.8566, lon: 2.3522 };

haversineDistance(london, paris); // 343.556... km
```

The package also exports `normalizeLongitude`, `clampLatitude`, and `toRadians` for callers who want to prepare coordinates themselves.

## Why this exists

Distance between coordinates is one of those calculations that looks like a one-liner and then quietly goes wrong. The obvious spherical law of cosines loses precision for short distances because of cancellation in the `acos` argument, and many snippets in the wild forget that longitude is periodic, so a pair like `179` and `-179` comes back as almost the whole planet. This library uses the haversine form, which is stable at short range, and normalises longitude before the formula runs.

The trade-off is the Earth model. Points are treated as lying on a sphere of radius 6371.0088 km, the IUGG mean radius. That is accurate to roughly 0.5% for most distances, which is fine for display, sorting, and rough filtering, and it keeps the whole library to a few lines of arithmetic with no dependencies. If you need metre-level accuracy across long baselines, use a geodesic library that models the ellipsoid instead.

## The awkward edge

Latitude is clamped to `[-90, 90]` and longitude is wrapped into `[-180, 180)`. That means `{ lat: 120, lon: 0 }` is silently treated as the north pole rather than rejected, and `{ lat: 0, lon: 181 }` is treated as `-179`. The alternative, throwing on out-of-range input, tends to break callers who accumulate small floating-point drift near the poles; clamping keeps those callers working. If you need strict validation, check the inputs before calling.
