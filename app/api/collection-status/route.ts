import { NextRequest, NextResponse } from 'next/server'
import { PolicyProcessor } from '@/lib/policyProcessor'
import { createClient } from '@supabase/supabase-js'

// Create service role client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const processor = new PolicyProcessor()
    const stats = await processor.getProcessingStats()
    
    // Get collection logs (you might want to implement a logs table)
    const { data: recentPolicies, error } = await supabaseAdmin
      .from('ai_policies')
      .select('policy_name, jurisdiction, status, risk_classification, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recent policies:', error)
    }

    // Get status counts
    const { data: statusCounts, error: statusError } = await supabaseAdmin
      .from('ai_policies')
      .select('status')

    const statusDistribution = statusCounts?.reduce((acc: Record<string, number>, policy: any) => {
      const status = policy.status || 'Unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get risk distribution
    const { data: riskCounts, error: riskError } = await supabaseAdmin
      .from('ai_policies')
      .select('risk_classification')

    const riskDistribution = riskCounts?.reduce((acc: Record<string, number>, policy: any) => {
      const risk = policy.risk_classification || 'Unknown'
      acc[risk] = (acc[risk] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      recentPolicies: recentPolicies || [],
      distributions: {
        status: statusDistribution,
        risk: riskDistribution
      },
      systemStatus: {
        database: 'connected',
        lastCollection: stats?.lastUpdate || null,
        nextCollection: 'Daily at 6:00 AM UTC'
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Status endpoint error:', error)
    
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
