// https://github.com/alex-popov-tech/advent_of_code_2024_golang/blob/91be3d84ef1f52982678a450f82997a193768092/day_9/part_one.go#L81-L94
func expand(diskMap string) []int {
	res := []int{}
	id := 0
	for i, r := range diskMap {
		isFile := i%2 == 0
		if isFile {
			res = append(res, repeat(id, parseInt(r))...)
			id++
		} else {
			res = append(res, repeat(-1, parseInt(r))...)
		}
	}
	return res
}
