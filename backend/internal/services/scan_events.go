package services

import (
	"sync"

	"quiubox/backend/internal/dto"
)

type ScanEventHub struct {
	mu      sync.RWMutex
	clients map[chan dto.ScanFinishedEvent]struct{}
}

func NewScanEventHub() *ScanEventHub {
	return &ScanEventHub{clients: make(map[chan dto.ScanFinishedEvent]struct{})}
}

func (h *ScanEventHub) Subscribe() chan dto.ScanFinishedEvent {
	ch := make(chan dto.ScanFinishedEvent, 8)
	h.mu.Lock()
	h.clients[ch] = struct{}{}
	h.mu.Unlock()
	return ch
}

func (h *ScanEventHub) Unsubscribe(ch chan dto.ScanFinishedEvent) {
	h.mu.Lock()
	if _, ok := h.clients[ch]; ok {
		delete(h.clients, ch)
		close(ch)
	}
	h.mu.Unlock()
}

func (h *ScanEventHub) Publish(event dto.ScanFinishedEvent) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for ch := range h.clients {
		select {
		case ch <- event:
		default:
		}
	}
}
