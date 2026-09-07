// https://github.com/alex-popov-tech/git-go/blob/95225fd5ec43bf054dd0d4803d46246fe371c3a0/internal/client/client.go#L179-L193
func readPktLine(data []byte) (message []byte, size int, rest []byte, err error) {
	sizeUint, err := strconv.ParseUint(string(data[0:4]), 16, 32)
	if err != nil {
		return nil, 0, nil, err
	}
	size = int(sizeUint)
	// flush
	if size == 0 {
		return []byte{}, 0, data[4:], nil
	}

	message = data[4:int(size)]
	rest = data[int(size):]
	return message, int(size), rest, nil
}
