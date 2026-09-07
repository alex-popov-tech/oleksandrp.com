// https://github.com/alex-popov-tech/dreampicai/blob/4c57194916e161450909fc147e7211d16e131286/utils/http.go#L17-L39
func AddUserAuthCookies(w http.ResponseWriter, accessToken, refreshToken, accountId string) {
	http.SetCookie(w, &http.Cookie{
		Name:     domain.AccessTokenCookieKey,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		Value:    accessToken,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     domain.RefreshTokenCookieKey,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		Value:    refreshToken,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     domain.AccountIdCookieKey,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		Value:    accountId,
	})
}
