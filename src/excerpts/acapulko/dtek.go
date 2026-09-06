// https://github.com/alex-popov-tech/acapulko/blob/4619bdd0f8190ba4c231d5b8bf71ecafe9fd8ef3/src/services/dtek/dtek.go#L43-L67
	go func() {
		log().Info("polling started", "interval", pollInterval)
		ticker := time.NewTicker(pollInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				log().Info("polling stopped")
				return
			case <-ticker.C:
			}

			outage, err := getOutage(ctx, client, dtekBaseURL, region, city, street, building)
			if err != nil {
				log().Error("poll failed", "error", err)
			} else if !prevOutage.Equal(outage) {
				prevOutage = outage
				outageUpdates <- outage
			}
		}
	}()

	return prevOutage, nil
}
