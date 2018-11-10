/*
 * Helpers for various tasks
 *
 *
 *
 */

 // Dependencies
const crypto = require('crypto')
const config = require('./config')

 // Container for all helpers
 const helpers = {}

 // Create a SHA256 hash
 helpers.hash = function(str) {
   if (typeof(str) === 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex')
    return hash
   } else {
    return false
   }
 }

 // Parse JSON string to an object without throw
 helpers.parseJsonToObject = function(str) {
   try {
    const obj = JSON.parse(str)
    return obj
   } catch (err) {
    return {}
   }
 }

 // Export the module
 module.exports = helpers