**Your primary goal is to build a eye-catching Ghost theme by replicating the design of an existing website.**

References:
- [Ghost offical documentation of themes](https://docs.ghost.org/themes), refer to it when acquiring knowledge from documentation is needed.
- @routes.yaml is the route configuration.
- @.screenshots contains screenshots from reference website.

Info:
- Ghost deployed via docker locally for development, URL: http://localhost:53368
- Login to Ghost container via `docker exec -it ghost su`
- ghost version: 6.43.1
- OS version: Debian 6.12.86-1 (2026-05-08) x86_64
- Theme files reside in @ciyanea. All code edits related to the theme itself should only be made inside this directory, including tests.

Requirements:
- No matter in what language the user is prompting, always reply in simplified Chinese, but write / modify files in English.
- After modification made to theme, load the modified theme by running `./update-theme.sh`.

Constraints:
- Do not try to operate on the database, nor ghost.
- Do not try to read / write / modify anything mentioned in @.gitignore unless after getting my consent.

**Current Status**: Refining the theme design.