// https://github.com/alex-popov-tech/git-go/blob/95225fd5ec43bf054dd0d4803d46246fe371c3a0/internal/packfile/packfile.go#L117-L139
func parseObjectHeader(bytes []byte) (ttype string, size int, consumed int) {
	// read first byte - C, type, size
	// 7th bit is C bit
	c := bytes[0] & 0b10000000
	// 6,5,4 are type bits
	t := (bytes[0] & 0b01110000) >> 4
	// 3,2,1,0 are size bits
	size = int(bytes[0] & 0b00001111)
	shift := 4
	consumed = 1
	for ; c == 0b10000000; consumed++ {
		b := bytes[consumed]
		c = b & 0b10000000
		// next 7 bits contribute to size
		next := int(b & 0b01111111)
		// shift those byte in needed position
		// join current size bits with next
		size = size | (next << shift)
		// increase shift for a length of this message
		shift += 7
	}
	return typeByteToString(t), size, consumed
}
