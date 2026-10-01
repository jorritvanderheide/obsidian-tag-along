# Security policy

## Supported versions

Security fixes go into the latest release of Tag Along. Older releases don't
get separate fixes, so please update before you report.

## Reporting a problem

Please don't open a public issue for a security problem. Report it privately
through GitHub instead:

https://github.com/jorritvanderheide/obsidian-tag-along/security/advisories/new

Include the Tag Along and Obsidian versions, your operating system, and the
steps to reproduce it. Reports are looked at before anything about them is made
public.

## What counts

Tag Along reads the tags in your vault and only changes files when you ask it
to, through Obsidian, the way the core file explorer does. It connects to
nothing and runs no programs. See
[section 11 of the README](README.md#11-network-and-file-disclosure). Anything
that makes it connect somewhere, read or write files outside your vault, or run
code that came from a note or a tag is a security problem.

A bug that renames, moves or deletes the wrong note is serious too, but it isn't
secret: please report that as a normal issue, so others can see it.
