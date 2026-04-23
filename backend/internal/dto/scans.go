package dto

type StartScanRequest struct {
	Target   string `json:"target"`
	ScanType string `json:"scanType"`
	UserID   string `json:"userId,omitempty"`
}

type ScanResponse struct {
	ID            string `json:"id"`
	Target        string `json:"target"`
	ScanType      string `json:"scanType"`
	Status        string `json:"status"`
	StartedAt     string `json:"startedAt,omitempty"`
	FinishedAt    string `json:"finishedAt,omitempty"`
	CriticalCount int64  `json:"criticalCount"`
	MediumCount   int64  `json:"mediumCount"`
	LowCount      int64  `json:"lowCount"`
}

type MitigationRecommendation struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type NVDDetails struct {
	CVEID        string   `json:"cveId"`
	CVSSScore    *float64 `json:"cvssScore,omitempty"`
	Description  string   `json:"description"`
	ReferenceURL string   `json:"referenceUrl"`
}

type VulnerabilityResponse struct {
	ID              string                     `json:"id"`
	ScanID          string                     `json:"scanId"`
	Title           string                     `json:"title"`
	Severity        string                     `json:"severity"`
	CVE             string                     `json:"cve,omitempty"`
	Summary         string                     `json:"summary"`
	Recommendations []MitigationRecommendation `json:"recommendations"`
	NVD             *NVDDetails                `json:"nvd,omitempty"`
}

type ScanFinishedEvent struct {
	Type          string       `json:"type"`
	ScanID        string       `json:"scanId"`
	Status        string       `json:"status"`
	CriticalCount int64        `json:"criticalCount"`
	MediumCount   int64        `json:"mediumCount"`
	LowCount      int64        `json:"lowCount"`
	Scan          ScanResponse `json:"scan"`
}
