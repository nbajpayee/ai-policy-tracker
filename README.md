# AI Policy Tracker

A comprehensive, automated web application for tracking and monitoring AI policy developments worldwide. Automatically collects policies from official government sources using AI-powered extraction. Built with Next.js, TypeScript, TailwindCSS, Supabase, and OpenAI.

## Features

### 🤖 **Automated Policy Collection**
- **Government Source Integration**: Automatically fetches from official sources:
  - Federal Register API (US federal regulations)
  - White House RSS feeds (statements, executive orders, press briefings)
  - Congressional committee feeds (House Science, Senate Commerce)
  - EU Commission feeds (Digital Single Market, Digital Strategy)
  - Key agency feeds (NIST, FTC, CISA)
- **AI-Powered Extraction**: Uses OpenAI to extract structured policy data
- **Configurable Timeframes**: Daily updates (7 days) or historical backfill (30-365 days)
- **Confidence Scoring**: Quality assessment for each extracted policy
- **Duplicate Detection**: Prevents duplicate policies in the database

### 📊 **Comprehensive Policy Tracking**
- **Complete Policy Data**: Tracks all aspects of AI policies:
  - Policy Name/Title, Jurisdiction, Issuing Body
  - Important dates (introduced, enacted, updated, review dates)
  - Status tracking (Proposed, Under Review, Enacted, etc.)
  - Risk classification (Low, Medium, High, Critical) with color coding
  - Detailed provisions, company obligations, and penalties
  - Affected stakeholders and implementation notes
  - Source links and monitoring organizations
  - AI confidence scores for data quality assessment

### 🎛️ **Professional Dashboard**
- **Clean Interface**: Streamlined, read-only dashboard focused on data analysis
- **Resizable Columns**: Customizable table layout with drag-to-resize functionality
- **Smart Text Formatting**: Automatically formats JSON data as bulleted lists or paragraphs
- **Visual Indicators**: Color-coded status, risk levels, and confidence scores
- **Real-time Stats**: Collection status and policy statistics
- **Manual Collection**: "Collect Now" button for immediate policy updates

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **AI Processing**: OpenAI GPT-4o-mini
- **Government APIs**: Federal Register API, RSS feeds
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account and project
- OpenAI API key for policy extraction

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-policy-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Run the SQL schema from `database/schema.sql` in your Supabase SQL editor

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   
   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key
   
   # Optional: For automated collection (production)
   CRON_SECRET=your-cron-secret
   ADMIN_KEY=your-admin-key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Initial Policy Collection**
   Run a historical backfill to populate your database:
   ```bash
   # 30-day backfill
   curl "http://localhost:3000/api/collect-policies?days_back=30"
   
   # Or 1-year backfill for comprehensive data
   curl "http://localhost:3000/api/collect-policies?days_back=365"
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses a single main table `ai_policies` with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| policy_name | VARCHAR(500) | Policy name/title |
| jurisdiction | VARCHAR(200) | Jurisdiction/region |
| issuing_body | VARCHAR(300) | Issuing authority |
| date_introduced | DATE | Date policy was introduced |
| date_enacted | DATE | Date policy became effective |
| status | VARCHAR(100) | Current status |
| policy_type | VARCHAR(150) | Type of policy |
| scope_coverage | TEXT | What the policy covers |
| key_provisions | TEXT | Main provisions summary |
| risk_classification | VARCHAR(100) | Risk level assessment |
| company_obligations | TEXT | Requirements for companies |
| penalties_fines | TEXT | Consequences for non-compliance |
| affected_stakeholders | TEXT | Who is affected |
| implementation_notes | TEXT | Implementation details |
| latest_update | DATE | Last update/amendment date |
| source_reference_link | VARCHAR(1000) | Link to original source |
| monitoring_org | VARCHAR(300) | Monitoring organization |
| notes_commentary | TEXT | Additional notes |
| next_review_date | DATE | Next review/sunset date |
| confidence_score | INTEGER | AI extraction confidence (0-100) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last modification time |

## Usage

### Automated Policy Collection

The system automatically collects AI policies from government sources:

1. **Manual Collection**: Click "Collect Now" in the dashboard for immediate updates
2. **API Collection**: Use the API endpoint for custom timeframes:
   ```bash
   # Daily update (7 days)
   curl "http://localhost:3000/api/collect-policies"
   
   # Custom timeframe
   curl "http://localhost:3000/api/collect-policies?days_back=30"
   ```
3. **Automated Cron**: Set up automated daily collection in production

### Dashboard Features

- **Policy Table**: View all collected policies with resizable columns
- **Visual Indicators**: Color-coded status, risk levels, and confidence scores
- **Smart Formatting**: JSON data automatically formatted as lists or paragraphs
- **Source Links**: Direct links to original government documents
- **Statistics**: Real-time collection status and policy counts

### Policy Status Options

- **Proposed**: Policy has been proposed but not yet enacted
- **Under Review**: Policy is currently being reviewed or debated
- **Enacted**: Policy is active and in effect
- **Amended**: Policy has been modified from its original form
- **Repealed**: Policy has been officially revoked
- **Expired**: Policy has reached its sunset date or expired

### Risk Classification

- **Low**: Minimal impact on AI development and deployment
- **Medium**: Moderate impact requiring some compliance measures
- **High**: Significant impact requiring substantial compliance efforts
- **Critical**: Major impact that could fundamentally change AI operations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- **Export functionality**: Export policy data to CSV/PDF
- **Advanced filtering**: Date range filters, multi-select filters
- **Policy comparison**: Side-by-side comparison of policies
- **Notifications**: Alerts for policy updates or review dates
- **API endpoints**: RESTful API for external integrations
- **Policy templates**: Pre-filled templates for common policy types
- **Collaboration features**: Comments and notes sharing
- **Analytics dashboard**: Trends and insights visualization

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information about the problem
3. Include steps to reproduce the issue

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- UI components styled with [TailwindCSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)
