class WinampProgram extends Program {
    // webamp is ~1MB, so it's only fetched the first time winamp is launched
    static loadWebamp() {
        if (window.Webamp) return Promise.resolve(window.Webamp)

        if (!WinampProgram.loading) {
            WinampProgram.loading = new Promise((resolve, reject) => {
                const script = document.createElement('script')
                script.src = 'lib/webamp/webamp.bundle.min.js'
                script.onload = () => resolve(window.Webamp)
                script.onerror = () => {
                    // allow a retry on the next launch
                    WinampProgram.loading = null
                    script.remove()
                    reject(new Error('could not load webamp'))
                }
                document.head.appendChild(script)
            })
        }

        return WinampProgram.loading
    }

    // tracks are listed in mp3/playlist.json (see mp3/playlist.example.json)
    static async loadTracks() {
        try {
            const res = await fetch('mp3/playlist.json', {cache: 'no-cache'})
            if (!res.ok) return []

            const playlist = await res.json()
            return playlist.map(({file, artist, title}) => {
                const track = {
                    url: `mp3/${encodeURIComponent(file)}`,
                    defaultName: title || file
                }
                // without both of these webamp reads the tags from the file
                if (artist && title) {
                    track.metaData = {artist, title}
                }
                return track
            })
        } catch (e) {
            console.warn('could not read the winamp playlist', e)
            return []
        }
    }

    async createWindow() {
        document.body.style.cursor = 'wait'
        try {
            const [Webamp, initialTracks] = await Promise.all([
                WinampProgram.loadWebamp(),
                WinampProgram.loadTracks()
            ])
            if (!Webamp.browserIsSupported()) {
                throw new Error('browser is not supported by webamp')
            }

            // webamp centers itself on this node
            this.container = document.createElement('div')
            this.container.id = 'winamp-container'
            document.body.appendChild(this.container)

            // the context menu sits at zIndex + 1: above every window, below the taskbar
            this.webamp = new Webamp({initialTracks, zIndex: 900})
            await this.webamp.renderWhenReady(this.container)
        } catch (e) {
            console.warn('could not start winamp', e)
            this.onClose()
            window.pm.createInstance('dialog:Error|Winamp|Winamp could not be started.|OK')
            return null
        } finally {
            document.body.style.cursor = ''
        }

        // webamp draws its own windows, so this one is never shown: it only
        // gives winamp a taskbar button and a slot in the window order
        let wminfo = {
            name: 'Winamp',
            icon: 'img/special/winamp.png',
            width: 0,
            height: 0,
            x: -1000,
            y: -1000
        }

        return [wminfo, '']
    }

    onAttach(win) {
        win.style.visibility = 'hidden'
        win.style.pointerEvents = 'none'

        this.root = document.getElementById('webamp')

        // clicking winamp brings it to the front like any other window
        const focus = () => {
            // focusing redraws the taskbar. When that happens under a finger,
            // ios takes the new buttons for what a hover revealed and never
            // sends the tap's click, so winamp's own buttons go dead: leave
            // everything alone when there's nothing to bring forward
            if (this.isInFront()) return
            this.focusWindow()
        }
        this.root.addEventListener('mousedown', focus, true)
        // a tap arrives as a mousedown as well, once ios has made up its
        // mind, so only a drag has to be caught from the touch itself
        this.root.addEventListener('touchmove', focus, {capture: true, passive: true})

        this.webamp.onMinimize(() => window.wm.minimizeWindow(win))
        this.webamp.onClose(() => this.closeWindow())

        // mirror the window's order and minimized state onto webamp
        this.observer = new MutationObserver(() => this.syncWithWindow())
        this.observer.observe(win, {
            attributes: true,
            attributeFilter: ['style', 'data-wm_minimized']
        })
        this.syncWithWindow()
    }

    isInFront() {
        return this.handle.dataset.wm_order === '0'
            && this.handle.dataset.wm_minimized !== 'true'
    }

    syncWithWindow() {
        this.root.style.setProperty('--winamp-z', this.handle.style.zIndex)
        // hidden rather than paused, so the music keeps playing while minimized
        this.root.style.display = (this.handle.dataset.wm_minimized === 'true') ? 'none' : ''
    }

    onClose() {
        this.observer?.disconnect()

        const webamp = this.webamp
        this.webamp = null
        webamp?.dispose()

        this.container?.remove()
    }
}

window.pm.registerPrototype('winamp', WinampProgram)
