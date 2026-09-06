// https://github.com/alex-popov-tech/redis-go/blob/df77b784abd992c8fa52e2ae9c27c0c3b119f74a/app/internal/resp/unmarshal.go#L7-L25
func Parse(r Reader) (RESPValue, error) {
	b, err := r.ReadByte()
	if err != nil {
		return nil, err
	}
	switch b {
	case '*':
		return ParseArray(r)
	case '$':
		return ParseBulkString(r)
	case ':':
		return ParseInteger(r)
	case '+':
		return ParseSimpleString(r)

	default:
		return nil, fmt.Errorf("unexpected input %q", b)
	}
}
