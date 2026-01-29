# LinkedIn Lead Generation Strategies

Advanced strategies and best practices for LinkedIn prospecting using anysite MCP.

## Boolean Search Operators

### Basic Operators

**AND** - Both terms must be present
```
title:"Software Engineer" AND "Python"
```

**OR** - Either term must be present
```
title:"VP Sales" OR "Head of Sales" OR "Director Sales"
```

**NOT** - Exclude terms
```
title:"Marketing" NOT "Intern" NOT "Coordinator"
```

**Quotes** - Exact phrase match
```
title:"Chief Technology Officer"
```

**Parentheses** - Group logic
```
title:("VP" OR "Director") AND ("Sales" OR "Business Development")
```

### Advanced Search Patterns

#### Title Targeting

**Executive Level**:
```
title:(VP OR "Vice President" OR SVP OR EVP OR C-level OR Chief OR President)
```

**Management Level**:
```
title:(Director OR "Head of" OR Manager OR Lead) NOT (Assistant OR Associate)
```

**Individual Contributor**:
```
title:("Software Engineer" OR Developer OR Analyst) NOT (Manager OR Director OR Lead)
```

**Seniority Filters**:
```
title:(Senior OR Staff OR Principal OR Lead OR Architect)
```

#### Industry-Specific Patterns

**SaaS/Technology**:
```
company_keywords:(SaaS OR "Cloud Software" OR "Enterprise Software" OR B2B)
```

**Finance**:
```
company_keywords:("Investment Bank" OR "Private Equity" OR "Venture Capital" OR Fintech)
```

**Healthcare**:
```
company_keywords:(Healthcare OR "Health Tech" OR Medical OR Pharma OR Biotech)
```

**E-commerce/Retail**:
```
company_keywords:(E-commerce OR Retail OR "Consumer Products" OR DTC)
```

#### Location Strategies

**Metropolitan Areas**:
```
location:"San Francisco Bay Area"
location:"New York City Metropolitan Area"
location:"Greater Boston"
```

**Remote Work**:
```
location:(Remote OR "Work from Home" OR Distributed)
```

**Multi-Location Search**:
```
location:("San Francisco" OR "New York" OR "Austin" OR "Seattle")
```

**Country-Level**:
```
location:"United States"
location:"United Kingdom"
```

## ICP-Based Search Strategies

### Enterprise B2B SaaS

**Target Profile**: Decision-makers at mid-market to enterprise SaaS companies

**Search Strategy**:
```
Step 1: Find Companies
- keywords: "B2B SaaS" OR "Enterprise Software"
- employee_count: ["201-500", "501-1000", "1001-5000"]
- industry: "Computer Software"

Step 2: Find Decision-Makers
- company_keywords: <from step 1>
- title: "VP" OR "SVP" OR "Chief" OR "Head of"
- keywords: "Sales" OR "Revenue" OR "GTM" OR "Business Development"
```

**Refinement**:
- Filter for companies with recent funding (check YC or Crunchbase)
- Prioritize companies with 100+ LinkedIn followers
- Target specific verticals (HR Tech, Sales Tech, Marketing Tech)

### Startup Ecosystem

**Target Profile**: Founders and early employees at seed/Series A startups

**Search Strategy**:
```
Step 1: Find Startups (Y Combinator)
- search_yc_companies
- batches: Recent batches (W24, S23, W23)
- industries: <your target verticals>

Step 2: Find Founders
- get_yc_company → Extract founder LinkedIn profiles
- title: "Founder" OR "Co-Founder" OR "CEO"

Step 3: Find Early Team
- company_keywords: <startup names from step 1>
- title: "Head of" OR "VP" OR "Lead"
- Filter for <50 total employees
```

**Refinement**:
- Target companies that recently raised funding
- Focus on specific YC batches or industries
- Look for hiring signals (job postings, team growth)

### Agency/Services

**Target Profile**: Agency owners and service providers

**Search Strategy**:
```
Step 1: Find Agencies
- keywords: "Agency" OR "Services" OR "Consulting"
- employee_count: ["11-50", "51-200"]
- industry: <specific agency type>

Step 2: Find Owners/Principals
- title: "Owner" OR "Founder" OR "Principal" OR "Managing Director"
- company_keywords: <agency names>
```

**Refinement**:
- Target specific agency types (Marketing, Design, Development)
- Filter by client focus (B2B vs B2C)
- Look for agencies with strong LinkedIn presence

## Search Workflow Optimization

### Funnel Approach

**Stage 1: Broad Search** (500+ prospects)
- Cast wide net with general criteria
- Focus on title and location only
- Identify target companies

**Stage 2: Company Filtering** (200-300 prospects)
- Research target companies
- Filter by company size, industry, funding
- Remove obviously poor fits

**Stage 3: Title Refinement** (100-150 prospects)
- Narrow to specific decision-maker titles
- Filter by seniority level
- Prioritize by title match

**Stage 4: Profile Enrichment** (50-75 prospects)
- Get full LinkedIn profiles
- Review work history and education
- Score based on qualification criteria

**Stage 5: Email Discovery** (25-40 prospects)
- Find verified emails
- Extract website contacts
- Validate email addresses

**Stage 6: Final Qualification** (15-25 prospects)
- Deep research on top prospects
- Personalization research
- Ready for outreach

### Batch Processing Strategy

**Batch Size Guidelines**:
- **Initial Search**: 50-100 prospects per batch
- **Profile Enrichment**: 10-20 profiles per batch
- **Email Finding**: 5-10 lookups per batch
- **Website Scraping**: 5-10 websites per batch

**Timing Between Batches**:
- Wait 30-60 seconds between large searches
- Process enrichment results before next batch
- Review quality before scaling up

**Parallel Processing**:
- Search multiple locations simultaneously
- Enrich different cohorts in parallel
- Extract contacts from multiple websites at once

Example:
```
Parallel Batch 1:
- search_linkedin_users(location="San Francisco", count=50)
- search_linkedin_users(location="New York", count=50)
- search_linkedin_users(location="Austin", count=50)

After review, Parallel Batch 2:
- Enrich top 10 from San Francisco
- Enrich top 10 from New York
- Enrich top 10 from Austin
```

## Qualification Frameworks

### BANT Framework (Budget, Authority, Need, Timeline)

**Budget** - Company size and funding
```
Check:
- Employee count (proxy for budget)
- Recent funding rounds (via YC or company posts)
- Company description for "Enterprise" or "SMB"
```

**Authority** - Decision-making power
```
Target titles:
- C-level: Final decision maker
- VP/SVP: Budget authority
- Director: Influencer/user
- Manager: User/champion
```

**Need** - Problem awareness
```
Research:
- LinkedIn posts about challenges
- Job postings for relevant roles
- Company growth signals
- Industry trends
```

**Timeline** - Buying readiness
```
Indicators:
- Recently joined company (new priorities)
- Job posting for related role
- Company expansion news
- Fiscal calendar alignment
```

### SCOTSMAN Framework (Situational, Competition, Objections, Timeline, Size, Money, Authority, Need)

**Enhanced qualification for complex sales**

**Situation** - Current state analysis
```
Research company:
- Recent news and LinkedIn posts
- Company growth trajectory
- Team expansion signals
- Technology stack (from jobs)
```

**Competition** - Competitive landscape
```
Check:
- Competitor usage signals in posts
- Tool mentions in employee profiles
- Integration partners
```

**Objections** - Potential blockers
```
Identify:
- Budget constraints (company size)
- Technical limitations
- Timing issues
- Process complexity
```

### Lead Scoring Model

**Profile Score (40 points)**:
- Exact title match: 20 points
- Similar title: 15 points
- Right department: 10 points
- Related role: 5 points

**Company Score (30 points)**:
- Ideal company size: 15 points
- Right industry: 10 points
- Growth signals: 5 points

**Engagement Score (20 points)**:
- Active on LinkedIn: 10 points
- Recent posts: 5 points
- Profile completeness: 5 points

**Contact Score (10 points)**:
- Email found: 10 points
- Phone found: 5 points
- No contact: 0 points

**Total**: 0-100 points
- **80-100**: Immediate outreach
- **60-79**: High priority
- **40-59**: Qualified
- **<40**: Nurture or discard

## Personalization Research

### Profile Intelligence

**Work History**:
```
get_linkedin_profile + with_experience: true

Extract:
- Career progression (promotions, moves)
- Company tenure (job hopper vs. stable)
- Industry experience
- Skill development path
```

**Education**:
```
get_linkedin_profile + with_education: true

Look for:
- Alma mater (school connections)
- Degree relevance to your solution
- Certifications (continuous learning)
- Shared education background
```

**Skills & Expertise**:
```
get_linkedin_user_skills

Identify:
- Technical skills (for product fit)
- Leadership skills (for selling approach)
- Endorsement count (credibility)
- Skills gaps you can address
```

### Company Intelligence

**Company Profile**:
```
get_linkedin_company

Analyze:
- Company description (positioning)
- Industry and specialties
- Employee count trend
- Headquarters location
```

**Recent Activity**:
```
get_linkedin_company_posts

Review:
- Announcement posts (expansion, funding, hiring)
- Thought leadership topics
- Engagement levels
- Company culture signals
```

**Team Growth**:
```
get_linkedin_company_employee_stats

Track:
- Hiring velocity (growth rate)
- Department expansion
- Geographic expansion
- Recent hires in target roles
```

### Conversation Starters

**Career Progression**:
```
"Congratulations on your recent promotion to VP Sales at [Company]!"
"I noticed you've been with [Company] for 3 years - impressive tenure in today's market."
```

**Shared Background**:
```
"Fellow [University] alum here - Go [Mascot]!"
"I see you worked at [Previous Company] - I spent time there too."
```

**Recent Activity**:
```
"Your recent post about [Topic] really resonated with me."
"Saw [Company]'s announcement about [Event] - exciting times!"
```

**Role-Specific**:
```
"As a VP Sales, you're probably thinking about [Challenge]..."
"Given your focus on [Area], I thought you'd find this interesting..."
```

## Email Discovery Strategies

### LinkedIn Email Methods

**Method 1**: Direct Email Finding
```
find_linkedin_user_email(email="prospect@company.com")
```

**Method 2**: Database Lookup
```
get_linkedin_user_email_db(profile="linkedin.com/in/prospect")
```

**Method 3**: Contact Info Section
```
get_linkedin_profile(user, with_experience=true)
→ Check profile for contact info section
→ May include email, phone, website
```

### Website Email Extraction

**Contact Page Pattern**:
```
parse_webpage(
  url="https://company.com/contact",
  extract_contacts=true
)

Common contact pages:
- /contact
- /contact-us
- /about/contact
- /get-in-touch
- /reach-us
```

**Team/About Page Pattern**:
```
parse_webpage(
  url="https://company.com/about/team",
  extract_contacts=true
)

Common team pages:
- /team
- /about/team
- /about
- /about-us
- /leadership
- /people
```

**Sitemap Discovery**:
```
Step 1: Get sitemap
get_sitemap(url="https://company.com", count=100)

Step 2: Filter for contact-related pages
→ Look for: contact, team, about, leadership, people

Step 3: Parse identified pages
parse_webpage(url, extract_contacts=true) for each page
```

### Email Pattern Guessing

**Common Patterns**:
```
first.last@company.com (most common)
first@company.com
flast@company.com
firstl@company.com
first_last@company.com
```

**Validation Strategy**:
1. Get person's name from LinkedIn
2. Get company domain from website
3. Try common patterns
4. Validate with email verification service
5. Test with small batch before scaling

**Example**:
```
Name: Jane Smith
Company: TechCorp
Domain: techcorp.com

Try:
jane.smith@techcorp.com
jane@techcorp.com
jsmith@techcorp.com
janes@techcorp.com
```

## Multi-Threading Strategies

### Account-Based Multi-Threading

**Strategy**: Contact multiple stakeholders at target account

**Steps**:
1. Identify target account
2. Map org structure:
   - Economic buyer (C-level)
   - Decision maker (VP level)
   - Influencer (Director level)
   - User/Champion (Manager level)
3. Personalized outreach to each
4. Reference other stakeholders in messaging

**Example**:
```
Target: TechCorp

search_linkedin_users(company_keywords="TechCorp", title="CTO")
→ Economic Buyer: John Smith, CTO

search_linkedin_users(company_keywords="TechCorp", title="VP Engineering")
→ Decision Maker: Jane Doe, VP Engineering

search_linkedin_users(company_keywords="TechCorp", title="Director")
→ Influencer: Bob Johnson, Director of Platform

Outreach sequence:
Day 1: Contact Jane (VP) - decision maker
Day 3: Contact Bob (Director) - technical champion
Day 7: Contact John (CTO) - if no response from Jane
```

### Champion Development

**Identify Potential Champions**:
```
Characteristics:
- Active on LinkedIn (posts, engages)
- Industry thought leader
- Recently joined company
- Previously used similar solutions
```

**Research Workflow**:
```
1. get_linkedin_profile(champion)
2. get_linkedin_user_posts(champion, count=20)
3. Analyze:
   - Topics they care about
   - Problems they discuss
   - Solution preferences
   - Engagement patterns
```

**Engagement Strategy**:
```
1. Engage with their content (thoughtful comments)
2. Share relevant resources
3. Build relationship before pitch
4. Ask for introduction to decision maker
```

## CRM Integration Patterns

### Salesforce Import Format

**Required Fields**:
```csv
First Name,Last Name,Email,Company,Title,Phone,LinkedIn URL
Jane,Smith,jane@tech.com,TechCorp,VP Sales,415-555-1234,linkedin.com/in/janesmith
```

**Optional Fields**:
```csv
Location,Industry,Company Size,Lead Source,Lead Score,Notes
San Francisco,Software,201-500,LinkedIn,85,Active on LinkedIn
```

**Import Process**:
1. Export prospects as CSV
2. Map CSV columns to Salesforce fields
3. Import via Data Loader or manual import
4. Assign to sales reps
5. Create tasks for follow-up

### HubSpot Import Format

**Contact Properties**:
```csv
Email,First Name,Last Name,Job Title,Company Name,LinkedIn Profile URL,Lead Score,Lifecycle Stage
jane@tech.com,Jane,Smith,VP Sales,TechCorp,linkedin.com/in/janesmith,85,Sales Qualified Lead
```

**Company Properties** (separate import):
```csv
Company Domain,Company Name,Industry,Number of Employees,LinkedIn Company Page
techcorp.com,TechCorp,Computer Software,350,linkedin.com/company/techcorp
```

**Import Process**:
1. Export contacts CSV
2. Export companies CSV (from LinkedIn company data)
3. Import companies first
4. Import contacts (will associate with companies)
5. Create workflows for engagement

### Outreach.io / SalesLoft Format

**Sequence-Ready Format**:
```csv
Email,First Name,Last Name,Title,Company,LinkedIn,Custom1,Custom2,Custom3
jane@tech.com,Jane,Smith,VP Sales,TechCorp,linkedin.com/in/janesmith,PersonalizationNote,MutualConnection,RecentActivity
```

**Personalization Variables**:
- Custom1: Personalization fact (e.g., "Recent promotion to VP")
- Custom2: Mutual connection name
- Custom3: Recent company activity (e.g., "Series B funding")

**Sequence Setup**:
1. Import prospects with variables
2. Create email templates using {{Custom1}}, {{Custom2}}, etc.
3. Set up multi-touch sequence (Email → Wait → LinkedIn → Wait → Call)
4. Track engagement and replies

## Compliance & Best Practices

### GDPR Compliance

**Data Collection**:
- Only collect publicly available information
- Document lawful basis for processing
- Provide data subject rights (access, deletion)
- Maintain data processing records

**Storage & Security**:
- Encrypt data at rest and in transit
- Implement access controls
- Set data retention policies
- Regular security audits

**Consent & Opt-Out**:
- Provide clear opt-out mechanism in all communications
- Honor opt-out requests within 24-48 hours
- Maintain suppression lists
- Don't re-add opted-out contacts

### CAN-SPAM Compliance

**Email Requirements**:
- Accurate "From" name and email
- Truthful subject lines
- Identify message as advertisement (if applicable)
- Include physical mailing address
- Provide clear opt-out mechanism
- Honor opt-outs within 10 business days

**Best Practices**:
- Use double opt-in when possible
- Clear unsubscribe link in every email
- Don't sell or share email lists
- Monitor bounce and spam rates
- Maintain clean email lists

### LinkedIn Usage Policies

**Do's**:
- Respect connection limits (100-200/week max)
- Personalize connection requests
- Engage authentically with content
- Respect privacy settings
- Use data for legitimate business purposes

**Don'ts**:
- Don't automate connection requests
- Don't send mass generic messages
- Don't scrape private profile information
- Don't circumvent LinkedIn's limits
- Don't misrepresent yourself or company

### Ethical Prospecting

**Respect**:
- Honor "do not contact" requests immediately
- Don't contact same person on multiple channels simultaneously
- Respect time zones when calling/messaging
- Keep messaging frequency reasonable (1-2x/week max)

**Transparency**:
- Be clear about who you are and why you're reaching out
- Don't misrepresent your solution or company
- Be honest about how you found their information
- Provide value in every interaction

**Value-First**:
- Share relevant content before pitching
- Offer insights from their industry
- Make meaningful connections
- Focus on helping, not selling

---

**Next Steps**: Apply these strategies to your lead generation workflows, and refer to [WEB_SCRAPING.md](WEB_SCRAPING.md) for website contact extraction techniques.
