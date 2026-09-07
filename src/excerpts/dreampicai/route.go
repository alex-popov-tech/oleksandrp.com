// https://github.com/alex-popov-tech/dreampicai/blob/4c57194916e161450909fc147e7211d16e131286/utils/http.go#L65-L86
func GetTokensFromQuery(values url.Values) (accessToken string, refreshToken string, err error) {
	accessToken = values.Get("access_token")
	refreshToken = values.Get("refresh_token")
	if accessToken == "" || refreshToken == "" {
		return "", "", fmt.Errorf(
			"Cannot get 'access_token' or 'refresh_token' from query: %v",
			values,
		)
	}
	return accessToken, refreshToken, nil
}

func MakeRoute(handler func(w http.ResponseWriter, r *http.Request) error) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		err := handler(w, r)
		if err != nil {
			log.Printf("Handler unhanded error %s %s\nError: %v", r.Method, r.URL.Path, err)
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprintf(w, "Something went wrong: %v", err)
		}
	})
}
