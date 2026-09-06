// https://github.com/alex-popov-tech/grep-go/blob/616576d21d5810932ef1d912bb39e9d63be4af0a/internal/token/backreference.go#L14-L33
func (t Backreference) Match(input []rune, i int, matched []*TokenMatchResult) []*TokenMatchResult {
	var match *TokenMatchResult
	for _, m := range matched {
		if m.GroupNumber == int(t) {
			match = m
		}
	}
	if match == nil {
		return nil
	}

	expected := input[match.Start:match.End]
	if i+len(expected) > len(input) {
		return nil
	}
	if slices.Equal(expected, input[i:i+len(expected)]) {
		return []*TokenMatchResult{{Start: i, End: i + len(expected)}}
	}
	return nil
}
