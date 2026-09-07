// https://github.com/alex-popov-tech/grep-go/blob/616576d21d5810932ef1d912bb39e9d63be4af0a/internal/token/quantifiers.go#L109-L134
func (t Range) String() string {
	to := ""
	if t.To == math.MaxInt {
		to = ""
	} else {
		to = fmt.Sprintf("%d", t.To)
	}
	return fmt.Sprintf("%s{%d:%s}", t.Token.String(), t.From, to)
}

func (t Range) Match(input []rune, i int, matched []*TokenMatchResult) []*TokenMatchResult {
	m := map[int]struct{}{}
	if t.From == 0 {
		m[i] = struct{}{}
	}
	t.matchFully(input, i, matched, 0, t.From, t.To, map[[2]int]struct{}{}, m)
	var res []*TokenMatchResult
	for it := range m {
		res = append(res, &TokenMatchResult{Start: i, End: it})
	}
	slices.SortFunc(res, func(a, b *TokenMatchResult) int {
		return a.End - b.End
	})
	slices.Reverse(res)
	return res
}
