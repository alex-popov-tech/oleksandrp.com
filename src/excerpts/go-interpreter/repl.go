// https://github.com/alex-popov-tech/go-interpreter/blob/ebd71b3cd7beafe574659539d5382ade1e2e2891/cmd/repl.go#L16-L38
func Repl() {
	in := os.Stdin
	out := os.Stdout
	scanner := bufio.NewScanner(in)

	scope := object.NewGlobalScope()
	fmt.Println("Hello bro! This is the Monkey programming language!")
	fmt.Println("Feel free to type in commands:")
	for {
		fmt.Fprint(out, PROMPT)
		scanned := scanner.Scan()
		if !scanned {
			return
		}

		line := scanner.Text()
		if line == "q" || line == "quit" {
			fmt.Printf("Bye bye!")
			os.Exit(0)
		}
		l := lexer.New(line)
		p := parser.New(l)
		program := p.ParseProgram()
