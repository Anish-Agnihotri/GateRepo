## Limitations

1. GitHub API has a rate-limit of sending a maximum of [50 invitations](https://octokit.github.io/rest.js/v18#repos-add-collaborator) for a repository per 24 hour period.
2. Application does not run a scheduled job to check continuance token ownership (to remove users who transfer their tokens). This is deferred to the user if desired functionality.
3. Application currently only supports [ERC20 tokens](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/) but is easily extensible to other token formats by updating the snapshot strategy in `/pages/api/gates/access.ts`.
4. Allows one user to verify token ownership on behalf of multiple GitHub users (not a one-to-one between GitHub users and addresses). Easily changeable should user require uniqueness by tracking address-to-gateId in database in `/pages/api/gates/access.ts`.
