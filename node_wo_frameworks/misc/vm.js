/*
 * Exampe VM
 * running some arbitrary commands
 */

// Dependencies
const vm = require('vm')


// NOT WORKING!!!

// Define a context for the script to run in
const context = {
  'foo' : 25
}

// Define the script
const script = new vm.Script(`

  foo = foo * 2
  const bar = foo + 1
  const fizz = 52

`)

// Run the script
script.runInContext(context)
console.log(context)
