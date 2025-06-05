//go:build dev

package main

func (a *App) IsDevMode() bool {
	return true
}
