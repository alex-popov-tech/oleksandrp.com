// https://github.com/alex-popov-tech/advent_of_code_2024_golang/blob/91be3d84ef1f52982678a450f82997a193768092/day_11/part_two.go#L15-L42
func Part2(input []byte) {
	line := strings.Trim(string(input), "\n")
	stones := parse(line)
	blinks := 75

	cache := map[Pair]uint64{}
	count := big.NewInt(0)
	for _, stone := range stones {
		count.Add(count, new(big.Int).SetUint64(walk(uint64(stone), uint64(blinks), cache)))
	}

	fmt.Println("Result is", count)
}

type Pair struct {
	f uint64
	s uint64
}

func walk(it, deepth uint64, cache map[Pair]uint64) uint64 {
	if deepth == 0 {
		return 1
	}

	cached, exists := cache[Pair{it, deepth}]
	if exists {
		return cached
	}
