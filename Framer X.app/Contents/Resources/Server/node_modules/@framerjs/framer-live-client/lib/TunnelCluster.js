var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('localtunnel:client');
var net = require('net');
var http = require('http');

var HeaderHostTransformer = require('./HeaderHostTransformer');

// manages groups of tunnels
var TunnelCluster = function(opt) {
    if (!(this instanceof TunnelCluster)) {
        return new TunnelCluster(opt);
    }

    var self = this;
    self._opt = opt;

    EventEmitter.call(self);
};

TunnelCluster.prototype.__proto__ = EventEmitter.prototype;

// establish a new tunnel
TunnelCluster.prototype.open = function() {
    var self = this;

    var opt = self._opt || {};

    var remote_host = opt.remote_host;
    var remote_port = opt.remote_port;

    var local_host = opt.local_host || 'localhost';
    var local_port = opt.local_port;

    debug('establishing tunnel %s:%s <> %s:%s', local_host, local_port, remote_host, remote_port);

    var remote;

    var proxy = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;

    if (proxy) {
        conn_proxy()
    } else {
        conn_remote(net.connect({
            host: remote_host,
            port: remote_port
        }));
    }

    function conn_remote(socket) {
        // connection to localtunnel server
        remote = socket

        remote.setKeepAlive(true);

        remote.on('error', function(err) {
            // emit connection refused errors immediately, because they
            // indicate that the tunnel can't be established.
            if (err.code === 'ECONNREFUSED') {
                self.emit('error', new Error('connection refused: ' + remote_host + ':' + remote_port + ' (check your firewall settings)'));
            }

            remote.end();
        });

        remote.on('data', function(data) {
            const match = data.toString().match(/^(\w+) (\S+)/);
            if (match) {
                self.emit('request', {
                    method: match[1],
                    path: match[2],
                });
            }
        });

        // tunnel is considered open when remote connects
        if (remote.connecting) {
            remote.once('connect', remote_open);
        } else {
            remote_open();
        }
    }

    function remote_open() {
        self.emit('open', remote);
        conn_local();
    }

    function conn_local() {
        if (remote.destroyed) {
            debug('remote destroyed');
            self.emit('dead');
            return;
        }

        debug('connecting locally to %s:%d', local_host, local_port);
        remote.pause();

        // connection to local http server
        var local = net.connect({
            host: local_host,
            port: local_port
        });

        function remote_close() {
            debug('remote close');
            self.emit('dead');
            local.end();
        };

        remote.once('close', remote_close);

        // TODO some languages have single threaded servers which makes opening up
        // multiple local connections impossible. We need a smarter way to scale
        // and adjust for such instances to avoid beating on the door of the server
        local.once('error', function(err) {
            debug('local error %s', err.message);
            local.end();

            remote.removeListener('close', remote_close);

            if (err.code !== 'ECONNREFUSED') {
                return remote.end();
            }

            // retrying connection to local server
            setTimeout(conn_local, 1000);
        });

        local.once('connect', function() {
            debug('connected locally');
            remote.resume();

            var stream = remote;

            // if user requested specific local host
            // then we use host header transform to replace the host header
            if (opt.local_host) {
                debug('transform Host header to %s', opt.local_host);
                stream = remote.pipe(HeaderHostTransformer({ host: opt.local_host }));
            }

            stream.pipe(local).pipe(remote);

            // when local closes, also get a new remote
            local.once('close', function(had_error) {
                debug('local connection closed [%s]', had_error);
            });

        });
    }

    function conn_proxy() {
        var connect = http.request(proxy, {
            method: 'CONNECT',
            path: remote_host + ':' + remote_port,
            agent: false
        });
        connect.setHeader('Host', connect.path);

        function proxy_error(message) {
            debug(message);
            var error = new Error(message);
            error.code = 'ECONNRESET';
            self.emit('error', error);
        }

        connect.once('connect', function(res, socket, head) {
            connect.removeAllListeners();
            if (res.statusCode === 200 && head.length === 0) {
                debug('proxy connection established');
                // this data will be ignored by the localtunnel server
                // but it allows to open connections through HTTP proxies
                socket.write('OPEN SESAME\n');
                conn_remote(socket);
              } else {
                proxy_error('proxy connection could not be established, statusCode=' + res.statusCode);
              }
        });

        connect.once('error', function(message) {
            connect.removeAllListeners()
            proxy_error(message)
        });

        connect.end();
    }
};

module.exports = TunnelCluster;
