# Limitations

There are currently a number of limitations to the code that users should be aware of:

## Security

The code is still undergoing a security audit and therefore security should not be assumed.

## ZK-SNARKs

The code makes use of ZK-SNARKS for transaction hiding, this approach is efficient, but carries the normal requirement for trusted setup and the knowledge of exponent assumption. We hope to address the former of these soon.

## Hash and Key lengths

Most hashes are sha256 based but truncated to 216 bits for convenience in the generation of proofs. Keys are also 216 bit. Whilst we do not believe this has a significant impact on security in itself, we mention it so that you can make up your own mind.

The repo contains an option to shift to MiMC hashing for merkle-tree hashing.

## No batching or aggregation of proofs

We currently treat each ZKP transaction as a separate event. In the future we expect to aggregate
proofs to improve efficiency of verification.

## Analysis of transactions

Zero Knowledge transactions are exactly that, an observer learns exactly nothing about the transaction. However, this does not mean that analysis of the blockchain will in all circumstances tell one nothing. For example if I mint 123456789 coins and send them directly to Bob, who then converts them back into conventional ERC-20, it indicates with high probability that I just transacted with Bob because of the disappearance and reappearance of the same unusual value. The situation is worse with non-fungible tokens. Therefore transactions should be made with care, making use of transactions that change fungible token values and not burning non-fungible tokens commitments.
