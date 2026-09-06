// https://github.com/alex-popov-tech/git-go/blob/95225fd5ec43bf054dd0d4803d46246fe371c3a0/internal/commands/hashobject.go#L20-L35
func hashobject(args []string) error {
	write := args[0] == "-w"
	var filePath string
	if write {
		filePath = args[1]
	} else {
		filePath = args[0]
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("can't read file %s: %v", filePath, err)
	}
	header := fmt.Sprintf("blob %d\x00", len(data))
	objectFileContent := append([]byte(header), data...)
	hash := utils.Hash(objectFileContent)
