---
title: A DNS server, from scratch, in Go
lang: go
order: 4
repo: alex-popov-tech/dns-go
tags: [Go, GitHub]
stream: dns
excerpts:
  - dns-go/question.go
  - dns-go/header.go
---
A DNS server built from scratch in Go with no DNS libraries — it parses and serializes raw DNS packets byte by byte, across the header, question, and answer sections.

Handles DNS name compression (pointer labels), bit-packed header flags, and recursive forwarding to an upstream resolver. Completed end-to-end as the CodeCrafters 'Build Your Own DNS server' challenge.
