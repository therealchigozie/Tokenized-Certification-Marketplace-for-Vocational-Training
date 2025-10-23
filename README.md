# 📜 Tokenized Certification Marketplace for Vocational Training

Welcome to a revolutionary platform that transforms vocational training certifications into verifiable, tokenized assets on the blockchain! This Web3 project addresses real-world problems like fraudulent credentials, lack of transparency in training quality, and misaligned incentives for training providers. By using the Stacks blockchain and Clarity smart contracts, we create a marketplace where certifications are issued as NFTs, employability outcomes are verified on-chain, and issuers are rewarded with tokens based on the success of their graduates in securing jobs.

## ✨ Features

🔑 Issue tokenized certifications as NFTs for vocational skills  
📈 Verify employability outcomes through on-chain oracles and proofs  
💰 Reward training issuers with tokens for high graduate employment rates  
🛒 Marketplace for discovering and enrolling in certified training programs  
🔍 Immutable audit trail for certification validity and performance metrics  
🏆 Staking mechanism for issuers to build reputation  
⚖️ Dispute resolution for verification challenges  
📊 Analytics dashboard for tracking issuer success rates  

## 🛠 How It Works

**For Training Issuers**  
- Register as an issuer and stake tokens to build credibility.  
- Create and list vocational training programs on the marketplace.  
- Issue NFT certifications to graduates upon completion.  
- Submit or wait for employability verifications (e.g., job placements) via oracles or employer attestations.  
- Earn reward tokens proportional to verified employment outcomes (e.g., 80%+ employability rate unlocks bonuses).  

**For Learners**  
- Browse the marketplace for vocational programs.  
- Enroll and pay via escrow for secure transactions.  
- Receive an NFT certification upon passing, which is soulbound (non-transferable) for authenticity.  
- Submit employment proofs to verify outcomes and help reward your issuer.  

**For Employers/Verifiers**  
- Query certification details to confirm validity instantly.  
- Attest to a graduate's employment via the oracle contract for on-chain verification.  
- View issuer performance metrics to choose high-quality training partners.  

**Reward Mechanism**  
Employability is tracked over time (e.g., 6-12 months post-certification). High-performing issuers receive tokens from a community reward pool, incentivizing quality training. Disputes over verifications are handled through governance voting.

## 🔗 Smart Contracts Overview

This project is built with 8 Clarity smart contracts on the Stacks blockchain, ensuring security and Bitcoin finality. Here's a high-level overview of each:

1. **IssuerRegistry.clar**  
   Registers training issuers, manages staking for reputation, and tracks performance metrics like employability scores.

2. **CertificationNFT.clar**  
   Handles minting, burning, and querying of soulbound NFTs representing vocational certifications. Includes metadata for skills, issuance date, and issuer details.

3. **Marketplace.clar**  
   Enables listing of training programs, enrollment, and discovery. Supports searching by skill, issuer rating, or price.

4. **EscrowPayment.clar**  
   Manages secure payments for enrollments, holding funds in escrow until certification issuance or refunds.

5. **VerificationOracle.clar**  
   Allows submission of employability proofs (e.g., hashed employment contracts) and aggregates verifications from employers or third-party oracles.

6. **RewardToken.clar**  
   An SIP-10 fungible token contract for issuing rewards to high-performing issuers based on verified outcomes.

7. **RewardPool.clar**  
   Distributes rewards from a pooled fund, calculating bonuses based on employability thresholds (e.g., quadratic formula for fairness).

8. **Governance.clar**  
   Facilitates community voting for disputes, parameter updates (e.g., reward thresholds), and protocol upgrades.

## 🚀 Getting Started

1. Set up a Stacks wallet and acquire STX tokens.  
2. Deploy the contracts using the Clarinet toolkit.  
3. Interact via the Stacks explorer or build a frontend dApp for user-friendly access.  

This project empowers underserved communities by making vocational training accountable and rewarding, ultimately bridging the skills gap in the global workforce!