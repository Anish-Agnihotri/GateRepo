<p align="center">
  <h1 align="center">GateRepo</h1>
</p>
<p align="center">
<b><a href="https://github.com/anish-agnihotri/GateRepo#About">About</a></b>
|
<b><a href="https://github.com/anish-agnihotri/GateRepo#Implementation">Implementation</a></b>
|
<b><a href="https://github.com/anish-agnihotri/GateRepo#License">License</a></b>
</p>

# About

Simple implementation of ERC20 [token-gating](https://coinmetro.com/blog/what-is-token-gating/) GitHub repositories.

Fueled by [Mike's tweet](https://twitter.com/mikedemarais/status/1511116843557306373?s=20&t=2LQ3BchO9bKAWVQsvphJbw).

# Implementation

1. Users login with [GitHub OAuth](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app), we store their `access token` to take actions on their behalf.
2. Users can create new Gates for their repositories, specifying contract address, number of tokens needed, and number of invites to open. In the back-end, token name + decimals, and current latest block number is stored.
3. Users can share links to Gates.
4. Upon accessing a Gate invitation, users can sign-in with GitHub (again giving us their `access token`). Then, they connect their wallet and sign a message to verify ownership for our back-end.
5. Finally, in `/api/gates/access` we run a multi-step process:
   1. Check that requesting user is authenticated
   2. Check that all parameters have been posted (address, signature, gated repo ID)
   3. Verify address ownership by matching address to signature
   4. Check if gated repo by ID exists
   5. Check if gated repo has available open invitations
   6. Check if address held necessary balance at block number
   7. Check if we have access token for requesting user
   8. Check if requesting user is not already a collaborator on private repo
   9. Check if we have access token for private repo owner
   10. Send invite from owner to requesting user to join private repo
   11. Accept invite from owner via requesting user to join private repo
   12. Increment number of used invites (decreasing available slots)

# Build and run locally

```bash
# Collect repo
git clone https://github.com/anish-agnihotri/GateRepo
cd GateRepo

# Install dependencies
npm install

# Update environment variables
cp .env.sample .env
vim .env

# Run application
npm run dev
```

## Environment variables

1. `NEXTAUTH_URL` and `NEXT_PUBLIC_URL`: Set both as site link, `http://localhost:3000` if developing locally, `https://gaterepo.com` for this deployed instance
2. `NEXTAUTH_SECRET`: Any randomly generated string as a secret, e.g.: `NpUFdWakhCjbuIIogCvj`
3. `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: Follow the instructions [here](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app) for spinning up a new GitHub OAuth application. When asked, the authorization callback URL is `http://localhost:3000/api/auth/callback/github` (local) or `https://your_domain.com/api/auth/callback/github` (deployed). Once setup, your OAuth applications `Client ID` is your `GITHUB_CLIENT_ID` and your `Client Secret` is your `GITHUB_CLIENT_SECRET`
4. `DATABASE_URL`: Postgres database connection URL
5. `RPC_API`: Any Ethereum Mainnet JSON-RPC endpoint

# Limitations

1. GitHub API has a rate-limit of sending a maximum of [50 invitations](https://octokit.github.io/rest.js/v18#repos-add-collaborator) for a repository per 24 hour period.
2. Application does not run a scheduled job to check continuing token ownership (to remove users who transfer their tokens). This is deferred to the user if desired functionality.
3. Application currently only supports [ERC20 tokens](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/) but is easily extensible to other token formats by updating the snapshot strategy in `/pages/api/gates/access.ts`.
4. Allows a single address to verify token ownership on behalf of multiple GitHub users (not a one-to-one between GitHub users and addresses). Easily changeable should user require uniqueness by tracking address-to-gateId in database in `/pages/api/gates/access.ts`.
5. GitHub OAuth scopes are fairly invasive (`repo,read:user,user:email`). If you are privacy-aware, I'd recommended running your own fork or migrating to an app-based system?

# License

[GNU Affero GPL v3.0](https://github.com/Anish-Agnihotri/GateRepo/blob/master/LICENSE)
