class ProgramManager {
    constructor() {
        this.prototypes = {}
        this.instances = {}

        // programs whose code is only fetched the first time they're launched
        this.lazy = {}
        this.loading = {}
    }

    registerPrototype(name, class_prototype) {
        this.prototypes[name] = class_prototype
    }

    // scripts are loaded in order, and the last one has to register the prototype
    registerLazy(name, scripts) {
        this.lazy[name] = scripts
    }

    hasPrototype(name) {
        return (name in this.prototypes) || (name in this.lazy)
    }

    // whether createInstance would find something to launch for this
    canLaunch(name) {
        name = name.trim()
        if (name === 'nop' || (name.length > 4 && name.slice(0,4) === 'web:')) {
            return true
        }

        return this.hasPrototype(name.split(':')[0].toLowerCase())
    }

    listPrograms() {
        return [...new Set([...Object.keys(this.prototypes), ...Object.keys(this.lazy)])]
    }

    loadScript(src) {
        if (!this.loading[src]) {
            this.loading[src] = new Promise((resolve, reject) => {
                const script = document.createElement('script')
                script.src = src
                script.onload = resolve
                script.onerror = () => {
                    // allow a retry on the next launch
                    delete this.loading[src]
                    script.remove()
                    reject(new Error(`could not load ${src}`))
                }
                document.head.appendChild(script)
            })
        }

        return this.loading[src]
    }

    createID() {
        // honestly this probably won't collide (16 ^ 10 = ~ 1 trilion)
        // if you get a collision you should probably buy a lottery ticket
        const alphabet = 'abcdef0123456789'
        let str = ''
        for (let i = 0; i < 10; i++) {
            str += alphabet[Math.floor(Math.random() * alphabet.length)]
        }
        return str
    }

    hasInstance(id) {
        return (id in this.instances)
    }

    async createInstance(name) {
        // names typed into run or the dos prompt come with stray spaces
        name = name.trim()

        // slight hack, but allow web: links to be opened in new tabs
        if (name.length > 4 && name.slice(0,4) === 'web:') {
            console.log('opening web link')
            document.querySelector('#dummy')
                .setAttribute('href', name.slice(4))

            document.querySelector('#dummy').click()

            return
        }

        if (name === 'nop') {
            return
        }

        // argument handling for general programs
        let arg = null;
        if (name.indexOf(':') !== -1) {
            [name, arg] = name.split(/:(.+)/)
        }

        // like windows, don't tell upper and lower case apart in a program's
        // name. its argument (a folder, a file) stays the way it was typed
        name = name.toLowerCase()
        console.log('launching ', name, ' with arg ', arg)

        if (!(name in this.prototypes) && (name in this.lazy)) {
            for (let src of this.lazy[name]) {
                await this.loadScript(src)
            }
        }

        if (!(name in this.prototypes)) {
            console.warn(`attempted to open unregistered program ${name}, ignoring...`)
            return
        }

        // every window only opens once: launching something that's already
        // open brings its window to the front instead
        const key = this.prototypes[name].keyFor(name, arg)
        const running = this.findInstance(key)
        if (running) {
            running.focusWindow()
            return running
        }

        const id = this.createID()

        // this feels real hacky
        const handle = this.instances[id] = new (this.prototypes[name])(id)
        handle._pm_key = key

        // a program can decline to open a window by returning nothing
        let created
        try {
            created = await handle.createWindow(arg)
        } catch (e) {
            // don't leave a windowless instance behind, it would block relaunching
            delete this.instances[id]
            throw e
        }
        if (!created) {
            delete this.instances[id]
            return
        }
        const [wminfo, body] = created

        window.wm.openWindow(wminfo, body, win => {
            win.dataset._pm_id = id

            // make sure the thing knows about the window
            handle.setWindowHandle(win)

            // dispatch handler
            handle.onAttach(win)
        })

        return handle
    }

    findInstance(key) {
        for (let id of Object.keys(this.instances)) {
            const instance = this.instances[id]
            if (instance._pm_key !== key) continue

            // windows removed without going through closeInstance leave these behind
            if (instance.handle && !instance.handle.isConnected) {
                delete this.instances[id]
                continue
            }

            return instance
        }

        return null
    }

    // take over a window that was in the page from the start, rather than
    // opened by a program
    adoptWindow(name, win) {
        const id = this.createID()
        const handle = this.instances[id] = new (this.prototypes[name])(id)
        handle._pm_key = this.prototypes[name].keyFor(name, null)

        win.dataset._pm_id = id
        handle.setWindowHandle(win)
    }

    getInstance(id) {
        if (!this.hasInstance(id)) {
            console.warn(`attempted to get unknown instance ${id}, ignoring...`)
            return
        }

        return this.instances[id]
    }

    closeInstance(id) {
        if (!this.hasInstance(id)) {
            console.warn(`attempted to close unknown instance ${id}, ignoring...`)
            return
        }

        this.instances[id].onClose()

        delete this.instances[id]
    }

}

// base class for further programs
class Program {
    constructor(id) {
        this._pm_id = id
    }

    // identifies what a window is showing: two launches with the same key
    // share one window
    static keyFor(name, arg) {
        return (arg == null) ? name : `${name}:${arg}`
    }

    async createWindow(arg) {
        let body = `
            <p> Default window </p>
        `

        let wminfo = {
            title: 'Hello!',
            name:  'Default Program',
            icon:  'img/desktop/EXE.png'
        }

        return [wminfo, body]
    }

    initializeMenuHandler() {
        const menus = this
            .getBodyHandle()
            .querySelectorAll('.menu-bar__item')

        // add function for closing stuff
        const closeMenu = () => {
            document.querySelectorAll('.menu-bar__submenu-bg')
                .forEach(el => {
                    el.classList.remove('menu-bar__submenu-bg--active')
                })
            document.querySelectorAll('.menu-bar__submenu')
                .forEach(el => {
                    el.classList.remove('menu-bar__submenu--active')
                })
            document.querySelectorAll('.menu-bar__item')
                .forEach(el => el.classList.remove('menu-bar__item--active'))
        }

        let bg = this.getBodyHandle()
            .parentElement
            .querySelector('.menu-bar__submenu-bg')

        if (bg === null) {
            // create the click catcher bg
            bg = document.createElement('div')
            bg.classList.add('menu-bar__submenu-bg')

            bg.addEventListener('click', () => {
                closeMenu()
            })

            // put the background down
            this
                .getBodyHandle()
                .parentElement
                .appendChild(bg)
        }


        for (let menu of menus) {
            let submenu = menu.querySelector('.menu-bar__submenu')
            if (submenu !== null) {
                menu.addEventListener('click', e => {

                    if (e.target !== menu) {return}

                    bg.classList.add('menu-bar__submenu-bg--active')
                    menu.classList.add('menu-bar__item--active')
                    submenu.classList.add('menu-bar__submenu--active')
                })

                // add event listeners for item clicking
                submenu
                    .querySelectorAll('[data-name]')
                    .forEach(el => {
                        el.addEventListener('click', e => {
                            this.handleMenuClick(e.target.dataset.name)

                            closeMenu()
                        })
                    })
            }
        }
    }

    handleMenuClick(name) {}

    setWindowHandle(win) {
        this.handle = win
    }

    getBodyHandle() {
        if (this.handle === null) {
            return null
        }
        return this.handle.querySelector('.window-body')
    }

    focusWindow() {
        // still starting up
        if (!this.handle) return

        window.wm.windowFocus(this.handle)
    }

    setWindowTitle(title) {
        this.handle
            .querySelector('.title-bar-text')
            .innerText = title
    }

    setWindowIcon(icon) {
        this.handle.dataset.icon = icon
        window.wm.redrawTaskbarMain()
    }
    setWindowName(name) {
        this.handle.dataset.name = name
        window.wm.redrawTaskbarMain()
    }

    onAttach() {}
    onClose() {}

    onResize() {}
    onResizeEnd() {}

    closeWindow() {
        // this is a hack...
        this.handle.querySelector('button[aria-label="Close"]').click()
    }
}

window.pm = new ProgramManager()

// xterm alone is bigger than the rest of the page put together
window.pm.registerLazy('cmd', ['lib/xterm/xterm.js', 'lib/xterm/fit.js', 'prog/prompt.js'])

// the games are fetched by whoever plays them
window.pm.registerLazy('winmine', ['prog/minesweeper.js'])
window.pm.registerLazy('sol', ['prog/solitaire.js'])
