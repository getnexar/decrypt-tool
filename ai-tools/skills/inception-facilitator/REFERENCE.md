# Inception Facilitator Reference

## Domain Research Methodology

This guide provides structured approaches for conducting thorough domain research during the Idea Exploration phase.

---

## Research Framework: IDCAR Method

**I**ndustry Analysis
**D**omain Trends
**C**ompetitive Landscape
**A**udience Understanding
**R**egulatory Environment

---

## 1. Industry Analysis

### Market Size & Growth
Use WebSearch to find:
- Total Addressable Market (TAM)
- Serviceable Addressable Market (SAM)
- Serviceable Obtainable Market (SOM)
- Year-over-year growth rates
- Market projections (3-5 years)

**Search Queries:**
- "[industry] market size 2025"
- "[industry] growth rate forecast"
- "TAM SAM SOM for [industry]"
- "[industry] market research report"

**Key Sources:**
- Gartner, Forrester reports
- IBISWorld, Statista
- Industry trade associations
- Public company earnings reports

**Document:**
```markdown
### Market Size & Growth
- **TAM:** $X billion (source)
- **SAM:** $Y billion (source)
- **CAGR:** Z% (2025-2030) (source)
- **Key Drivers:** [List factors driving growth]
```

---

## 2. Domain Trends

### Identifying Trends
Search for:
- Emerging technologies
- Changing user behaviors
- Regulatory shifts
- Economic factors
- Social/cultural changes

**Search Queries:**
- "[industry] trends 2025"
- "future of [industry]"
- "[industry] innovation"
- "emerging technologies in [industry]"

**Evaluate Each Trend:**
- **Impact:** High / Medium / Low
- **Timeline:** Current / Near-term (1-2yr) / Long-term (3-5yr)
- **Relevance:** How it affects our product

**Document:**
```markdown
### Key Trends
1. **[Trend Name]**
   - **Description:** [What is happening]
   - **Impact:** [How it affects the industry]
   - **Opportunity:** [How we can leverage it]
   - **Timeline:** [When it will be significant]
   - **Source:** [Link to research]
```

---

## 3. Competitive Landscape

### Direct Competitors
Identify 5-7 direct competitors:

**For Each Competitor:**
- Company name and website
- Product offering
- Pricing model
- Target market
- Market position (leader, challenger, niche)
- Funding/revenue (if public)
- Customer count (if available)

**Search Queries:**
- "[product category] competitors"
- "alternatives to [competitor name]"
- "[industry] software comparison"
- "[competitor] reviews"

**Analyze:**
```markdown
### Competitive Analysis

| Competitor | Strengths | Weaknesses | Pricing | Our Differentiation |
|------------|-----------|------------|---------|---------------------|
| [Company A] | [List 2-3] | [List 2-3] | [Model] | [How we're different] |
```

### Feature Comparison Matrix
```markdown
| Feature | Us | Competitor A | Competitor B | Competitor C |
|---------|-------|--------------|--------------|--------------|
| [Feature 1] | ✅ | ✅ | ❌ | ⚠️ |
| [Feature 2] | ✅ | ⚠️ | ✅ | ❌ |
```

Legend: ✅ Full support | ⚠️ Partial support | ❌ Not supported

### Competitive Positioning
Use WebSearch to understand:
- What do customers say? (reviews, forums, social media)
- What are common complaints?
- What features are missing?
- What do they do well?

**Search Queries:**
- "[competitor] reviews"
- "[competitor] vs [competitor]"
- "problems with [competitor]"
- "[competitor] reddit"

---

## 4. Audience Understanding

### User Personas
Research to build 2-4 personas:

**Demographics:**
- Job title/role
- Industry
- Company size
- Experience level
- Geographic location

**Psychographics:**
- Goals and motivations
- Pain points and frustrations
- Current workflow
- Tool preferences
- Decision-making criteria

**Search Queries:**
- "[role] day in the life"
- "[role] challenges"
- "[role] tools"
- "[industry] user research"

**Document:**
```markdown
### Primary Persona: [Name] - [Role]

**Demographics:**
- **Title:** [Job title]
- **Industry:** [Industry]
- **Company Size:** [Small/Mid/Enterprise]
- **Experience:** [Years in role]

**Goals:**
- [Goal 1: What they're trying to achieve]
- [Goal 2]

**Pain Points:**
- [Pain 1: Current frustration]
- [Pain 2]

**Current Workflow:**
[Describe how they currently solve the problem]

**Tools Used:**
- [Tool 1]
- [Tool 2]

**Decision Criteria:**
- [What matters most when choosing a solution]

**Quote:**
"[A representative quote that captures their perspective]"
```

### User Behavior Patterns
Research common behaviors:
- How do users currently solve this problem?
- What workarounds do they use?
- When/where do they encounter the problem?
- What devices/platforms do they use?

**Search Queries:**
- "how to [solve problem]"
- "[user role] workflow"
- "[industry] best practices"

---

## 5. Regulatory Environment

### Compliance Requirements
Identify relevant regulations:

**Common Regulations:**
- **GDPR** (EU data protection)
- **CCPA** (California privacy)
- **HIPAA** (US healthcare)
- **PCI DSS** (payment cards)
- **SOC 2** (security)
- **COPPA** (children's privacy)
- **WCAG** (accessibility)

**Search Queries:**
- "[industry] regulations"
- "[industry] compliance requirements"
- "GDPR requirements for [product type]"
- "[country] data protection laws"

**Document:**
```markdown
### Regulatory Requirements

**Applicable Regulations:**
1. **[Regulation Name]**
   - **Scope:** [What it covers]
   - **Requirements:** [Key compliance requirements]
   - **Impact on Product:** [How it affects our design]
   - **Implementation Effort:** [Low/Medium/High]

**Compliance Strategy:**
- [How we'll achieve compliance]
- [Certifications needed]
- [Audit requirements]
```

---

## Domain Knowledge Documentation

### Industry Standards
Document common patterns:

**Technical Standards:**
- Data formats (JSON, XML, HL7, FHIR, etc.)
- Communication protocols (REST, gRPC, MQTT, etc.)
- Authentication methods (OAuth, SAML, etc.)
- Integration standards

**Search Queries:**
- "[industry] data standards"
- "[industry] API standards"
- "[industry] best practices"

**Document:**
```markdown
### Industry Standards

**Data Formats:**
- [Standard 1]: [Why it's used, when to apply]

**Integration Patterns:**
- [Pattern 1]: [Common approach in this industry]

**Authentication:**
- [Method 1]: [Industry-standard approach]
```

### Common Terminology
Build a glossary:
- Industry-specific terms
- Acronyms
- Technical jargon

**Document:**
```markdown
### Domain Glossary

- **[Term]:** [Definition]
- **[Acronym]:** [Full name] - [What it means]
```

---

## Research Quality Checklist

Before completing Idea Exploration, verify:

- [ ] Used multiple reliable sources (3+ per topic)
- [ ] Cross-referenced data for accuracy
- [ ] Documented all sources with links
- [ ] Validated statistics are current (within 1-2 years)
- [ ] Identified gaps in research
- [ ] Noted assumptions that need validation
- [ ] Competitor analysis includes recent data
- [ ] User personas based on real research (not assumptions)
- [ ] Regulatory requirements verified with official sources
- [ ] Industry standards confirmed with authoritative bodies

---

## Source Reliability Guide

### Highly Reliable
- Government agencies
- Industry regulatory bodies
- Academic research papers
- Established research firms (Gartner, Forrester, McKinsey)
- Direct competitor documentation

### Moderately Reliable
- Industry blogs (established companies)
- Trade publications
- Conference presentations
- Product review sites

### Use with Caution
- Individual blog posts
- Social media (unless from verified experts)
- Forums (Reddit, Quora) - anecdotal only
- Marketing materials (biased)

---

## Advanced Research Techniques

### 1. Jobs-to-be-Done Framework
Understand what job the user is hiring your product to do:

**Questions to Research:**
- What job is the user trying to accomplish?
- What are they currently hiring to do this job?
- What are the functional, emotional, and social dimensions?

**Document:**
```markdown
### Jobs-to-be-Done

**Main Job:**
When [situation], I want to [motivation], so I can [expected outcome].

**Current Solutions:**
- [Solution 1]: [Pros/Cons from user perspective]

**Desired Outcome:**
[What success looks like to the user]
```

### 2. Value Chain Analysis
Understand the broader ecosystem:

**Map the Value Chain:**
- Suppliers/Dependencies
- Your product position
- Customer workflows
- Downstream impacts

### 3. Technology Landscape
Research enabling technologies:

**Search for:**
- Cloud platforms commonly used
- Development frameworks
- Integration platforms
- AI/ML capabilities
- Mobile/device support

**Document:**
```markdown
### Technology Landscape

**Common Tech Stacks:**
- [Stack 1]: Used by [competitors/companies]
- [Stack 2]: Gaining popularity

**Integration Points:**
- [System 1]: Most products integrate with this
- [System 2]: Standard in the industry

**Emerging Tech:**
- [Technology]: [How it's being adopted]
```

---

## Research Synthesis

After completing research, synthesize findings:

### Key Insights
Identify 5-7 critical insights:

```markdown
### Research Insights

1. **[Insight 1]**
   - **Evidence:** [Data supporting this]
   - **Implication:** [What this means for our product]

2. **[Insight 2]**
   [Repeat structure]
```

### Strategic Recommendations
Based on research, recommend:

```markdown
### Strategic Recommendations

**Must Have:**
- [Feature/approach 1]: [Why it's critical]

**Should Have:**
- [Feature/approach 2]: [Why it's important]

**Consider:**
- [Feature/approach 3]: [Why it's worth exploring]

**Avoid:**
- [Approach 1]: [Why not recommended]
```

---

## Pre-Populated Context Template

Use this structure for `.claude/agent-context/domain-knowledge.md`:

```markdown
# Domain Knowledge: [Industry/Domain Name]

**Last Updated:** [YYYY-MM-DD]
**Research Date:** [YYYY-MM-DD]

## Industry Overview

**Market Size:** $X billion TAM
**Growth Rate:** Y% CAGR (2025-2030)
**Key Players:** [Top 5 companies in space]

**Industry Maturity:** [Emerging / Growing / Mature / Declining]

## Key Trends (Top 5)

1. **[Trend Name]**
   - **Impact:** High / Medium / Low
   - **Timeline:** Current / 1-2yr / 3-5yr
   - **Relevance:** [How it affects us]

[Repeat for trends 2-5]

## Competitive Landscape

### Direct Competitors
[Use table format from above]

### Market Positioning
[Where competitors are positioned, gaps we can fill]

## Target Audience

### Primary Persona
[Full persona from template above]

### Secondary Persona
[If applicable]

## User Behavior Insights

**Current Workflows:**
[How users currently solve the problem]

**Pain Points:**
1. [Pain point 1]
2. [Pain point 2]

**Device/Platform Preferences:**
- [Mobile-first, Desktop, etc.]

## Regulatory & Compliance

**Required Compliance:**
- [Regulation 1]: [Key requirements]

**Optional/Regional:**
- [Regulation 2]: [When applicable]

## Industry Standards

**Data Formats:**
- [Standard 1]: [When to use]

**Integration Patterns:**
- [Pattern 1]: [Common approach]

**Authentication:**
- [Method 1]: [Standard in industry]

## Technical Patterns

**Common Architectures:**
- [Pattern 1]: [Why it's used]

**Typical Tech Stacks:**
- [Stack 1]: [Prevalence]

## Domain Glossary

- **[Term 1]:** [Definition]
- **[Term 2]:** [Definition]

## Key Insights

1. [Insight 1 with implication]
2. [Insight 2 with implication]

## Research Sources

- [Source 1]: [Link]
- [Source 2]: [Link]

**Research Quality Score:** [X/10]
- Sources: [Multiple/Single]
- Recency: [Current/Dated]
- Depth: [Deep/Surface]
```

---

## Common Research Pitfalls

### ❌ Avoid:
1. **Confirmation Bias** - Only looking for data that supports your idea
2. **Outdated Data** - Using research from 3+ years ago
3. **Single Source** - Relying on one report or article
4. **Assumption Over Data** - Assuming user behavior without research
5. **Ignoring Competitors** - Not understanding what exists
6. **Superficial Research** - Stopping at surface-level findings

### ✅ Do:
1. **Challenge Assumptions** - Actively seek contradictory data
2. **Current Data** - Prioritize recent research (within 1-2 years)
3. **Multiple Sources** - Cross-reference findings
4. **Real User Data** - Talk to actual users if possible
5. **Deep Competitive Analysis** - Use competitor products
6. **Depth Over Breadth** - Go deep on critical topics
