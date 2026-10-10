class WelcomeProgram extends Program {
    createWindow() {
        let body = window.__welcomepage
        let wminfo = {
            title: 'Welcome!',
            name: 'Welcome!',
            icon: 'img/taskbar/WindowsFlagSmall.png',
        }

        return [wminfo, body]
    }

    onAttach() {
        this.getBodyHandle().classList.add('typography')

        // not all of these links are in the page at the moment
        this.getBodyHandle()
            .querySelector('[data-upgrade="intro-launchresume"]')
            ?.addEventListener('click', e => {
                e.preventDefault()
                window.pm.createInstance('resume')
            })

        this.getBodyHandle()
            .querySelector('[data-upgrade="intro-launchportfolio"]')
            ?.addEventListener('click', e => {
                e.preventDefault()
                window.pm.createInstance('portfolio')
            })

        this.getBodyHandle()
            .querySelector('[data-upgrade="intro-launchemail"]')
            ?.addEventListener('click', e => {
                e.preventDefault()
                window.pm.createInstance('email')
            })
    }
}

window.pm.registerPrototype('welcome', WelcomeProgram)

// the welcome window that's in the page from the start is this program too
{
    const initial = document.querySelector('.window[data-_wm_id="initialwindow"]')
    if (initial) {
        window.pm.adoptWindow('welcome', initial)
    }
}
