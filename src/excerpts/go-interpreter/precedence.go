// https://github.com/alex-popov-tech/go-interpreter/blob/ebd71b3cd7beafe574659539d5382ade1e2e2891/parser/infixParsers.go#L10-L30
func (p *Parser) parseInfixExpression(left ast.Expression) (ast.Expression, error) {
	defer untrace(trace(fmt.Sprintf("parseInfixExpression, left is %s", left.String())))
	res := &ast.InfixExpression{Token: p.currentToken, Left: left, Operator: p.currentToken.Literal}

	precedence := p.currPrecedence()

	// Assignment is right-associative: x = y = 5 should parse as x = (y = 5)
	if p.currentToken.Type == token.ASSIGN {
		precedence = precedence - 1
	}

	p.nextToken()

	exrp, err := p.parseExpression(precedence)
	if err != nil {
		return nil, fmt.Errorf("could not parse infix expression: %s", err)
	}
	res.Right = exrp

	return res, nil
}
