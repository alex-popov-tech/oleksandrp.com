// https://github.com/alex-popov-tech/redis-go/blob/df77b784abd992c8fa52e2ae9c27c0c3b119f74a/app/internal/store/store.go#L148-L173
func makeNthStreamID(id string, lastEntry Pairs) PairsID {
	chunks := strings.Split(id, "-")
	var ms int
	var seq int
	if chunks[0] == "*" {
		ms = int(time.Now().UnixMilli())
		if ms == lastEntry.ID.Milliseconds {
			seq = lastEntry.ID.Sequence + 1
		} else {
			seq = 0
		}
		return PairsID{Milliseconds: ms, Sequence: seq}
	} else {
		ms, _ = strconv.Atoi(chunks[0])
	}
	if chunks[1] == "*" {
		if ms == lastEntry.ID.Milliseconds {
			seq = lastEntry.ID.Sequence + 1
		} else {
			seq = 0
		}
	} else {
		seq, _ = strconv.Atoi(chunks[1])
	}
	return PairsID{Milliseconds: ms, Sequence: seq}
}
