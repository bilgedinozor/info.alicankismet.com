/* ICON MANAGEMENT */

const ICON_STORAGE_KEY = 'desktop-icons'
// how far (px) the pointer has to travel before a press turns into a drag
const ICON_DRAG_THRESHOLD = 4

class DesktopManager {

    constructor() {
        window.addEventListener('load', this.resizeSelectionCanvas.bind(this))
        window.addEventListener('resize', this.resizeSelectionCanvas.bind(this))
        window.addEventListener('orientationchange', this.resizeSelectionCanvas.bind(this))

        this.desktop = document.querySelector('.desktop')
        this.desktop_container = document.querySelector('.desktop-container')

        // attach icon behaviors
        this.desktop
            .querySelectorAll('.desktop-icon')
            .forEach(icon => {
                this.attachIconSelection(icon)
                if (!isMobileBrowser()) this.attachIconDrag(icon)
            })

        // put the icons where the visitor left them
        this.icon_positions = this.loadIconPositions()
        this.icon_cells = new Map()
        this.layoutIcons()
        window.addEventListener('load', this.layoutIcons.bind(this))
        window.addEventListener('resize', this.layoutIcons.bind(this))
        window.addEventListener('orientationchange', this.layoutIcons.bind(this))

        if (!isMobileBrowser()) this.attachContextMenu()

        document.querySelector('.desktop')
            .addEventListener('click', this.handleClick.bind(this))

        this.canvas = document.querySelector('canvas#selections')
        this.sel_ctx = this.canvas.getContext('2d')
        this.drawing_selection = false
        this.skip_click        = false

        this.resizeSelectionCanvas()

        // attach selection events
        window.mm.addMouseupListener(() => this.handleSelectionEnd())
        if (isMobileBrowser()) {
            this.desktop_container
                .addEventListener('touchstart', this.handleSelectionStart.bind(this))
            this.desktop_container
                .addEventListener('touchend', this.handleSelectionEnd.bind(this))
        } else {
            this.desktop_container
                .addEventListener('pointerdown',  this.handleSelectionStart.bind(this))
            this.desktop_container
                .addEventListener('pointerup', this.handleSelectionEnd.bind(this))
        }

        // taskbar quick
        document.querySelectorAll('.task-bar__quick[data-launch]')
            .forEach(el => {
                el.addEventListener('click', () => window.pm.createInstance(el.dataset.launch))
            })
        
    }

    attachIconSelection(icon) {
        icon.addEventListener('click', () => {
            document.querySelector('.desktop')
                .querySelectorAll('.desktop-icon[data-active="true"]')
                .forEach(el => el.dataset.active = false)

            icon.dataset.active = true
        })
        


        const openProgram = e => {
            e.preventDefault()
            if ('launch' in icon.dataset) {
                window.pm.createInstance(icon.dataset.launch)
            } else {
                window.wm.openWindow({title: 'Sorry!'}, `
                    <p>It doesn't work.</p>
                `)
            }
        }

        icon.addEventListener('dblclick', openProgram)

        if (isMobileBrowser()) {
            // on mobile, fire this on a single click
            icon.addEventListener('click', openProgram)
        }
    }

    getGrid() {
        const style = getComputedStyle(this.desktop)
        const pitchX = parseFloat(style.gridTemplateColumns) + parseFloat(style.columnGap)
        const pitchY = parseFloat(style.gridTemplateRows)    + parseFloat(style.rowGap)

        const width  = this.desktop.clientWidth
            - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
        const height = this.desktop.clientHeight
            - parseFloat(style.paddingTop)  - parseFloat(style.paddingBottom)

        return {
            pitchX,
            pitchY,
            cols: Math.max(1, Math.floor((width  + parseFloat(style.columnGap)) / pitchX)),
            rows: Math.max(1, Math.floor((height + parseFloat(style.rowGap))    / pitchY))
        }
    }

    loadIconPositions() {
        // storage can be blocked or hold junk; the default layout still works
        try {
            return JSON.parse(localStorage.getItem(ICON_STORAGE_KEY)) || {}
        } catch (e) {
            return {}
        }
    }

    saveIconPositions() {
        try {
            localStorage.setItem(ICON_STORAGE_KEY, JSON.stringify(this.icon_positions))
        } catch (e) {}
    }

    layoutIcons() {
        const grid = this.getGrid()
        const icons = [...this.desktop.querySelectorAll('.desktop-icon')]
        const taken = new Set()

        this.icon_cells = new Map()

        // saved positions first, as long as they still fit on this screen
        for (let icon of icons) {
            const pos = this.icon_positions[icon.dataset.launch]
            if (!pos || !Number.isInteger(pos.col) || !Number.isInteger(pos.row)) continue
            if (pos.col < 0 || pos.col >= grid.cols) continue
            if (pos.row < 0 || pos.row >= grid.rows) continue
            if (taken.has(`${pos.col},${pos.row}`)) continue

            taken.add(`${pos.col},${pos.row}`)
            this.icon_cells.set(icon, {col: pos.col, row: pos.row})
        }

        // everything else fills the free cells top to bottom, left to right
        let next = 0
        for (let icon of icons) {
            if (this.icon_cells.has(icon)) continue

            let cell = null
            for (; next < grid.cols * grid.rows && cell === null; next++) {
                const col = Math.floor(next / grid.rows)
                const row = next % grid.rows
                if (!taken.has(`${col},${row}`)) cell = {col, row}
            }

            // no room left: the grid's own auto placement takes over
            if (cell !== null) this.icon_cells.set(icon, cell)
        }

        for (let icon of icons) {
            const cell = this.icon_cells.get(icon)
            icon.style.gridColumn = cell ? cell.col + 1 : ''
            icon.style.gridRow    = cell ? cell.row + 1 : ''
        }
    }

    attachIconDrag(icon) {
        let start = null
        let ghost = null

        const move = e => {
            const dx = e.clientX - start.x
            const dy = e.clientY - start.y

            if (ghost === null) {
                if (Math.hypot(dx, dy) < ICON_DRAG_THRESHOLD) return

                this.clearIconSelections()
                icon.dataset.active = true

                // the icon stays put while a see-through copy follows the pointer
                const rect = icon.getBoundingClientRect()
                ghost = icon.cloneNode(true)
                ghost.classList.add('desktop-icon--ghost')
                ghost.style.left = `${rect.x}px`
                ghost.style.top  = `${rect.y}px`
                document.body.appendChild(ghost)
            }

            ghost.style.transform = `translate(${dx}px, ${dy}px)`
        }

        const end = e => {
            icon.removeEventListener('pointermove', move)
            icon.removeEventListener('pointerup', end)
            icon.removeEventListener('pointercancel', end)

            if (ghost === null) return
            ghost.remove()
            ghost = null

            if (e.type === 'pointerup') {
                this.moveIcon(icon, e.clientX - start.x, e.clientY - start.y)
            }
        }

        icon.addEventListener('pointerdown', e => {
            if (e.button !== 0 || !this.icon_cells.has(icon)) return

            // keep the desktop from starting a selection box under the icon
            e.stopPropagation()

            start = {x: e.clientX, y: e.clientY}
            icon.setPointerCapture(e.pointerId)
            icon.addEventListener('pointermove', move)
            icon.addEventListener('pointerup', end)
            icon.addEventListener('pointercancel', end)
        })

        // otherwise the browser starts its own drag of the icon image
        icon.addEventListener('dragstart', e => e.preventDefault())
    }

    moveIcon(icon, dx, dy) {
        const grid = this.getGrid()
        const from = this.icon_cells.get(icon)
        const clamp = (n, count) => Math.min(Math.max(n, 0), count - 1)
        const to = {
            col: clamp(from.col + Math.round(dx / grid.pitchX), grid.cols),
            row: clamp(from.row + Math.round(dy / grid.pitchY), grid.rows)
        }

        if (to.col === from.col && to.row === from.row) return

        for (let [other, cell] of this.icon_cells) {
            const key = other.dataset.launch

            // pin the icons that were never moved, or they would slide into the gap
            if (!(key in this.icon_positions)) this.icon_positions[key] = cell

            // dropping onto another icon swaps the two
            if (cell.col === to.col && cell.row === to.row) this.icon_positions[key] = from
        }
        this.icon_positions[icon.dataset.launch] = to

        this.saveIconPositions()
        this.layoutIcons()
    }

    /* CONTEXT MENU */

    attachContextMenu() {
        this.context_bg   = document.querySelector('.context-menu__container')
        this.context_menu = this.context_bg.querySelector('.context-menu')

        this.desktop_container.addEventListener('contextmenu', e => {
            // icons keep the browser's own menu for now
            if (e.target.closest('.desktop-icon')) return

            e.preventDefault()
            this.openContextMenu(e.clientX, e.clientY)
        })

        // any press outside of the menu dismisses it
        this.context_bg.addEventListener('mousedown', e => {
            if (e.target === this.context_bg) this.closeContextMenu()
        })
        this.context_bg.addEventListener('contextmenu', e => e.preventDefault())
        window.addEventListener('resize', this.closeContextMenu.bind(this))
        window.addEventListener('keydown', e => {
            if (e.key === 'Escape') this.closeContextMenu()
        })

        this.context_menu.querySelectorAll('[data-action]')
            .forEach(el => {
                el.addEventListener('click', () => {
                    this.closeContextMenu()
                    this.runContextAction(el.dataset.action)
                })
            })

        this.context_menu.querySelectorAll('[data-launch]')
            .forEach(el => {
                el.addEventListener('click', () => {
                    this.closeContextMenu()
                    window.pm.createInstance(el.dataset.launch)
                })
            })
    }

    openContextMenu(x, y) {
        this.clearIconSelections()
        this.context_bg.style.display = 'block'

        // open away from the screen edges, the way windows does
        const rect = this.context_menu.getBoundingClientRect()
        const left = (x + rect.width  > window.innerWidth)  ? x - rect.width  : x
        const top  = (y + rect.height > window.innerHeight) ? y - rect.height : y
        this.context_menu.style.left = `${Math.max(0, left)}px`
        this.context_menu.style.top  = `${Math.max(0, top)}px`

        const submenus = [...this.context_menu.querySelectorAll('.context-menu__submenu')]
        const widest = Math.max(...submenus.map(sub => sub.offsetWidth))
        this.context_menu.classList.toggle(
            'context-menu--flip',
            left + rect.width + widest > window.innerWidth
        )

        // slide up the submenus that would run off the bottom
        for (let sub of submenus) {
            sub.style.top = ''
            const overflow = sub.getBoundingClientRect().bottom - window.innerHeight
            if (overflow > 0) sub.style.top = `${sub.offsetTop - overflow}px`
        }
    }

    closeContextMenu() {
        this.context_bg.style.display = 'none'
    }

    runContextAction(action) {
        const icons = [...this.desktop.querySelectorAll('.desktop-icon')]

        if (action === 'arrange-name') {
            const grid = this.getGrid()
            const name = icon => icon.querySelector('span').innerText

            this.icon_positions = {}
            icons
                .sort((a, b) => name(a).localeCompare(name(b)))
                .forEach((icon, i) => {
                    this.icon_positions[icon.dataset.launch] = {
                        col: Math.floor(i / grid.rows),
                        row: i % grid.rows
                    }
                })
        }

        // not a real toggle: it packs the icons back into their original order
        if (action === 'auto-arrange') {
            this.icon_positions = {}
        }

        if (action === 'refresh') {
            // the desktop blinks while it "redraws"
            this.desktop.style.visibility = 'hidden'
            setTimeout(() => this.desktop.style.visibility = '', 120)
            return
        }

        this.saveIconPositions()
        this.layoutIcons()
    }

    clearIconSelections() {
        document.querySelector('.desktop')
            .querySelectorAll('.desktop-icon[data-active="true"]')
            .forEach(el => el.dataset.active = false)
    }

    handleClick(e) {
        // ensure that we're not firing a click after a selection event
        if (this.skip_click === true) {
            this.skip_click = false
            return
        }

        let assertNotIcon = target => {
            if (target === document.body) return true
            if (target.classList.contains('desktop-icon')) return false
            return assertNotIcon(target.parentNode)
        }

        if (!assertNotIcon(e.target)) return

        this.clearIconSelections()
    }

    checkIconOverlap(icon, x1, y1, x2, y2) {
        let rect = icon.getBoundingClientRect()

        /*
         * Conditions for missing an overlap:
         *      - top edge of sel box is below bottom edge of icon
         *      - left edge of sel box is past right edge of icon
         *      - right edge of sel box is past left edge of icon
         *      - bottom edge of sel box is above top edge of icon
         */

        let i_x1 = rect.x * window.devicePixelRatio
        let i_y1 = rect.y * window.devicePixelRatio

        let i_x2 = (rect.x + rect.width ) * window.devicePixelRatio
        let i_y2 = (rect.y + rect.height) * window.devicePixelRatio


        if (!(Math.min(y1,y2) > i_y2  ||
              Math.max(y1,y2) < i_y1) &&
            !(Math.min(x1,x2) > i_x2  ||
              Math.max(x1,x2) < i_x1)
        ) {
            return true
        }
        return false
    }

    resizeSelectionCanvas() {
        const canvas = document.querySelector('canvas#selections')
        const taskbarHeight = document
            .querySelector('.task-bar')
            .getBoundingClientRect()
            .height

        // get the naive sizing
        let canvas_width = window.innerWidth
        let canvas_height = window.innerHeight - taskbarHeight
        
        // first set the canvas dom element size
        canvas.style.height = `${canvas_height}px`
        canvas.style.width  = `${canvas_width}px`


        // fix the dpi scaling
        let dpi = window.devicePixelRatio


        canvas.setAttribute('width',  canvas_width  * dpi)
        canvas.setAttribute('height', canvas_height * dpi)

        this.canvas_size = {
            width:  canvas_width  * dpi,
            height: canvas_height * dpi
        }

    }

    clearSelectionRect() {
        // clear a rectangle the size of the canvas
        this.sel_ctx.clearRect(0,0,this.canvas_size.width,this.canvas_size.height)
    }

    drawSelectionRect(x1, y1, x2, y2) {

        // scale dpi to match screen pixels to canvas pixels
        let dpi = window.devicePixelRatio
        x1 *= dpi
        y1 *= dpi
        x2 *= dpi
        y2 *= dpi

        // clear the previous one (if any)
        this.clearSelectionRect()

        // begin draw

        this.sel_ctx.beginPath()

        this.sel_ctx.lineWidth = '1px'
        this.sel_ctx.strokeStyle = 'red'
        this.sel_ctx.setLineDash([1])

        // x, y, width, height
        this.sel_ctx.rect(x1, y1, x2 - x1, y2 - y1)

        this.sel_ctx.stroke()

        for (let icon of this.desktop.querySelectorAll('.desktop-icon')) {
            if (this.checkIconOverlap(icon, x1, y1, x2, y2)) {
                icon.dataset.active = true
            } else {
                icon.dataset.active = false
            }
        }
    }


    handleSelectionStart(e) {
        window.mm.updateMousePos(e)

        this.drawing_selection = true
        this.initial_selection_start = {
            x: window.mouse.x,
            y: window.mouse.y
        }

        const updateSelection = () => {
            // conditional hoisted to not break clicking/dblclicking
            if (this.drawing_selection) {

                this.skip_click = true

                this.drawSelectionRect(
                    this.initial_selection_start.x,
                    this.initial_selection_start.y,
                    window.mouse.x,
                    window.mouse.y
                )

                window.requestAnimationFrame(updateSelection)
            }
        }
        setTimeout(updateSelection, 250)
    }

    handleSelectionEnd(e) {
        this.drawing_selection = false
        this.clearSelectionRect()
        // hacky, but this keeps the selections from instantly disappearing
        setTimeout(() => this.skip_click = false, 100) 
    }


}

window.dm = new DesktopManager()
