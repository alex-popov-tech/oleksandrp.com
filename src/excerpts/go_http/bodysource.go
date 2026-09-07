// https://github.com/alex-popov-tech/go_http/blob/0ff1b1244e7932c2af791160ee1a9fad81ac2e7a/internal/response/response.go#L124-L143
func WriteBodySource(target io.Writer, source io.ReadCloser) error {
	_, err := target.Write([]byte("\r\n"))
	if err != nil {
		return err
	}
	buf := make([]byte, 64)
	for {
		n, err := source.Read(buf)
		if err != nil && err != io.EOF {
			return err
		}
		if n == 0 && err == io.EOF {
			return source.Close()
		}
		_, err = target.Write(buf[0:n])
		if err != nil {
			return err
		}
	}
}
