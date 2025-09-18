import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface PolicyExtractionResult {
  policy_name: string
  jurisdiction?: string
  issuing_body?: string
  date_introduced?: string
  date_enacted?: string
  status?: 'Proposed' | 'Under Review' | 'Enacted' | 'Amended' | 'Repealed' | 'Expired'
  policy_type?: string
  scope_coverage?: string
  key_provisions?: string
  risk_classification?: 'Low' | 'Medium' | 'High' | 'Critical'
  company_obligations?: string
  penalties_fines?: string
  affected_stakeholders?: string
  implementation_notes?: string
  latest_update?: string
  source_reference_link?: string
  monitoring_org?: string
  notes_commentary?: string
  next_review_date?: string
  confidence_score: number
}

export async function extractPolicyFromText(
  articleText: string,
  sourceUrl: string
): Promise<PolicyExtractionResult | null> {
  try {
    const prompt = `
You are an AI policy analyst. Extract AI policy information from the following government document or policy announcement.

IMPORTANT: This document should be about AI/artificial intelligence policies, regulations, legislation, or government initiatives. Look for:
- Government regulations about AI systems
- AI safety frameworks and guidelines  
- AI ethics policies and principles
- Algorithmic accountability measures
- AI governance frameworks
- Government AI funding or initiatives
- AI compliance requirements
- AI oversight and monitoring policies

If this document mentions AI but is primarily about other topics (like general cybersecurity, media funding, or non-AI research), still extract it but give it a lower confidence score.

Document Text:
${articleText}

Source URL: ${sourceUrl}

Extract the following information and return as JSON:
{
  "policy_name": "Full name/title of the AI policy or regulation",
  "jurisdiction": "Country, state, or region (e.g., 'United States', 'European Union', 'California')",
  "issuing_body": "Organization or authority issuing the policy (e.g., 'FTC', 'European Commission', 'NIST')",
  "date_introduced": "Date policy was first introduced (YYYY-MM-DD format, null if unknown)",
  "date_enacted": "Date policy became effective (YYYY-MM-DD format, null if unknown)",
  "status": "Current status: 'Proposed', 'Under Review', 'Enacted', 'Amended', 'Repealed', or 'Expired'",
  "policy_type": "Type of policy (e.g., 'Regulation', 'Executive Order', 'Guidelines', 'Framework')",
  "scope_coverage": "What areas, industries, or AI applications this policy covers",
  "key_provisions": "Main requirements, rules, or provisions of the policy",
  "risk_classification": "REQUIRED: Impact level based on potential business/societal impact. Must be exactly one of: 'Low', 'Medium', 'High', or 'Critical'. Guidelines: Low=guidance/recommendations, Medium=compliance requirements, High=significant penalties/restrictions, Critical=major regulatory changes",
  "company_obligations": "What companies are required to do under this policy",
  "penalties_fines": "Consequences for non-compliance, including fines or penalties",
  "affected_stakeholders": "Who is affected (e.g., 'AI companies', 'researchers', 'consumers')",
  "implementation_notes": "Timeline, challenges, or implementation requirements",
  "latest_update": "Most recent update date (YYYY-MM-DD format, null if unknown)",
  "source_reference_link": "${sourceUrl}",
  "monitoring_org": "Organization responsible for monitoring compliance",
  "notes_commentary": "Additional analysis or important notes about this policy",
  "next_review_date": "Scheduled review or sunset date (YYYY-MM-DD format, null if unknown)",
  "confidence_score": "Number between 0-100 indicating confidence this is a legitimate AI policy"
}

Rules:
1. Only extract if confidence_score >= 70 (clearly about AI policy)
2. Use null for unknown/missing information
3. Be precise and factual
4. Focus on AI-specific policies, not general tech regulations
5. If not about AI policy, return: {"confidence_score": 0}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI policy analyst. Extract structured information from policy documents and news articles. Return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return null

    try {
      // Clean the response - remove code block markers if present
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const extracted = JSON.parse(cleanContent) as PolicyExtractionResult
      
      // Ensure risk_classification is always populated with a valid value
      if (!extracted.risk_classification || !['Low', 'Medium', 'High', 'Critical'].includes(extracted.risk_classification)) {
        // Determine risk level based on policy characteristics
        if (extracted.penalties_fines && (extracted.penalties_fines.toLowerCase().includes('fine') || extracted.penalties_fines.toLowerCase().includes('penalty'))) {
          extracted.risk_classification = 'High'
        } else if (extracted.status === 'Enacted' && extracted.company_obligations) {
          extracted.risk_classification = 'Medium'
        } else if (extracted.status === 'Proposed' || extracted.policy_type?.toLowerCase().includes('guideline')) {
          extracted.risk_classification = 'Low'
        } else {
          extracted.risk_classification = 'Medium' // Default fallback
        }
        console.log(`Applied fallback risk classification: ${extracted.risk_classification} for policy: ${extracted.policy_name}`)
      }
      
      // Only return if confidence score is high enough
      if (extracted.confidence_score < 40) {
        console.log(`Low confidence policy (${extracted.confidence_score}%): ${extracted.policy_name || 'Unknown'}`)
        return null
      }
      
      console.log(`Found policy (${extracted.confidence_score}% confidence): ${extracted.policy_name}`)

      return extracted
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      console.error('Raw content:', content)
      return null
    }
  } catch (error) {
    console.error('OpenAI extraction error:', error)
    return null
  }
}

export async function summarizePolicy(policyText: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI policy expert. Provide concise, accurate summaries of AI policies and regulations.',
        },
        {
          role: 'user',
          content: `Summarize this AI policy in 2-3 sentences, focusing on key requirements and impact:\n\n${policyText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    })

    return response.choices[0]?.message?.content || 'Summary not available'
  } catch (error) {
    console.error('OpenAI summarization error:', error)
    return 'Summary not available'
  }
}
