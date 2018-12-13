/*
 * Library for request handlers
 *
 *
 *
 */

// Dependencies
const _data = require('./data')
const helpers = require('./helpers')


// Define the handlers
const handlers = {}

// Users
handlers.users = function(data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback)
  } else {
    callback(405) // method not allowed status code
  }
}

// Container for the users submethods
handlers._users = {}

// Users-post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: no
handlers._users.post = function(data, callback) {
  // Check that all required fields are filled out
  const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false
  const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
  const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true : false

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user does not already exist
    _data.read('users', phone, function(err, data) {
      if(err) {
        // Hash the password
        const hashedPassword = helpers.hash(password)

        if (hashedPassword) {
          // Create the user object
          const userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            hashedPassword: hashedPassword,
            tosAgreement: true // hardcode true because it is 'true' anyway here. Weird for me.
          }

          // Store the user
          _data.create('users', phone, userObject, function(err){
            if (!err) {
              callback(200)
            } else {
              console.log(err)
              callback(500, {Error: 'Could not create a new user'})
            }
          })
        } else {
          callback(500, {Error: 'Could not create a hash of users\'s password '})
        }
      } else {
        // User already exists
        callback(400, {Error: 'A user with that phone number is already exists'})
      }
    })
  } else {
    callback(400, {Error: 'Missing requred fields'})
  }
}

// Users-get
// Required data: phone
// Required header: token
// Optional data: no
handlers._users.get = function(data, callback) {
  // Check that phone number provided is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone : false
  if (phone) {
    // Get the token from the headers
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false
    // Verify that given token is valid for the phone number
    handlers._tokens.virifyToken(token, phone, function(tokenIsValid) {
      if(tokenIsValid) {
          // Look up user
          _data.read('users', phone, function(err, data){
          if (!err && data) {
            // Remove the hashed password from user object before send it to requestor
            delete data.hashedPassword
            callback(200, data)
          } else {
            callback(404)
          }
        })
      } else {
        callback(403, {Error: 'Missing required token in header, or token is invalid'})
      }
    })
  } else {
    callback(400, {Error: 'Missing required field'})
  }
}

// Users-put
// Required data: phone
// Optional data: firstName, lastName, password, tosAgreement (at least one of these must be specified)
handlers._users.put = function(data, callback) {
  // Check for the reqired field
  const phone = typeof (data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone : false

  // Check for the oprional fields
  const firstName = typeof (data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  const lastName = typeof (data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

  // Error is the phone is invalid
  if(phone) {
    // Error is nothing to update
    if(firstName || lastName || password) {

      // Get the token from the headers
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false

      // Verify that given token is valid for the phone number
      handlers._tokens.virifyToken(token, phone, function(tokenIsValid) {
        if(tokenIsValid) {
          // Look up the user
          _data.read('users', phone, function(err, userData) {
            if(!err && userData) {
              // Update the necessary fields
              if(firstName) {
                userData.firstName = firstName
              }
              if(lastName) {
                userData.lastName = lastName
              }
              if(password) {
                userData.hashedPassword = helpers.hash(password)
              }
              // Store new user updates
              _data.update('users', phone, userData, function(err1) {
                if(!err1) {
                  callback(200)
                } else {
                  console.log(err)
                  callback(500, {Error: 'Could not update the user'})
                }
              })
            } else {
              callback(400, {Error: 'The specified user does not exist'})
            }
          })
        } else {
          callback(403, {Error: 'Missing required token in header, or token is invalid'})
        }
      })
    } else {
      callback(400, {Error: 'Missing fields to update '})
    }
  } else {
    callback(400, {Error: 'Missing required field'})
  }
}

// Users-delete
// Required data: phone
// Optional data: no
// @TODO Cleanup (delete) any other data files assotiated with this user
handlers._users.delete = function(data, callback) {
  // Check that the phone number is valid
  const phone = typeof (data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone : false
  if(phone) {

    // Get the token from the headers
    const token = typeof (data.headers.token) === 'string' ? data.headers.token : false

    // Verify that given token is valid for the phone number
    handlers._tokens.virifyToken(token, phone, function(tokenIsValid) {
      if(tokenIsValid) {
        // Look up user
        _data.read('users', phone, function(err, data) {
          if(!err && data) {
            _data.delete('users', phone, function(err) {
              if(!err) {
                callback(200)
              } else {
                callback(500, {Error: 'Could not delete the specified user'})
              }
            })
          } else {
            callback(400, {Error: 'Could not find the specified user'})
          }
        })
      } else {
        callback(403, {Error: 'Missing required token in header, or token is invalid'})
      }
    })
  } else {
    callback(400, {Error: 'Missing required field'})
  }
}

// Tokens
handlers.tokens = function(data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback)
  } else {
    callback(405) // method not allowed status code
  }
}

// Container for all the tokens methods
handlers._tokens = {}

// Tokens - post
// Require data: phone, password
// Optional data: none
handlers._tokens.post = function(data, callback) {
  const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false
  const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
  if(phone && password) {
    // Lookup the user who matches that phone number
    _data.read('users', phone, function(err, userData) {
      if(!err && userData) {
        // Hash the sent password, and compare it to the password stored in user password
        const hashedPassword = helpers.hash(password)
        if (hashedPassword === userData.hashedPassword) {
          // If valid, create a new token with a random name. Set expiration date 1 hour in the future
          const tokenId = helpers.createRandomString(20)
          const expires = Date.now() + 1000 * 60 * 60 // plus one hour from now
          const tokenObject = {
            phone: phone,
            id: tokenId,
            expires: expires
          }

          // Store the token
          _data.create('tokens', tokenId, tokenObject, function(err) {
            if (!err) {
              callback(200, tokenObject)
            } else {
              callback(500, {Error: 'Could not create a new token'})
            }
          })
        } else {
          callback(400, {Error: 'Password did not match the specified user\'s stered password'})
        }
      } else {
        callback(400, {Error: 'Could not find the specified user'})
      }
    })
  } else {
    callback(400, {Error: 'Missing required field(s)'})
  }
}

// Tokens - get
// Required Data: id
// Optional Data: None
handlers._tokens.get = function(data, callback) {
  // Check that the id is valid
  const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id : false
  if (id) {
    // Look up token
    _data.read('tokens', id, function(err, tokenData){
      if (!err && tokenData) {
        callback(200, tokenData)
      } else {
        callback(404)
      }
    })
  } else {
    callback(400, {Error: 'Missing required field'})
  }
}

// Tokens - put
// Required data: id, extend
// Optional data: None
handlers._tokens.put = function(data, callback) {
  const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false
  const extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false
  if(id && extend) {
    // Lookup the token
    _data.read('tokens', id, function(err, tokenData) {
      if(!err && tokenData) {
        // Check to make sure that token isn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60

          // Store the new updates
          _data.update('tokens', id, tokenData, function(err) {
            if(!err) {
              callback(200)
            } else {
              callback(500, {Error: 'Could not update the token\'s expiration'})
            }
          })
        } else {
          callback(400, {Error: 'The token has already expiried and cannot be extended'})
        }
      } else {
        callback(400, {Error: 'Specified token does not exist'})
      }
    })

  } else {
    callback(400, {Error: 'Missing required field(s) or field(s) are invalid'})
  }
}

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data, callback) {
  // Check that the ID is valid
  const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id : false
  if (id) {
    // Look up token
    _data.read('tokens', id, function(err, data){
      if (!err && data) {
        _data.delete('tokens', id, function(err){
          if (!err) {
            callback(200)
          } else {
            callback(500, {Error: 'Could not delete the specified token'})
          }
        })
      } else {
        callback(400, {Error: 'Could not find the specified token'})
      }
    })
  } else {
    callback(400, {Error: 'Missing required field'})
  }
}

// Verify if a given token id is currently valid for a given user
handlers._tokens.virifyToken = function (id, phone, callback) {
  // Look up the token
  _data.read('tokens', id, function(err, tokenData) {
    if(!err && tokenData) {
      // Check that token is for the given user and has not expired
      if(tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true)
      } else {
        callback(false)
      }
    } else {
      callback(false)
    }
  })
}

// Ping handler
handlers.ping = function (data, callback) {
  callback(200)
}

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404)
}

// Exporting the module
module.exports = handlers