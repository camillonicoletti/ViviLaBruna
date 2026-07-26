import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAutoplayActivityMedia } from './activityMediaPolicy.js';

test('autoplay parte soltanto per un video mobile visibile', () => {
  assert.equal(shouldAutoplayActivityMedia({
    isMobile: true,
    isVisible: true,
    reduceMotion: false
  }), true);
  assert.equal(shouldAutoplayActivityMedia({
    isMobile: true,
    isVisible: false,
    reduceMotion: false
  }), false);
  assert.equal(shouldAutoplayActivityMedia({
    isMobile: false,
    isVisible: true,
    reduceMotion: false
  }), false);
  assert.equal(shouldAutoplayActivityMedia({
    isMobile: true,
    isVisible: true,
    reduceMotion: true
  }), false);
});
