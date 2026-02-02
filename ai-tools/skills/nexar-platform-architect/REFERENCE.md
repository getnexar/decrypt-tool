# Nexar Platform Architect Reference

Detailed architecture patterns, decision trees, and best practices.

---

## Authentication Deep Dive

### IAP Headers Reference

| Header | Value Format | Description |
|--------|--------------|-------------|
| `X-Goog-Authenticated-User-Email` | `accounts.google.com:user@getnexar.com` | User's email |
| `X-Goog-Authenticated-User-Id` | `accounts.google.com:123456789` | User's unique ID |
| `X-Goog-IAP-JWT-Assertion` | `eyJhbGciOiJSUzI1...` | Signed JWT token |

### Parsing User Identity

**Python (FastAPI)**:
```python
from fastapi import Request

def get_current_user(request: Request) -> dict:
    email_header = request.headers.get("X-Goog-Authenticated-User-Email", "")
    id_header = request.headers.get("X-Goog-Authenticated-User-Id", "")

    email = email_header.replace("accounts.google.com:", "") if email_header else None
    user_id = id_header.replace("accounts.google.com:", "") if id_header else None

    return {"email": email, "user_id": user_id}
```

**Node.js (Express)**:
```javascript
function getCurrentUser(req) {
    const emailHeader = req.headers['x-goog-authenticated-user-email'] || '';
    const idHeader = req.headers['x-goog-authenticated-user-id'] || '';

    return {
        email: emailHeader.replace('accounts.google.com:', ''),
        userId: idHeader.replace('accounts.google.com:', '')
    };
}
```

**Go**:
```go
func getCurrentUser(r *http.Request) (string, string) {
    emailHeader := r.Header.Get("X-Goog-Authenticated-User-Email")
    idHeader := r.Header.Get("X-Goog-Authenticated-User-Id")

    email := strings.TrimPrefix(emailHeader, "accounts.google.com:")
    userID := strings.TrimPrefix(idHeader, "accounts.google.com:")

    return email, userID
}
```

### JWT Validation (Optional)

For sensitive operations, validate the JWT:

```python
from google.auth import jwt
from google.auth.transport import requests

def validate_iap_jwt(iap_jwt: str, expected_audience: str) -> dict:
    """Validate IAP JWT and return claims."""
    return jwt.decode(iap_jwt, request=requests.Request(), audience=expected_audience)
```

---

## Public API Configuration

### Enabling Public API

```bash
# Enable public API endpoint
nexar public-api enable

# Your app now accessible at:
# https://my-app.api.corp.nexars.ai
```

### API Key Management

```bash
# Create API key
nexar api-keys create my-key --description "Mobile app"

# List keys
nexar api-keys list

# Revoke key
nexar api-keys revoke <key-id>
```

### Handling API Key Requests

Public API requests include:

| Header | Description |
|--------|-------------|
| `X-Nexar-API-Key-ID` | The ID of the API key used |
| `Authorization` | `Bearer <api-key>` |

```python
def get_api_key_id(request: Request) -> str:
    return request.headers.get("X-Nexar-API-Key-ID")
```

---

## Resource Sizing Guide

### Memory Guidelines

| App Type | Recommended | Notes |
|----------|-------------|-------|
| Static site | 256Mi | Minimal processing |
| Simple API | 512Mi | Basic CRUD operations |
| Standard app | 1Gi | Most applications |
| Data processing | 2Gi | Heavy computation |
| AI inference (CPU) | 4Gi | LLM without GPU |
| AI inference (GPU) | 16Gi | **Minimum for GPU** |
| Large models | 32Gi | Very large models |

### CPU Guidelines

| App Type | Recommended | Notes |
|----------|-------------|-------|
| Low traffic | 1 | < 100 req/min |
| Medium traffic | 2 | 100-500 req/min |
| High traffic | 4 | 500+ req/min |
| GPU workloads | 4 | **Minimum for GPU** |
| Compute-intensive | 8 | Heavy computation |

### Scaling Configuration

```yaml
resources:
  memory: 1Gi
  cpu: 2
  scaling:
    min_instances: 1    # Keep warm (reduces cold starts)
    max_instances: 10   # Limit cost
```

---

## Database Selection Guide

### Cloud SQL (PostgreSQL)

**Best for**:
- Relational data with complex queries
- Transactions and ACID compliance
- Existing PostgreSQL schemas
- Join-heavy workloads

**Configuration**:
```yaml
capabilities:
  - cloud-sql
```

**Connection**:
```python
from google.cloud.sql.connector import Connector

connector = Connector()
conn = connector.connect(
    instance_connection_name,  # from env
    "pg8000",
    user=user,
    password=password,
    db=db
)
```

### Firestore

**Best for**:
- Document/NoSQL data
- Real-time updates
- Simple CRUD operations
- Hierarchical data

**Configuration**:
```yaml
capabilities:
  - firestore
```

**Connection**:
```python
from google.cloud import firestore

db = firestore.Client()
doc_ref = db.collection("users").document("user123")
```

### BigQuery

**Best for**:
- Analytics and reporting
- Large-scale data processing
- Read-heavy workloads
- Data warehouse queries

**Configuration**:
```yaml
capabilities:
  - bigquery
```

---

## Migration Guides

### From Heroku

1. **Procfile → Dockerfile or buildpack**
   - Nexar auto-detects `Procfile` for Python/Node
   - Or use custom `Dockerfile`

2. **Config Vars → Secrets**
   ```bash
   # Heroku
   heroku config:set API_KEY=xxx

   # Nexar
   nexar secrets create API_KEY
   nexar secrets set API_KEY
   ```

3. **Add-ons → Capabilities**

   | Heroku Add-on | Nexar Capability |
   |---------------|------------------|
   | Heroku Postgres | cloud-sql |
   | Redis | (coming soon) |
   | Cloudinary | cloud-storage |

4. **Domain**
   - `my-app.herokuapp.com` → `my-app.corp.nexars.ai`

### From AWS (ECS/Lambda)

1. **ECR → Container Registry**
   - Nexar builds from source
   - Or use `Dockerfile`

2. **IAM Roles → Capabilities**
   - Capabilities auto-grant IAM roles

3. **Secrets Manager → Secret Manager**
   ```bash
   nexar secrets create DB_PASSWORD
   nexar secrets set DB_PASSWORD
   ```

4. **ALB → Global Load Balancer**
   - Automatic with IAP

### From GCP (Cloud Run direct)

1. **Already on Cloud Run? Easy migration!**

2. **Add nexar.yaml**:
   ```yaml
   app_id: my-existing-app
   capabilities:
     - <your-capabilities>
   ```

3. **Deploy via Nexar**:
   ```bash
   nexar deploy
   ```

4. **Benefits gained**:
   - Automatic IAP authentication
   - Global load balancing
   - Capability management
   - Simplified secrets

---

## Troubleshooting Decision Tree

```
Problem: App not starting?
├─ Check: nexar logs --severity ERROR
├─ Common: PORT not set → Use os.environ.get("PORT", 8080)
├─ Common: Missing dependency → Check requirements.txt/package.json
└─ Common: Dockerfile error → Validate Dockerfile syntax

Problem: Permission denied on GCP service?
├─ Check: nexar caps
├─ Solution: nexar caps add <capability>
└─ Wait: IAM propagation takes 60-90 seconds

Problem: Can't connect to database?
├─ Check: Is cloud-sql capability enabled?
├─ Check: Are secrets configured?
├─ Check: Connection string format
└─ Check: nexar logs for connection errors

Problem: Auth not working?
├─ Check: Are you on *.corp.nexars.ai domain?
├─ Check: X-Goog-Authenticated-User-Email header present?
├─ Check: User is @getnexar.com?
└─ For API: Check X-Nexar-API-Key-ID header

Problem: Slow cold starts?
├─ Solution: Set min_instances: 1 in resources
├─ Solution: Reduce container size
└─ Solution: Optimize startup code
```

---

## Cost Optimization

### Best Practices

1. **Right-size resources** - Don't over-provision
2. **Use min_instances: 0** for dev apps
3. **Enable auto-scaling** with appropriate max
4. **Use Cloud SQL shared instance** for small apps
5. **Clean up unused apps** - `nexar delete`

### Cost Estimation

```bash
nexar cost-estimate
```

Shows estimated monthly cost based on:
- CPU/Memory configuration
- Minimum instances
- Enabled capabilities

---

## Security Best Practices

1. **Never hardcode secrets** - Use `nexar secrets`
2. **Validate IAP JWT** for sensitive operations
3. **Use principle of least privilege** - Only enable needed capabilities
4. **Review API keys regularly** - Rotate and revoke unused
5. **Enable Secret Scanning** - Automatic in Nexar Platform
6. **Use HTTPS only** - Automatic with Global LB

---

## Vertex AI Integration

### Basic Usage

```python
import vertexai
from vertexai.generative_models import GenerativeModel

# Initialize (project auto-detected from environment)
vertexai.init()

# Use Gemini
model = GenerativeModel("gemini-1.5-pro")
response = model.generate_content("Hello, world!")
print(response.text)
```

### Streaming Responses

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

@app.post("/chat")
async def chat(message: str):
    model = GenerativeModel("gemini-1.5-flash")

    async def generate():
        response = model.generate_content(message, stream=True)
        for chunk in response:
            yield chunk.text

    return StreamingResponse(generate(), media_type="text/plain")
```

### With GPU

For custom models or heavy inference:

```yaml
app_id: my-llm-app
capabilities:
  - vertex-ai
resources:
  memory: 16Gi
  cpu: 4
  gpu: nvidia-l4
```

---

## Cloud Storage Integration

### Basic Usage

```python
from google.cloud import storage

# Client auto-authenticated via capability
client = storage.Client()

# Your dedicated bucket: <app_id>-storage
bucket = client.bucket("my-app-storage")

# Upload
blob = bucket.blob("path/to/file.txt")
blob.upload_from_string("Hello, world!")

# Download
content = blob.download_as_text()
```

### With Signed URLs

```python
from datetime import timedelta

# Generate signed URL for client upload
url = blob.generate_signed_url(
    version="v4",
    expiration=timedelta(minutes=15),
    method="PUT"
)
```

---

## Common Patterns

### Health Check Endpoint

```python
@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### Graceful Shutdown

```python
import signal
import sys

def handle_shutdown(signum, frame):
    # Clean up connections, finish pending work
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_shutdown)
```

### Environment-Based Logging

```python
import os
import logging

log_level = os.environ.get("LOG_LEVEL", "INFO")
logging.basicConfig(level=getattr(logging, log_level))
```
