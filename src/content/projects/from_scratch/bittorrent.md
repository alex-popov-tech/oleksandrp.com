---
title: A BitTorrent client, from scratch, in Go
lang: go
order: 3
repo: alex-popov-tech/bittorrent-go
tags: [Go, GitHub]
stream: bittorrent
excerpts:
  - bittorrent-go/handshake.go
  - bittorrent-go/bencode.go
---
A BitTorrent client built from scratch in Go with no torrent libraries — it hand-rolls the bencode codec, parses .torrent files down to the info-hash, and announces to HTTP trackers to discover a peer swarm.

Speaks the raw peer wire protocol (68-byte handshake, then length-prefixed messages), downloads pieces in 16 KiB blocks with SHA-1 verification, and saturates the swarm with a goroutine-per-peer work queue. Magnet links are supported too, fetching the torrent metadata itself from peers over ut_metadata (BEP 9/10). Built end-to-end as the CodeCrafters 'Build Your Own BitTorrent' challenge.
