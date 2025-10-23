(define-non-fungible-token certification-nft uint)

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-ISSUER u101)
(define-constant ERR-INVALID-LEARNER u102)
(define-constant ERR-INVALID-SKILLS u103)
(define-constant ERR-INVALID-ISSUANCE-DATE u104)
(define-constant ERR-INVALID-METADATA u105)
(define-constant ERR-NFT-ALREADY-EXISTS u106)
(define-constant ERR-NFT-NOT-FOUND u107)
(define-constant ERR-TRANSFER-NOT-ALLOWED u108)
(define-constant ERR-BURN-NOT-ALLOWED u109)
(define-constant ERR-UPDATE-NOT-ALLOWED u110)
(define-constant ERR-INVALID-EXPIRY u111)
(define-constant ERR-INVALID-LEVEL u112)
(define-constant ERR-INVALID-SCORE u113)
(define-constant ERR-INVALID-VERIFICATION-STATUS u114)
(define-constant ERR-MAX-NFTS-EXCEEDED u115)
(define-constant ERR-INVALID-ADMIN u116)
(define-constant ERR-ISSUER-ALREADY-EXISTS u117)
(define-constant ERR-ISSUER-NOT-FOUND u118)
(define-constant ERR-INVALID-REPUTATION u119)
(define-constant ERR-INVALID-DESCRIPTION u120)
(define-constant ERR-INVALID-CERT-TYPE u121)
(define-constant ERR-INVALID-DURATION u122)
(define-constant ERR-INVALID-PREREQS u123)
(define-constant ERR-INVALID-ENDORSEMENTS u124)
(define-constant ERR-INVALID-RENEWAL-FEE u125)

(define-data-var next-nft-id uint u0)
(define-data-var max-nfts uint u1000000)
(define-data-var admin-principal principal tx-sender)
(define-data-var mint-fee uint u500)
(define-data-var issuer-count uint u0)

(define-map nft-metadata
  uint
  {
    issuer: principal,
    learner: principal,
    skills: (list 10 (string-utf8 50)),
    issuance-date: uint,
    expiry-date: (optional uint),
    level: (string-utf8 20),
    score: uint,
    verification-status: bool,
    reputation: uint,
    description: (string-utf8 500),
    cert-type: (string-utf8 50),
    duration: uint,
    prereqs: (list 5 uint),
    endorsements: (list 5 principal),
    renewal-fee: uint
  }
)

(define-map nft-owners uint principal)

(define-map allowed-issuers principal { reputation: uint, active: bool })

(define-map nfts-by-learner principal (list 100 uint))

(define-map nfts-by-issuer principal (list 100 uint))

(define-read-only (get-nft-metadata (id uint))
  (map-get? nft-metadata id)
)

(define-read-only (get-nft-owner (id uint))
  (map-get? nft-owners id)
)

(define-read-only (get-issuer-details (issuer principal))
  (map-get? allowed-issuers issuer)
)

(define-read-only (is-issuer-allowed (issuer principal))
  (match (map-get? allowed-issuers issuer)
    details (get active details)
    false
  )
)

(define-read-only (get-nfts-for-learner (learner principal))
  (default-to (list) (map-get? nfts-by-learner learner))
)

(define-read-only (get-nfts-for-issuer (issuer principal))
  (default-to (list) (map-get? nfts-by-issuer issuer))
)

(define-private (validate-issuer (issuer principal))
  (if (is-issuer-allowed issuer)
    (ok true)
    (err ERR-INVALID-ISSUER)
  )
)

(define-private (validate-learner (learner principal))
  (if (not (is-eq learner tx-sender))
    (ok true)
    (err ERR-INVALID-LEARNER)
  )
)

(define-private (validate-skills (skills (list 10 (string-utf8 50))))
  (if (and (> (len skills) u0) (<= (len skills) u10))
    (ok true)
    (err ERR-INVALID-SKILLS)
  )
)

(define-private (validate-issuance-date (date uint))
  (if (<= date block-height)
    (ok true)
    (err ERR-INVALID-ISSUANCE-DATE)
  )
)

(define-private (validate-expiry-date (expiry (optional uint)))
  (match expiry
    e (if (> e block-height) (ok true) (err ERR-INVALID-EXPIRY))
    (ok true)
  )
)

(define-private (validate-level (level (string-utf8 20)))
  (if (and (> (len level) u0) (<= (len level) u20))
    (ok true)
    (err ERR-INVALID-LEVEL)
  )
)

(define-private (validate-score (score uint))
  (if (and (>= score u0) (<= score u100))
    (ok true)
    (err ERR-INVALID-SCORE)
  )
)

(define-private (validate-verification-status (status bool))
  (ok true)
)

(define-private (validate-reputation (rep uint))
  (if (>= rep u0)
    (ok true)
    (err ERR-INVALID-REPUTATION)
  )
)

(define-private (validate-description (desc (string-utf8 500)))
  (if (<= (len desc) u500)
    (ok true)
    (err ERR-INVALID-DESCRIPTION)
  )
)

(define-private (validate-cert-type (ctype (string-utf8 50)))
  (if (and (> (len ctype) u0) (<= (len ctype) u50))
    (ok true)
    (err ERR-INVALID-CERT-TYPE)
  )
)

(define-private (validate-duration (dur uint))
  (if (> dur u0)
    (ok true)
    (err ERR-INVALID-DURATION)
  )
)

(define-private (validate-prereqs (prereqs (list 5 uint)))
  (if (<= (len prereqs) u5)
    (ok true)
    (err ERR-INVALID-PREREQS)
  )
)

(define-private (validate-endorsements (endors (list 5 principal)))
  (if (<= (len endors) u5)
    (ok true)
    (err ERR-INVALID-ENDORSEMENTS)
  )
)

(define-private (validate-renewal-fee (fee uint))
  (if (>= fee u0)
    (ok true)
    (err ERR-INVALID-RENEWAL-FEE)
  )
)

(define-private (validate-admin)
  (if (is-eq tx-sender (var-get admin-principal))
    (ok true)
    (err ERR-INVALID-ADMIN)
  )
)

(define-public (set-admin (new-admin principal))
  (begin
    (try! (validate-admin))
    (var-set admin-principal new-admin)
    (ok true)
  )
)

(define-public (add-issuer (issuer principal) (reputation uint))
  (begin
    (try! (validate-admin))
    (try! (validate-reputation reputation))
    (asserts! (is-none (map-get? allowed-issuers issuer)) (err ERR-ISSUER-ALREADY-EXISTS))
    (map-set allowed-issuers issuer { reputation: reputation, active: true })
    (var-set issuer-count (+ (var-get issuer-count) u1))
    (ok true)
  )
)

(define-public (remove-issuer (issuer principal))
  (begin
    (try! (validate-admin))
    (asserts! (is-some (map-get? allowed-issuers issuer)) (err ERR-ISSUER-NOT-FOUND))
    (map-set allowed-issuers issuer { reputation: u0, active: false })
    (var-set issuer-count (- (var-get issuer-count) u1))
    (ok true)
  )
)

(define-public (update-issuer-reputation (issuer principal) (new-rep uint))
  (begin
    (try! (validate-admin))
    (try! (validate-reputation new-rep))
    (match (map-get? allowed-issuers issuer)
      details
      (begin
        (map-set allowed-issuers issuer { reputation: new-rep, active: (get active details) })
        (ok true)
      )
      (err ERR-ISSUER-NOT-FOUND)
    )
  )
)

(define-public (mint-nft
  (learner principal)
  (skills (list 10 (string-utf8 50)))
  (expiry (optional uint))
  (level (string-utf8 20))
  (score uint)
  (description (string-utf8 500))
  (cert-type (string-utf8 50))
  (duration uint)
  (prereqs (list 5 uint))
  (endorsements (list 5 principal))
  (renewal-fee uint)
)
  (let (
    (id (var-get next-nft-id))
    (issuer tx-sender)
  )
    (asserts! (< id (var-get max-nfts)) (err ERR-MAX-NFTS-EXCEEDED))
    (try! (validate-issuer issuer))
    (try! (validate-learner learner))
    (try! (validate-skills skills))
    (try! (validate-issuance-date block-height))
    (try! (validate-expiry-date expiry))
    (try! (validate-level level))
    (try! (validate-score score))
    (try! (validate-description description))
    (try! (validate-cert-type cert-type))
    (try! (validate-duration duration))
    (try! (validate-prereqs prereqs))
    (try! (validate-endorsements endorsements))
    (try! (validate-renewal-fee renewal-fee))
    (try! (stx-transfer? (var-get mint-fee) tx-sender (var-get admin-principal)))
    (try! (nft-mint? certification-nft id learner))
    (map-set nft-metadata id
      {
        issuer: issuer,
        learner: learner,
        skills: skills,
        issuance-date: block-height,
        expiry-date: expiry,
        level: level,
        score: score,
        verification-status: false,
        reputation: u0,
        description: description,
        cert-type: cert-type,
        duration: duration,
        prereqs: prereqs,
        endorsements: endorsements,
        renewal-fee: renewal-fee
      }
    )
    (map-set nft-owners id learner)
    (map-set nfts-by-learner learner (append (get-nfts-for-learner learner) id))
    (map-set nfts-by-issuer issuer (append (get-nfts-for-issuer issuer) id))
    (var-set next-nft-id (+ id u1))
    (print { event: "nft-minted", id: id, learner: learner, issuer: issuer })
    (ok id)
  )
)

(define-public (burn-nft (id uint))
  (let (
    (owner (unwrap! (get-nft-owner id) (err ERR-NFT-NOT-FOUND)))
  )
    (asserts! (is-eq tx-sender owner) (err ERR-NOT-AUTHORIZED))
    (try! (nft-burn? certification-nft id owner))
    (map-delete nft-metadata id)
    (map-delete nft-owners id)
    (print { event: "nft-burned", id: id })
    (ok true)
  )
)

(define-public (verify-nft (id uint))
  (match (map-get? nft-metadata id)
    meta
    (begin
      (asserts! (is-eq tx-sender (get issuer meta)) (err ERR-NOT-AUTHORIZED))
      (map-set nft-metadata id (merge meta { verification-status: true }))
      (ok true)
    )
    (err ERR-NFT-NOT-FOUND)
  )
)

(define-public (update-nft-reputation (id uint) (new-rep uint))
  (match (map-get? nft-metadata id)
    meta
    (begin
      (asserts! (is-eq tx-sender (get issuer meta)) (err ERR-NOT-AUTHORIZED))
      (try! (validate-reputation new-rep))
      (map-set nft-metadata id (merge meta { reputation: new-rep }))
      (ok true)
    )
    (err ERR-NFT-NOT-FOUND)
  )
)

(define-public (renew-nft (id uint))
  (match (map-get? nft-metadata id)
    meta
    (let (
      (owner (unwrap! (get-nft-owner id) (err ERR-NFT-NOT-FOUND)))
      (fee (get renewal-fee meta))
    )
      (asserts! (is-eq tx-sender owner) (err ERR-NOT-AUTHORIZED))
      (try! (stx-transfer? fee tx-sender (get issuer meta)))
      (map-set nft-metadata id (merge meta { expiry-date: (some (+ block-height (get duration meta))) }))
      (print { event: "nft-renewed", id: id })
      (ok true)
    )
    (err ERR-NFT-NOT-FOUND)
  )
)

(define-public (endorse-nft (id uint))
  (match (map-get? nft-metadata id)
    meta
    (let (
      (endors (get endorsements meta))
    )
      (asserts! (< (len endors) u5) (err ERR-INVALID-ENDORSEMENTS))
      (asserts! (is-issuer-allowed tx-sender) (err ERR-NOT-AUTHORIZED))
      (map-set nft-metadata id (merge meta { endorsements: (append endors tx-sender) }))
      (ok true)
    )
    (err ERR-NFT-NOT-FOUND)
  )
)

(define-public (transfer-nft (id uint) (recipient principal))
  (err ERR-TRANSFER-NOT-ALLOWED)
)