// https://github.com/alex-popov-tech/redis-go/blob/df77b784abd992c8fa52e2ae9c27c0c3b119f74a/app/internal/replicas/registry.go#L23-L47
func (r *Registry) CountAcked(target int64) int {
	r.mu.Lock()
	defer r.mu.Unlock()
	res := 0
	for _, replica := range r.replicas {
		if replica.AckOffset.Load() >= target {
			res++
		}
	}
	return res
}

func (r *Registry) RecordAck(conn net.Conn, target int64) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, replica := range r.replicas {
		if replica.Conn == conn {
			replica.AckOffset.Store(target)
			select {
			case r.ackSignals <- struct{}{}:
			default:
			}
		}
	}
}
