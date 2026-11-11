export const MOCK_REPOSITORIES = [
  {
    id: "expressjs-express",
    fullName: "expressjs/express",
    name: "express",
    owner: "expressjs",
    description: "Fast, unopinionated, minimalist web framework for Node.js",
    stars: 63420,
    forks: 14210,
    watchers: 1840,
    openIssues: 92,
    defaultBranch: "master",
    primaryLanguage: "JavaScript",
    license: "MIT",
    url: "https://github.com/expressjs/express",
    analyzedAt: "2026-11-08T14:32:00Z",
    analysisStats: {
      totalFiles: 34,
      totalLines: 4980,
      complexityScore: "A- (Low)",
      securityRisk: "Low",
      testCoverage: "98.4%",
    },
    files: [
      {
        name: "lib",
        type: "folder",
        path: "lib",
        children: [
          {
            name: "express.js",
            type: "file",
            path: "lib/express.js",
            size: "3.2 KB",
            language: "javascript",
            lines: 104,
            content: `/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

var bodyParser = require('body-parser');
var EventEmitter = require('events').EventEmitter;
var mixin = require('merge-descriptors');
var proto = require('./application');
var Route = require('./router/route');
var Router = require('./router');
var req = require('./request');
var res = require('./response');

/**
 * Expose \`createApplication()\`.
 */

exports = module.exports = createApplication;

/**
 * Create an express application.
 *
 * @return {Function}
 * @api public
 */

function createApplication() {
  var app = function(req, res, next) {
    app.handle(req, res, next);
  };

  mixin(app, EventEmitter.prototype, false);
  mixin(app, proto, false);

  // expose the prototype that will get set on requests
  app.request = Object.create(req, {
    app: { configurable: true, enumerable: true, writable: true, value: app }
  });

  // expose the prototype that will get set on responses
  app.response = Object.create(res, {
    app: { configurable: true, enumerable: true, writable: true, value: app }
  });

  app.init();
  return app;
}

/**
 * Expose the prototypes.
 */

exports.application = proto;
exports.request = req;
exports.response = res;

/**
 * Expose constructors.
 */

exports.Route = Route;
exports.Router = Router;

/**
 * Expose middleware.
 */

exports.json = bodyParser.json;
exports.query = require('./middleware/query');
exports.raw = bodyParser.raw;
exports.static = require('serve-static');
exports.text = bodyParser.text;
exports.urlencoded = bodyParser.urlencoded;`,
            analysis: {
              summary: "Entry point for Express.js. Factory function `createApplication` generates an Express callable request-handler instance decorated with EventEmitter and Application prototype methods.",
              keyInsights: [
                "Callable instance pattern: Returns `app` as a function `(req, res, next) => app.handle(req, res, next)` while attaching object prototype methods onto the function.",
                "Prototype inheritance via `merge-descriptors`: Dynamically mixes in `EventEmitter.prototype` and `./application.js` prototype methods without modifying the prototype chain directly.",
                "Circular reference binding: The `app.request` and `app.response` prototypes hold a direct reference to the current application instance.",
                "Re-exports core middleware: Binds `serve-static`, `body-parser` flavors (`json`, `urlencoded`, `raw`, `text`), and router primitives."
              ],
              complexity: {
                time: "O(1) initialization",
                space: "O(1) allocation per app instance",
                maintainabilityIndex: 94,
                cyclomaticComplexity: 2
              },
              security: {
                score: "A",
                status: "Clean",
                details: "No direct eval or dynamic string execution. Relies on `merge-descriptors` which copies property descriptors safely without prototype pollution."
              },
              suggestions: [
                "Consider migrating from CommonJS to ESM (`import / export`) with dual exports for modern Node.js environments.",
                "Refactor `mixin` helper to native `Object.defineProperties` to remove external micro-dependency.",
                "Add TypeScript typings or JSDoc `@template` definitions for better IDE autocompletion."
              ]
            }
          },
          {
            name: "application.js",
            type: "file",
            path: "lib/application.js",
            size: "18.4 KB",
            language: "javascript",
            lines: 168,
            content: `/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 * @private
 */

var finalhandler = require('finalhandler');
var Router = require('./router');
var methods = require('methods');
var middleware = require('./middleware/init');
var debug = require('debug')('express:application');
var View = require('./view');
var http = require('http');
var compileETag = require('./utils').compileETag;
var compileQueryParser = require('./utils').compileQueryParser;
var compileTrust = require('./utils').compileTrust;

/**
 * Application prototype.
 */

var app = exports = module.exports = {};

/**
 * Initialize the server.
 *
 *   - setup default configuration
 *   - setup default middleware
 *   - setup route reflection methods
 *
 * @private
 */

app.init = function init() {
  this.cache = {};
  this.engines = {};
  this.settings = {};

  this.defaultConfiguration();
};

/**
 * Initialize application configuration.
 * @private
 */

app.defaultConfiguration = function defaultConfiguration() {
  var env = process.env.NODE_ENV || 'development';

  // default settings
  this.enable('x-powered-by');
  this.set('etag', 'weak');
  this.set('env', env);
  this.set('query parser', 'extended');
  this.set('subdomain offset', 2);
  this.set('trust proxy', false);

  this.mountpath = '/';
  this.locals = Object.create(null);
  this.locals.settings = this.settings;
};

/**
 * Dispatch a req, res pair into the application. Starts pipeline.
 *
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @param {Function} callback
 * @private
 */

app.handle = function handle(req, res, callback) {
  var router = this._router;

  // final handler for 404 / uncaught errors
  var done = callback || finalhandler(req, res, {
    env: this.get('env'),
    onerror: logerror.bind(this)
  });

  // no routes configured yet
  if (!router) {
    debug('no routes defined on app');
    done();
    return;
  }

  router.handle(req, res, done);
};

/**
 * Listen for HTTP connections.
 *
 * @return {http.Server}
 * @public
 */

app.listen = function listen() {
  var server = http.createServer(this);
  return server.listen.apply(server, arguments);
};

function logerror(err) {
  if (this.get('env') !== 'test') console.error(err.stack || err.toString());
}`,
            analysis: {
              summary: "The core Application prototype defining app lifecycle, configuration registry, request dispatching pipeline via `app.handle`, and HTTP server bootstrap `app.listen`.",
              keyInsights: [
                "Lazy router initialization: If no routes are defined, `app.handle` directly hands off to `finalhandler` for standard 404 responses.",
                "Delegation to `http.createServer`: The `app` function conforms to Node's `(req, res)` signature, making `http.createServer(this)` completely seamless.",
                "`finalhandler` safety net: Catches unhandled errors and closes dangling connections safely.",
                "Config store: Backed by `this.settings` with helpers `set`, `get`, `enable`, `disable`."
              ],
              complexity: {
                time: "O(1) dispatch handoff to router",
                space: "O(k) where k is number of custom settings and view engines",
                maintainabilityIndex: 88,
                cyclomaticComplexity: 5
              },
              security: {
                score: "B+",
                status: "Notice",
                details: "Defaults to enabling `X-Powered-By: Express` header, which broadcasts server technology. Modern security best practice recommends disabling this header (`app.disable('x-powered-by')`)."
              },
              suggestions: [
                "Consider turning off `x-powered-by` by default in future major releases for security hardening.",
                "Replace `arguments` spread with standard rest parameters (`...args`) for V8 optimization.",
                "Support native `fetch` / WinterCG Request/Response handlers for edge runtimes."
              ]
            }
          },
          {
            name: "router",
            type: "folder",
            path: "lib/router",
            children: [
              {
                name: "index.js",
                type: "file",
                path: "lib/router/index.js",
                size: "14.2 KB",
                language: "javascript",
                lines: 112,
                content: `/*!
 * express
 * Router Implementation
 * MIT Licensed
 */

'use strict';

var Route = require('./route');
var Layer = require('./layer');
var methods = require('methods');
var mixin = require('merge-descriptors');
var debug = require('debug')('express:router');
var parseUrl = require('parseurl');

var proto = module.exports = function(options) {
  var opts = options || {};

  function router(req, res, next) {
    router.handle(req, res, next);
  }

  // mixin Prototype
  Object.setPrototypeOf(router, proto);

  router.params = {};
  router._params = [];
  router.caseSensitive = opts.caseSensitive;
  router.mergeParams = opts.mergeParams;
  router.strict = opts.strict;
  router.stack = [];

  return router;
};

proto.route = function route(path) {
  var route = new Route(path);
  var layer = new Layer(path, {
    sensitive: this.caseSensitive,
    strict: this.strict,
    end: true
  }, route.dispatch.bind(route));

  layer.route = route;
  this.stack.push(layer);
  return route;
};

proto.use = function use(fn) {
  var offset = 0;
  var path = '/';

  // default path to /
  if (typeof fn !== 'function') {
    var arg = fn;
    while (Array.isArray(arg) && arg.length !== 0) {
      arg = arg[0];
    }
    if (typeof arg !== 'function') {
      offset = 1;
      path = fn;
    }
  }

  var callbacks = Array.prototype.slice.call(arguments, offset);

  for (var i = 0; i < callbacks.length; i++) {
    var callback = callbacks[i];
    var layer = new Layer(path, {
      sensitive: this.caseSensitive,
      strict: false,
      end: false
    }, callback);

    layer.route = undefined;
    this.stack.push(layer);
  }

  return this;
};`,
                analysis: {
                  summary: "The middleware and route execution engine of Express. Manages an ordered execution stack of `Layer` instances.",
                  keyInsights: [
                    "Stack architecture: Middleware and sub-routers are wrapped inside `Layer` instances in `router.stack`.",
                    "`use()` versatility: Supports path prefixes, callback arrays, and variadic middleware chaining.",
                    "Path matching: Leverages regex compilation via `path-to-regexp` embedded inside `Layer`."
                  ],
                  complexity: {
                    time: "O(n) where n is stack size per incoming HTTP request",
                    space: "O(n) memory for layer stack",
                    maintainabilityIndex: 82,
                    cyclomaticComplexity: 8
                  },
                  security: {
                    score: "A-",
                    status: "Clean",
                    details: "Path normalization and param sanitization handled appropriately before regex evaluation."
                  },
                  suggestions: [
                    "Implement a Radix Tree / Trie structure for static routes to achieve O(1) route lookup instead of O(N) linear array scanning.",
                    "Modernize `Array.prototype.slice.call(arguments, offset)` to rest parameters."
                  ]
                }
              },
              {
                name: "route.js",
                type: "file",
                path: "lib/router/route.js",
                size: "6.8 KB",
                language: "javascript",
                lines: 85,
                content: `/*!
 * express
 * Route representation
 * MIT Licensed
 */

'use strict';

var Layer = require('./layer');
var methods = require('methods');

module.exports = Route;

function Route(path) {
  this.path = path;
  this.stack = [];
  this.methods = {};
}

Route.prototype._handles_method = function _handles_method(method) {
  if (this.methods._all) return true;
  var name = method.toLowerCase();
  if (name === 'head' && !this.methods['head']) {
    name = 'get';
  }
  return Boolean(this.methods[name]);
};

Route.prototype.dispatch = function dispatch(req, res, done) {
  var idx = 0;
  var stack = this.stack;
  var sync = 0;

  if (stack.length === 0) {
    return done();
  }

  var method = req.method.toLowerCase();
  if (method === 'head' && !this.methods['head']) {
    method = 'get';
  }

  req.route = this;

  next();

  function next(err) {
    // signal to bypass rest of route
    if (err && err === 'route') {
      return done();
    }

    // signal to bypass all routes
    if (err && err === 'router') {
      return done(err);
    }

    var layer = stack[idx++];
    if (!layer) {
      return done(err);
    }

    if (layer.method && layer.method !== method) {
      return next(err);
    }

    if (err) {
      layer.handle_error(err, req, res, next);
    } else {
      layer.handle_request(req, res, next);
    }
  }
};`,
                analysis: {
                  summary: "Encapsulates a single HTTP route path and handles method matching (GET, POST, etc.) across internal middleware layers.",
                  keyInsights: [
                    "Automatic HEAD handling: HEAD requests automatically fall back to GET handler if no explicit HEAD route is registered.",
                    "Recursion unrolling: The `next()` function steps iteratively through the route's layer stack.",
                    "Control codes: Special error strings `'route'` and `'router'` permit short-circuiting out of the current route or the entire router."
                  ],
                  complexity: {
                    time: "O(m) where m is number of handlers bound to this specific route",
                    space: "O(m)",
                    maintainabilityIndex: 91,
                    cyclomaticComplexity: 6
                  },
                  security: {
                    score: "A",
                    status: "Clean",
                    details: "Error propagation properly isolates application handlers from crashing the server process."
                  },
                  suggestions: [
                    "Add async/await support natively to avoid unhandled Promise rejections if a handler returns a Promise."
                  ]
                }
              }
            ]
          },
          {
            name: "middleware",
            type: "folder",
            path: "lib/middleware",
            children: [
              {
                name: "init.js",
                type: "file",
                path: "lib/middleware/init.js",
                size: "1.4 KB",
                language: "javascript",
                lines: 42,
                content: `'use strict';

/**
 * Initialization middleware, exposing the
 * request and response to each other, as well
 * as mounting the app for each.
 *
 * @param {Function} app
 * @return {Function}
 * @api private
 */

exports.init = function(app){
  return function expressInit(req, res, next){
    if (app.enabled('x-powered-by')) res.setHeader('X-Powered-By', 'Express');
    req.res = res;
    res.req = req;
    req.next = next;

    Object.setPrototypeOf(req, app.request);
    Object.setPrototypeOf(res, app.response);

    res.locals = res.locals || Object.create(null);

    next();
  };
};`,
                analysis: {
                  summary: "Foundation middleware that links incoming Node.js raw request and response streams to Express augmented prototypes.",
                  keyInsights: [
                    "Prototype mutation: Upgrades standard `http.IncomingMessage` and `http.ServerResponse` to Express prototypes using `Object.setPrototypeOf`.",
                    "Bidirectional references: Cross-links `req.res` and `res.req`.",
                    "X-Powered-By injector: Sets the header if configured."
                  ],
                  complexity: {
                    time: "O(1)",
                    space: "O(1)",
                    maintainabilityIndex: 96,
                    cyclomaticComplexity: 2
                  },
                  security: {
                    score: "A-",
                    status: "Clean",
                    details: "Safe prototype manipulation scoped only to the current transaction."
                  },
                  suggestions: [
                    "Note: Object.setPrototypeOf has a minor V8 hidden class deoptimization penalty; creating a wrapper or proxy is an alternative."
                  ]
                }
              }
            ]
          }
        ]
      },
      {
        name: "package.json",
        type: "file",
        path: "package.json",
        size: "1.9 KB",
        language: "json",
        lines: 55,
        content: `{
  "name": "express",
  "description": "Fast, unopinionated, minimalist web framework",
  "version": "4.21.2",
  "author": "TJ Holowaychuk <tj@vision-media.ca>",
  "contributors": [
    "Douglas Christopher Wilson <doug@somethingdoug.com>",
    "Roman Shtylman <shtylman+expressjs@gmail.com>"
  ],
  "license": "MIT",
  "repository": "expressjs/express",
  "homepage": "http://expressjs.com/",
  "keywords": [
    "express",
    "framework",
    "sinatra",
    "web",
    "rest",
    "restful",
    "router",
    "app",
    "api"
  ],
  "dependencies": {
    "accepts": "~1.3.8",
    "array-flatten": "1.1.1",
    "body-parser": "1.20.3",
    "content-disposition": "0.5.4",
    "content-type": "~1.0.4",
    "cookie": "0.7.1",
    "cookie-signature": "1.0.6",
    "debug": "2.6.9",
    "depd": "2.0.0",
    "encodeurl": "~2.0.0",
    "escape-html": "~1.0.3",
    "etag": "~1.8.1",
    "finalhandler": "1.3.1",
    "fresh": "0.5.2",
    "http-errors": "2.0.0",
    "merge-descriptors": "1.0.3",
    "methods": "~1.1.2",
    "on-finished": "2.4.1",
    "parseurl": "~1.3.3",
    "path-to-regexp": "0.1.10",
    "proxy-addr": "~2.0.7",
    "qs": "6.13.0",
    "range-parser": "~1.2.1",
    "safe-buffer": "5.2.1",
    "send": "0.19.0",
    "serve-static": "1.16.2",
    "setprototypeof": "1.2.0",
    "statuses": "2.0.1",
    "type-is": "~1.6.18",
    "utils-merge": "1.0.1",
    "vary": "~1.1.2"
  },
  "devDependencies": {
    "mocha": "10.7.3",
    "supertest": "7.0.0"
  },
  "engines": {
    "node": ">= 0.10.0"
  }
}`,
        analysis: {
          summary: "Manifest file defining dependencies, metadata, and engine constraints for Express 4.x.",
          keyInsights: [
            "Pinning strategy: Uses tilde `~` and exact versions to avoid unexpected breaking upstream updates.",
            "Engine support: Broad backward compatibility specified as `node >= 0.10.0`.",
            "Key dependencies: `finalhandler`, `send`, `body-parser`, `path-to-regexp`."
          ],
          complexity: {
            time: "N/A",
            space: "30 direct production dependencies",
            maintainabilityIndex: 90,
            cyclomaticComplexity: 1
          },
          security: {
            score: "A",
            status: "Audit Passed",
            details: "Standard production dependencies, widely audited."
          },
          suggestions: [
            "Update minimum Node engine to >= 18.0.0 to drop legacy polyfills and improve performance."
          ]
        }
      },
      {
        name: "README.md",
        type: "file",
        path: "README.md",
        size: "3.8 KB",
        language: "markdown",
        lines: 62,
        content: `# Express

Fast, unopinionated, minimalist web framework for [Node.js](https://nodejs.org).

\`\`\`js
const express = require('express')
const app = express()

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(3000)
\`\`\`

## Installation

\`\`\`bash
$ npm install express
\`\`\`

## Features

- Robust routing
- Focus on high performance
- Super-high test coverage
- HTTP helpers (redirection, caching, etc)
- View system supporting 14+ template engines
- Content negotiation
- Executable for generating applications quickly

## Philosophy

The Express philosophy is to provide small, robust tooling for HTTP servers, making it a great solution for single page applications, websites, hybrids, or public HTTP APIs.

## License

[MIT](LICENSE)`,
        analysis: {
          summary: "Repository documentation providing introduction, quick-start code sample, feature list, and license declaration.",
          keyInsights: [
            "Clear minimal example that demonstrates core ergonomics.",
            "Emphasizes zero-friction onboarding."
          ],
          complexity: {
            time: "N/A",
            space: "N/A",
            maintainabilityIndex: 100,
            cyclomaticComplexity: 1
          },
          security: {
            score: "A",
            status: "Clean",
            details: "No security issues in documentation."
          },
          suggestions: [
            "Include TypeScript usage example alongside CommonJS sample."
          ]
        }
      }
    ]
  },
  {
    id: "shadcn-taxonomy",
    fullName: "shadcn/taxonomy",
    name: "taxonomy",
    owner: "shadcn",
    description: "An open source application built using the new Next.js App Router, Server Components, and Tailwind CSS.",
    stars: 19820,
    forks: 3120,
    watchers: 420,
    openIssues: 24,
    defaultBranch: "main",
    primaryLanguage: "TypeScript",
    license: "MIT",
    url: "https://github.com/shadcn/taxonomy",
    analyzedAt: "2026-11-08T11:15:00Z",
    analysisStats: {
      totalFiles: 48,
      totalLines: 6120,
      complexityScore: "A (Clean)",
      securityRisk: "Low",
      testCoverage: "82.1%",
    },
    files: [
      {
        name: "app",
        type: "folder",
        path: "app",
        children: [
          {
            name: "api",
            type: "folder",
            path: "app/api",
            children: [
              {
                name: "posts",
                type: "folder",
                path: "app/api/posts",
                children: [
                  {
                    name: "route.ts",
                    type: "file",
                    path: "app/api/posts/route.ts",
                    size: "2.1 KB",
                    language: "typescript",
                    lines: 68,
                    content: `import { getServerSession } from "next-auth/next"
import * as z from "zod"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { RequiresProPlanError } from "@/lib/exceptions"
import { getUserSubscriptionPlan } from "@/lib/subscription"

const postCreateSchema = z.object({
  title: z.string().min(1).max(128),
  content: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new Response("Unauthorized", { status: 403 })
    }

    const { user } = session
    const posts = await db.post.findMany({
      select: {
        id: true,
        title: true,
        published: true,
        createdAt: true,
      },
      where: {
        authorId: user.id,
      },
    })

    return new Response(JSON.stringify(posts))
  } catch (error) {
    return new Response(null, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new Response("Unauthorized", { status: 403 })
    }

    const { user } = session
    const subscriptionPlan = await getUserSubscriptionPlan(user.id)

    // Check plan limits
    if (!subscriptionPlan?.isPro) {
      const count = await db.post.count({
        where: {
          authorId: user.id,
        },
      })

      if (count >= 3) {
        throw new RequiresProPlanError()
      }
    }

    const json = await req.json()
    const body = postCreateSchema.parse(json)

    const post = await db.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: session.user.id,
      },
      select: {
        id: true,
      },
    })

    return new Response(JSON.stringify(post))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 })
    }

    if (error instanceof RequiresProPlanError) {
      return new Response("Requires Pro Plan", { status: 402 })
    }

    return new Response(null, { status: 500 })
  }
}`,
                    analysis: {
                      summary: "Next.js App Router API route for listing and creating user blog posts with authentication, tier plan enforcement, and input validation via Zod.",
                      keyInsights: [
                        "Server-side session validation: Checks `getServerSession(authOptions)` before touching the database.",
                        "Strict schema parsing: Input payload strictly parsed via `z.object` to thwart parameter injection.",
                        "Subscription gating: Enforces max 3 posts on free plan before requiring Pro upgrade with custom `RequiresProPlanError`.",
                        "Granular field projection: Selects only necessary fields (`id`, `title`, `published`, `createdAt`) for minimal network payload."
                      ],
                      complexity: {
                        time: "O(1) database queries with proper indexed foreign key",
                        space: "O(k) where k is post count per author",
                        maintainabilityIndex: 92,
                        cyclomaticComplexity: 7
                      },
                      security: {
                        score: "A",
                        status: "Clean",
                        details: "Robust authorization: authors can only query and mutate their own posts. Zod validation prevents arbitrary object injection."
                      },
                      suggestions: [
                        "Use `NextResponse.json(...)` instead of `new Response(JSON.stringify(...))` for cleaner syntax and auto JSON headers.",
                        "Add rate-limiting middleware (e.g., Upstash Ratelimit) on the POST endpoint to prevent spam."
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        name: "lib",
        type: "folder",
        path: "lib",
        children: [
          {
            name: "auth.ts",
            type: "file",
            path: "lib/auth.ts",
            size: "3.4 KB",
            language: "typescript",
            lines: 74,
            content: `import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import EmailProvider from "next-auth/providers/email"

import { db } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db as any),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
    EmailProvider({
      from: process.env.SMTP_FROM,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        // Send magic link email
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
      }

      return session
    },
    async jwt({ token, user }) {
      const dbUser = await db.user.findFirst({
        where: {
          email: token.email,
        },
      })

      if (!dbUser) {
        if (user) {
          token.id = user?.id
        }
        return token
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      }
    },
  },
}`,
            analysis: {
              summary: "NextAuth.js authentication configuration linking Prisma database adapter, GitHub OAuth provider, email magic link provider, and JWT session enrichment.",
              keyInsights: [
                "JWT session strategy: Avoids database lookups on every single client request while retaining user claims.",
                "Custom sign-in page: Configured to `/login` to override standard NextAuth UI.",
                "Database user sync: JWT callback attaches persistent `dbUser.id` into the signed client token."
              ],
              complexity: {
                time: "O(1) token verification",
                space: "O(1)",
                maintainabilityIndex: 90,
                cyclomaticComplexity: 4
              },
              security: {
                score: "A",
                status: "Secure",
                details: "Secrets loaded through environment variables. Session signed via JWE/JWT."
              },
              suggestions: [
                "Remove `as any` type cast on PrismaAdapter for strict type safety.",
                "Ensure NEXTAUTH_SECRET is rotated periodically and marked required at build-time."
              ]
            }
          }
        ]
      }
    ]
  },
  {
    id: "fastapi-fastapi",
    fullName: "fastapi/fastapi",
    name: "fastapi",
    owner: "fastapi",
    description: "FastAPI framework, high performance, easy to learn, fast to code, ready for production.",
    stars: 78240,
    forks: 6510,
    watchers: 1320,
    openIssues: 54,
    defaultBranch: "master",
    primaryLanguage: "Python",
    license: "MIT",
    url: "https://github.com/fastapi/fastapi",
    analyzedAt: "2026-11-07T18:40:00Z",
    analysisStats: {
      totalFiles: 62,
      totalLines: 8400,
      complexityScore: "A+ (Clean)",
      securityRisk: "Low",
      testCoverage: "100%",
    },
    files: [
      {
        name: "fastapi",
        type: "folder",
        path: "fastapi",
        children: [
          {
            name: "applications.py",
            type: "file",
            path: "fastapi/applications.py",
            size: "12.8 KB",
            language: "python",
            lines: 120,
            content: `from typing import Any, Callable, Coroutine, Dict, List, Optional, Sequence, Type, Union
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.responses import JSONResponse, Response
from starlette.routing import BaseRoute

from fastapi import routing
from fastapi.datastructures import Default
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.params import Depends

class FastAPI(Starlette):
    def __init__(
        self,
        *,
        debug: bool = False,
        routes: Optional[List[BaseRoute]] = None,
        title: str = "FastAPI",
        description: str = "",
        version: str = "0.1.0",
        openapi_url: Optional[str] = "/openapi.json",
        docs_url: Optional[str] = "/docs",
        redoc_url: Optional[str] = "/redoc",
        swagger_ui_oauth2_redirect_url: Optional[str] = "/docs/oauth2-redirect",
        middleware: Optional[Sequence[Middleware]] = None,
        exception_handlers: Optional[Dict[Union[int, Type[Exception]], Callable]] = None,
    ) -> None:
        self.title = title
        self.description = description
        self.version = version
        self.openapi_url = openapi_url
        self.docs_url = docs_url
        self.redoc_url = redoc_url
        self.router: routing.APIRouter = routing.APIRouter(
            routes=routes,
            dependency_overrides_provider=self,
        )
        super().__init__(
            debug=debug,
            routes=self.router.routes,
            middleware=middleware,
            exception_handlers=exception_handlers,
        )
        self.setup()

    def setup(self) -> None:
        if self.openapi_url:
            async def openapi(req: Any) -> JSONResponse:
                return JSONResponse(self.openapi())
            self.add_route(self.openapi_url, openapi, include_in_schema=False)
        if self.openapi_url and self.docs_url:
            async def swagger_ui_html(req: Any) -> Response:
                return get_swagger_ui_html(
                    openapi_url=self.openapi_url,
                    title=f"{self.title} - Swagger UI",
                )
            self.add_route(self.docs_url, swagger_ui_html, include_in_schema=False)`,
            analysis: {
              summary: "Core class extending Starlette, orchestrating OpenAPI spec generation, Swagger UI / ReDoc interactive documentation routes, and APIRouter binding.",
              keyInsights: [
                "Inherits from Starlette ASGI: High-performance asynchronous foundation.",
                "Auto-generated OpenAPI schema: Serves interactive documentation without external tools.",
                "Dependency injection registry: `dependency_overrides_provider` enables easy mock injection during testing."
              ],
              complexity: {
                time: "O(1) bootstrap",
                space: "O(r) where r is registered routes",
                maintainabilityIndex: 95,
                cyclomaticComplexity: 3
              },
              security: {
                score: "A",
                status: "Clean",
                details: "Built-in interactive docs endpoints cleanly exclude themselves from the schema."
              },
              suggestions: [
                "Enable configurable Content Security Policy (CSP) headers for the Swagger UI inline scripts."
              ]
            }
          }
        ]
      }
    ]
  },
  {
    id: "golang-mux",
    fullName: "gorilla/mux",
    name: "mux",
    owner: "gorilla",
    description: "A powerful HTTP router and URL matcher for building Go web servers.",
    stars: 21200,
    forks: 2110,
    watchers: 610,
    openIssues: 18,
    defaultBranch: "main",
    primaryLanguage: "Go",
    license: "BSD-3-Clause",
    url: "https://github.com/gorilla/mux",
    analyzedAt: "2026-11-06T09:20:00Z",
    analysisStats: {
      totalFiles: 14,
      totalLines: 3200,
      complexityScore: "A (Clean)",
      securityRisk: "Low",
      testCoverage: "94.0%",
    },
    files: [
      {
        name: "mux.go",
        type: "file",
        path: "mux.go",
        size: "8.4 KB",
        language: "go",
        lines: 95,
        content: `// Package mux implements a request router and dispatcher for matching incoming
// requests to their respective handler.
package mux

import (
	"context"
	"net/http"
)

// Router registers routes to be matched and dispatches a handler.
type Router struct {
	// Configurable Handler to be used when no route matches.
	NotFoundHandler http.Handler

	// Configurable Handler to be used when the request method does not match the route.
	MethodNotAllowedHandler http.Handler

	// Routes to be matched, in order.
	routes []*Route

	// See Router.StrictSlash().
	strictSlash bool

	// See Router.SkipClean().
	skipClean bool

	// See Router.UseEncodedPath().
	useEncodedPath bool
}

// NewRouter returns a new router instance.
func NewRouter() *Router {
	return &Router{
		NotFoundHandler: http.NotFoundHandler(),
	}
}

// ServeHTTP dispatches the handler registered in the matched route.
func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	if !r.skipClean {
		// Clean path to prevent path traversal attacks
	}

	var match RouteMatch
	var handler http.Handler

	if r.Match(req, &match) {
		handler = match.Handler
		req = setVars(req, match.Vars)
		req = setCurrentRoute(req, match.Route)
	}

	if handler == nil {
		if match.MatchErr == ErrMethodMismatch {
			handler = r.MethodNotAllowedHandler
		} else {
			handler = r.NotFoundHandler
		}
	}

	handler.ServeHTTP(w, req)
}`,
        analysis: {
          summary: "Go standard library-compatible HTTP dispatcher implementing request routing, context variable injection, and 404/405 fallback handling.",
          keyInsights: [
            "100% `http.Handler` compatible: Fits smoothly into standard Go net/http ecosystem.",
            "Route matching pipeline: Populates URL variables into request context via `setVars`.",
            "Explicit method mismatch: Distinguishes between 404 Not Found and 405 Method Not Allowed."
          ],
          complexity: {
            time: "O(n) linear route matching",
            space: "O(1) allocations per request with sync.Pool",
            maintainabilityIndex: 96,
            cyclomaticComplexity: 4
          },
          security: {
            score: "A",
            status: "Secure",
            details: "Path cleaning prevents directory traversal exploits across subpaths."
          },
          suggestions: [
            "Consider offering a trie-based matcher for ultra high-throughput microservices."
          ]
        }
      }
    ]
  }
];

export const POPULAR_REPO_SUGGESTIONS = [
  { url: "https://github.com/expressjs/express", label: "expressjs/express", lang: "JavaScript" },
  { url: "https://github.com/shadcn/taxonomy", label: "shadcn/taxonomy", lang: "TypeScript" },
  { url: "https://github.com/fastapi/fastapi", label: "fastapi/fastapi", lang: "Python" },
  { url: "https://github.com/gorilla/mux", label: "gorilla/mux", lang: "Go" },
];

