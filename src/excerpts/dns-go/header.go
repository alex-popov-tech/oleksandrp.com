// https://github.com/alex-popov-tech/dns-go/blob/cb9ea17c5475bbf3044211f4fe1279c5503b4007/internal/message/header.go#L52-L66
func (h *Header) SetFlags(qr, opcode, aa, tc, rd, ra, z, rcode uint16) {
	h.Flags = qr<<15 | opcode<<11 | aa<<10 | tc<<9 | rd<<8 | ra<<7 | z<<4 | rcode
}

func (h Header) Opcode() uint16 {
	return (h.Flags >> 11) & 0xF
}

func (h Header) Rd() uint16 {
	return (h.Flags >> 8) & 0x1
}

func (h Header) Rcode() uint16 {
	return h.Flags & 0xF
}
