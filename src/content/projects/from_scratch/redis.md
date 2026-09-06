---
title: A Redis-compatible server, from scratch, in Go
lang: go
order: 1
repo: alex-popov-tech/redis-go
tags: [Go, RESP, TCP, Streams, Transactions, Replication, CodeCrafters]
excerpts:
  - redis-go/unmarshal.go
  - redis-go/bulkstring.go
---
A Redis-compatible server built from scratch in Go, speaking the real RESP wire protocol over TCP — you can talk to it with redis-cli. Concurrent clients are handled with a goroutine-per-connection model over a thread-safe keyspace.

Implements strings with expiry, streams (XADD/XRANGE/XREAD), transactions (MULTI/EXEC/DISCARD), optimistic locking (WATCH), and full leader-follower replication with command propagation and WAIT. Built through the CodeCrafters challenge — base stages plus the Streams, Transactions, Optimistic Locking, and Replication extensions.
