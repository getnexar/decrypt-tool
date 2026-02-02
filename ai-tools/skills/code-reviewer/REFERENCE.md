# Code Review Reference

## Detailed Review Checklist

### Code Quality (Comprehensive)
- [ ] Code is readable and well-structured
- [ ] Variable and function names are descriptive
- [ ] Code follows DRY principle (Don't Repeat Yourself)
- [ ] Complex logic is documented with comments
- [ ] No commented-out code or debug statements
- [ ] Code follows team style guide
- [ ] Appropriate design patterns used
- [ ] Functions/methods have single responsibility
- [ ] Classes have clear purpose and scope

### Functionality
- [ ] Code accomplishes stated requirements
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] No hardcoded values (use configuration)
- [ ] Logging is appropriate (not too verbose, not too quiet)
- [ ] Return values are appropriate
- [ ] Null/undefined handled properly

### Security (Comprehensive)
- [ ] No SQL injection vulnerabilities
- [ ] No XSS (Cross-Site Scripting) vulnerabilities
- [ ] Authentication/authorization properly implemented
- [ ] Sensitive data is encrypted
- [ ] No secrets (API keys, passwords) in code
- [ ] Input validation present
- [ ] Output encoding present
- [ ] CSRF protection (if applicable)
- [ ] Rate limiting (if applicable)
- [ ] Session management secure

### Performance (Comprehensive)
- [ ] No N+1 query problems
- [ ] Database queries are optimized
- [ ] Appropriate caching implemented
- [ ] No memory leaks
- [ ] Efficient algorithms used
- [ ] Large datasets handled properly
- [ ] Pagination implemented (if applicable)
- [ ] Lazy loading where appropriate
- [ ] Resource cleanup (connections, file handles)

### Testing (Comprehensive)
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated (if applicable)
- [ ] Test coverage meets minimum threshold (>80%)
- [ ] Tests cover happy path and edge cases
- [ ] Tests are readable and maintainable
- [ ] Mock/stub dependencies appropriately
- [ ] Tests are independent
- [ ] Test data is meaningful

### Documentation (Comprehensive)
- [ ] Code is self-documenting where possible
- [ ] Complex logic has explanatory comments
- [ ] Public APIs are documented
- [ ] README updated (if applicable)
- [ ] CHANGELOG updated (if applicable)
- [ ] Architecture docs updated (if applicable)
- [ ] JSDoc/docstrings present (if required)

### Dependencies
- [ ] New dependencies are justified
- [ ] Dependencies are up to date
- [ ] Security vulnerabilities checked
- [ ] License compatibility verified
- [ ] Bundle size impact considered (frontend)

### Database (if applicable)
- [ ] Migrations are reversible
- [ ] Indexes added where appropriate
- [ ] Foreign keys defined
- [ ] Data integrity constraints present
- [ ] Migration tested on copy of production data

### Frontend (if applicable)
- [ ] Responsive design works on mobile
- [ ] Cross-browser compatibility checked
- [ ] Accessibility standards met (WCAG 2.1)
- [ ] No console errors
- [ ] Loading states implemented
- [ ] Error states handled gracefully
- [ ] Forms validated properly

### Backend (if applicable)
- [ ] API follows RESTful conventions
- [ ] API versioning considered
- [ ] Rate limiting implemented (if applicable)
- [ ] API documentation updated
- [ ] Proper HTTP status codes used
- [ ] Idempotency considered (for POST/PUT/DELETE)

## Issue Severity Guidelines

### Critical Issues (Must Fix Before Merge)
**Examples:**
- SQL injection vulnerability: Unparameterized queries
- XSS vulnerability: Unescaped user input in HTML
- Authentication bypass
- Data loss risk
- Memory leak in critical path
- Breaking API changes without versioning
- Test failures
- Performance regression >20%

### Important Issues (Should Fix)
**Examples:**
- Missing error handling for network calls
- Incomplete input validation
- Missing tests for new functionality
- N+1 query problem
- Poor variable naming
- Missing documentation for complex logic
- Code duplication

### Suggestions (Nice to Have)
**Examples:**
- Minor style inconsistencies
- Potential refactoring opportunities
- Performance micro-optimizations
- Additional test coverage for edge cases
- Documentation improvements
