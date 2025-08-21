// Optional API endpoint for remote iOS debug logging
// This runs on Cloudflare Workers/Pages Functions

export async function onRequestPost(context: any) {
  try {
    const { request } = context
    const logData = await request.json()
    
    // Add server timestamp
    const serverEntry = {
      ...logData,
      serverTimestamp: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown'
    }
    
    // Log to server console (visible in Cloudflare logs)
    console.log('📱 iOS DEBUG REMOTE LOG:', JSON.stringify(serverEntry, null, 2))
    
    // Could store in database, send to external service, etc.
    // For now just log to server console
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('iOS debug log endpoint error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to process log' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Handle preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
