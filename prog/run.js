class RunProgram extends Program {
    createWindow() {
        let winfo = {
            title: 'Run',
            name: 'Run',
            y: window.innerHeight - 180,
            x: 10,
            app: true
        }

        let body = `
                <div class="window__dialog">
                    <div class="window__dialog-info">
                        <img src="img/startmenu/Run.png"/>
                        <p>
                            Type the name of a program, folder, document, or Internet <br/>
                            resource and Windows will open it for you.
                        </p>
                    </div>
                    <div class="menu-bar__menu run__runbar">
                        <span class="menu-bar__label">Open:</span>
                        <input class="menu-bar__input" autofocus type="text" name="prog">
                    </div>
                    <div class="window__dialog-action">
                        <button class="run__open">OK</button>
                        <button class="run__close">Cancel</button>
                    </div>
                </div>
        `

        return [winfo, body]
    }

    launchProgram() {
        const input = this.getBodyHandle()
            .querySelector('input[name="prog"]')
        const prog = input.value.trim()

        // windows keeps OK greyed out until something has been typed
        if (prog === '') return

        if (!window.pm.canLaunch(prog)) {
            this.showNotFound(prog, input)
            return
        }

        window.pm.createInstance(prog)
        this.closeWindow()
    }

    // the message windows 98 gives for a name it can't find. run stays open
    // behind it, and gets the name back, selected, to be typed again
    async showNotFound(prog, input) {
        // the name ends up in the dialog's markup, inside a | separated argument
        const name = prog.replace(/[&<>"'|]/g, c => `&#${c.charCodeAt(0)};`)

        const dialog = await window.pm.createInstance(
            `dialog:Error|${name}|Cannot find the file '${name}' (or one of its components). `
            + 'Make sure the path and filename are correct and that all required libraries are available.|OK'
        )

        dialog.onClose = () => {
            if (!this.handle.isConnected) return

            this.focusWindow()
            input.focus()
            input.select()
        }
    }

    // on key down, not up: the enter that dismisses the message above is
    // released back in this field, and would bring the message straight up again
    handleKeyDown(e) {
        if (e.keyCode !== 13) return

        // without this the rest of the same press goes to the message's OK
        // button, which has the focus by then, and dismisses it unseen
        e.preventDefault()
        if (!e.repeat) this.launchProgram()
    }

    onAttach() {
        this.getBodyHandle()
            .querySelector('button.run__close')
            .addEventListener('click', this.closeWindow.bind(this))

        this.getBodyHandle()
            .querySelector('button.run__open')
            .addEventListener('click', this.launchProgram.bind(this))


        this.getBodyHandle()
            .querySelector('input[name="prog"]')
            .addEventListener('keydown', this.handleKeyDown.bind(this))
    }
}

window.pm.registerPrototype('run', RunProgram)
