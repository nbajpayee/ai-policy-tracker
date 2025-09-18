import { supabase } from './supabase'
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
import { extractPolicyFromText, PolicyExtractionResult } from './openai'
import { GovernmentSourcesService } from './governmentSources'

interface ProcessingResult {
  processed: number
  added: number
  duplicates: number
  errors: number
}

export class PolicyProcessor {
  private governmentService: GovernmentSourcesService

  constructor() {
    this.governmentService = new GovernmentSourcesService()
  }

  async processLatestPolicies(daysBack: number = 7): Promise<ProcessingResult> {
    console.log('Starting policy processing...')
    
    const result: ProcessingResult = {
      processed: 0,
      added: 0,
      duplicates: 0,
      errors: 0
    }

    try {
      // Fetch documents from government sources
      const documents = await this.governmentService.fetchAllGovernmentSources(daysBack)
      console.log(`Found ${documents.length} government documents to process (${daysBack} days back)`)

      for (const document of documents) {
        try {
          result.processed++
          
          // Extract policy information using OpenAI
          const extractedPolicy = await extractPolicyFromText(document.content, document.url)
          if (!extractedPolicy) {
            console.log(`No policy extracted from: ${document.title}`)
            continue
          }

          // Normalize text fields to ensure consistent formatting
          const normalizedPolicy = this.normalizeTextFields(extractedPolicy)

          // Check for duplicates
          const isDuplicate = await this.checkForDuplicate(normalizedPolicy)
          if (isDuplicate) {
            result.duplicates++
            console.log(`Duplicate policy found: ${normalizedPolicy.policy_name}`)
            continue
          }

          // Save to database
          await this.savePolicyToDatabase(normalizedPolicy)
          result.added++
          console.log(`Added new policy: ${extractedPolicy.policy_name}`)

          // Add delay to respect OpenAI rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          result.errors++
          console.error(`Error processing document "${document.title}":`, error)
        }
      }

      console.log('Policy processing completed:', result)
      return result

    } catch (error) {
      console.error('Policy processing failed:', error)
      throw error
    }
  }

  private async checkForDuplicate(policy: PolicyExtractionResult): Promise<boolean> {
    try {
      // Check by policy name and source URL
      const { data, error } = await supabaseAdmin
        .from('ai_policies')
        .select('id')
        .or(`policy_name.eq.${policy.policy_name},source_reference_link.eq.${policy.source_reference_link}`)
        .limit(1)

      if (error) {
        console.error('Error checking for duplicates:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Duplicate check error:', error)
      return false
    }
  }

  private normalizeTextFields(policy: PolicyExtractionResult): PolicyExtractionResult {
    // Fields that might come as JSON arrays but should be readable text
    const fieldsToNormalize: (keyof PolicyExtractionResult)[] = [
      'key_provisions', 'company_obligations', 'affected_stakeholders', 
      'penalties_fines', 'implementation_notes', 'notes_commentary'
    ]
    
    const normalized = { ...policy }
    
    for (const field of fieldsToNormalize) {
      const value = normalized[field]
      if (value && typeof value === 'string') {
        (normalized as any)[field] = this.convertToReadableText(value)
      }
    }
    
    return normalized
  }

  private convertToReadableText(value: string): string {
    if (!value) return value
    
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        // Convert array to bulleted list
        return parsed
          .filter(item => item && typeof item === 'string')
          .map(item => `• ${item.trim()}`)
          .join('\n')
      }
      // If it's a JSON object, stringify it nicely
      if (typeof parsed === 'object') {
        return Object.entries(parsed)
          .map(([key, val]) => `${key}: ${val}`)
          .join('\n')
      }
      // If it parsed but isn't array/object, return as string
      return String(parsed)
    } catch {
      // Not JSON, return as-is but clean up
      return value.trim()
    }
  }

  private async savePolicyToDatabase(policy: PolicyExtractionResult): Promise<void> {
    try {
      // Include confidence_score in database save
      const { error } = await supabaseAdmin
        .from('ai_policies')
        .insert([policy])

      if (error) {
        throw new Error(`Database insert error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error saving policy to database:', error)
      throw error
    }
  }

  async updateExistingPolicies(): Promise<void> {
    try {
      console.log('Checking for policy updates...')

      // Get policies that might need updates (recent ones or those with review dates)
      const { data: existingPolicies, error } = await supabaseAdmin
        .from('ai_policies')
        .select('*')
        .or('next_review_date.gte.now(),created_at.gte.now() - interval \'30 days\'')

      if (error) {
        console.error('Error fetching existing policies:', error)
        return
      }

      for (const existingPolicy of existingPolicies || []) {
        try {
          // Search for updates to this specific policy
          const updateArticles = await this.searchForPolicyUpdates(existingPolicy.policy_name)
          
          for (const article of updateArticles) {
            const updatedInfo = await extractPolicyFromText(
              `${article.title}\n\n${article.description}\n\n${article.content}`,
              article.url
            )

            if (updatedInfo && this.hasSignificantChanges(existingPolicy, updatedInfo)) {
              // Normalize the updated policy data
              const normalizedUpdatedInfo = this.normalizeTextFields(updatedInfo)
              await this.updatePolicyInDatabase(existingPolicy.id, normalizedUpdatedInfo)
              console.log(`Updated policy: ${existingPolicy.policy_name}`)
            }
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (error) {
          console.error(`Error updating policy ${existingPolicy.policy_name}:`, error)
        }
      }
    } catch (error) {
      console.error('Policy update process failed:', error)
    }
  }

  private async searchForPolicyUpdates(policyName: string): Promise<any[]> {
    try {
      // Search government sources for updates to this specific policy
      const documents = await this.governmentService.fetchAllGovernmentSources()
      
      return documents.filter((document: any) => 
        document.title.toLowerCase().includes(policyName.toLowerCase()) ||
        document.content.toLowerCase().includes(policyName.toLowerCase())
      ).slice(0, 3) // Limit to 3 most relevant documents
    } catch (error) {
      console.error('Error searching for policy updates:', error)
      return []
    }
  }

  private hasSignificantChanges(existing: any, updated: PolicyExtractionResult): boolean {
    // Check for significant changes that warrant an update
    const significantFields = ['status', 'date_enacted', 'key_provisions', 'penalties_fines']
    
    return significantFields.some(field => {
      const existingValue = existing[field]
      const updatedValue = updated[field as keyof PolicyExtractionResult]
      return existingValue !== updatedValue && updatedValue !== null
    })
  }

  private async updatePolicyInDatabase(policyId: string, updatedInfo: PolicyExtractionResult): Promise<void> {
    try {
      // Add update timestamp and include confidence_score
      const dataToUpdate = {
        ...updatedInfo,
        latest_update: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      }

      const { error } = await supabaseAdmin
        .from('ai_policies')
        .update(dataToUpdate)
        .eq('id', policyId)

      if (error) {
        throw new Error(`Database update error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error updating policy in database:', error)
      throw error
    }
  }

  async getProcessingStats(): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from('ai_policies')
        .select('created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const today = new Date().toISOString().split('T')[0]
      const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      return {
        total: data?.length || 0,
        addedToday: data?.filter(p => p.created_at.startsWith(today)).length || 0,
        addedThisWeek: data?.filter(p => p.created_at >= thisWeek).length || 0,
        lastUpdate: data?.[0]?.updated_at || null
      }
    } catch (error) {
      console.error('Error getting processing stats:', error)
      return null
    }
  }
}
