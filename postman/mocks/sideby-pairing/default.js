// Local pending-only stand-in derived from docs/PAIRING.md. No real device data.
const http = require('http');
const { createHash } = require('crypto');
http.createServer((req, res) => {
  const send = (status, body) => { res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify(body)); };
  if (req.method === 'POST' && req.url === '/device/heartbeat') return send(401,{error:'Unauthorised'});
  if (req.method === 'POST' && req.url === '/device/claim') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || !/^[0-9a-f]{64}$/.test(body.credential) || body.platform !== 'android' || !body.name || body.name.length > 60) return send(400,{error:'Invalid input'});
    if (body.code.replace(/[ -]/g,'').toUpperCase() !== '0123456789ABCDEF') return send(404,{error:'Pairing unavailable'});
    return send(200,{status:'pending',verification:createHash('sha256').update('verify:'+body.credential).digest('hex').slice(0,8).toUpperCase()});
  }
  send(501,{error:'Not modelled in this local simulation'});
}).listen(process.env.PORT || 4500);
