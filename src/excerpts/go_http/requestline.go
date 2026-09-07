// https://github.com/alex-popov-tech/go_http/blob/0ff1b1244e7932c2af791160ee1a9fad81ac2e7a/internal/request/request.go#L110-L142
func parseRequestLine(requestLine string) (RequestLine, error) {
	res := RequestLine{}

	requestLineChunks := strings.Fields(requestLine)
	if len(requestLineChunks) != 3 {
		return res, fmt.Errorf(
			"request line should consist of three parts separated by ' ', but was %s",
			requestLine,
		)
	}

	if !slices.Contains(allowedMethods, requestLineChunks[0]) {
		return res, fmt.Errorf(
			"method must be one of [%s], but was '%s'",
			allowedMethods,
			requestLineChunks[0],
		)
	}
	res.Method = requestLineChunks[0]

	res.RequestTarget = requestLineChunks[1]
	r := regexp.MustCompile(`HTTP/\d\.\d`)
	if !r.Match([]byte(requestLineChunks[2])) {
		return res, fmt.Errorf(
			"http protocol must be of format 'HTTP/digit.digit', but was: %s",
			requestLineChunks[2],
		)
	}

	res.HttpVersion = strings.Split(requestLineChunks[2], "/")[1]

	return res, nil
}
