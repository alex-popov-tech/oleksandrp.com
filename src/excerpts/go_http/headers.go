// https://github.com/alex-popov-tech/go_http/blob/0ff1b1244e7932c2af791160ee1a9fad81ac2e7a/internal/headers/headers.go#L12-L33
func ParseHeaders(lines []string) (Headers, error) {
	res := make(map[string]string)
	for _, line := range lines {
		name, value, err := parseHeader(line)
		if err != nil {
			return res, fmt.Errorf("cannot parse header '%s': %w", line, err)
		}

		// 1. field name is case insensitive
		// so we just make all lowercase for simplicity
		lowerCasedName := strings.ToLower(name)

		// 2. if there are repetitive field names - their values are joined with ' ,'
		if _, hasValue := res[lowerCasedName]; hasValue {
			res[lowerCasedName] = fmt.Sprintf("%s,%s", res[lowerCasedName], value)
		} else {
			res[lowerCasedName] = value
		}
	}

	return res, nil
}
