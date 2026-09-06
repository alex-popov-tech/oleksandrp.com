---
title: A power-outage tracker for one address in Ukraine
lang: go
order: 2
repo: alex-popov-tech/acapulko
live: https://acapulko.oleksandrp.com/
tags: [Go, Home Assistant, Telegram, Raspberry Pi, Docker, SSE]
excerpts:
  - acapulko/dtek.go
---
Self-hosted power outage tracker for a single Ukrainian address, built to survive the war-driven blackouts. Combines live grid sensor data from Home Assistant with emergency outage announcements from the DTEK utility API.

Pushes Telegram alerts when power flips or DTEK announces an outage, and serves a live PWA dashboard via Server-Sent Events. Runs on a Raspberry Pi 5, packaged as both a standalone binary and a Home Assistant add-on.
