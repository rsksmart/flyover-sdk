// this is included because currently jest does not support fail fast inside the same test suite
const { TestEnvironment } = require('jest-environment-node')

class FailFastEnvironment extends TestEnvironment {
    failedTest = false

    handleTestEvent(event, state) {
        if (event.name === 'hook_failure' || event.name === 'test_fn_failure') {
            this.failedTest = true
        } else if (this.failedTest && event.name === 'test_start') {
            event.test.mode = 'skip'
        }
    }
}

module.exports = FailFastEnvironment
