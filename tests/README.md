# AAVE Test Suite

## Test Structure

```
tests/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests between components
├── e2e/            # End-to-end tests
└── performance/    # Performance and load tests
```

## Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Plugin tests
cd apps/premiere-plugin
npm test
cd ../after-effects-plugin
npm test

# All tests
npm test
```

## Test Categories

### Unit Tests
- Command registry validation
- EDL schema validation
- Companion service message handling
- Plugin SDK functionality

### Integration Tests
- Backend API endpoints
- WebSocket communication
- Database migrations
- Plugin-to-companion communication

### E2E Tests (requires Adobe software)
- Premiere Pro plugin loading
- After Effects plugin loading
- Full autonomous editing pipeline
- Render output validation

## Test Data

Use synthetic footage and legally usable test assets only.
Do not use copyrighted material for testing.
