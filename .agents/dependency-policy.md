# Dependency security and freshness policy

- PRIME DIRECTIVE: Use the latest stable library releases, maintain zero known security advisories, and continuously verify compatibility in CI.
- Keep direct dependencies on their latest stable release. Migrate across major versions promptly, with compatibility work and tests in the same update rather than indefinitely pinning an obsolete major.
- Run daily Dependabot updates for npm packages and GitHub Actions. Review and merge updates only after the required CI checks pass.
- Require the CI `npm audit --audit-level=low` step to pass. The committed lockfile must have zero known npm advisories; do not suppress findings or use `npm audit fix --force` without reviewing its proposed major-version changes.
- Keep `package-lock.json` committed and use `npm ci` for reproducible CI/local verification.
- Run `npm update` regularly to bring packages to the newest versions allowed by current ranges, and use Dependabot major-update PRs to keep ranges current.
- Recheck the audit after dependency changes and before releases. A clean audit represents known advisories in the current npm database, not proof against undiscovered vulnerabilities.
