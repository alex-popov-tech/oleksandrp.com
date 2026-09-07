// https://github.com/alex-popov-tech/advent_of_code_2024_golang/blob/91be3d84ef1f52982678a450f82997a193768092/day_5/part_two.go#L47-L73
func getValidPages(update []int, rules map[int][]int) []int {
	// we have all rules, which are 24 per page
	// we also have pages in update
	// we need to iterate over update pages, and for each page:
	// 1. grab all possible rules
	relevantRulesPerPage := map[int][]int{}
	for _, page := range update {
		allRulesForPage := rules[page]
		// 2. filter rules which are not present in update
		presentInUpdateRules := []int{}
		for _, potentialRule := range allRulesForPage {
			if slices.Contains(update, potentialRule) {
				presentInUpdateRules = append(presentInUpdateRules, potentialRule)
			}
		}
		// (now we have all actual rules for page in update)
		// 3. save those relevant rules per page to map
		relevantRulesPerPage[page] = presentInUpdateRules
	}
	// 4. sort pages by rules count
	res := slices.Clone(update)
	slices.SortFunc(res, func(p1, p2 int) int {
		return len(relevantRulesPerPage[p2]) - len(relevantRulesPerPage[p1])
	})
	// 5. Return sorter pages slice
	return res
}
