/*
 * Test runner
 *
 */

// Dependencies
const helpers = require('./../lib/helpers')
const assert = require('assert')

// Application logic for the test runner
_app = {}

// Container for the tests
_app.tests = {
  unit: {}
}

// Assert that the getANumber function is returning a number
_app.tests.unit['helpers.getANumber should return number '] = function(done) { // 'done' is callback, this is just convention to name it 'done'
  const val = helpers.getAnumber()
  assert.equal(typeof(val), 'number')
  done()
}

// Assert that the getANumber function is returning a 1
_app.tests.unit['helpers.getANumber should return 1'] = function(done) {
  const val = helpers.getAnumber()
  assert.equal(val, 1)
  done()
}

// Assert that the getANumber function is returning a 1
_app.tests.unit['helpers.getANumber should return 2'] = function(done) {
  const val = helpers.getAnumber()
  assert.equal(val, 2)
  done()
}

// Count all the test
_app.countTests = function() {
  let counter = 0
  for(const key in _app.tests) {
    if(_app.tests.hasOwnProperty(key)) {
      const subTests = _app.tests[key]
      for(const testName in subTests) {
        if(subTests.hasOwnProperty(testName)) {
          counter++
        }
      }
    }
  }
  return counter
}

// Run all the test, collecting the errors and successes
_app.runTests = function() {
  const errors = []
  let successes = 0
  const limit = _app.countTests()
  let counter = 0
  for( const key in _app.tests) {
    if(_app.tests.hasOwnProperty(key)) {
      const subTests = _app.tests[key]
      for(const testName in subTests) {
        if(subTests.hasOwnProperty(testName)) {
          (function(){
            const tmpTestName = testName // declate temp variables because of scopes - my guess
            const testValue = subTests[testName]
            // Call the test
            try {
              testValue(function() {
                // If it calls back without throwing, then it succeeded, so log it in green
                console.log('\x1b[32m%s\x1b[0m', tmpTestName)
                counter++
                successes++
                if(counter === limit) {
                  _app.produceTestReport(limit, successes, errors)
                }
              })
            } catch (e) {
              // If it throws, then it is failed, so capture the error and log it in red
              errors.push({
                name: testName,
                error: e
              })
              console.log('\x1b[31m%s\x1b[0m', tmpTestName)
              counter++
              if(counter === limit) {
                _app.produceTestReport(limit, successes, errors)
              }
            }
          })()
        }
      }
    }
  }
}

// Produce the test outcome report
_app.produceTestReport = function(limit, successes, errors){
  console.log('')
  console.log('---------------- BEGIN TEST REPORT ----------------')
  console.log('')
  console.log('Total Tests: ', limit)
  console.log('Pass: ', successes)
  console.log('Fail: ', errors.length)
  console.log('')

  // If there are errors, print them in details
  if(errors.length > 0) {
    console.log('---------------- BEGIN ERROR DETAILS ----------------')
    console.log('')

    errors.forEach(function(testError) {
      console.log('\x1b[31m%s\x1b[0m', testError.name)
      console.log(testError.error)
      console.log('')
    })

    console.log('')
    console.log('---------------- END ERROR DETAILS ----------------')
  }

  console.log('')
  console.log('---------------- END TEST REPORT ----------------')
}


// Run the tests
_app.runTests()