import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canFullscreenActivityVideo,
  enterActivityVideoFullscreen
} from './activityVideoControls.js';

test('preferisce fullscreen standard e usa il fallback Safari', async () => {
  let standardCalls = 0;
  let safariCalls = 0;

  assert.equal(await enterActivityVideoFullscreen({
    requestFullscreen: async () => { standardCalls += 1; },
    webkitEnterFullscreen: () => { safariCalls += 1; }
  }), true);
  assert.equal(standardCalls, 1);
  assert.equal(safariCalls, 0);

  assert.equal(await enterActivityVideoFullscreen({
    webkitEnterFullscreen: () => { safariCalls += 1; }
  }), true);
  assert.equal(safariCalls, 1);
});

test('disabilita fullscreen quando il video non espone API compatibili', async () => {
  assert.equal(canFullscreenActivityVideo({}), false);
  assert.equal(canFullscreenActivityVideo(null), false);
  assert.equal(await enterActivityVideoFullscreen({}), false);
});
