// https://github.com/alex-popov-tech/bittorrent-go/blob/e6fc298dc0512727e3509f7f6ccffb66e9612f1e/internal/network/request.go#L9-L22
func (p Peer) Request(pieceIndex, blockOffset, blockLength uint32) error {
	id := getIdByName("request")
	length := uint32(13) // fixed lengta - id(1) + index(4) + offset(4) + length(4)

	message := make([]byte, length+4)
	binary.BigEndian.PutUint32(message[0:4], length)
	message[4] = id
	binary.BigEndian.PutUint32(message[5:9], uint32(pieceIndex))
	binary.BigEndian.PutUint32(message[9:13], uint32(blockOffset))
	binary.BigEndian.PutUint32(message[13:17], uint32(blockLength))

	_, err := p.conn.Write(message)
	return err
}
