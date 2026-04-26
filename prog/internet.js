class InternetProgram extends Program {
    createWindow(argument) {
        let title = (argument === null) ? 'Internet' : `Internet (${argument})`

        let winfo = {
            name: 'Internet Explorer',
            title,
            icon: 'img/desktop/Notepad.png',
            resizable: true,
            margin: false,
            app: true,
            width: 640, // Set the width to 640 pixels
            height: 480 // Set the height to 480 pixels
        }
        let body = `
            <div class="menu-bar__container">
                <div class="menu-bar__menu">
                    <div class="menu-bar__handle"></div>
                    <span class="menu-bar__item">
                        File
                    </span>
                    <span class="menu-bar__item">
                        Edit
                    </span>
                    <span class="menu-bar__item">
                        Search
                    </span>
                    <span class="menu-bar__item">
                        Help
                    </span>
                </div>
                <input class="menu-bar__input" type="text" value="https://www.google.com/webhp?igu=1" disabled>
            </div>
            <iframe
            style="width: calc(100% - 4px); height: 100%"
            src="https://www.google.com/webhp?igu=1">
        </iframe>
        `

        return [winfo, body]
    }
}

window.pm.registerPrototype('internet', InternetProgram)
