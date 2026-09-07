// https://github.com/alex-popov-tech/go-interpreter/blob/ebd71b3cd7beafe574659539d5382ade1e2e2891/lexer/lexer.go#L185-L206
func (this *Lexer) readString() string {
	openingQuote := this.currentChar
	acc := ""

	// go over to first string byte
	this.nextChar()

	for this.currentChar != openingQuote && this.currentChar != 0 {
		if !this.isEscapeChar() {
			acc += string(this.currentChar)
			this.nextChar()
		} else {
			this.nextChar()
			acc += string(this.currentChar)
			this.nextChar()
		}
	}
	// go over last quote
	this.nextChar()

	return acc
}
