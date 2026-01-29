# Web Scraping for Contact Extraction

Strategies and techniques for extracting contact information from company websites using anysite MCP.

## Overview

Web scraping complements LinkedIn lead generation by:
- Finding contacts not active on LinkedIn
- Discovering phone numbers and addresses
- Verifying email addresses
- Accessing information from company directories
- Getting regional office contacts

## Contact Extraction Tools

### parse_webpage

Primary tool for extracting contacts from web pages.

**Basic Usage**:
```
Tool: mcp__anysite__parse_webpage
Parameters:
- url: "https://company.com/contact"
- extract_contacts: true
- strip_all_tags: true
- only_main_content: true
```

**Returns**:
- Emails: All email addresses found
- Phones: Phone numbers in various formats
- Social links: LinkedIn, Twitter, Facebook, Instagram
- Content: Page text for additional parsing

**Best Practices**:
- Set `extract_contacts: true` to enable contact extraction
- Use `only_main_content: true` to avoid footer/header noise
- Try multiple page variations (/contact, /about, /team)

### get_sitemap

Discover all pages on a website to find contact information.

**Basic Usage**:
```
Tool: mcp__anysite__get_sitemap
Parameters:
- url: "https://company.com"
- count: 100
```

**Returns**:
- List of URLs from sitemap.xml
- Typically includes all public pages
- Useful for finding hidden contact/team pages

**Best Practices**:
- Start with count=100 to get comprehensive coverage
- Filter results for relevant pages (contact, team, about, leadership)
- Parse identified pages with parse_webpage

## Common Page Patterns

### Contact Pages

**Standard URLs**:
```
/contact
/contact-us
/get-in-touch
/reach-us
/contact-information
/locations
```

**Parsing Strategy**:
```
1. Try /contact first (most common)
2. If 404, try /contact-us
3. Check sitemap for contact-related URLs
4. Look for "Contact" link in navigation
```

**Example**:
```
parse_webpage("https://company.com/contact", extract_contacts=true)

Expected data:
- General company email (info@, contact@, hello@)
- Department emails (sales@, support@, careers@)
- Phone numbers (often main line)
- Physical address
- Social media links
```

### About Pages

**Standard URLs**:
```
/about
/about-us
/who-we-are
/company
/our-story
```

**Parsing Strategy**:
```
1. Often contains leadership team contacts
2. May have founder/CEO email
3. Usually has company description and values
4. Sometimes includes team photos with names
```

**Example**:
```
parse_webpage("https://company.com/about", extract_contacts=true)

Expected data:
- Leadership emails
- Company phone
- Headquarters address
- Founder/CEO information
```

### Team/People Pages

**Standard URLs**:
```
/team
/our-team
/people
/leadership
/about/team
/company/team
/meet-the-team
```

**Parsing Strategy**:
```
1. Best source for individual contacts
2. Often lists names with titles
3. May include email addresses
4. Sometimes has LinkedIn profile links
```

**Example**:
```
parse_webpage("https://company.com/team", extract_contacts=true)

Expected data:
- Individual names and titles
- Personal email addresses (name@company.com)
- LinkedIn profile links
- Role descriptions
```

### Locations/Offices Pages

**Standard URLs**:
```
/locations
/offices
/contact/locations
/our-offices
/global-offices
```

**Parsing Strategy**:
```
1. Find regional office contacts
2. Get location-specific phone numbers
3. Extract local addresses
4. Identify office managers
```

**Example**:
```
parse_webpage("https://company.com/locations", extract_contacts=true)

Expected data:
- Office-specific emails
- Local phone numbers
- Regional addresses
- Office manager contacts
```

## Email Pattern Recognition

### Common Email Formats

**Individual Emails**:
```
first.last@company.com          (Most common)
first@company.com               (Small companies)
flast@company.com               (Medium companies)
firstl@company.com              (Larger companies)
first_last@company.com          (Underscore variant)
last.first@company.com          (Reverse order)
```

**Department Emails**:
```
sales@company.com
info@company.com
contact@company.com
hello@company.com
support@company.com
careers@company.com
press@company.com
marketing@company.com
```

**Pattern Detection**:
```
1. Extract all emails from page
2. Identify individual vs. department emails
3. Detect naming pattern from individual emails
4. Apply pattern to LinkedIn prospects
5. Validate before using
```

### Email Validation

**Format Validation**:
```
Regex pattern: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$

Check:
- Contains @ symbol
- Has domain extension
- No invalid characters
- Proper domain format
```

**Domain Validation**:
```
1. Extract domain from email
2. Verify domain matches company website
3. Check for common typos (.con instead of .com)
4. Ensure professional domain (not gmail, yahoo, etc. for B2B)
```

**Deliverability Validation** (external tool required):
```
Use email verification services:
- ZeroBounce
- NeverBounce
- Hunter.io
- EmailListVerify

Check:
- Mailbox exists
- Domain has MX records
- Not a catch-all
- Not a disposable email
```

## Phone Number Extraction

### Phone Number Patterns

**US/Canada Formats**:
```
(415) 555-1234
415-555-1234
415.555.1234
+1 415 555 1234
1-415-555-1234
```

**International Formats**:
```
+44 20 7123 4567    (UK)
+33 1 23 45 67 89   (France)
+49 30 123456       (Germany)
+61 2 1234 5678     (Australia)
```

**Parsing Strategy**:
```
1. Look for common format patterns
2. Extract country code (+1, +44, etc.)
3. Identify area/city code
4. Get main number
5. Check for extension
```

**Normalization**:
```
Input: "(415) 555-1234 ext. 123"
Normalized: +14155551234
Extension: 123
Display: +1 (415) 555-1234 x123
```

### Phone Number Context

**Labels to Look For**:
```
Main: General company line
Sales: Sales team direct line
Support: Customer support
Direct: Individual's direct line
Mobile: Mobile/cell phone
Toll-free: 800/888 numbers
Fax: Fax number (avoid using)
```

**Example**:
```
Page content:
"Sales: (415) 555-SALE
Support: (415) 555-HELP
Main Office: (415) 555-1234"

Extracted:
- sales_phone: +14155557253
- support_phone: +14155554357
- main_phone: +14155551234
```

## Multi-Page Scraping Workflows

### Workflow 1: Comprehensive Company Contact Extraction

**Goal**: Extract all available contact information from a company website

**Steps**:

1. **Get sitemap**
```
get_sitemap("https://company.com", count=100)
```

2. **Filter for relevant pages**
```
Filter sitemap results for:
- URLs containing: contact, about, team, location, office
- Exclude: blog, news, privacy, terms
```

3. **Parse each relevant page**
```
For each filtered URL:
  parse_webpage(url, extract_contacts=true)
```

4. **Consolidate and deduplicate**
```
- Combine all emails found
- Remove duplicates
- Group by type (sales, support, etc.)
- Combine all phone numbers
- Match to departments
```

5. **Enrich with LinkedIn**
```
For team member names found:
  search_linkedin_users(first_name, last_name, company_keywords)
  get_linkedin_profile(user)
```

**Expected Output**:
- 5-20 email addresses
- 3-10 phone numbers
- 10-50 team member names
- Social media profiles
- All office locations

### Workflow 2: Team Directory Scraping

**Goal**: Build contact list of entire team from website directory

**Steps**:

1. **Find team page**
```
Try common patterns:
- parse_webpage("https://company.com/team")
- parse_webpage("https://company.com/about/team")
- parse_webpage("https://company.com/people")

Or use sitemap:
- get_sitemap("https://company.com", count=100)
- Filter for "team" or "people"
```

2. **Extract team members**
```
parse_webpage(team_url, extract_contacts=true)

Look for patterns:
- Name + Title combinations
- Email addresses
- LinkedIn profile links
- Headshot images with alt text containing names
```

3. **Parse individual profiles** (if available)
```
Some team pages link to individual profiles:
- /team/john-smith
- /people/jane-doe

parse_webpage(individual_url, extract_contacts=true)
→ Often has direct email, phone
```

4. **Match to LinkedIn**
```
For each team member name:
  search_linkedin_users(
    first_name=<first>,
    last_name=<last>,
    company_keywords=<company>
  )
```

5. **Construct email addresses**
```
If email pattern detected from some team members:
- Apply pattern to all team members
- Example: john.doe@company.com → jane.smith@company.com
```

**Expected Output**:
- Complete team roster
- 40-60% email coverage (direct or inferred)
- LinkedIn profiles for 70-80% of team
- Titles and roles for all members

### Workflow 3: Multi-Location Contact Extraction

**Goal**: Get contacts for all office locations

**Steps**:

1. **Find locations page**
```
parse_webpage("https://company.com/locations", extract_contacts=true)
```

2. **Extract location information**
```
For each location found:
- Office name/city
- Full address
- Phone number
- Regional email
- Office manager name
```

3. **Parse location-specific pages** (if available)
```
Some companies have per-location pages:
- /locations/san-francisco
- /offices/new-york

parse_webpage(location_url, extract_contacts=true)
```

4. **Find office leaders**
```
For each location:
  search_linkedin_users(
    title="Office Manager OR General Manager",
    company_keywords=<company>,
    location=<office_city>
  )
```

5. **Build location contact sheet**
```
Spreadsheet with:
- Location name
- Address
- Main phone
- Local email
- Office manager name + LinkedIn
- Office manager email
```

**Expected Output**:
- Contact info for all office locations
- Regional phone numbers
- Office manager contacts
- Location-specific emails

## Advanced Extraction Techniques

### HTML Structure Analysis

**Common Team Page Structures**:

**Grid Layout**:
```html
<div class="team-grid">
  <div class="team-member">
    <img src="john.jpg" alt="John Smith">
    <h3>John Smith</h3>
    <p class="title">VP Sales</p>
    <a href="mailto:john@company.com">Email</a>
  </div>
  ...
</div>
```

**List Layout**:
```html
<ul class="team-list">
  <li>
    <strong>Jane Doe</strong> - CEO
    <a href="https://linkedin.com/in/janedoe">LinkedIn</a>
    <a href="mailto:jane@company.com">jane@company.com</a>
  </li>
  ...
</ul>
```

**Table Layout**:
```html
<table class="team-directory">
  <tr>
    <td>Bob Johnson</td>
    <td>CTO</td>
    <td>bob.johnson@company.com</td>
    <td>(415) 555-1234</td>
  </tr>
  ...
</table>
```

**Parsing Strategy**:
- Look for repeating patterns
- Identify CSS classes for team members
- Extract data from consistent positions
- Handle variations in structure

### Contact Form Scraping

**Contact Form Analysis**:
```
Many contact pages have forms instead of direct emails

Indicators:
- Form fields: name, email, message
- Submit button
- "Get in touch" or "Send us a message"

Information to extract:
- Department options (dropdown values)
- Office location options
- Inquiry type options (sales, support, etc.)
```

**Alternative Approaches**:
1. **Check page source** for hidden emails
```
Sometimes email is in HTML comments
Or in JavaScript that loads after form submission
```

2. **Try related pages**
```
If /contact has only a form:
- Try /about for team emails
- Check press/media page for PR contact
- Look for careers page (jobs@)
```

3. **Use department-specific pages**
```
/sales might have sales team contacts
/support might have support emails
/media might have press contact
```

### Social Link Extraction

**Social Profiles to Extract**:
```
LinkedIn: linkedin.com/company/[company]
Twitter: twitter.com/[company]
Facebook: facebook.com/[company]
Instagram: instagram.com/[company]
YouTube: youtube.com/[company]
```

**Parsing Strategy**:
```
parse_webpage(url, extract_contacts=true) returns social links

Use social profiles to:
1. Verify company information
2. Find additional team members
3. Get posting/engagement insights
4. Identify brand voice
```

**Example**:
```
Social links found:
- LinkedIn: linkedin.com/company/techcorp
- Twitter: twitter.com/techcorp

Next steps:
get_linkedin_company("techcorp") → Company details
get_twitter_user("techcorp") → Twitter profile
```

## Error Handling & Troubleshooting

### Common Issues

#### 1. No Contacts Found

**Symptoms**: parse_webpage returns no emails or phones

**Causes**:
- JavaScript-rendered content (page loads dynamically)
- Contact form instead of direct contacts
- Contacts hidden in images or PDFs
- Privacy-focused website design

**Solutions**:
```
1. Try alternative pages:
   - /about instead of /contact
   - /team instead of /contact-us
   - /leadership for executive contacts

2. Check page source manually to verify data exists

3. Look for PDF downloads:
   - Company brochure might have contacts
   - Annual report might list executives

4. Use LinkedIn as primary source instead
```

#### 2. Malformed Contact Data

**Symptoms**: Emails or phones in wrong format

**Causes**:
- Email obfuscation (user[at]company.com)
- Phone with extra text (Call us: 555-1234)
- HTML entities (&amp; instead of &)

**Solutions**:
```
Post-processing:
- Replace [at] with @
- Replace [dot] with .
- Strip "Call", "Phone:", "Email:" prefixes
- Decode HTML entities
- Normalize phone format
```

**Example**:
```
Raw: "Email us at hello[at]company[dot]com"
Cleaned: "hello@company.com"

Raw: "Phone: (415) 555-1234 ext 123"
Cleaned: "+14155551234"
Extension: "123"
```

#### 3. Too Many Irrelevant Results

**Symptoms**: Extracted emails include spam, marketing, unrelated domains

**Causes**:
- Partner/sponsor logos with emails
- Advertisement blocks
- Footer links to other sites

**Solutions**:
```
Filtering strategy:
1. only_main_content: true (remove footer/header)
2. Verify email domain matches company domain
3. Exclude common spam patterns (noreply@, donotreply@)
4. Filter out tracking/marketing emails
```

**Example Filter**:
```
Keep:
- john@company.com ✓
- sales@company.com ✓

Discard:
- noreply@company.com ✗
- partner@otherdomain.com ✗
- ads@advertising-network.com ✗
```

#### 4. Rate Limiting or Blocking

**Symptoms**: Requests fail or return errors

**Causes**:
- Website blocks scraping/bots
- Rate limiting (too many requests too fast)
- IP-based blocking

**Solutions**:
```
1. Increase request_timeout parameter
2. Add delays between requests (30-60 seconds)
3. Rotate user agents (handled by MCP server)
4. Scrape during off-peak hours
5. Use smaller batch sizes
```

**Best Practices**:
```
- Wait 30-60 seconds between parse_webpage calls
- Process 5-10 websites per batch
- Don't scrape same site multiple times rapidly
- Respect robots.txt
```

### Validation Workflows

**Email Validation Checklist**:
```
✓ Contains @ symbol
✓ Has valid domain extension
✓ Domain matches company website
✓ Not a role-based email (noreply, admin, etc.)
✓ Proper format (no spaces, special chars)
✓ Not a personal email (gmail, yahoo, etc. for B2B)
```

**Phone Validation Checklist**:
```
✓ Contains correct number of digits for region
✓ Has valid area/city code
✓ Not a fax number
✓ Not a toll-free number (for direct contact)
✓ Matches expected country code
✓ Includes extension if available
```

**Data Quality Scoring**:
```
High Quality (90-100):
- Direct email (first.last@)
- Direct phone with extension
- Verified through LinkedIn match

Medium Quality (70-89):
- Department email (sales@)
- Main office phone
- Found on official website

Low Quality (50-69):
- Generic contact form
- General inquiry email (info@)
- No phone available

Poor Quality (<50):
- Inferred/guessed email
- No contact method found
```

## Integration with LinkedIn Data

### Workflow: LinkedIn → Web Enrichment

**Pattern**: Use LinkedIn as source, enrich with web data

**Steps**:

1. **Find prospects on LinkedIn**
```
search_linkedin_users(title, location, company_keywords)
```

2. **Get company websites**
```
For each prospect:
  get_linkedin_company(prospect.company)
  → Extract website URL
```

3. **Extract company contacts**
```
For each company website:
  parse_webpage(website + "/contact", extract_contacts=true)
  parse_webpage(website + "/team", extract_contacts=true)
```

4. **Match web contacts to LinkedIn**
```
For each email found on website:
  If email pattern matches prospect name:
    Assign email to LinkedIn prospect
  Else:
    Try find_linkedin_user_email(email)
```

5. **Build enriched prospect list**
```
Combine:
- LinkedIn profile data (title, experience, etc.)
- Company website (phone, address)
- Direct email (from web or LinkedIn)
- Social profiles (from website)
```

**Expected Result**:
- LinkedIn prospects with 80-90% email coverage
- Company phone numbers for all prospects
- Verified company websites
- Full contact profiles ready for outreach

### Workflow: Web → LinkedIn Validation

**Pattern**: Use website as source, validate with LinkedIn

**Steps**:

1. **Extract team from website**
```
parse_webpage("https://company.com/team", extract_contacts=true)
→ Get names, titles, emails
```

2. **Search LinkedIn for each person**
```
For each team member:
  search_linkedin_users(
    first_name=<first>,
    last_name=<last>,
    company_keywords=<company>
  )
```

3. **Validate and enrich**
```
For each LinkedIn match:
  get_linkedin_profile(user)
  → Verify title matches
  → Get full work history
  → Find additional contact methods
```

4. **Cross-reference data**
```
Compare:
- Website title vs. LinkedIn title (should match)
- Email pattern consistency
- Still at company (LinkedIn current position)
```

5. **Build validated contact list**
```
Keep prospects where:
- LinkedIn profile found
- Title matches (or is recent)
- Still at company
- Email validated
```

**Expected Result**:
- 70-80% of website contacts validated on LinkedIn
- Up-to-date employment status
- Enriched with LinkedIn work history
- Higher quality contact data

## Best Practices Summary

### Efficiency

1. **Start with sitemap** to identify all relevant pages
2. **Parse in batches** of 5-10 websites at a time
3. **Prioritize high-value pages** (team, leadership) over generic contact pages
4. **Use LinkedIn first** for individual contacts, web scraping for company-level contacts

### Quality

1. **Validate all contact data** before using
2. **Match emails to people** when possible (vs. generic info@)
3. **Check data freshness** (recent LinkedIn activity = current employee)
4. **Verify company domain** matches website being scraped

### Compliance

1. **Respect robots.txt** and website terms of service
2. **Rate limit requests** to avoid overloading servers
3. **Only collect publicly available** contact information
4. **Provide opt-out mechanism** in all communications

### Organization

1. **Track source of data** (which page each contact came from)
2. **Date stamp extractions** to know data freshness
3. **Deduplicate systematically** (same email from multiple pages)
4. **Categorize contacts** (by department, location, role)

---

**Next Steps**: Combine web scraping with LinkedIn strategies from [LINKEDIN_STRATEGIES.md](LINKEDIN_STRATEGIES.md) for comprehensive lead generation.
