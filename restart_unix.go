//go:build !windows

package main

import (
	"os"
	"os/exec"
	"time"
)

func (a *App) restartApplication(currentExe string) {
	go func() {
		time.Sleep(2 * time.Second)

		// Approche Unix/Linux/macOS
		cmd := exec.Command("nohup", currentExe)
		cmd.Start()

		os.Exit(0)
	}()
}

func (a *App) testRestart(currentExe string) {
	go func() {
		time.Sleep(3 * time.Second)

		cmd := exec.Command("nohup", currentExe)
		err := cmd.Start()
		if err != nil {
			// Log error
		}

		os.Exit(0)
	}()
}
