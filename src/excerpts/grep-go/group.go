// https://github.com/alex-popov-tech/grep-go/blob/616576d21d5810932ef1d912bb39e9d63be4af0a/internal/token/group.go#L23-L47
func (t Group) Match(input []rune, i int, matched []*TokenMatchResult) []*TokenMatchResult {
	m := map[int][]*TokenMatchResult{}
	matchFullyAllOptions(t.Tokens, input, i, 0, false, matched, m)
	if len(m) == 0 {
		return nil
	}
	var res []*TokenMatchResult
	for end, matchedPath := range m {
		res = append(
			res,
			&TokenMatchResult{
				Start: i,
				End:   end,
				// record only subpath, without all previous matches
				Subs:        matchedPath[len(matched):],
				GroupNumber: t.Number,
			},
		)
	}
	slices.SortFunc(res, func(a, b *TokenMatchResult) int {
		return a.End - b.End
	})
	slices.Reverse(res)
	return res
}
