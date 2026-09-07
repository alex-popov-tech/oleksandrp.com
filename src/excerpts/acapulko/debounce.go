// https://github.com/alex-popov-tech/acapulko/blob/4619bdd0f8190ba4c231d5b8bf71ecafe9fd8ef3/src/services/homeassistant/homeassistant.go#L111-L127
func debounce(
	timeout time.Duration,
	action func(WebhookPayload),
) func(WebhookPayload) {
	var mu sync.Mutex
	var timer *time.Timer
	return func(payload WebhookPayload) {
		mu.Lock()
		defer mu.Unlock()
		if timer != nil {
			timer.Stop()
		}
		timer = time.AfterFunc(timeout, func() {
			action(payload)
		})
	}
}
