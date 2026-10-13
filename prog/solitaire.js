// seven columns of cards and the gaps between them: any narrower and the
// cards start to overlap
const SOLITAIRE_MIN_WIDTH = 520

class SolitaireProgram extends Program {
    createWindow() {
        const winfo = {
            name: 'Solitaire',
            title: 'Solitaire',
            icon: 'img/special/solitaire-16.png',
            resizable: true,
            margin: false,
            app: true,
            width: 600,
            height: 440
        }

        // the game is js-solitaire by Radovan Janjic, a page of its own (see
        // prog/solitaire). Only the menu bar is ours
        const body = `
            <div class="menu-bar__container">
                <div class="menu-bar__menu">
                    <div class="menu-bar__handle"></div>
                    <span class="menu-bar__item">
                        Game
                        <ul class="menu-bar__submenu">
                            <li class="menu-bar__subitem" data-name="deal">Deal<span class="menu-bar__shortcut">F2</span></li>
                            <li class="menu-bar__hr"></li>
                            <li class="menu-bar__subitem menu-bar__subitem--disabled">Undo</li>
                            <li class="menu-bar__subitem menu-bar__subitem--disabled">Deck...</li>
                            <li class="menu-bar__subitem menu-bar__subitem--disabled">Options...</li>
                            <li class="menu-bar__hr"></li>
                            <li class="menu-bar__subitem" data-name="exit">Exit</li>
                        </ul>
                    </span>
                    <span class="menu-bar__item">
                        Help
                        <ul class="menu-bar__submenu">
                            <li class="menu-bar__subitem" data-name="about">About Solitaire</li>
                        </ul>
                    </span>
                </div>
            </div>
            <div class="game__viewport">
                <iframe class="game__frame" src="prog/solitaire/index.html" title="Solitaire"></iframe>
            </div>
        `

        return [winfo, body]
    }

    onAttach() {
        this.initializeMenuHandler()

        this.viewport = this.getBodyHandle().querySelector('.game__viewport')
        this.frame = this.viewport.querySelector('iframe')
        this.layout()

        // the window is resized, maximized, or the phone is turned
        new ResizeObserver(() => this.layout()).observe(this.viewport)

        // F2 deals, as it does in windows. The key goes to the frame or to
        // the page around it, whichever was clicked last
        this.onKeyDown = e => {
            const win = this.handle.dataset
            if (e.key !== 'F2' || win.wm_order !== '0' || win.wm_minimized === 'true') return

            e.preventDefault()
            if (!e.repeat) this.deal()
        }
        window.addEventListener('keydown', this.onKeyDown)

        // the game deals its first hand as it loads
        this.dealing = true
        this.frame.addEventListener('load', () => {
            const game = this.frame.contentWindow
            game.addEventListener('keydown', this.onKeyDown)
            game.requestAnimationFrame(() => this.dealing = false)
        })
    }

    onClose() {
        window.removeEventListener('keydown', this.onKeyDown)
    }

    // the game fills the window. In one that's too narrow for it (a phone's)
    // the whole table is scaled down instead
    layout() {
        const width  = this.viewport.clientWidth
        const height = this.viewport.clientHeight
        if (width === 0 || height === 0) return

        const scale = Math.min(1, width / SOLITAIRE_MIN_WIDTH)

        this.frame.style.width  = `${width  / scale}px`
        this.frame.style.height = `${height / scale}px`
        this.frame.style.transform = (scale === 1) ? '' : `scale(${scale})`
    }

    // the game lays the cards out on the next frame it draws, and a second
    // deal before that leaves it with two hands at once
    deal() {
        if (this.dealing) return
        this.dealing = true

        const game = this.frame.contentWindow
        game.resetGame()
        game.requestAnimationFrame(() => this.dealing = false)
    }

    handleMenuClick(name) {
        switch (name) {
            case 'deal':
                this.deal()
                break
            case 'exit':
                this.closeWindow()
                break
            case 'about':
                window.pm.createInstance(
                    'dialog:img/special/solitaire.png|About Solitaire|'
                    + 'Solitaire<br><br>js-solitaire by Radovan Janjic, '
                    + 'the way it comes with 98.js.org.|OK'
                )
                break
        }
    }
}

window.pm.registerPrototype('sol', SolitaireProgram)
