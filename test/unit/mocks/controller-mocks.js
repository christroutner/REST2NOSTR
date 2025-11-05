/*
  Mock Express request/response objects for controller unit tests.
*/

// Mock Express request object
export function createMockRequest (overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    method: 'GET',
    path: '/',
    ...overrides
  }
}

// Mock Express response object
export function createMockResponse () {
  const res = {
    statusCode: 200,
    jsonData: null,
    statusValue: null,
    headers: {},
    writeData: [],
    endCalled: false
  }

  res.status = function (code) {
    res.statusCode = code
    res.statusValue = code
    return res
  }

  res.json = function (data) {
    res.jsonData = data
    return res
  }

  res.setHeader = function (name, value) {
    res.headers[name] = value
    return res
  }

  res.write = function (data) {
    res.writeData.push(data)
    return true
  }

  res.end = function () {
    res.endCalled = true
    return res
  }

  res.on = function (event, callback) {
    // For SSE connection close handling
    if (event === 'close') {
      res.closeCallback = callback
    }
    return res
  }

  return res
}

// Helper to create a mock request with body
export function createMockRequestWithBody (body) {
  return createMockRequest({ body })
}

// Helper to create a mock request with params
export function createMockRequestWithParams (params) {
  return createMockRequest({ params })
}

// Helper to create a mock request with query
export function createMockRequestWithQuery (query) {
  return createMockRequest({ query })
}
