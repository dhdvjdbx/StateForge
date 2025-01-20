# Contributing to StateForge

Thank you for your interest in contributing to StateForge! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

- Check if the bug has already been reported
- Include detailed steps to reproduce
- Provide system information (Solidity version, network, etc.)
- Include relevant code snippets

### Suggesting Features

- Clearly describe the feature and its use case
- Explain why it would be beneficial
- Consider backward compatibility

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests
5. Update documentation
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/StateForge.git
cd StateForge

# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint
```

## Coding Standards

### Solidity

- Follow the official Solidity style guide
- Use NatSpec comments for all public functions
- Keep functions focused and testable
- Optimize for gas efficiency

### TypeScript

- Use TypeScript strict mode
- Follow ESLint rules
- Write descriptive variable names
- Add JSDoc comments for complex functions

### Testing

- Write tests for all new features
- Maintain or improve code coverage
- Include both positive and negative test cases
- Test edge cases

## Commit Messages

Format: `<type>: <description>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test changes
- `chore`: Build/config changes
- `refactor`: Code refactoring

Examples:
```
feat: add ZK proof validation support
fix: resolve reentrancy in transition execution
docs: update API reference for AccessRegistry
test: add integration tests for workflows
```

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the documentation
3. Add tests for new functionality
4. Ensure all tests pass
5. Update version numbers if applicable
6. The PR will be merged once approved by maintainers

## Testing Guidelines

- Unit tests for individual contracts
- Integration tests for contract interactions
- Gas usage benchmarks for critical functions
- Test on local hardhat network before testnets

## Documentation

- Keep documentation up-to-date
- Include code examples
- Document breaking changes
- Update API reference

## Questions?

Feel free to open an issue for questions or discussions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

