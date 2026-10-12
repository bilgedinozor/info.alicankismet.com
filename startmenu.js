class StartMenuManager {
    constructor() {
        this.bg   = document.querySelector('.start-menu__container')
        this.menu = document.querySelector('.start-menu')
        this.btn  = document.querySelector('#start-btn')

        this.btn.addEventListener('click', this.openStartMenu.bind(this))
        this.bg.addEventListener('click', this.startMenuBackgroundClick.bind(this))

        this.menu.querySelectorAll('[data-launch]')
            .forEach(el => this.attachLaunchClickHandler(el))

        this.menu.querySelectorAll('a')
            .forEach(el => this.attachLinkClickHandler(el))

        this.menu.querySelectorAll('.start-menu__item, .start-menu__submenu-item')
            .forEach(el => this.attachSubmenuToggle(el))
    }

    openStartMenu() {
        this.bg.style.display = 'block'
        this.btn.classList.add('start-btn--active')
    }

    startMenuBackgroundClick(e) {
        if (e.target !== this.bg) {
            return
        }
        this.closeStartMenu()
    }

    closeStartMenu() {
        this.bg.style.display = 'none'
        this.btn.classList.remove('start-btn--active')

        this.menu.querySelectorAll('[data-open="true"]')
            .forEach(el => el.dataset.open = false)
    }

    // there's no hovering on a phone: tapping an item folds its submenu open
    // underneath it instead (see css/mobile.css)
    attachSubmenuToggle(el) {
        const submenu = el.querySelector(':scope > .start-menu__submenu-container')
        if (submenu === null) return

        el.addEventListener('click', e => {
            if (!isPhoneLayout() || submenu.contains(e.target)) return

            const wasOpen = el.dataset.open === 'true'

            // one open submenu per level
            el.parentElement
                .querySelectorAll(':scope > [data-open="true"]')
                .forEach(other => other.dataset.open = false)

            el.dataset.open = !wasOpen
        })
    }
    
    attachLaunchClickHandler(el) {
        if (!el.dataset.launch) {return;}
        el.addEventListener('click', () => {
            this.closeStartMenu()
            window.pm.createInstance(el.dataset.launch)
        })
    }

    attachLinkClickHandler(el) {
        el.addEventListener('click', () => this.closeStartMenu())
    }
}

window.sm = new StartMenuManager()
