# Contributing to EduChain Academy

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- Node.js >= 18
- npm or yarn
- Git
- A wallet (MetaMask, Rainbow, etc.) for testing

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/educhainacademy.git
   cd educhainacademy
   ```
3. Install dependencies:
   ```bash
   npm install
   cd webapp && npm install && cd ..
   ```
4. Copy `.env.example` to `.env` and fill in your keys
5. Run tests:
   ```bash
   npm test
   ```

## Development Workflow

### Smart Contracts

- Contracts are in `contracts/` using Solidity 0.8.24
- Tests are in `test/` using Hardhat + Mocha + Chai
- Run `npm test` before submitting
- All contracts must have 100% function coverage

### Webapp

- Next.js 16 + React 19 + Tailwind CSS 4
- Run `cd webapp && npm run dev` for local development
- Run `npm run build` to verify production build

### Code Style

- Follow existing patterns in the codebase
- Use TypeScript for all webapp code
- Solidity contracts use OpenZeppelin libraries
- No comments unless requested

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with tests
3. Ensure all tests pass: `npm test`
4. Ensure webapp builds: `cd webapp && npm run build`
5. Submit a PR with a clear description

## KYC Requirement

All contributors must complete KYC verification to be eligible for EDU token rewards. See [COMPLIANCE.md](COMPLIANCE.md) for details.

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Questions?

Open a GitHub issue or reach out on our Discord.
