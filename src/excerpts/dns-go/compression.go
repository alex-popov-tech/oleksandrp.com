// https://github.com/alex-popov-tech/dns-go/blob/cb9ea17c5475bbf3044211f4fe1279c5503b4007/internal/message/answer.go#L42-L67
func parseAnswerName(pointer int, data []byte) (string, int) {
	labels := []string{}
	for {
		first := data[pointer]
		pointer++
		// if null byte - end
		if first == 0 {
			break
		}
		// if redirect - read labels from there
		if (first & 0b11000000) == 0b11000000 {
			second := data[pointer]
			pointer++
			redirectAddress := binary.BigEndian.Uint16([]byte{first & 0b00111111, second})
			question, _ := parseAnswerName(int(redirectAddress), data)
			labels = append(labels, question)
			break
		}
		// else read from here
		label := data[pointer : pointer+int(first)]
		pointer = pointer + int(first)
		labels = append(labels, string(label))
	}

	return strings.Join(labels, "."), pointer
}
