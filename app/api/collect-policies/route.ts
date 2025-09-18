import { NextRequest, NextResponse } from 'next/server'
import { PolicyProcessor } from '@/lib/policyProcessor'

export async function POST(request: NextRequest) {
  try {
    // Security check - verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting automated policy collection...')
    
    const processor = new PolicyProcessor()
    
    // Process new policies
    const result = await processor.processLatestPolicies()
    
    // Update existing policies
    await processor.updateExistingPolicies()
    
    // Get processing stats
    const stats = await processor.getProcessingStats()

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      result,
      stats,
      message: `Processed ${result.processed} articles, added ${result.added} new policies, found ${result.duplicates} duplicates`
    }

    console.log('Policy collection completed:', response)
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('Policy collection error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Allow manual triggering via GET for testing
export async function GET(request: NextRequest) {
  try {
    // Check for admin access or development environment
    const isDevelopment = process.env.NODE_ENV === 'development'
    const adminKey = request.nextUrl.searchParams.get('admin_key')
    
    if (!isDevelopment && adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - manual collection not allowed in production' },
        { status: 401 }
      )
    }

    console.log('Manual policy collection triggered...')
    
    // Check for backfill parameter
    const daysBack = parseInt(request.nextUrl.searchParams.get('days_back') || '7')
    console.log(`Collection timeframe: ${daysBack} days back`)
    
    const processor = new PolicyProcessor()
    const result = await processor.processLatestPolicies(daysBack)
    const stats = await processor.getProcessingStats()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
      stats,
      message: 'Manual collection completed'
    })

  } catch (error) {
    console.error('Manual policy collection error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
