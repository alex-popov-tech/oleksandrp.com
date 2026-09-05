---
title: An HTTP/1.1 server, from scratch, in Go
lang: go
order: 5
repo: alex-popov-tech/go_http
tags: [Go, GitHub]
hero:
  type: image
  src: ./http.png
excerpts:
  - go_http/headers.go
---
An HTTP/1.1 server built from scratch in Go directly on raw TCP, without using net/http for the server itself — it carves the request line, header block, and body out of the byte stream by hand, validates field names against the RFC tchar set, and reads bodies strictly against Content-Length.

Serializes responses by hand and supports chunked transfer encoding with trailer fields (X-Content-SHA256, X-Content-Length) computed once the body is fully sent, plus streamed file responses, reverse proxying, goroutine-per-connection concurrency and graceful shutdown. Built end-to-end as the Boot.dev 'Learn HTTP Protocol' course, starting from raw UDP datagrams.
