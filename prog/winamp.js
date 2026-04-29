class WinampProgram extends Program {
    async createWindow(arg) {
        const Webamp = window.Webamp;
        if (!Webamp || !Webamp.browserIsSupported()) {
            alert("Webamp is not supported in this browser.");
            return [{}, ""];
        }

        if (!window.webampInstance) {
            window.webampInstance = new Webamp({
                initialTracks: [
                    {
                        metaData: {
                            artist: "Ali Can Kismet",
                            title: "Portfolio Music",
                        },
                        url: "mp3/sample.mp3", // Just in case user adds it later
                        duration: 0
                    }
                ],
            });

            // Set up container
            let container = document.getElementById('winamp-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'winamp-container';
                document.body.appendChild(container);
            }

            await window.webampInstance.renderWhenReady(container);

            window.webampInstance.onClose(() => {
                window.webampInstance.dispose();
                window.webampInstance = null;
                if (this.handle) {
                    window.wm.removeWindow(this.handle);
                }
            });

            window.webampInstance.onMinimize(() => {
                if (this.handle) {
                    window.wm.minimizeWindow(this.handle);
                }
            });
        } else {
            window.webampInstance.reopen();
        }

        // Return a "ghost" window to provide taskbar presence
        let winfo = {
            name: 'Winamp',
            title: 'Winamp',
            icon: 'img/special/winamp.png',
            resizable: false,
            width: 0,
            height: 0,
            x: -1000,
            y: -1000
        }

        return [winfo, '']
    }

    onAttach(win) {
        this.handle = win;
        win.style.visibility = 'hidden';
        win.style.pointerEvents = 'none';
        
        // Listen for minimization changes to sync with Webamp
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-wm_minimized') {
                    const isMinimized = win.dataset.wm_minimized === 'true';
                    if (isMinimized) {
                        window.webampInstance?.minimize();
                    } else {
                        window.webampInstance?.reopen();
                    }
                }
            });
        });
        observer.observe(win, { attributes: true });
    }
}

window.pm.registerPrototype('winamp', WinampProgram);
