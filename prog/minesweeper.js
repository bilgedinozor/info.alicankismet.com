class MinesweeperProgram extends Program {
    createWindow() {
        const winfo = {
            name: 'Minesweeper',
            title: 'Minesweeper',
            icon: 'img/special/minesweeper-16.png',
            margin: false
        }

        // the game is winmine.html by Anthony Fucci: a page of its own, menu
        // bar included (see prog/minesweeper)
        const body = `
            <div class="game__viewport">
                <iframe class="game__frame" src="prog/minesweeper/winmine.html" title="Minesweeper"></iframe>
            </div>
        `

        return [winfo, body]
    }

    onAttach() {
        this.viewport = this.getBodyHandle().querySelector('.game__viewport')
        this.frame = this.viewport.querySelector('iframe')

        // a beginner's board, until the game says what it has dealt
        this.board = {width: 148, height: 211}
        this.layout()

        // a new game, or another board, is a new page in the frame
        this.frame.addEventListener('load', () => this.attachGame())

        // F2 starts a new game, as it does in windows. The key goes to the
        // frame or to the page around it, whichever was clicked last
        this.onKeyDown = e => {
            const win = this.handle.dataset
            if (e.key !== 'F2' || win.wm_order !== '0' || win.wm_minimized === 'true') return

            e.preventDefault()
            if (!e.repeat) this.newGame()
        }
        window.addEventListener('keydown', this.onKeyDown)
    }

    onClose() {
        window.removeEventListener('keydown', this.onKeyDown)
    }

    // what New in the game's own menu does
    newGame() {
        this.frame.contentDocument
            .querySelector('.menu-item[data-name="New"]')
            ?.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}))
    }

    attachGame() {
        const game = this.frame.contentWindow
        const winmine = game.winmine
        if (!winmine) return

        // on its own, winmine starts a new game when the page is reloaded,
        // and says so in its menu
        game.addEventListener('keydown', this.onKeyDown)
        const key = game.document.querySelector('.menu-item[data-name="New"] > div')
        if (key !== null) key.textContent = 'F2'

        // winmine expects a browser window to itself: it opens another one
        // for a board of another size, and closes its own on exit
        game.open = url => {
            game.location.href = new URL(url, game.location.href).href
            return null
        }
        game.close = () => setTimeout(() => this.closeWindow())

        // the same sum winmine does when it sizes those windows
        this.setBoard(
            winmine.width  * winmine.setting.x_px + 20,
            winmine.height * winmine.setting.y_px + 83
        )

        // followed inside the frame, a link would replace the game
        game.document.querySelectorAll('a[href]').forEach(a => {
            a.target = '_blank'
            a.rel = 'noopener'
        })

        this.attachTouch(game)
    }

    setBoard(width, height) {
        if (!(width > 0 && height > 0)) return

        this.board = {width, height}
        this.layout()

        // a bigger board can leave the window hanging off the screen
        window.wm.fitToScreen(this.handle)
    }

    // the window is as big as the board. A board that doesn't fit on the
    // screen is scaled down, and on a phone a small one is scaled up: its
    // squares are 16 pixels, too small for a finger
    layout() {
        const area = window.wm.getWorkArea()
        const win  = this.handle.getBoundingClientRect()
        const body = this.getBodyHandle().getBoundingClientRect()

        // what the window puts around the board: its edge and its title bar
        const edge = body.left - win.left
        const roomW = area.width  - edge * 2 - 8
        const roomH = area.height - (body.top - win.top) - edge - 8

        const scale = Math.min(
            isPhoneLayout() ? 2 : 1,
            roomW / this.board.width,
            roomH / this.board.height
        )

        this.viewport.style.width  = `${Math.floor(this.board.width  * scale)}px`
        this.viewport.style.height = `${Math.floor(this.board.height * scale)}px`
        this.frame.style.width  = `${this.board.width}px`
        this.frame.style.height = `${this.board.height}px`
        this.frame.style.transform = (scale === 1) ? '' : `scale(${scale})`
    }

    // the screen changed shape
    onResize() {
        this.layout()
    }

    // winmine only knows the mouse
    attachTouch(game) {
        this.attachTouchBoard(game)
        this.attachTouchMenu(game)
    }

    // a finger has no right button. On the board a tap is a click, and
    // holding a square down marks it the way a right click would. The delay
    // is the one the desktop's menu opens after (see desktop.js)
    attachTouchBoard(game) {
        const field = game.document.querySelector('.cell-container')
        if (field === null) return

        let cell = null
        let start = null
        let timer = null

        const click = button => {
            for (let type of ['mousedown', 'mouseup']) {
                cell.dispatchEvent(new game.MouseEvent(type, {
                    button,
                    bubbles: true,
                    cancelable: true,
                    view: game
                }))
            }
        }

        const cancel = () => {
            clearTimeout(timer)
            timer = null
            cell = null
        }

        field.addEventListener('touchstart', e => {
            cancel()

            // the clicks are made here: keep the browser from adding its own
            e.preventDefault()
            if (e.touches.length !== 1 || !e.target.id.startsWith('cell_')) return

            cell = e.target
            start = {x: e.touches[0].clientX, y: e.touches[0].clientY}
            timer = setTimeout(() => {
                click(2)
                cancel()
            }, LONG_PRESS_DELAY)
        }, {passive: false})

        // sliding off the square is the way out of a tap
        field.addEventListener('touchmove', e => {
            if (cell === null) return

            const dx = e.touches[0].clientX - start.x
            const dy = e.touches[0].clientY - start.y
            if (Math.hypot(dx, dy) > LONG_PRESS_SLOP) cancel()
        }, {passive: true})

        field.addEventListener('touchend', () => {
            if (cell !== null) click(0)
            cancel()
        })
        field.addEventListener('touchcancel', cancel)
    }

    // nor can a finger hover, which is what opens winmine's menus. A tap on a
    // menu's name opens it (see prog/minesweeper/win98.css), a tap on one of
    // its items picks that, and a tap anywhere else puts it away
    attachTouchMenu(game) {
        const doc = game.document
        const names = '.menu-game-button, .menu-help-button, .menu-extra-button'

        const close = () => doc.querySelectorAll('.touch-open')
            .forEach(el => el.classList.remove('touch-open'))

        doc.addEventListener('touchstart', e => {
            const name = e.target.closest(names)
            const item = e.target.closest('.menu-item')
            if (name === null && item === null) {
                close()
                return
            }

            // or the browser would hover for the finger after all, and leave
            // the menu open
            e.preventDefault()
            if (name === null) return

            const menu = name.parentElement
            const open = menu.classList.contains('touch-open')
            close()
            if (!open) menu.classList.add('touch-open')
        }, {passive: false})

        doc.addEventListener('touchend', e => {
            const item = e.target.closest('.menu-item')
            if (item === null) return

            close()
            item.dispatchEvent(new game.MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                view: game
            }))
        })
    }
}

window.pm.registerPrototype('winmine', MinesweeperProgram)
