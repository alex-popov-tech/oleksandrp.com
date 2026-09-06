// https://github.com/alex-popov-tech/redis-go/blob/df77b784abd992c8fa52e2ae9c27c0c3b119f74a/app/internal/resp/bulkstring.go#L16-L38
func ParseBulkString(r Reader) (BulkString, error) {
	contentLength, firstNonNumberByte, err := readNumber(r)
	if err != nil {
		return "", err
	}
	if firstNonNumberByte != '\r' {
		return "", fmt.Errorf("expected '\\r', got %q", firstNonNumberByte)
	}
	// nums finished, skip next byte which should be '\r'
	b, err := r.ReadByte()
	if err != nil {
		return "", err
	}
	if b != '\n' {
		return "", fmt.Errorf("expected '\\n', got %q", b)
	}

	// read content
	buf := make([]byte, contentLength)
	_, err = io.ReadFull(r, buf)
	if err != nil {
		return "", err
	}
