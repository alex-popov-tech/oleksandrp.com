// https://github.com/alex-popov-tech/go_http/blob/0ff1b1244e7932c2af791160ee1a9fad81ac2e7a/internal/request/request.go#L159-L181
func (lr linesReader) ReadLine() lineInfo {
	CR := byte('\r') // 13
	LF := byte('\n') // 10

	line := []byte{}
	for {
		b := make([]byte, 1)
		read, err := lr.r.Read(b)
		if err != nil && !errors.Is(err, io.EOF) {
			return lineInfo{string(line), err}
		}
		// if the end of the stream
		if errors.Is(err, io.EOF) && read == 0 {
			return lineInfo{string(line), err}
		}

		// if its LF and prev was CR
		if b[0] == LF && len(line) > 0 && line[len(line)-1] == CR {
			return lineInfo{string(line[0 : len(line)-1]), nil}
		}
		line = append(line, b[0])
	}
}
