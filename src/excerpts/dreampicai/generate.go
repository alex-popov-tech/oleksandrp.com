// https://github.com/alex-popov-tech/dreampicai/blob/4c57194916e161450909fc147e7211d16e131286/handler/generate.go#L71-L89
		prediction, err := replicate.Client.CreatePrediction(
			r.Context(),
			model,
			replicate.PredictionInput{
				"prompt":              prompt,
				"negative_prompt":     negativePrompt,
				"num_outputs":         1,
				"width":               960,
				"height":              1280,
				"output_quality":      100,
				"prompt_strength":     0.8,
				"num_inference_steps": 10,
			},
			&replicate.Webhook{
				URL:    os.Getenv("REPLICATE_WEBHOOK"),
				Events: []replicate.WebhookEventType{"completed"},
			},
			false,
		)
