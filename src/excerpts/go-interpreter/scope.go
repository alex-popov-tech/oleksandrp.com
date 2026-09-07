// https://github.com/alex-popov-tech/go-interpreter/blob/ebd71b3cd7beafe574659539d5382ade1e2e2891/object/scope.go#L23-L48
func (me *Scope) Get(identifier string) (Object, bool) {
	res, has := me.s[identifier]
	if has {
		return res, true
	}
	if me.parent != nil {
		return me.parent.Get(identifier)
	}
	return NULL_OBJECT, false
}

func (me *Scope) Add(identifier string, val Object) {
	me.s[identifier] = val
}

func (me *Scope) Set(identifier string, val Object) bool {
	_, has := me.s[identifier]
	if has {
		me.s[identifier] = val
		return true
	}
	if me.parent != nil {
		return me.parent.Set(identifier, val)
	}
	return false
}
