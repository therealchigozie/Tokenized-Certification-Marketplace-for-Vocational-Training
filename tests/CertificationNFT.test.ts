import { describe, it, expect, beforeEach } from "vitest";
import { ClarityValue, noneCV, optional, principalCV, stringUtf8CV, tupleCV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_ISSUER = 101;
const ERR_INVALID_LEARNER = 102;
const ERR_INVALID_SKILLS = 103;
const ERR_INVALID_ISSUANCE_DATE = 104;
const ERR_INVALID_EXPIRY = 111;
const ERR_INVALID_LEVEL = 112;
const ERR_INVALID_SCORE = 113;
const ERR_INVALID_DESCRIPTION = 120;
const ERR_INVALID_CERT_TYPE = 121;
const ERR_INVALID_DURATION = 122;
const ERR_INVALID_PREREQS = 123;
const ERR_INVALID_ENDORSEMENTS = 124;
const ERR_INVALID_RENEWAL_FEE = 125;
const ERR_NFT_ALREADY_EXISTS = 106;
const ERR_NFT_NOT_FOUND = 107;
const ERR_TRANSFER_NOT_ALLOWED = 108;
const ERR_MAX_NFTS_EXCEEDED = 115;
const ERR_INVALID_ADMIN = 116;
const ERR_ISSUER_ALREADY_EXISTS = 117;
const ERR_ISSUER_NOT_FOUND = 118;
const ERR_INVALID_REPUTATION = 119;

interface NFTMetadata {
  issuer: string;
  learner: string;
  skills: string[];
  issuanceDate: number;
  expiryDate: number | null;
  level: string;
  score: number;
  verificationStatus: boolean;
  reputation: number;
  description: string;
  certType: string;
  duration: number;
  prereqs: number[];
  endorsements: string[];
  renewalFee: number;
}

interface IssuerDetails {
  reputation: number;
  active: boolean;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class CertificationNFTMock {
  state: {
    nextNftId: number;
    maxNfts: number;
    adminPrincipal: string;
    mintFee: number;
    issuerCount: number;
    nftMetadata: Map<number, NFTMetadata>;
    nftOwners: Map<number, string>;
    allowedIssuers: Map<string, IssuerDetails>;
    nftsByLearner: Map<string, number[]>;
    nftsByIssuer: Map<string, number[]>;
  } = {
    nextNftId: 0,
    maxNfts: 1000000,
    adminPrincipal: "ST1ADMIN",
    mintFee: 500,
    issuerCount: 0,
    nftMetadata: new Map(),
    nftOwners: new Map(),
    allowedIssuers: new Map(),
    nftsByLearner: new Map(),
    nftsByIssuer: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1ADMIN";
  stxTransfers: Array<{ amount: number; from: string; to: string }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextNftId: 0,
      maxNfts: 1000000,
      adminPrincipal: "ST1ADMIN",
      mintFee: 500,
      issuerCount: 0,
      nftMetadata: new Map(),
      nftOwners: new Map(),
      allowedIssuers: new Map(),
      nftsByLearner: new Map(),
      nftsByIssuer: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1ADMIN";
    this.stxTransfers = [];
  }

  getNftMetadata(id: number): NFTMetadata | null {
    return this.state.nftMetadata.get(id) || null;
  }

  getNftOwner(id: number): string | null {
    return this.state.nftOwners.get(id) || null;
  }

  getIssuerDetails(issuer: string): IssuerDetails | null {
    return this.state.allowedIssuers.get(issuer) || null;
  }

  isIssuerAllowed(issuer: string): boolean {
    const details = this.getIssuerDetails(issuer);
    return details ? details.active : false;
  }

  getNftsForLearner(learner: string): number[] {
    return this.state.nftsByLearner.get(learner) || [];
  }

  getNftsForIssuer(issuer: string): number[] {
    return this.state.nftsByIssuer.get(issuer) || [];
  }

  setAdmin(newAdmin: string): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_INVALID_ADMIN };
    this.state.adminPrincipal = newAdmin;
    return { ok: true, value: true };
  }

  addIssuer(issuer: string, reputation: number): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_INVALID_ADMIN };
    if (reputation < 0) return { ok: false, value: ERR_INVALID_REPUTATION };
    if (this.state.allowedIssuers.has(issuer)) return { ok: false, value: ERR_ISSUER_ALREADY_EXISTS };
    this.state.allowedIssuers.set(issuer, { reputation, active: true });
    this.state.issuerCount++;
    return { ok: true, value: true };
  }

  removeIssuer(issuer: string): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_INVALID_ADMIN };
    if (!this.state.allowedIssuers.has(issuer)) return { ok: false, value: ERR_ISSUER_NOT_FOUND };
    this.state.allowedIssuers.set(issuer, { reputation: 0, active: false });
    this.state.issuerCount--;
    return { ok: true, value: true };
  }

  updateIssuerReputation(issuer: string, newRep: number): Result<boolean> {
    if (this.caller !== this.state.adminPrincipal) return { ok: false, value: ERR_INVALID_ADMIN };
    if (newRep < 0) return { ok: false, value: ERR_INVALID_REPUTATION };
    const details = this.getIssuerDetails(issuer);
    if (!details) return { ok: false, value: ERR_ISSUER_NOT_FOUND };
    this.state.allowedIssuers.set(issuer, { reputation: newRep, active: details.active });
    return { ok: true, value: true };
  }

  mintNft(
    learner: string,
    skills: string[],
    expiry: number | null,
    level: string,
    score: number,
    description: string,
    certType: string,
    duration: number,
    prereqs: number[],
    endorsements: string[],
    renewalFee: number
  ): Result<number> {
    const id = this.state.nextNftId;
    const issuer = this.caller;
    if (id >= this.state.maxNfts) return { ok: false, value: ERR_MAX_NFTS_EXCEEDED };
    if (!this.isIssuerAllowed(issuer)) return { ok: false, value: ERR_INVALID_ISSUER };
    if (learner === issuer) return { ok: false, value: ERR_INVALID_LEARNER };
    if (skills.length === 0 || skills.length > 10) return { ok: false, value: ERR_INVALID_SKILLS };
    if (expiry !== null && expiry <= this.blockHeight) return { ok: false, value: ERR_INVALID_EXPIRY };
    if (level.length === 0 || level.length > 20) return { ok: false, value: ERR_INVALID_LEVEL };
    if (score < 0 || score > 100) return { ok: false, value: ERR_INVALID_SCORE };
    if (description.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (certType.length === 0 || certType.length > 50) return { ok: false, value: ERR_INVALID_CERT_TYPE };
    if (duration <= 0) return { ok: false, value: ERR_INVALID_DURATION };
    if (prereqs.length > 5) return { ok: false, value: ERR_INVALID_PREREQS };
    if (endorsements.length > 5) return { ok: false, value: ERR_INVALID_ENDORSEMENTS };
    if (renewalFee < 0) return { ok: false, value: ERR_INVALID_RENEWAL_FEE };
    this.stxTransfers.push({ amount: this.state.mintFee, from: issuer, to: this.state.adminPrincipal });
    const metadata: NFTMetadata = {
      issuer,
      learner,
      skills,
      issuanceDate: this.blockHeight,
      expiryDate: expiry,
      level,
      score,
      verificationStatus: false,
      reputation: 0,
      description,
      certType,
      duration,
      prereqs,
      endorsements,
      renewalFee,
    };
    this.state.nftMetadata.set(id, metadata);
    this.state.nftOwners.set(id, learner);
    const learnerNfts = this.getNftsForLearner(learner);
    this.state.nftsByLearner.set(learner, [...learnerNfts, id]);
    const issuerNfts = this.getNftsForIssuer(issuer);
    this.state.nftsByIssuer.set(issuer, [...issuerNfts, id]);
    this.state.nextNftId++;
    return { ok: true, value: id };
  }

  burnNft(id: number): Result<boolean> {
    const owner = this.getNftOwner(id);
    if (!owner) return { ok: false, value: ERR_NFT_NOT_FOUND };
    if (this.caller !== owner) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.nftMetadata.delete(id);
    this.state.nftOwners.delete(id);
    return { ok: true, value: true };
  }

  verifyNft(id: number): Result<boolean> {
    const meta = this.getNftMetadata(id);
    if (!meta) return { ok: false, value: ERR_NFT_NOT_FOUND };
    if (this.caller !== meta.issuer) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const updated: NFTMetadata = { ...meta, verificationStatus: true };
    this.state.nftMetadata.set(id, updated);
    return { ok: true, value: true };
  }

  updateNftReputation(id: number, newRep: number): Result<boolean> {
    const meta = this.getNftMetadata(id);
    if (!meta) return { ok: false, value: ERR_NFT_NOT_FOUND };
    if (this.caller !== meta.issuer) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newRep < 0) return { ok: false, value: ERR_INVALID_REPUTATION };
    const updated: NFTMetadata = { ...meta, reputation: newRep };
    this.state.nftMetadata.set(id, updated);
    return { ok: true, value: true };
  }

  renewNft(id: number): Result<boolean> {
    const meta = this.getNftMetadata(id);
    if (!meta) return { ok: false, value: ERR_NFT_NOT_FOUND };
    const owner = this.getNftOwner(id);
    if (!owner) return { ok: false, value: ERR_NFT_NOT_FOUND };
    if (this.caller !== owner) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.stxTransfers.push({ amount: meta.renewalFee, from: owner, to: meta.issuer });
    const updated: NFTMetadata = { ...meta, expiryDate: this.blockHeight + meta.duration };
    this.state.nftMetadata.set(id, updated);
    return { ok: true, value: true };
  }

  endorseNft(id: number): Result<boolean> {
    const meta = this.getNftMetadata(id);
    if (!meta) return { ok: false, value: ERR_NFT_NOT_FOUND };
    if (meta.endorsements.length >= 5) return { ok: false, value: ERR_INVALID_ENDORSEMENTS };
    if (!this.isIssuerAllowed(this.caller)) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const updated: NFTMetadata = { ...meta, endorsements: [...meta.endorsements, this.caller] };
    this.state.nftMetadata.set(id, updated);
    return { ok: true, value: true };
  }

  transferNft(id: number, recipient: string): Result<boolean> {
    return { ok: false, value: ERR_TRANSFER_NOT_ALLOWED };
  }
}

describe("CertificationNFT", () => {
  let contract: CertificationNFTMock;

  beforeEach(() => {
    contract = new CertificationNFTMock();
    contract.reset();
  });

  it("adds issuer successfully", () => {
    const result = contract.addIssuer("ST2ISSUER", 100);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const details = contract.getIssuerDetails("ST2ISSUER");
    expect(details?.reputation).toBe(100);
    expect(details?.active).toBe(true);
    expect(contract.state.issuerCount).toBe(1);
  });

  it("rejects add issuer by non-admin", () => {
    contract.caller = "ST3FAKE";
    const result = contract.addIssuer("ST2ISSUER", 100);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_ADMIN);
  });

  it("removes issuer successfully", () => {
    contract.addIssuer("ST2ISSUER", 100);
    const result = contract.removeIssuer("ST2ISSUER");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const details = contract.getIssuerDetails("ST2ISSUER");
    expect(details?.active).toBe(false);
    expect(contract.state.issuerCount).toBe(0);
  });

  it("updates issuer reputation successfully", () => {
    contract.addIssuer("ST2ISSUER", 100);
    const result = contract.updateIssuerReputation("ST2ISSUER", 200);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const details = contract.getIssuerDetails("ST2ISSUER");
    expect(details?.reputation).toBe(200);
  });

  it("mints nft successfully", () => {
    contract.addIssuer("ST2ISSUER", 100);
    contract.caller = "ST2ISSUER";
    const result = contract.mintNft(
      "ST3LEARNER",
      ["skill1", "skill2"],
      null,
      "advanced",
      85,
      "description",
      "vocational",
      365,
      [1, 2],
      ["ST4ENDORSE"],
      100
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const meta = contract.getNftMetadata(0);
    expect(meta?.learner).toBe("ST3LEARNER");
    expect(meta?.skills).toEqual(["skill1", "skill2"]);
    expect(meta?.verificationStatus).toBe(false);
    expect(contract.stxTransfers).toEqual([{ amount: 500, from: "ST2ISSUER", to: "ST1ADMIN" }]);
    expect(contract.getNftsForLearner("ST3LEARNER")).toEqual([0]);
    expect(contract.getNftsForIssuer("ST2ISSUER")).toEqual([0]);
  });

  it("rejects mint by invalid issuer", () => {
    contract.caller = "ST2ISSUER";
    const result = contract.mintNft(
      "ST3LEARNER",
      ["skill1"],
      null,
      "advanced",
      85,
      "description",
      "vocational",
      365,
      [],
      [],
      100
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_ISSUER);
  });

  it("burns nft successfully", () => {
    contract.addIssuer("ST2ISSUER", 100);
    contract.caller = "ST2ISSUER";
    contract.mintNft(
      "ST3LEARNER",
      ["skill1"],
      null,
      "advanced",
      85,
      "description",
      "vocational",
      365,
      [],
      [],
      100
    );
    contract.caller = "ST3LEARNER";
    const result = contract.burnNft(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.getNftMetadata(0)).toBeNull();
    expect(contract.getNftOwner(0)).toBeNull();
  });

  it("verifies nft successfully", () => {
    contract.addIssuer("ST2ISSUER", 100);
    contract.caller = "ST2ISSUER";
    contract.mintNft(
      "ST3LEARNER",
      ["skill1"],
      null,
      "advanced",
      85,
      "description",
      "vocational",
      365,
      [],
      [],
      100
    );
    const result = contract.verifyNft(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const meta = contract.getNftMetadata(0);
    expect(meta?.verificationStatus).toBe(true);
  });

  it("updates nft reputation successfully", () => {
    contract.addIssuer("ST2ISSUER", 100);
    contract.caller = "ST2ISSUER";
    contract.mintNft(
      "ST3LEARNER",
      ["skill1"],
      null,
      "advanced",
      85,
      "description",
      "vocational",
      365,
      [],
      [],
      100
    );
    const result = contract.updateNftReputation(0, 50);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const meta = contract.getNftMetadata(0);
    expect(meta?.reputation).toBe(50);
  });

  it("renews nft successfully", () => {
    contract.addIssuer("ST2ISSUER", 100);
    contract.caller = "ST2ISSUER";
    contract.mintNft(
      "ST3LEARNER",
      ["skill1"],
      null,
      "advanced",
      85,
      "description",
      "vocational",
      365,
      [],
      [],
      100
    );
    contract.caller = "ST3LEARNER";
    const result = contract.renewNft(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const meta = contract.getNftMetadata(0);
    expect(meta?.expiryDate).toBe(365);
    expect(contract.stxTransfers[1]).toEqual({ amount: 100, from: "ST3LEARNER", to: "ST2ISSUER" });
  });

  it("endorses nft successfully", () => {
    contract.addIssuer("ST2ISSUER", 100);
    contract.addIssuer("ST4ENDORSE", 50);
    contract.caller = "ST2ISSUER";
    contract.mintNft(
      "ST3LEARNER",
      ["skill1"],
      null,
      "advanced",
      85,
      "description",
      "vocational",
      365,
      [],
      [],
      100
    );
    contract.caller = "ST4ENDORSE";
    const result = contract.endorseNft(0);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const meta = contract.getNftMetadata(0);
    expect(meta?.endorsements).toEqual(["ST4ENDORSE"]);
  });

  it("rejects transfer nft", () => {
    const result = contract.transferNft(0, "ST5RECIPIENT");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_TRANSFER_NOT_ALLOWED);
  });

  it("sets admin successfully", () => {
    const result = contract.setAdmin("ST2NEWADMIN");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.adminPrincipal).toBe("ST2NEWADMIN");
  });

  it("rejects invalid expiry in mint", () => {
    contract.addIssuer("ST2ISSUER", 100);
    contract.caller = "ST2ISSUER";
    contract.blockHeight = 100;
    const result = contract.mintNft(
      "ST3LEARNER",
      ["skill1"],
      50,
      "advanced",
      85,
      "description",
      "vocational",
      365,
      [],
      [],
      100
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_EXPIRY);
  });

  it("rejects invalid score in mint", () => {
    contract.addIssuer("ST2ISSUER", 100);
    contract.caller = "ST2ISSUER";
    const result = contract.mintNft(
      "ST3LEARNER",
      ["skill1"],
      null,
      "advanced",
      101,
      "description",
      "vocational",
      365,
      [],
      [],
      100
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_SCORE);
  });
});