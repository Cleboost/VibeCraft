//go:build windows

package main

import (
	"os"
	"os/exec"
	"syscall"
	"time"
)

func (a *App) restartApplication(currentExe string) {
	go func() {
		time.Sleep(2 * time.Second)

		// Méthode 1: Approche directe
		cmd := exec.Command(currentExe)
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    false,      // On veut voir la nouvelle fenêtre
			CreationFlags: 0x00000008, // DETACHED_PROCESS
		}
		err := cmd.Start()

		// Méthode 2: Fallback avec PowerShell si la première échoue
		if err != nil {
			cmdPS := exec.Command("powershell", "-Command", "Start-Process", "-FilePath", currentExe)
			cmdPS.SysProcAttr = &syscall.SysProcAttr{
				HideWindow:    true,
				CreationFlags: 0x08000000,
			}
			cmdPS.Start()
		}

		os.Exit(0)
	}()
}

func (a *App) testRestart(currentExe string) {
	go func() {
		time.Sleep(3 * time.Second)

		cmd := exec.Command(currentExe)
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    false,
			CreationFlags: 0x00000008,
		}
		err := cmd.Start()
		if err != nil {
			// Log error
		}

		os.Exit(0)
	}()
}
