// https://github.com/alex-popov-tech/acapulko/blob/4619bdd0f8190ba4c231d5b8bf71ecafe9fd8ef3/src/services/dtek/datetime.go#L13-L31
func (dt datetime) MarshalJSON() ([]byte, error) {
	if dt.IsZero() {
		return nil, nil
	}
	return []byte(`"` + dt.Format("15:04 02.01.2006") + `"`), nil
}

func (dt *datetime) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), `"`)
	if s == "" || s == "null" {
		return nil
	}
	parsed, err := time.ParseInLocation("15:04 02.01.2006", s, kyivLocation)
	if err != nil {
		return err
	}
	dt.Time = parsed
	return nil
}
