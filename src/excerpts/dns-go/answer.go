// https://github.com/alex-popov-tech/dns-go/blob/cb9ea17c5475bbf3044211f4fe1279c5503b4007/internal/message/answer.go#L90-L111
func (q Answer) Bytes() []byte {
	labelsBytes := []byte{}
	for label := range strings.SplitSeq(q.Name, ".") {
		labelsBytes = append(labelsBytes, byte(len(label)))
		labelsBytes = append(labelsBytes, []byte(label)...)
	}
	labelsBytes = append(labelsBytes, byte(0))
	// ANAME + TYPE (2 bytes) + CLASS (2 bytes) + TTL (4 bytes) + RDLENGTH (2 bytes)
	res := make([]byte, len(labelsBytes)+10)
	copy(res, labelsBytes)
	binary.BigEndian.PutUint16(res[len(labelsBytes):], q.Type)
	binary.BigEndian.PutUint16(res[len(labelsBytes)+2:], q.Class)
	binary.BigEndian.PutUint32(res[len(labelsBytes)+4:], q.TTL)
	binary.BigEndian.PutUint16(res[len(labelsBytes)+8:], q.Length)

	for ns := range strings.SplitSeq(q.Data, ".") {
		n, _ := strconv.Atoi(ns)
		res = append(res, byte(n))
	}

	return res
}
