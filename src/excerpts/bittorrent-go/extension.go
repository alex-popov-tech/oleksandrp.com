// https://github.com/alex-popov-tech/bittorrent-go/blob/e6fc298dc0512727e3509f7f6ccffb66e9612f1e/internal/network/extensionHandshake.go#L19-L40
func (p Peer) ExtensionHandshake(extensionsIdMap map[string]byte) error {
	payload, err := bencode.Marshall(map[string]interface{}{"m": extensionsIdMap})
	if err != nil {
		return fmt.Errorf("can't marshal extensions: %w", err)
	}
	length := uint32(2 + len(payload))

	message := make([]byte, length+4)
	// put length
	binary.BigEndian.PutUint32(message[0:4], length)
	// put top-level id for extension message
	message[4] = 20
	// put sub-level id for extension 'handshake' message
	message[5] = 0
	// put extensions id's map
	copy(message[6:], payload)
	_, err = p.conn.Write(message)
	if err != nil {
		return fmt.Errorf("can't write extension handshake: %w", err)
	}
	return nil
}
