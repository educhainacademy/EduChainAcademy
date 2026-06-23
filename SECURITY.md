# 🔒 SECURITY.md
## EduChain Academy | Responsible Disclosure & Vulnerability Management

> ️ **IMPORTANT**: This document outlines our security policy, reporting procedures, and safe harbor guidelines. **Do not test against mainnet contracts or production user data.** All security research must comply with this policy and applicable laws.

---

## 📋 1. SECURITY POLICY OVERVIEW
EduChain Academy prioritizes the security of our learners, platform infrastructure, and utility token ecosystem. We maintain a **defense-in-depth** approach combining:
- 🔐 Non-custodial wallet architecture (Alchemy Account Abstraction)
- 📜 KYC-gated reward distribution with anti-sybil controls
- ️ Formally verified smart contracts + continuous monitoring
- 🌐 Alchemy Monitor, Notify, and Growth audit trails
-  Transparent, good-faith collaboration with the security community

We welcome ethical hackers, auditors, and researchers to help us identify and remediate vulnerabilities responsibly.

---

##  2. SUPPORTED VERSIONS & ENVIRONMENTS
| Environment | Status | Support Window |
|-------------|--------|----------------|
| **Mainnet Contracts** | ✅ In Scope | Actively monitored & patchable |
| **Testnet (Base Sepolia)** | ✅ In Scope | Bug bounty eligible |
| **Frontend (Next.js v14+)** | ✅ In Scope | Latest stable release |
| **Backend/Reward Engine** | ✅ In Scope | Active branch + production |
| **Legacy/Deprecated Code** | ❌ Out of Scope | Archived, no security support |

> Only vulnerabilities affecting **currently deployed mainnet/testnet code** or **active infrastructure** are eligible for rewards or formal acknowledgment.

---

## 📩 3. HOW TO REPORT A VULNERABILITY
Please submit reports via **one** of the following channels:

| Method | Contact |
|--------|---------|
| **Email** | `security@educhain.academy` (PGP preferred) |
| **Bug Bounty Platform** | [Immunefi Program Link](https://immunefi.com) |
| **Encrypted Comms** | PGP Key: [link-to-key] or Signal: [handle] |

**Include in your report:**
1. Vulnerability type & severity (CVSS 3.1+ if applicable)
2. Step-by-step reproduction instructions
3. Proof of Concept (code, screenshots, transaction hashes)
4. Impact assessment (user data, token logic, platform availability)
5. Your contact details & preferred disclosure timeline

**DO NOT:**
- ❌ Exploit mainnet contracts or access production user/KYC data
- ❌ Publicly disclose vulnerabilities before coordinated fix
- ❌ Perform DoS, spam, or social engineering attacks
- ❌ Modify, delete, or exfiltrate data beyond PoC requirements

---

## ⏱️ 4. RESPONSE TIMELINE & SLA
| Severity | Acknowledgment | Triage | Fix/Patch | Public Disclosure |
|----------|----------------|--------|-----------|-------------------|
| **Critical** | ≤ 24 hours | ≤ 48 hours | ≤ 7 days | Coordinated after patch |
| **High** | ≤ 48 hours | ≤ 5 days | ≤ 14 days | Coordinated after patch |
| **Medium** | ≤ 72 hours | ≤ 10 days | ≤ 30 days | Researcher may disclose |
| **Low/Info** | ≤ 5 days | ≤ 14 days | ≤ 60 days | Researcher may disclose |

We will provide regular status updates and work with you on coordinated disclosure. If a fix is delayed, we will transparently communicate mitigations and timelines.

---

## 🏆 5. BUG BOUNTY PROGRAM
EduChain Academy runs a structured bounty program via **Immunefi** to incentivize high-quality security research.

**Reward Tiers (USD):**
| Severity | Smart Contract | Backend/API | Frontend/Infra |
|----------|----------------|-------------|----------------|
| Critical | $5,000 – $50,000 | $2,000 – $15,000 | $1,000 – $5,000 |
| High | $2,000 – $10,000 | $1,000 – $5,000 | $500 – $2,000 |
| Medium | $500 – $2,000 | $250 – $1,000 | $200 – $750 |
| Low | $100 – $500 | $100 – $300 | $100 – $250 |

**Payout Notes:**
- Rewards paid in USD equivalent (stablecoin or fiat via licensed partner)
- Bounties require reproducible PoC & adherence to this policy
- Duplicate reports: first valid submission receives full bounty
- Business logic disputes, compliance interpretations, or UI/UX issues are **not** eligible

---

## 🔍 6. SCOPE BOUNDARIES

### ✅ IN-SCOPE
- Smart contract vulnerabilities (reentrancy, overflow, access control, governance bypass)
- Reward distribution & anti-sybil/KYC gating flaws
- Alchemy Account Abstraction wallet flows & gasless transaction logic
- Next.js frontend auth, session management, or SSRF/XSS vectors
- Backend API endpoints, webhook handlers, or Alchemy Notify integrations
- CI/CD pipeline misconfigurations, secret leakage, or dependency vulnerabilities
- NFT metadata manipulation or soulbound transfer bypasses

###  OUT-OF-SCOPE
- Social engineering, phishing, or physical security attacks
- Third-party services (SumSub/Onfido KYC, Alchemy RPC infrastructure, wallet providers)
- Spam, rate-limiting bypasses, or DoS against public endpoints
- UI/UX complaints, typos, or non-security feature requests
- Compliance/legal disagreements or token economics design debates
- Vulnerabilities in archived, deprecated, or test-only branches

---

## 🛠️ 7. SECURITY BEST PRACTICES FOR CONTRIBUTORS
All pull requests must adhere to:
-  **Zero Secrets in Repo**: Use GitHub Actions Secrets, `.env.example`, or external vaults
- 📝 **Signed Commits**: GPG verification required for `contracts/` and `lib/` directories
-  **Test Coverage**: ≥90% Foundry/Next.js test coverage for new features
- 🤖 **Compliance Linting**: `scripts/compliance-lint.js` must pass (blocks financial/speculation language)
- 🔍 **Dependabot Enabled**: Auto-PRs for vulnerable dependencies; require review before merge
- 🌐 **Least Privilege Alchemy Keys**: Separate keys for `notify`, `growth`, `supernode`, and `aa-relayer`
- 📜 **Audit Trail Ready**: All reward mints/transfers must log to Alchemy Monitor with exportable metadata

---

## ⚖️ 8. LEGAL SAFE HARBOR & COORDINATED DISCLOSURE
EduChain Academy commits to:
- ️ **No Legal Action** against researchers who follow this policy in good faith
- 📉 **Data Handling**: Any accidentally accessed user/KYC data must be immediately reported, isolated, and securely deleted
- 🤝 **Coordinated Disclosure**: We will acknowledge your contribution in release notes (unless anonymity requested)
- 🌍 **Regulatory Cooperation**: All reports may be shared with legal counsel or regulators if required by law, with researcher anonymization where possible

*This safe harbor applies only to research conducted in accordance with this policy and applicable laws.*

---

## 📬 9. CONTACT & ACKNOWLEDGMENTS
**Security Team:** `security@educhain.academy`  
**PGP Fingerprint:** `[INSERT FINGERPRINT]`  
**Immunefi Program:** `[LINK]`  
**Status Page:** `status.educhain.academy`  

We gratefully acknowledge researchers who have helped secure our platform. Public hall of fame maintained in `docs/security/hall-of-fame.md`.

---

### 📝 VERSION HISTORY
| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-24 | Initial security policy aligned with Alchemy stack, utility token safeguards, and Immunefi bounty structure |
| | | |

---

> ✅ **Implementation Checklist**  
> - [ ] PGP key generated & published  
> - [ ] Immunefi program configured with scope & reward tiers  
> - [ ] GitHub Secret Scanning + Dependabot enabled  
> - [ ] `compliance-lint.js` integrated into PR checks  
> - [ ] Alchemy Monitor alerting configured for anomalous reward mints  
> - [ ] Incident response runbook stored in `docs/security/incident-response.md`  

*Security is a continuous practice. Report responsibly. Build securely. Learn openly.* 🔐🌍
