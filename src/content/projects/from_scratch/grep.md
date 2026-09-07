---
title: A grep, from scratch, in Go
lang: go
order: 6
repo: alex-popov-tech/grep-go
tags: [Go, GitHub]
stream: grep
excerpts:
  - grep-go/backreference.go
  - grep-go/range.go
  - grep-go/group.go
  - grep-go/alternation.go
---
A grep built from scratch in Go with no regex libraries — the pattern is compiled by hand into a token list, and matching is a backtracking DFS where every token reports all the ways it could consume the input, greedy-first.

Supports ERE-flavored syntax (character classes, anchors, quantifiers including {n,m} ranges, grouping and alternation), capture groups that survive nesting, and multiple and nested backreferences, behind a grep-style CLI with recursive directory walk and a goroutine-per-file fan-out. Built end-to-end as the CodeCrafters 'Build Your Own grep' challenge, including the Backreferences and File Search extensions.
