import test from 'node:test';
import assert from 'node:assert/strict';

import {
  haversineDistance,
  normalizeLongitude,
  clampLatitude,
  toRadians,
} from '../src/index.js';

const EPS_KM = 1e-6;

function assertClose(actual, expected, eps = EPS_KM, message) {
  assert.ok(
    Math.abs(actual - expected) < eps,
    message ?? `expected ${actual} to be within ${eps} of ${expected}`
  );
}

test('zero distance for identical points', () => {
  const p = { lat: 51.5074, lon: -0.1278 };
  assert.equal(haversineDistance(p, p), 0);
});

test('London to Paris is about 344 km', () => {
  const london = { lat: 51.5074, lon: -0.1278 };
  const paris = { lat: 48.8566, lon: 2.3522 };
  assertClose(haversineDistance(london, paris), 343.556, 0.01);
});

test('distance is symmetric', () => {
  const a = { lat: -33.8688, lon: 151.2093 };
  const b = { lat: 40.7128, lon: -74.006 };
  assert.equal(haversineDistance(a, b), haversineDistance(b, a));
});

test('antipodal points give half the circumference', () => {
  const north = { lat: 90, lon: 0 };
  const south = { lat: -90, lon: 0 };
  const halfCircumference = Math.PI * 6371.0088;
  assertClose(haversineDistance(north, south), halfCircumference, 1e-6);
});

test('longitude wrap is handled', () => {
  const a = { lat: 0, lon: 179 };
  const b = { lat: 0, lon: -179 };
  const direct = haversineDistance(a, b);
  const same = haversineDistance(
    { lat: 0, lon: 179 },
    { lat: 0, lon: 181 }
  );
  assertClose(direct, same, 1e-9);
  // Two degrees of longitude at the equator is about 222.4 km.
  assertClose(direct, 222.3902, 0.01);
});

test('latitude outside the valid range is clamped', () => {
  const tooFar = { lat: 120, lon: 0 };
  const pole = { lat: 90, lon: 0 };
  const equator = { lat: 0, lon: 0 };
  assert.equal(
    haversineDistance(tooFar, equator),
    haversineDistance(pole, equator)
  );
});

test('normalizeLongitude maps into [-180, 180)', () => {
  assert.equal(normalizeLongitude(0), 0);
  assert.equal(normalizeLongitude(180), -180);
  assert.equal(normalizeLongitude(-180), -180);
  assert.equal(normalizeLongitude(190), -170);
  assert.equal(normalizeLongitude(-190), 170);
  assert.equal(normalizeLongitude(540), -180);
});

test('clampLatitude bounds the value', () => {
  assert.equal(clampLatitude(45), 45);
  assert.equal(clampLatitude(90), 90);
  assert.equal(clampLatitude(-90), -90);
  assert.equal(clampLatitude(100), 90);
  assert.equal(clampLatitude(-100), -90);
});

test('toRadians converts a quarter turn', () => {
  assertClose(toRadians(90), Math.PI / 2, 1e-12);
  assertClose(toRadians(180), Math.PI, 1e-12);
  assertClose(toRadians(0), 0, 1e-12);
});

test('a small step near the equator matches the local metric', () => {
  // 0.001 degrees of latitude is about 111.195 metres; the haversine formula
  // should agree with the spherical arc to well under a millimetre.
  const a = { lat: 0, lon: 0 };
  const b = { lat: 0.001, lon: 0 };
  const expected = (6371.0088 * Math.PI) / 180000;
  assertClose(haversineDistance(a, b), expected, 1e-9);
});
