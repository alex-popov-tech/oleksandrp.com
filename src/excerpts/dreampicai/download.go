// https://github.com/alex-popov-tech/dreampicai/blob/4c57194916e161450909fc147e7211d16e131286/handler/replicateWebhook.go#L152-L167
func downloadImage(url, filepath string) error {
	r, err := http.Get(url)
	if err != nil {
		return err
	}
	defer r.Body.Close()

	file, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = io.Copy(file, r.Body)
	return err
}
