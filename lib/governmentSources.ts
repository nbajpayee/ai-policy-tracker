interface PolicyDocument {
  title: string
  description: string
  content: string
  url: string
  publishedAt: string
  source: {
    name: string
    type: 'federal_register' | 'white_house' | 'congress' | 'eu_commission' | 'agency_rss'
  }
  documentType?: string
  agency?: string
}

export class GovernmentSourcesService {
  
  async fetchAllGovernmentSources(daysBack: number = 7): Promise<PolicyDocument[]> {
    const allDocuments: PolicyDocument[] = []

    try {
      // Tier 1 Sources
      const [federalRegister, whiteHouse, congress] = await Promise.allSettled([
        this.fetchFederalRegister(daysBack),
        this.fetchWhiteHouseRSS(),
        this.fetchCongressionalSources()
      ])

      if (federalRegister.status === 'fulfilled') {
        allDocuments.push(...federalRegister.value)
        console.log(`Federal Register: ${federalRegister.value.length} documents`)
      }
      if (whiteHouse.status === 'fulfilled') {
        allDocuments.push(...whiteHouse.value)
        console.log(`White House: ${whiteHouse.value.length} documents`)
      }
      if (congress.status === 'fulfilled') {
        allDocuments.push(...congress.value)
        console.log(`Congress: ${congress.value.length} documents`)
      }

      // Tier 2 Sources
      const [euSources, agencySources] = await Promise.allSettled([
        this.fetchEUSources(),
        this.fetchAgencyRSSFeeds()
      ])

      if (euSources.status === 'fulfilled') {
        allDocuments.push(...euSources.value)
        console.log(`EU Sources: ${euSources.value.length} documents`)
      }
      if (agencySources.status === 'fulfilled') {
        allDocuments.push(...agencySources.value)
        console.log(`Agency Sources: ${agencySources.value.length} documents`)
      }

      console.log(`Total collected: ${allDocuments.length} documents from government sources`)
      return allDocuments

    } catch (error) {
      console.error('Error fetching government sources:', error)
      return allDocuments
    }
  }

  // Tier 1: Federal Register API
  async fetchFederalRegister(daysBack: number = 7): Promise<PolicyDocument[]> {
    try {
      const aiTerms = ['artificial intelligence', 'machine learning', 'algorithmic', 'AI', 'algorithm']
      const documents: PolicyDocument[] = []

      for (const term of aiTerms) {
        const url = new URL('https://www.federalregister.gov/api/v1/articles.json')
        url.searchParams.append('conditions[term]', term)
        url.searchParams.append('conditions[publication_date][gte]', this.getDateDaysAgo(daysBack))
        url.searchParams.append('per_page', '20')
        url.searchParams.append('order', 'newest')

        const response = await fetch(url.toString())
        if (!response.ok) continue

        const data = await response.json()
        
        for (const article of data.results || []) {
          documents.push({
            title: article.title,
            description: article.abstract || article.summary || '',
            content: `${article.abstract || ''}\n\n${article.summary || ''}`,
            url: article.html_url,
            publishedAt: article.publication_date,
            source: {
              name: 'Federal Register',
              type: 'federal_register'
            },
            documentType: article.type,
            agency: article.agencies?.[0]?.name
          })
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      return this.removeDuplicates(documents)
    } catch (error) {
      console.error('Federal Register fetch error:', error)
      return []
    }
  }

  // Tier 1: White House RSS
  async fetchWhiteHouseRSS(): Promise<PolicyDocument[]> {
    try {
      const rssFeeds = [
        'https://www.whitehouse.gov/briefing-room/statements-releases/feed/',
        'https://www.whitehouse.gov/briefing-room/presidential-actions/feed/',
        'https://www.whitehouse.gov/briefing-room/press-briefings/feed/'
      ]

      const documents: PolicyDocument[] = []

      for (const feedUrl of rssFeeds) {
        try {
          const feedDocuments = await this.parseRSSFeed(feedUrl, 'White House', 'white_house')
          // Filter for AI-related content
          const aiDocuments = feedDocuments.filter(doc => 
            this.containsAITerms(doc.title) || this.containsAITerms(doc.description)
          )
          documents.push(...aiDocuments)
        } catch (error) {
          console.error(`Error fetching White House RSS ${feedUrl}:`, error)
        }
      }

      return documents
    } catch (error) {
      console.error('White House RSS fetch error:', error)
      return []
    }
  }

  // Tier 1: Congressional Sources
  async fetchCongressionalSources(): Promise<PolicyDocument[]> {
    try {
      const congressFeeds = [
        'https://science.house.gov/rss.xml',
        'https://www.commerce.senate.gov/public/index.cfm/rss/feed',
        // Add more committee RSS feeds as available
      ]

      const documents: PolicyDocument[] = []

      for (const feedUrl of congressFeeds) {
        try {
          const feedDocuments = await this.parseRSSFeed(feedUrl, 'Congress', 'congress')
          const aiDocuments = feedDocuments.filter(doc => 
            this.containsAITerms(doc.title) || this.containsAITerms(doc.description)
          )
          documents.push(...aiDocuments)
        } catch (error) {
          console.error(`Error fetching Congressional RSS ${feedUrl}:`, error)
        }
      }

      return documents
    } catch (error) {
      console.error('Congressional sources fetch error:', error)
      return []
    }
  }

  // Tier 2: EU Sources
  async fetchEUSources(): Promise<PolicyDocument[]> {
    try {
      const euFeeds = [
        'https://ec.europa.eu/newsroom/dae/rss.cfm?ServiceID=1090', // Digital Single Market
        'https://digital-strategy.ec.europa.eu/en/rss.xml', // Digital Strategy
      ]

      const documents: PolicyDocument[] = []

      for (const feedUrl of euFeeds) {
        try {
          const feedDocuments = await this.parseRSSFeed(feedUrl, 'European Commission', 'eu_commission')
          const aiDocuments = feedDocuments.filter(doc => 
            this.containsAITerms(doc.title) || this.containsAITerms(doc.description)
          )
          documents.push(...aiDocuments)
        } catch (error) {
          console.error(`Error fetching EU RSS ${feedUrl}:`, error)
        }
      }

      return documents
    } catch (error) {
      console.error('EU sources fetch error:', error)
      return []
    }
  }

  // Tier 2: Agency RSS Feeds
  async fetchAgencyRSSFeeds(): Promise<PolicyDocument[]> {
    try {
      const agencyFeeds = [
        { url: 'https://www.nist.gov/news-events/news/rss.xml', name: 'NIST' },
        { url: 'https://www.ftc.gov/news-events/press-releases/rss.xml', name: 'FTC' },
        { url: 'https://www.cisa.gov/news/rss.xml', name: 'CISA' },
        // Add more agency feeds
      ]

      const documents: PolicyDocument[] = []

      for (const feed of agencyFeeds) {
        try {
          const feedDocuments = await this.parseRSSFeed(feed.url, feed.name, 'agency_rss')
          const aiDocuments = feedDocuments.filter(doc => 
            this.containsAITerms(doc.title) || this.containsAITerms(doc.description)
          )
          documents.push(...aiDocuments)
        } catch (error) {
          console.error(`Error fetching ${feed.name} RSS:`, error)
        }
      }

      return documents
    } catch (error) {
      console.error('Agency RSS fetch error:', error)
      return []
    }
  }

  // Helper: Parse RSS Feed
  private async parseRSSFeed(feedUrl: string, sourceName: string, sourceType: any): Promise<PolicyDocument[]> {
    try {
      const response = await fetch(feedUrl)
      if (!response.ok) return []

      const xmlText = await response.text()
      
      // Use proper XML parsing with fast-xml-parser
      const { XMLParser } = await import('fast-xml-parser')
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_'
      })
      
      const result = parser.parse(xmlText)
      const items = result.rss?.channel?.item || result.feed?.entry || []
      const itemsArray = Array.isArray(items) ? items : [items]
      
      return itemsArray.slice(0, 10).map((item: any) => ({
        title: item.title || item.title?.['#text'] || '',
        description: item.description || item.summary || item.content || '',
        content: item.description || item.summary || item.content || '',
        url: item.link || item.link?.['@_href'] || item.id || '',
        publishedAt: item.pubDate || item.published || item.updated || new Date().toISOString(),
        source: {
          name: sourceName,
          type: sourceType
        }
      })).filter((doc: PolicyDocument) => doc.title && doc.url)
    } catch (error) {
      console.error(`RSS parsing error for ${feedUrl}:`, error)
      return []
    }
  }


  // Helper: Check for AI terms
  private containsAITerms(text: string): boolean {
    const aiTerms = [
      'artificial intelligence', 'AI', 'machine learning', 'ML', 'algorithmic', 'algorithm',
      'neural network', 'deep learning', 'automated decision', 'AI system', 'AI model',
      'generative AI', 'large language model', 'LLM', 'foundation model'
    ]
    
    const lowerText = text.toLowerCase()
    return aiTerms.some(term => lowerText.includes(term.toLowerCase()))
  }

  // Helper: Remove duplicates
  private removeDuplicates(documents: PolicyDocument[]): PolicyDocument[] {
    const seen = new Set<string>()
    return documents.filter(doc => {
      const key = `${doc.title}-${doc.url}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // Helper: Get date N days ago
  private getDateDaysAgo(days: number): string {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
  }
}
