// https://github.com/alex-popov-tech/bittorrent-go/blob/e6fc298dc0512727e3509f7f6ccffb66e9612f1e/internal/bencode/bencode.go#L126-L146
func Marshall(value interface{}) (string, error) {
	switch it := value.(type) {
	case string:
		return fmt.Sprintf("%d:%s", len(it), it), nil
	case int:
		return fmt.Sprintf("i%de", value), nil
	case byte: // uint8
		return fmt.Sprintf("i%de", it), nil
	case uint32:
		return fmt.Sprintf("i%de", it), nil
	case []interface{}:
		res := "l"
		for _, v := range it {
			val, err := Marshall(v)
			if err != nil {
				return "", err
			}
			res += val
		}
		res += "e"
		return res, nil
