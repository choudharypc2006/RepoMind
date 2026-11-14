/**
 * Automated Verification Suite for RepoMind
 */
import { parseGitHubUrl } from '../src/utils/urlParser.js';
import * as githubService from '../src/services/githubService.js';
import { createRateLimiter } from '../src/middleware/rateLimiter.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting RepoMind Automated Test Suite');
  console.log('======================================================\n');

  // --- Test 1: Invalid GitHub URLs ---
  console.log('Test Group 1: GitHub URL Validation');
  const invalidUrls = [
    '',
    '   ',
    'not-a-url',
    'https://gitlab.com/user/repo',
    'https://google.com',
    'https://github.com/',
    'https://github.com/incomplete',
    'https://github.com/invalid/owner/name/extra/extra',
  ];

  for (const url of invalidUrls) {
    try {
      parseGitHubUrl(url);
      assert(false, `Expected error for invalid URL: "${url}"`);
    } catch (err) {
      assert(err.statusCode === 400, `Rejected invalid URL "${url}" with 400 Bad Request (${err.message})`);
    }
  }

  // Valid GitHub URLs
  const valid = parseGitHubUrl('https://github.com/facebook/react');
  assert(valid.owner === 'facebook' && valid.repo === 'react', 'Parsed standard URL facebook/react');

  const validWithGit = parseGitHubUrl('https://github.com/torvalds/linux.git');
  assert(validWithGit.owner === 'torvalds' && validWithGit.repo === 'linux', 'Parsed .git URL torvalds/linux');

  const validNoProtocol = parseGitHubUrl('github.com/expressjs/express/');
  assert(validNoProtocol.owner === 'expressjs' && validNoProtocol.repo === 'express', 'Parsed protocol-less URL expressjs/express');

  const validWithTree = parseGitHubUrl('https://github.com/facebook/react/tree/main');
  assert(validWithTree.owner === 'facebook' && validWithTree.repo === 'react', 'Parsed URL with /tree/main');

  // --- Test 2: Unsupported File Types (Binary / Images / SVGs) ---
  console.log('\nTest Group 2: Unsupported File Types Rejection');
  const unsupportedFiles = ['logo.png', 'avatar.jpg', 'icon.svg', 'archive.zip', 'app.exe', 'database.sqlite'];
  for (const file of unsupportedFiles) {
    try {
      await githubService.getFileContent('facebook', 'react', 'main', `src/${file}`);
      assert(false, `Expected 422 rejection for binary file: ${file}`);
    } catch (err) {
      assert(err.statusCode === 422, `Rejected binary/unsupported file "${file}" with 422 Unprocessable Entity`);
    }
  }

  // --- Test 3: Rate Limiter Middleware ---
  console.log('\nTest Group 3: Rate Limiter Middleware');
  const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 2 });
  const mockReq = { ip: '127.0.0.1' };
  let statusSet = null;
  let jsonSet = null;
  const mockRes = {
    setHeader: () => {},
    status: (s) => { statusSet = s; return mockRes; },
    json: (j) => { jsonSet = j; return mockRes; },
  };

  let nextCalls = 0;
  const next = () => { nextCalls++; };

  limiter(mockReq, mockRes, next); // Call 1 -> allowed
  limiter(mockReq, mockRes, next); // Call 2 -> allowed
  limiter(mockReq, mockRes, next); // Call 3 -> should block

  assert(nextCalls === 2, `Allowed exactly 2 requests under max limit`);
  assert(statusSet === 429, `Blocked 3rd request with 429 Too Many Requests`);
  assert(jsonSet?.success === false, `Returned standard error format for rate limit`);

  // --- Test 4: Error Handler Middleware ---
  console.log('\nTest Group 4: Centralized Error Handling Middleware');
  const testErr = new Error('Test validation error');
  testErr.statusCode = 400;
  let errStatus = null;
  let errJson = null;
  const errRes = {
    status: (s) => { errStatus = s; return errRes; },
    json: (j) => { errJson = j; return errRes; },
  };

  errorHandler(testErr, { method: 'POST', url: '/api/test' }, errRes, () => {});
  assert(errStatus === 400, 'Handled custom status code 400');
  assert(errJson?.success === false && errJson?.error === 'Test validation error', 'Standardized error response payload');

  // --- Test 5: Mongoose CastError Handling ---
  const castErr = new Error('Cast failed');
  castErr.name = 'CastError';
  castErr.path = 'userId';
  castErr.value = 'invalid-id';
  errorHandler(castErr, { method: 'GET', url: '/api/test' }, errRes, () => {});
  assert(errStatus === 400, 'CastError converted to 400 Bad Request');

  // --- Test 6: Mongoose Duplicate Key (11000) Handling ---
  const dupErr = new Error('Duplicate key');
  dupErr.code = 11000;
  dupErr.keyPattern = { email: 1 };
  errorHandler(dupErr, { method: 'POST', url: '/api/auth/register' }, errRes, () => {});
  assert(errStatus === 409, 'Duplicate key error converted to 409 Conflict');

  // --- Test 7: JWT Expired Token Handling ---
  const jwtErr = new Error('jwt expired');
  jwtErr.name = 'TokenExpiredError';
  errorHandler(jwtErr, { method: 'GET', url: '/api/auth/me' }, errRes, () => {});
  assert(errStatus === 401, 'TokenExpiredError converted to 401 Unauthorized');

  console.log('\n======================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
