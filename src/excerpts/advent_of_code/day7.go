// https://github.com/alex-popov-tech/advent_of_code_2024_golang/blob/91be3d84ef1f52982678a450f82997a193768092/day_7/part_two.go#L58-L87
func generateOperatorStrings2(operatorsCount int) []string {
	if operatorsCount == 1 {
		return operators
	}

	result := []string{}
	for _, operator := range operators {
		options := generateOperatorStrings2(operatorsCount - 1)
		for _, option := range options {
			result = append(result, operator+option)
		}
	}
	return result
}

func calculate2(operands []int, operators string) int {
	result := operands[0]
	for i, operator := range operators {
		switch operator {
		case '+':
			result += operands[i+1]
		case '*':
			result *= operands[i+1]
		default:
			squashed := fmt.Sprintf("%d%d", result, operands[i+1])
			result, _ = strconv.Atoi(squashed)
		}
	}
	return result
}
