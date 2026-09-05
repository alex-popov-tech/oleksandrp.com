// https://github.com/alex-popov-tech/bittorrent-go/blob/e6fc298dc0512727e3509f7f6ccffb66e9612f1e/internal/network/handshake.go#L16-L35
func (p Peer) Handshake(infoHash []byte, extensionSupported bool) (net.Conn, []byte, error) {
	conn, err := net.DialTimeout("tcp", p.address, DialTimeout)
	if err != nil {
		return nil, nil, fmt.Errorf("can't connect to peer %s: %w", p.address, err)
	}

	handshakeMessage := make([]byte, 68)
	//	length of the protocol string (BitTorrent protocol) which is 19 (1 byte)
	handshakeMessage[0] = 19
	//	the string BitTorrent protocol (19 bytes)
	copy(handshakeMessage[1:20], []byte("BitTorrent protocol"))
	//	eight reserved bytes, which are all set to zero (8 bytes)
	//	or 20th bit flagged
	if extensionSupported {
		copy(handshakeMessage[20:28], []byte{0, 0, 0, 0, 0, 0b00010000, 0, 0})
	}
	//	sha1 infohash (20 bytes) (NOT the hexadecimal representation, which is 40 bytes long)
	copy(handshakeMessage[28:48], infoHash)
	//	peer id (20 bytes) (generate 20 random byte values)
	copy(handshakeMessage[48:68], PeerId[:])
