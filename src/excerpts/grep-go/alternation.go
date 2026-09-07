// https://github.com/alex-popov-tech/grep-go/blob/616576d21d5810932ef1d912bb39e9d63be4af0a/internal/token/or.go#L17-L35
func (t Or) Match(input []rune, i int, matched []*TokenMatchResult) []*TokenMatchResult {
	if i >= len(input) {
		return nil
	}
	m := map[int][]*TokenMatchResult{}
	matchFullyAllOptions([]Token(t.Left), input, i, 0, false, matched, m)
	matchFullyAllOptions([]Token(t.Right), input, i, 0, false, matched, m)
	if len(m) == 0 {
		return nil
	}
	var res []*TokenMatchResult
	for end := range m {
		res = append(res, &TokenMatchResult{Start: i, End: end})
	}
	slices.SortFunc(res, func(a, b *TokenMatchResult) int {
		return b.End - a.End
	})
	return res
}
