# 📜 COMPLIANCE.md
## EduChain Academy | Utility-First Web3 Education Platform

> ⚠️ **LEGAL DISCLAIMER**: This document outlines the compliance framework, technical safeguards, and regulatory alignment strategy for EduChain Academy. It is **not legal advice**. All token distribution, marketing, and user onboarding flows must be reviewed by qualified securities, AML, and data privacy counsel in your target jurisdictions before deployment.

---

## 🎯 1. COMPLIANCE PHILOSOPHY
EduChain Academy is designed as a **utility-driven educational platform**, not a financial instrument or investment vehicle. All token mechanics, reward systems, and governance features are engineered to:
- ✅ Provide verifiable access to courses, simulations, and NFT credentials
- ✅ Avoid characteristics of securities, commodities, or payment instruments
- ✅ Prioritize learner outcomes, skill acquisition, and regulatory transparency
- ✅ Operate within established frameworks (EU MiCA, U.S. SEC guidance, Singapore MAS, Swiss FINMA)

---

## 🔍 2. TOKEN CLASSIFICATION & HOWEY TEST ANALYSIS
The **EDU token** is explicitly structured as a **non-security utility token**. Below is our internal Howey Test assessment:

| Howey Element | Implementation & Safeguard |
|---------------|----------------------------|
| **Investment of Money** | Users earn EDU via learning milestones, not capital contribution. Fiat purchases (if enabled) route through licensed third-party on-ramps; platform takes no custody. |
| **Common Enterprise** | Platform operates as a public utility. No profit-pooling, revenue-sharing, or pooled investment structure exists. |
| **Expectation of Profits** | All marketing, UI copy, and documentation emphasize skill acquisition, credentialing, and platform access. Zero price speculation, ROI claims, or market cap references. |
| **Efforts of Others** | Token utility and distribution are algorithmically governed by smart contracts and user activity. No centralized team manipulates supply, price, or reward eligibility. |

**Token Utility Matrix:**
- 🎓 Course & simulation access
- 🏅 Soulbound NFT certificate minting
- 🗳️ Governance voting (curriculum, feature prioritization)
- 🔗 Partner ecosystem discounts (fintech, real estate tools)
- 🔄 Revenue-backed deflationary burns (30% of platform fees)

---

## 🌍 3. REGULATORY FRAMEWORK ALIGNMENT
| Jurisdiction | Compliance Approach |
|--------------|---------------------|
| **European Union (MiCA)** | Utility token exemption applies if functional at issuance. White paper notifier process followed for public offers >€1M. 14-day withdrawal right for retail users. EMT/ART rules not triggered (no stablecoin features). |
| **United States (SEC)** | Structured to avoid investment contract classification. No public fundraising. Rewards gated by KYC + activity verification. Marketing avoids "investment," "yield," or "appreciation" language. State money transmitter laws addressed via third-party fiat partners. |
| **Singapore (MAS)** | Utility/governance tokens exempt from DPT licensing if no exchange/custody services offered. Strict AML/CFT integration. Geo-blocked from jurisdictions restricting retail crypto access. |
| **Switzerland (FINMA)** | Self-classification as payment/utility token. No securities classification under FINMA ICO guidelines. Swiss entity preferred for regulatory engagement. |

> 📌 *Jurisdiction-specific adaptations require formal legal opinion. This document serves as a technical & operational baseline.*

---

## 🚫 4. GEO-FENCING & ACCESS CONTROLS
Platform access and token rewards are restricted in jurisdictions where utility token distribution conflicts with local securities, consumer protection, or AML laws.

**Technical Implementation:**
- 🌐 IP + ASN filtering via Next.js middleware + Alchemy Supernode routing
-  Wallet chain detection restricts interactions from sanctioned/restricted networks
- 📜 User-facing disclaimer on first login: *"EduChain Academy is not available in restricted jurisdictions. Access may be denied based on location or regulatory status."*
-  Dynamic allowlist/blocklist updated quarterly via compliance dashboard

**Commonly Restricted Regions (Subject to Legal Review):**
- 🇺🇸 United States (if operating without registered exemption)
- 🇨🇳 Mainland China
- 🇮🇳 India (subject to RBI/FEMA guidelines)
- 🇷🇺 Russia, 🇾 Belarus, 🇵 North Korea, 🇸🇾 Syria, 🇮🇷 Iran, 🇨🇺 Cuba
- *Full list maintained in `compliance/restricted-jurisdictions.json` (private repo)*

---

##  5. KYC/AML & DATA PRIVACY
All users receiving EDU tokens or minting NFT credentials must complete identity verification.

**KYC/AML Flow:**
-  Provider: SumSub / Onfido / Alloy (jurisdiction-dependent)
- ✅ Verification tiers: Basic (email + phone) → Enhanced (ID + selfie) for reward eligibility
-  Anti-sybil: Device fingerprinting, wallet clustering analysis, daily reward caps (max 50 EDU/day)
- 📉 Data minimization: KYC results stored off-chain; only `kyc_status: verified` flag passed to smart contracts via Alchemy Account Abstraction relayer

**Privacy Compliance:**
- 🇺 GDPR: Right to access, rectification, erasure, and data portability. DPO contact available.
- 🇸 CCPA/CPRA: Opt-out of data sale/sharing. Privacy policy published at `/legal/privacy`
-  Non-custodial: Platform never stores private keys. Alchemy AA wallets use MPC or social recovery. User data encrypted at rest & in transit.

---

## 🛡️ 6. SMART CONTRACT & INFRASTRUCTURE SECURITY
| Control | Implementation |
|---------|----------------|
| **Code Standards** | Solidity 0.8.20+, Foundry testing, Slither/Mythril static analysis, compliance-lint.js for non-utility language |
| **Audits** | Pre-mainnet audits by 2 independent firms (e.g., OpenZeppelin, CertiK). Reports published in `/audits` |
| **Bug Bounty** | Immunefi program pre-launch. Critical vulnerabilities rewarded up to $50k |
| **Upgradeability** | Timelock-controlled proxy pattern. Governance voting required post-decentralization threshold |
| **Monitoring** | Alchemy Monitor + custom webhooks log all mints, transfers, burns. Exportable CSV for regulatory requests |
| **Fail-Safes** | Pause mechanism for reward distribution, daily cap enforcement, KYC-gated mint functions |

---

## 📢 7. MARKETING & COMMUNICATIONS STANDARDS
All public-facing content must adhere to utility-first messaging:

✅ **Allowed Language:**
- "Earn EDU tokens by completing courses"
- "Unlock advanced simulations with EDU"
- "Govern curriculum updates via token voting"
- "Verify your skills with on-chain NFT certificates"

❌ **Prohibited Language:**
- "Invest in EDU for future returns"
- "High yield / passive income / ROI"
- "Token price will appreciate as adoption grows"
- "Buy EDU to profit from platform growth"

**Review Process:**
- All marketing assets pass through `compliance-lint.js` before publication
- Social media, Discord, Telegram, and email campaigns archived for 7 years
- Influencer/partner agreements include compliance addendums prohibiting price speculation

---

## 🏛️ 8. GOVERNANCE & DECENTRALIZATION ROADMAP
Governance is phased to ensure utility alignment before community control:

| Phase | Timeline | Governance Scope |
|-------|----------|------------------|
| **1. Platform-Led** | Months 1-6 | Core team proposes curriculum, feature updates, burn parameters |
| **2. Token-Gated Voting** | Months 7-12 | EDU stakers vote on course additions, partner integrations, UI improvements |
| **3. Decentralized DAO** | Month 13+ | Multi-sig treasury, community-elected stewards, transparent proposal lifecycle |

**Safeguards:**
- No financial treasury management rights until legal framework permits
- Voting power capped per address to prevent whale dominance
- All proposals published publicly with impact assessments

---

##  9. TRANSPARENCY & REPORTING
- 📈 Public dashboard: Active learners, EDU utility spend vs. trade volume, burn metrics, audit status
-  Quarterly transparency report: User growth, compliance actions, geo-block updates, security incidents
-  Regulatory cooperation: Ready to provide Alchemy Monitor logs, KYC verification hashes, and smart contract source code upon lawful request
-  Open-source: All non-sensitive code, contracts, and curriculum published under MIT/CC BY-SA 4.0

---

## 📬 10. LEGAL CONTACT & VERSIONING
**Compliance Inquiries:** `compliance@educhain.academy`  
**Legal Counsel:** `[Insert Law Firm Name & Jurisdiction]`  
**Data Protection Officer:** `dpo@educhain.academy`  
**Bug & Vulnerability Reports:** `security@educhain.academy` or Immunefi listing

### 📝 Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-24 | Initial compliance framework aligned with Alchemy stack, utility token design, and multi-jurisdictional safeguards |
| | | |

---

> ✅ **Implementation Checklist**  
> - [ ] Jurisdiction-specific legal opinion obtained & attached  
> - [ ] `restricted-jurisdictions.json` configured in private repo  
> - [ ] KYC provider contract signed & webhook tested  
> - [ ] `compliance-lint.js` integrated into CI/CD  
> - [ ] Alchemy Monitor + Notify audit trails verified  
> - [ ] Marketing guidelines distributed to all team/partners  

*This document is a living framework. Update quarterly or upon regulatory changes. Always prioritize learner safety, platform utility, and legal clarity over growth metrics.* 🌍🔐
