---
title: A Git implementation, from scratch, in Go
lang: go
order: 2
repo: alex-popov-tech/git-go
tags: [Go, Git, GitHub]
hero:
  type: image
  src: ./git.png
---
A Git implementation built from scratch in Go with no Git libraries — it reads and writes the real .git object store by hand (blobs, trees, commits), content-addressed with SHA-1 and zlib-compressed, byte-for-byte compatible with real git.

Implements the plumbing (init, hash-object, cat-file, ls-tree, write-tree, commit-tree) and a full clone of public repositories over the Smart HTTP protocol — pkt-line framing, packfile parsing, and ref-delta resolution including delta chains, then checkout. Built end-to-end as the CodeCrafters 'Build Your Own Git' challenge.
