# AI Context

**Purpose**: This file provides AI-specific configuration and context for the AI Engineer agent. Customize this for your project to ensure AI implementations align with your stack, budget, and requirements.

---

## LLM Configuration

**Primary LLM Provider**: [e.g., Anthropic, OpenAI, Google, Cohere, Azure OpenAI]

**Models in Use**:
- **High-Capability Tasks**: [e.g., Claude Opus 4, GPT-4, Gemini Pro]
  - Use cases: Complex reasoning, long-context analysis, critical features
  - Cost: [e.g., $15 per 1M input tokens, $75 per 1M output tokens]
- **Standard Tasks**: [e.g., Claude Sonnet 3.5, GPT-4o, Gemini Flash]
  - Use cases: Most features, general intelligence tasks
  - Cost: [e.g., $3 per 1M input tokens, $15 per 1M output tokens]
- **High-Volume/Fast Tasks**: [e.g., Claude Haiku, GPT-4o-mini, Gemini Nano]
  - Use cases: High-throughput, low-latency, simple classification
  - Cost: [e.g., $0.25 per 1M input tokens, $1.25 per 1M output tokens]

**API Configuration**:
- API keys stored in: [e.g., environment variables, AWS Secrets Manager, 1Password]
- Rate limits: [e.g., 10,000 RPM, 2M TPM]
- Timeout settings: [e.g., 60s for standard, 120s for long-running]
- Retry policy: [e.g., exponential backoff, 3 retries]

---

## Embedding Configuration

**Embedding Model**: [e.g., OpenAI text-embedding-3-small, Voyage AI voyage-2, Cohere embed-english-v3]

**Specifications**:
- Dimensions: [e.g., 1536, 1024, 768]
- Max input tokens: [e.g., 8191 tokens]
- Cost: [e.g., $0.02 per 1M tokens]
- Latency: [e.g., p95 <200ms]

**Use Cases**:
- Document embeddings for RAG retrieval
- Semantic search
- [Other domain-specific use cases]

---

## Vector Database

**Vector Database**: [e.g., Pinecone, Weaviate, Qdrant, pgvector, Chroma, Milvus]

**Configuration**:
- Hosting: [e.g., Pinecone serverless, self-hosted on AWS, managed Weaviate Cloud]
- Index name(s): [e.g., product-docs-v1, user-conversations]
- Similarity metric: [e.g., cosine, dot product, euclidean]
- Dimensionality: [e.g., 1536 to match embedding model]
- Metadata filters: [e.g., user_id, document_type, created_at, category]

**Schema Example**:
```json
{
  "id": "doc-uuid",
  "vector": [0.1, 0.2, ...],
  "metadata": {
    "text": "Original text chunk",
    "source": "document-name.pdf",
    "page": 5,
    "chunk_index": 12,
    "created_at": "2025-01-10T12:00:00Z",
    "category": "technical-docs"
  }
}
```

**Performance**:
- Query latency: [e.g., p95 <100ms for top-10 retrieval]
- Index size: [e.g., 100K vectors, 1M vectors]
- Scaling plan: [e.g., auto-scaling enabled, manual scaling triggers at 80% capacity]

---

## AI Frameworks & Libraries

**Primary Framework**: [e.g., LangChain, LlamaIndex, Haystack, Semantic Kernel, Custom]

**Rationale**: [e.g., LangChain chosen for mature ecosystem, extensive integrations, and prompt management]

**Additional Libraries**:
- **Prompt Management**: [e.g., LangSmith, PromptLayer, git-versioned templates]
- **Evaluation**: [e.g., RAGAS, TruLens, DeepEval, Phoenix, custom metrics]
- **Observability**: [e.g., LangSmith tracing, Weights & Biases, Arize, Datadog LLM Observability]
- **Text Processing**: [e.g., tiktoken for tokenization, unstructured for document parsing]
- **Safety**: [e.g., OpenAI Moderation API, Presidio for PII detection, llm-guard]

---

## Prompt Management

**Strategy**: [e.g., Git-versioned text files, LangSmith prompt registry, PromptLayer]

**Directory Structure**:
```
prompts/
├── [feature-name]/
│   ├── v1/
│   │   ├── system.txt
│   │   ├── user.txt
│   │   ├── examples.json
│   │   └── metadata.json
│   ├── v2/
│   │   └── [same structure]
│   └── current -> v2/  # Symlink to active version
```

**Versioning Convention**:
- Major version (v1 → v2): Significant prompt structure changes
- Minor version (v1.0 → v1.1): Wording improvements, example updates
- Patch version (v1.1.0 → v1.1.1): Typo fixes, minor tweaks

**Metadata Tracking**:
- Version number
- Created date and author
- Changelog describing changes
- Evaluation results (accuracy, cost, latency)
- A/B test winner (if applicable)

---

## Evaluation & Testing

**Evaluation Metrics**:
- **RAG Systems**: Faithfulness >0.85, Answer Relevancy >0.8, Context Precision >0.75, Context Recall >0.75 (RAGAS)
- **Classification**: Accuracy >0.90, Precision >0.85, Recall >0.85, F1 >0.85
- **Summarization**: ROUGE-L >0.5, human preference score >4/5
- **Custom Domain Metrics**: [Define domain-specific metrics, e.g., medical diagnosis accuracy, financial compliance score]

**Test Datasets**:
- Location: [e.g., `evaluations/[feature-name]/dataset.jsonl`, LangSmith datasets]
- Size: [e.g., 100 examples per feature minimum, 500 for critical features]
- Format: [e.g., JSONL with `{"input": "...", "expected_output": "...", "metadata": {...}}`]
- Update frequency: [e.g., monthly, after major prompt changes]

**Evaluation Workflow**:
1. Offline evaluation on test datasets before deployment
2. A/B testing for prompt changes (20% traffic to new version)
3. Online monitoring of production metrics
4. Quarterly human evaluation for quality drift

**Tools**:
- Framework: [e.g., RAGAS, custom evaluation scripts]
- A/B Testing: [e.g., LangSmith experiments, Statsig]
- Human Evaluation: [e.g., Label Studio, Scale AI, internal tool]

---

## Cost Management

**Budget**:
- **Monthly LLM Spend**: [e.g., $500 target, $750 hard limit]
- **Per-Request Target**: [e.g., <$0.02 average]
- **Per-User Monthly Target**: [e.g., <$5 per active user]

**Cost Optimization Strategies**:
- Prompt compression: Remove redundancy, use concise language
- Model selection: Use smallest effective model (Haiku for simple tasks, Sonnet for standard, Opus for complex)
- Caching: Semantic caching for repeated queries (e.g., Redis with TTL)
- Batch processing: Non-real-time requests batched for efficiency
- Token limits: Set max_tokens appropriately (e.g., 512 for short answers, 2048 for detailed responses)

**Cost Monitoring**:
- Dashboard: [e.g., Datadog dashboard, LangSmith cost tracking, custom Grafana dashboard]
- Alerts: [e.g., Slack alert if daily spend >$50, email if monthly >$600]
- Reporting: [e.g., weekly cost report by feature, user, model]

---

## Performance Targets

**Latency**:
- **p50**: [e.g., <1s]
- **p95**: [e.g., <3s]
- **p99**: [e.g., <5s]

**Optimization Strategies**:
- Streaming responses for user-facing features
- Parallel processing for multi-step workflows
- Caching for repeated queries
- Async processing for non-real-time features

**Monitoring**:
- Tool: [e.g., Datadog, New Relic, LangSmith, Prometheus + Grafana]
- Alerts: [e.g., PagerDuty alert if p95 >5s for 5 minutes]

---

## Observability & Monitoring

**Tracing & Logging**:
- Tool: [e.g., LangSmith, Weights & Biases, Arize, Datadog APM]
- Trace every LLM call with: prompt, response, tokens, latency, cost, model, user_id
- Log level: INFO for successful calls, ERROR for failures, DEBUG for development

**Metrics to Track**:
- **Request Volume**: Total LLM calls per minute/hour/day
- **Latency**: p50, p95, p99 response times
- **Cost**: Tokens consumed, $ per request, daily/monthly spend
- **Errors**: API failures, timeouts, rate limits, retries
- **Quality**: User feedback scores (thumbs up/down), hallucination rate, safety violations

**Dashboards**:
- Real-time: [e.g., Datadog dashboard with latency, error rate, cost]
- Historical: [e.g., Weekly/monthly trends in Looker, Metabase]

**Alerts**:
- Error rate >5% for 5 minutes → PagerDuty
- p95 latency >5s for 10 minutes → Slack
- Daily cost >$50 → Slack + Email
- Hallucination rate >10% → Slack

---

## Responsible AI & Safety

**Domain Compliance Requirements**:
[Document domain-specific regulatory requirements from `.claude/agent-context/domain-knowledge.md`]

Examples:
- **Healthcare (HIPAA)**: PII redaction, PHI handling, audit logs, encryption at rest/transit
- **Finance (SOC2, PCI-DSS)**: Data retention policies, explainability, bias testing, audit trails
- **General (GDPR)**: User data rights (access, deletion), consent management, data minimization

**Safety Measures**:
1. **PII Redaction**: [e.g., Presidio for automatic PII detection and redaction before LLM calls]
2. **Content Moderation**: [e.g., OpenAI Moderation API, custom filters for domain-specific harmful content]
3. **Prompt Injection Protection**: Input sanitization, prompt guards, output validation
4. **Rate Limiting**: Per-user rate limits to prevent abuse [e.g., 100 requests/hour per user]
5. **Guardrails**: Output validation, safety classifiers, blocked topic detection

**Bias Mitigation**:
- Evaluation datasets include diverse demographic slices
- Quarterly bias testing across user segments
- Human review of outputs for fairness
- Feedback mechanism for users to report bias

**Transparency & Explainability**:
- Disclose AI usage to users (e.g., "This response was generated by AI")
- Provide citations/sources for RAG-generated content
- Document model versions, limitations, and failure modes
- Allow users to opt-out of AI features where applicable

**Human-in-the-Loop**:
- Critical decisions require human review
- User feedback loop for quality improvement
- Escalation to human support for complex or sensitive queries

---

## RAG-Specific Configuration

**Chunking Strategy**:
- Chunk size: [e.g., 512 tokens, 1024 tokens]
- Overlap: [e.g., 50 tokens, 10% overlap]
- Splitting method: [e.g., sentence-based with LangChain RecursiveCharacterTextSplitter, paragraph-based, semantic chunking]

**Retrieval Strategy**:
- Top-k: [e.g., 5 documents for standard queries, 10 for complex queries]
- Similarity threshold: [e.g., >0.7 cosine similarity]
- Hybrid search: [e.g., 70% semantic, 30% keyword (BM25)]
- Re-ranking: [e.g., Cohere Rerank, cross-encoder model]
- Metadata filters: [e.g., filter by document_type, date_range, user_permissions]

**Context Optimization**:
- Max context tokens: [e.g., 4096 tokens for GPT-4, 8192 for Claude]
- Context compression: [e.g., LLMLingua, summary-based compression]
- Prompt structure: [e.g., `Context: {context}\n\nQuestion: {query}\n\nAnswer:`]

**Document Ingestion Pipeline**:
1. Parse documents [e.g., unstructured library for PDFs, DOCX, HTML]
2. Clean and preprocess text
3. Chunk documents using configured strategy
4. Generate embeddings
5. Store in vector database with metadata
6. Index for fast retrieval

---

## Agent Systems (If Applicable)

**Agent Framework**: [e.g., LangGraph, AutoGPT, custom agent loop]

**Agent Architecture**:
- Agent type: [e.g., ReAct, Plan-and-Execute, Conversational]
- Tools available: [e.g., web search, database query, API calls, calculators]
- Memory: [e.g., conversation buffer, summary memory, vector store memory]
- Max iterations: [e.g., 5 iterations before fallback]

**Multi-Agent Setup** (if using):
- Orchestration: [e.g., supervisor agent routing to specialist agents]
- Specialist agents: [e.g., data analyst, code generator, researcher]
- Communication protocol: [e.g., message passing, shared memory]

---

## Fine-Tuning (If Applicable)

**Fine-Tuning Status**: [e.g., Not currently used, Planned for Q2, In production for [specific feature]]

**Use Case**: [e.g., Domain-specific classification, Style alignment, Response formatting]

**Approach**:
- Platform: [e.g., OpenAI Fine-tuning, Anthropic (future), LoRA/QLoRA on open-source models]
- Training data size: [e.g., 500+ examples minimum, 2000 target]
- Evaluation: Held-out test set, comparison against base model
- Cost-benefit: [e.g., Fine-tuning justified when >10K requests/month with significant quality improvement]

---

## Error Handling & Fallbacks

**Retry Logic**:
- Strategy: Exponential backoff [e.g., 1s, 2s, 4s, 8s]
- Max retries: [e.g., 3 retries]
- Retry conditions: [e.g., Rate limit errors (429), transient API errors (500, 503)]

**Fallback Strategies**:
1. **Model Fallback**: If primary model fails → try secondary model [e.g., Claude Sonnet → GPT-4o]
2. **Cached Response**: Serve cached response if query is similar to recent query
3. **Graceful Degradation**: Return partial result or helpful error message to user
4. **Human Handoff**: Escalate to human support for critical failures

**Error Communication**:
- User-facing: Friendly, non-technical error messages
- Internal logging: Detailed error context for debugging (prompt, response, trace ID)

---

## Development & Testing Environment

**Local Development**:
- LLM: [e.g., Use GPT-4o-mini for cost savings, or mock LLM client for unit tests]
- Vector DB: [e.g., Local Chroma instance, Docker Compose for Qdrant, pgvector in local Postgres]
- Evaluation: Sample datasets in `evaluations/dev/`

**Staging Environment**:
- LLM: [e.g., Same models as production, separate API keys]
- Vector DB: [e.g., Separate Pinecone index `product-docs-staging`]
- Evaluation: Full evaluation suite runs on staging before production deploy

**CI/CD Integration**:
- Pre-commit: Prompt linting, format validation
- CI pipeline: Run evaluation suite on test datasets, ensure metrics pass thresholds
- Deployment: Blue-green deployment with gradual rollout (10% → 50% → 100%)

---

## Documentation Standards

**For Each AI Feature, Document**:
1. **Purpose**: What problem does this AI feature solve?
2. **Architecture**: High-level diagram (RAG pipeline, agent loop, LLM call)
3. **Prompts**: Links to versioned prompt templates
4. **Evaluation Results**: Metrics, test dataset, baseline comparison
5. **Cost**: Estimated $ per request, monthly spend projection
6. **Limitations**: Known failure modes, edge cases, out-of-scope queries
7. **Maintenance**: Update frequency, monitoring, alert contacts

**Documentation Location**:
- Architecture: `agent_docs/architecture/ai/[feature-name].md`
- Prompts: `prompts/[feature-name]/v[X]/`
- Evaluation: `evaluations/[feature-name]/`
- Implementation: `implementations/ai/[feature-name].md`

---

## Example Projects for Reference

**Internal References**:
- [Link to similar AI feature in codebase]
- [Link to evaluation report]
- [Link to architecture diagram]

**External References**:
- LangChain RAG tutorial: https://python.langchain.com/docs/use_cases/question_answering/
- RAGAS documentation: https://docs.ragas.io/
- OpenAI best practices: https://platform.openai.com/docs/guides/prompt-engineering

---

## Key Contacts

**AI Engineering Lead**: [Name, Slack handle]
**Product Owner (AI Features)**: [Name, Slack handle]
**Data Science/ML Team**: [Team name, Slack channel]
**DevOps/Infrastructure**: [Team name for vector DB, LLM API access]

---

## Changelog

**2025-01-10**: Initial AI Context template created
- Documented LLM providers, embedding models, vector database setup
- Defined evaluation metrics and cost budgets
- Established responsible AI guidelines

[Update this section as AI configuration evolves]
