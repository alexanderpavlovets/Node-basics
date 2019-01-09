/*
 * Server related tasks
 *
 */

// Dependencies
const http = require('http')
const https = require('https')
const url = require('url')
const fs = require('fs')
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./config')
const handlers = require('./handlers')
const helpers = require('./helpers')
const path = require('path')
const util = require('util')
const debug = util.debuglog('server')

// Instantiate the server module object
const server = {}

// Instantiate HTTP server
server.httpServer = http.createServer(function(req, res) {
  server.unifiedServer(req, res)
})

// Instantiate HTTPS server
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../https/cert.pem'))
}
server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res) {
  server.unifiedServer(req, res)
})

// Server logic for both http and https servers
server.unifiedServer = function (req, res) {
  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true)

  // Get the path from URL
  const path = parsedUrl.pathname
  const trimmedPath = path.replace(/^\/+|\/+$/g, '') // removing slashes from begin and end of the path

  // Get the query string as an object
  const queryStringObject = parsedUrl.query

  // Get the HTTP method
  const method = req.method.toLowerCase()

  // Get the headers as an object
  const headers = req.headers

  // Get the payload if any
  const decoder = new StringDecoder('utf-8') // parameter - what encoding shoul be received. This is common
  let buffer = '' // buffer - just variable name,
  req.on('data', function(data){
    buffer += decoder.write(data)
  })
  req.on('end', function(){
    buffer += decoder.end()

    // Choose the handler this request should go to, if not found - use notFound handler
    const choosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound

    // Construct the data object to send to the handler
    const data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload : helpers.parseJsonToObject(buffer)
    }

    // Route the request to the handler specified in the router
    choosenHandler(data, function(statusCode, payload, contentType) {
      // Determine the type of response (fallback to JSON)
      contentType = typeof(contentType) === 'string' ? contentType : 'json'

      // Use the status code called back by the handler, or default to 200
      statusCode = typeof(statusCode) === 'number' ? statusCode : 200

      // Return the response parts that are content-specific
      let payloadString = ''
      if(contentType === 'json') {
        res.setHeader('Content-Type', 'application/json')
        payload = typeof(payload) === 'object' ? payload : {}
        payloadString = JSON.stringify(payload)
      }
      if(contentType === 'html') {
        res.setHeader('Content-Type', 'text/html')
        payloadString = typeof(payload) === 'string' ? payload : ''
      }

      // Return the response parts that are common to all content-types
      res.writeHead(statusCode)
      res.end(payloadString)

      // if the response is 200 print green, otherwise print red
      if(statusCode === 200) {
        debug('\x1b[32m%s\x1b[0m' ,method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode)
      } else {
        debug('\x1b[31m%s\x1b[0m' ,method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode)
      }
    })
  })
}

// Define a request router
server.router = {
  '': handlers.index,
  'account/create': handlers.accountCreate,
  'account/edit': handlers.accountEdit,
  'account/deleted': handlers.accountDeleted,
  'session/create': handlers.sessionCreate,
  'session/deleted': handlers.sessionDeleted,
  'checks/all': handlers.checksList,
  'checks/create': handlers.checksCreate,
  'checks/edit': handlers.checksEdit,
  'ping': handlers.ping,
  'api/users': handlers.users,
  'api/tokens': handlers.tokens,
  'api/checks': handlers.checks
}

// Init script
server.init = function() {
  // Start the HTTP server
  server.httpServer.listen(config.httpPort, function(){
    console.log('\x1b[36m%s\x1b[0m', 'The server is listening on port ' + config.httpPort + ' in ' + config.envName + ' mode')
  })

  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort, function(){
    console.log('\x1b[35m%s\x1b[0m', 'The server is listening on port ' + config.httpsPort + ' in ' + config.envName + ' mode')
  })
}

// Export the module
module.exports = server
