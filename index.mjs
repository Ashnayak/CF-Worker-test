// Standalone metrics collection - no external dependencies
// Stores metrics in memory and displays them at /metrics

const metrics = {
  requests: {},
  startTime: Date.now()
}

function recordMetric(statusCode) {
  const key = `status_${statusCode}`
  metrics.requests[key] = (metrics.requests[key] || 0) + 1
}

function getMetricsText() {
  const uptime = Math.floor((Date.now() - metrics.startTime) / 1000)
  let output = `# Metrics Collection
# Uptime: ${uptime} seconds

# HTTP Status Codes
`
  
  Object.entries(metrics.requests).forEach(([key, count]) => {
    const status = key.replace('status_', '')
    output += `${status}: ${count}\n`
  })
  
  const total = Object.values(metrics.requests).reduce((sum, count) => sum + count, 0)
  output += `\nTotal Requests: ${total}\n`
  
  return output
}

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Metrics endpoint - view collected metrics
  if (url.pathname === '/metrics') {
    return new Response(getMetricsText(), {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
  
  // Health check
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'healthy' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Test different status codes
  if (url.pathname === '/404') {
    return new Response('Not Found', { status: 404 })
  }
  
  if (url.pathname === '/500') {
    return new Response('Internal Server Error', { status: 500 })
  }
  
  // Default response
  return new Response('Hello! Metrics are being collected.\n\nEndpoints:\n  /metrics - View metrics\n  /health - Health check\n  /404 - Test 404\n  /500 - Test 500', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  })
}

export default {
  async fetch(request) {
    const start = performance.now()
    
    let response
    try {
      response = await handleRequest(request)
    } catch (error) {
      response = new Response('Error: ' + error.message, { status: 500 })
    }
    
    // Record the status code
    recordMetric(response.status)
    
    const duration = performance.now() - start
    console.log(`${request.method} ${new URL(request.url).pathname} - ${response.status} (${duration.toFixed(2)}ms)`)
    
    return response
  }
}
