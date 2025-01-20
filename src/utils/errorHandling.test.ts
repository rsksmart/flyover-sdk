import { describe, test, expect } from '@jest/globals'
import { processError } from './errorHandling'

describe('should convert error messages properly', () => {
  test('error conversion', () => {
    expect(() => processError('LBC040')).toThrowError(new Error('LBC: Quote already pegged out'))
  })
})
