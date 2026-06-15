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
- Reply user in Chinese, but write / modify files in English.

Constraints:
- Do not try to operate on the database, nor ghost.
- Do not try to read / write / modify anything mentioned in @.gitignore.
- Though I've give you the way to login to ghost container, do not try to operate in the container, you only have read permission in the container.

**Current Status**: Theme built, fixing errors and bugs.