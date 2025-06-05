package ffmpeg

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

type FFmpeg struct {
	BinaryPath string
}

func NewFFmpeg() *FFmpeg {
	return &FFmpeg{}
}

func (f *FFmpeg) IsInstalled() bool {
	if f.BinaryPath == "" {
		f.BinaryPath = f.getFFmpegPath()
	}

	if f.BinaryPath == "" {
		return false
	}

	_, err := os.Stat(f.BinaryPath)
	return err == nil
}

func (f *FFmpeg) getFFmpegPath() string {
	homeDir, _ := os.UserHomeDir()
	vibeDir := filepath.Join(homeDir, ".vibecraft")

	var binaryName string
	if runtime.GOOS == "windows" {
		binaryName = "ffmpeg.exe"
	} else {
		binaryName = "ffmpeg"
	}

	return filepath.Join(vibeDir, "ffmpeg", binaryName)
}

func (f *FFmpeg) Download(progressCallback func(progress float64)) error {
	homeDir, _ := os.UserHomeDir()
	vibeDir := filepath.Join(homeDir, ".vibecraft")
	ffmpegDir := filepath.Join(vibeDir, "ffmpeg")

	os.MkdirAll(ffmpegDir, 0755)

	downloadURL := f.getDownloadURL()
	if downloadURL == "" {
		return fmt.Errorf("système non supporté: %s/%s", runtime.GOOS, runtime.GOARCH)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", downloadURL, nil)
	if err != nil {
		return fmt.Errorf("erreur création requête: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("erreur téléchargement: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("erreur HTTP: %d", resp.StatusCode)
	}

	tempFile := filepath.Join(ffmpegDir, "ffmpeg_temp.zip")
	file, err := os.Create(tempFile)
	if err != nil {
		return fmt.Errorf("erreur création fichier: %w", err)
	}
	defer file.Close()
	defer os.Remove(tempFile)

	reader := &progressReader{
		Reader:   resp.Body,
		Total:    resp.ContentLength,
		Callback: progressCallback,
	}

	_, err = io.Copy(file, reader)
	if err != nil {
		return fmt.Errorf("erreur écriture fichier: %w", err)
	}

	file.Close()

	err = f.extractFFmpeg(tempFile, ffmpegDir)
	if err != nil {
		return fmt.Errorf("erreur extraction: %w", err)
	}

	f.BinaryPath = f.getFFmpegPath()

	if !f.IsInstalled() {
		return fmt.Errorf("échec installation ffmpeg")
	}

	return nil
}

func (f *FFmpeg) getDownloadURL() string {
	baseURL := "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest"

	switch runtime.GOOS {
	case "windows":
		if runtime.GOARCH == "amd64" {
			return baseURL + "/ffmpeg-master-latest-win64-gpl.zip"
		}
	case "darwin":
		if runtime.GOARCH == "amd64" || runtime.GOARCH == "arm64" {
			return baseURL + "/ffmpeg-master-latest-macos64-gpl.zip"
		}
	case "linux":
		if runtime.GOARCH == "amd64" {
			return baseURL + "/ffmpeg-master-latest-linux64-gpl.zip"
		}
	}

	return ""
}

func (f *FFmpeg) extractFFmpeg(zipPath, destDir string) error {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer reader.Close()

	var binaryName string
	if runtime.GOOS == "windows" {
		binaryName = "ffmpeg.exe"
	} else {
		binaryName = "ffmpeg"
	}

	for _, file := range reader.File {
		if strings.HasSuffix(file.Name, "/bin/"+binaryName) || strings.HasSuffix(file.Name, "\\bin\\"+binaryName) {
			rc, err := file.Open()
			if err != nil {
				return err
			}

			destPath := filepath.Join(destDir, binaryName)
			destFile, err := os.Create(destPath)
			if err != nil {
				rc.Close()
				return err
			}

			_, err = io.Copy(destFile, rc)
			destFile.Close()
			rc.Close()

			if err != nil {
				return err
			}

			if runtime.GOOS != "windows" {
				err = os.Chmod(destPath, 0755)
				if err != nil {
					return err
				}
			}

			return nil
		}
	}

	return fmt.Errorf("binaire ffmpeg non trouvé dans l'archive")
}

func (f *FFmpeg) ConvertWebMToMP4(webmPath, mp4Path string) error {
	if !f.IsInstalled() {
		return fmt.Errorf("ffmpeg non installé")
	}

	// Vérifier que le fichier source existe et n'est pas vide
	if stat, err := os.Stat(webmPath); err != nil {
		return fmt.Errorf("fichier WebM inaccessible: %w", err)
	} else if stat.Size() == 0 {
		return fmt.Errorf("fichier WebM source vide")
	}

	cmd := exec.Command(f.BinaryPath,
		"-i", webmPath,
		"-c:v", "libx264",
		"-c:a", "aac",
		"-preset", "medium",
		"-crf", "20",
		"-pix_fmt", "yuv420p",
		"-movflags", "+faststart",
		"-y",
		mp4Path,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg error: %w - output: %s", err, string(output))
	}

	// Vérifier que le fichier MP4 a été créé
	if stat, err := os.Stat(mp4Path); err != nil {
		return fmt.Errorf("fichier MP4 non créé: %w", err)
	} else if stat.Size() == 0 {
		return fmt.Errorf("fichier MP4 créé mais vide")
	}

	return nil
}

type progressReader struct {
	Reader   io.Reader
	Total    int64
	Current  int64
	Callback func(progress float64)
}

func (pr *progressReader) Read(p []byte) (int, error) {
	n, err := pr.Reader.Read(p)
	pr.Current += int64(n)

	if pr.Callback != nil && pr.Total > 0 {
		progress := float64(pr.Current) / float64(pr.Total)
		pr.Callback(progress)
	}

	return n, err
}
