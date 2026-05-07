# Security Policy

## Supported Versions

The following versions are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 7.x     | :white_check_mark: |
| 6.x     | :white_check_mark: |
| < 6.0   | :x:                |

## Reporting a Vulnerability

We take security bugs in React Router seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

To report a security issue, please use the GitHub Security Advisory [Report a Vulnerability](https://github.com/remix-run/react-router/security/advisories/new) feature.

The React Router team will send a response indicating the next steps in handling your report. After the initial reply to your report, our team will keep you informed of the progress towards a fix and full announcement, and may ask for additional information or guidance.

Generally, the full process will look something like this when we receive a new advisory via Github:

- If the advisory is valid, we'll move it into `Draft` status as we begin our investigation
- We'll inform common hosting platforms of the vulnerability so they can make any preventative changes on their end even before the vulnerability is fixed/published
  - If you are a hosting provider and you want to be notified right away, please email us at [hello@remix.run](mailto:hello@remix.run) and we'll get you added
- We'll publish a new version of React Router with a fix
- We'll update our own sites with the new version
- After a period of time, potentially up to a month or so, we'll publish the advisory
  - This gives application developers time to update their applications to the latest version before we make the details of the advisory public

Report security bugs in third-party modules to the person or team maintaining the module. You can also report a vulnerability through the [npm contact form](https://www.npmjs.com/support) by selecting "I'm reporting a security vulnerability".
