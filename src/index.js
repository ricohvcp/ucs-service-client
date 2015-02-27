var URLSearchParams = URLSearchParams || require('urlsearchparams').URLSearchParams;
var XMLHttpRequest = XMLHttpRequest || require('xmlhttprequest').XMLHttpRequest;
var assert = require('assert');

var scopes = require('./scopes').SCOPES;

export class FetchError extends Error {
  constructor(message, code) {
    this.message = message;
    this.code = code;
  }
}

class Emitter {
  constructor() {
    this.events = {};
  }

  emit(name, data) {
    this.events[name].forEach((cb) => {
      cb(data);
    });
  }

  on(name, cb) {
    this.events[name] = this.events[name] || [];
    this.events[name].push(cb);
  }

  off(name, fn) {
    if (name === undefined && fn === undefined) {
      delete this.events;
      this.events = {};
      return;
    }

    if (this.events[name] === undefined) {
      return;
    }

    if (fn !== undefined) {
      let index = this.events[name].indexOf(fn);
      if (index > -1) {
        this.events[name].splice(index, 1);
      }
    } else {
      delete this.events[name];
    }
  }
}

class Fetcher extends Emitter {
  fetch(url, options) {
    assert(url, 'url required');

    options = options || {};

    let method = options.method || 'GET';
    let xhr = new XMLHttpRequest();

    xhr.open(method, url);

    // set access_token to Authroization header
    if (options.access_token) {
      xhr.setRequestHeader('Authorization', `Bearer ${options.access_token}`);
    }

    // set content-type to form-urlencoded
    if (options.body) {
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }

    xhr.responseType = 'text';

    return new Promise((done, fail) => {
      xhr.addEventListener('error', fail);

      this.on('cancel', () => {
        xhr.abort();
        fail(new Error('upload canceled'));
      });

      xhr.addEventListener('load', () => {
        let status = xhr.status;
        let text = xhr.responseText;
        let json;

        if (/json/.test(xhr.getResponseHeader('content-type'))) {
          json = JSON.parse(text);
        }

        if (status > 399) {
          let message, code;

          if (json.error) {
            // single error
            message = json.error_description;
            code = json.error;
          } else if (json.errors) {
            // multiple error
            // but use only first.
            message = json.errors[0].message;
            code = json.errors[0].message_id;
          } else {
            throw new Error('cant be here: error = ' + text);
          }

          let err = new FetchError(message, code);
          return fail(err);
        }

        return done(json || text);
      });

      xhr.send(options.body || '');
    });
  }
}

export class Session extends Fetcher {

  constructor(endpoint, params) {
    assert(endpoint, 'endpoint required');
    Session.validateParams(params);

    super();
    this.endpoint = endpoint;
    this.params = params;
  }

  static validateParams(params) {
    assert(params, 'params required');

    assert(params.client_id, 'params.client_id required')
    assert.strictEqual(typeof params.client_id, 'string',  'params.client_id should be string');

    assert(params.client_secret, 'params.client_secret required');
    assert.strictEqual(typeof params.client_secret, 'string',  'params.client_secret should be string');

    assert(params.username,'params.username required');
    assert.strictEqual(typeof params.username, 'string',  'params.username should be string');

    assert(params.password,'params.password required');
    assert.strictEqual(typeof params.password, 'string',  'params.password should be string');

    assert(params.scope, 'params.scope required');
    assert(Array.isArray(params.scope), 'params.scope should be array');

    assert(params.grant_type,'params.grant_type required');
    assert.strictEqual(typeof params.grant_type, 'string',  'params.grant_type should be string');
  }

  auth() {
    let url = `${this.endpoint}/auth/token`;
    let urlParams = new URLSearchParams();

    Object.keys(this.params).forEach((key) => {
      let value = this.params[key];
      if (key === 'scope') {
        value = value.join(' ');
      }
      urlParams.append(key, value);
    });

    let body = urlParams.toString();

    return this.fetch(url, {
      method: 'POST',
      body: body
    }).then((authInfo) => {
      this.authInfo = authInfo;
      return Promise.resolve();
    });
  }

  discovery(scope) {
    assert(scope, 'scope is required');

    let url = `${this.endpoint}/auth/discovery`;
    let access_token = this.authInfo.access_token;

    let urlParams = new URLSearchParams();
    urlParams.append('scope', scope);

    let body = urlParams.toString();

    return this.fetch(url, {
      method: 'POST',
      access_token: access_token,
      body: body
    }).then(response => {
      return response[scope];
    });
  }

  accountInfo() {
    return this.discovery(scopes.GD_ACCOUNT_INFO_QUERY);
  }

  userInfo() {
    return this.discovery(scopes.USERINFO_QUERY);
  }

  information() {
    return this.discovery(scopes.INFORMATION_URI);
  }

  rosters() {
    return this.discovery(scopes.ROSTER_SERVICE_HTTP_API).then((res) => {
      let url = `${res.endpoint}/${this.params.username}`;
      let access_token = res.access_token;

      return this.fetch(url, {
        method: 'GET',
        access_token: access_token
      });
    });
  }

  roster(cid) {
    assert(cid, 'cid is required');

    return this.discovery(scopes.ROSTER_SERVICE_HTTP_API).then((res) => {
      let url = `${res.endpoint}/${this.params.username}/${cid}`;
      let access_token = res.access_token;

      return this.fetch(url, {
        method: 'GET',
        access_token: access_token
      });
    });
  }

  logUpload(log, filename) {
    assert(log, 'log is required');
    assert(filename, 'filename is required');

    // API limit for logfile name
    assert(filename.length < 32, 'logfile name too large. (API limit less than 32byte )');
    assert(/^[a-zA-Z0-9_\-\.]*$/.test(filename), 'invalid log filename. (API limit alpahnumeric and -, ., _)');

    // API limit is limit for logfile size
    assert(log.length < 1024 * 1024 * 128, 'logfile too big. (API limit 128MB)');

    return this.discovery(scopes.LOG_UPLOAD_API).then((res) => {
      let url = res.endpoint;
      url = url.replace('{filename_suffix}', filename);

      return this.fetch(url, {
        method: 'POST',
        body: log,
        access_token: res.access_token
      });
    });
  }

  logUploadCancel() {
    setImmediate(() => {
      this.emit('cancel');
    });
  }
}
