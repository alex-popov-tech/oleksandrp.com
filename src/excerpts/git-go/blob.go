// https://github.com/alex-popov-tech/git-go/blob/95225fd5ec43bf054dd0d4803d46246fe371c3a0/internal/objects/blob.go#L23-L43
// parses blob object file
func ParseBlob(object []byte) (*Blob, error) {
	hash := utils.Hash(object)
	t, rest, found := bytes.Cut(object, []byte(" "))
	if !found {
		return nil, fmt.Errorf("malformed blob object - missing whitespace after type")
	}
	if string(t) != "blob" {
		return nil, fmt.Errorf("malformed blob object - expected type 'blob' but was %s", string(t))
	}
	sizeBytes, contentBytes, found := bytes.Cut(rest, []byte{byte(0)})
	if !found {
		return nil, fmt.Errorf("malformed blob object %s", object)
	}
	size, err := strconv.Atoi(string(sizeBytes))
	if err != nil {
		return nil, fmt.Errorf("malformed blob object: %v", err)
	}

	return &Blob{Hash: hash, Size: size, Content: contentBytes[:size]}, nil
}
