# MPP Portal Wizard Flows

Two wizard flows extracted from the MPP Portal reference site for eLearning development.

## Protégé Signup Wizard (5 steps)

| Step | Page | Description |
|------|------|-------------|
| 1 | [Company Info](protege-signup/step-1-company-info.html) | Company Info |
| 2 | [SDB Certification](protege-signup/step-2-sdb-certification.html) | SDB Certification |
| 3 | [Agreement Details](protege-signup/step-3-agreement-details.html) | Agreement Details |
| 4 | [Review](protege-signup/step-4-review.html) | Review |
| 5 | [Congratulations](protege-signup/step-5-congratulations.html) | Congratulations |

**Screenshots**: `protege-signup/screenshots/` (23 images)

## Agreement Team Wizard (8 steps)

| Step | Page | Description |
|------|------|-------------|
| 1 | [Mentor Team](agreement-team/page-01-mentor-team.html) | Mentor Team |
| 2 | [Mentor Roles](agreement-team/page-02-mentor-roles.html) | Mentor Roles |
| 3 | [Protégé Team](agreement-team/page-03-protege-team.html) | Protégé Team |
| 4 | [Protégé Roles](agreement-team/page-04-protege-roles.html) | Protégé Roles |
| 5 | [Subcontractors](agreement-team/page-05-subcontractors.html) | Subcontractors |
| 6 | [Sponsoring Agency](agreement-team/page-06-sponsoring-agency.html) | Sponsoring Agency |
| 7 | [Review](agreement-team/page-07-review.html) | Review |
| 8 | [Final Review](agreement-team/page-08-final-review.html) | Final Review |

**Screenshots**: `agreement-team/screenshots/` (28 images)

## How to View

1. Start the dev server: `npm run serve` (serves from `static/` on port 3005)
2. Or open HTML files directly in a browser — they are self-contained with relative asset paths.

## Screenshot Index

See [screenshots.html](screenshots.html) for a visual gallery of all wizard screenshots organized by section.

## Assets

Shared CSS, logos, and diagram images are in `assets/`.

## Source

Built from the 50-page MPP Portal reference site (`docs/`). Screenshots captured via Playwright (`storyboard/capture-screenshots.mjs`).
