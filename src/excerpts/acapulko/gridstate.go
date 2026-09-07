// https://github.com/alex-popov-tech/acapulko/blob/4619bdd0f8190ba4c231d5b8bf71ecafe9fd8ef3/src/services/homeassistant/homeassistant.go#L28-L60
func GetGridState(ctx context.Context, homeAssistantURL, token string) (string, error) {
	client := http.Client{Timeout: 10 * time.Second}

	req, err := http.NewRequestWithContext(ctx, "GET", homeAssistantURL, http.NoBody)
	if err != nil {
		return "", fmt.Errorf("cannot construct HA request: %w", err)
	}
	req.Header.Add("Authorization", "Bearer "+token)

	res, err := client.Do(req) //nolint:gosec // URL is from server config, not user input
	if err != nil {
		return "", fmt.Errorf("failed to GET grid state: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		return "", fmt.Errorf("unexpected status code from HA: %d", res.StatusCode)
	}

	var body struct {
		State string `json:"state"`
	}

	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		return "", fmt.Errorf("failed to decode HA response: %w", err)
	}

	if body.State != "on" && body.State != "off" {
		return "", fmt.Errorf("unexpected grid state value: %s", body.State)
	}

	return body.State, nil
}
