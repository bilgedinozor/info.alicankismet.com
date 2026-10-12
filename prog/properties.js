/* Windows 98's System Properties, showing the kind of machine it would have
 * run on. Only for looks: nothing in here reads the visitor's computer. */

// device manager: [class, icon in img/devices, devices of that class]
const PROPERTIES_DEVICES = [
    ['CDROM', 'CDROM', [
        'ATAPI CD-ROM DRIVE 32X'
    ]],
    ['Disk drives', 'DiskDrive', [
        'GENERIC IDE  DISK TYPE47',
        'GENERIC NEC  FLOPPY DISK'
    ]],
    ['Display adapters', 'DisplayAdapter', [
        'S3 ViRGE-DX/GX PCI (375/385)'
    ]],
    ['Floppy disk controllers', 'FloppyController', [
        'Standard Floppy Disk Controller'
    ]],
    ['Hard disk controllers', 'HardDiskController', [
        'Intel 82371AB/EB PCI Bus Master IDE Controller',
        'Primary IDE controller (dual fifo)',
        'Secondary IDE controller (dual fifo)'
    ]],
    ['Keyboard', 'Keyboard', [
        'Standard 101/102-Key or Microsoft Natural Keyboard'
    ]],
    ['Modem', 'Modem', [
        'U.S. Robotics 56K FAX INT PnP'
    ]],
    ['Monitors', 'Monitor', [
        'Plug and Play Monitor'
    ]],
    ['Mouse', 'Mouse', [
        'Standard PS/2 Port Mouse'
    ]],
    ['Network adapters', 'NetworkAdapter', [
        'Dial-Up Adapter',
        'Realtek RTL8029(AS) PCI Ethernet NIC'
    ]],
    ['Ports (COM & LPT)', 'Ports', [
        'Communications Port (COM1)',
        'Communications Port (COM2)',
        'Printer Port (LPT1)'
    ]],
    ['Sound, video and game controllers', 'Sound', [
        'Creative Sound Blaster 16 Plug and Play',
        'Gameport Joystick'
    ]],
    ['System devices', 'Computer', [
        'Advanced Power Management support',
        'Direct memory access controller',
        'Intel 82371AB/EB PCI to ISA bridge (ISA mode)',
        'Intel 82439TX Pentium(r) Processor to PCI bridge',
        'IO read data port for ISA Plug and Play enumerator',
        'Motherboard resources',
        'Numeric data processor',
        'PCI bus',
        'Plug and Play BIOS',
        'Programmable interrupt controller',
        'System board',
        'System CMOS/real time clock',
        'System speaker',
        'System timer'
    ]],
    ['Universal Serial Bus controllers', 'USB', [
        'Intel 82371AB/EB PCI to USB Universal Host Controller',
        'USB Root Hub'
    ]]
]

class PropertiesProgram extends Program {
    createDeviceTree() {
        const row = (icon, name, toggle = '') => `
            <div class="properties__row">
                ${toggle}<img src="img/devices/${icon}.png" alt=""/><span class="properties__name">${name}</span>
            </div>
        `

        const classes = PROPERTIES_DEVICES.map(([name, icon, devices]) => `
            <li class="properties__node properties__node--branch">
                ${row(icon, name.replace('&', '&amp;'), '<span class="properties__toggle"></span>')}
                <ul>
                    ${devices.map(device => `
                        <li class="properties__node">${row(icon, device)}</li>
                    `).join('')}
                </ul>
            </li>
        `)

        return `
            <ul class="properties__tree">
                <li class="properties__node">
                    ${row('Computer', 'Computer')}
                    <ul>${classes.join('')}</ul>
                </li>
            </ul>
        `
    }

    createWindow() {
        let winfo = {
            title: 'System Properties',
            name: 'System Properties',
            icon: 'img/desktop/MyComputer.png',
            width: 404 // 410 with the window border
        }

        let body = `
            <div class="properties__tabs">
                <span class="properties__tab properties__tab--active" data-tab="general">General</span>
                <span class="properties__tab" data-tab="devices">Device Manager</span>
                <span class="properties__tab" data-tab="performance">Performance</span>
            </div>
            <div class="properties__panel">
                <div class="properties__page properties__page--active" data-tab="general">
                    <img class="properties__logo" src="img/dialog/SystemProperties.png" alt="Windows 98"/>
                    <div class="properties__info">
                        <div class="properties__group properties__group--system">
                            <p>System:</p>
                            <p class="properties__value">
                                Microsoft Windows 98<br/>
                                4.10.1998
                            </p>
                        </div>
                        <div class="properties__group properties__group--registered">
                            <p>Registered to:</p>
                            <p class="properties__value">
                                Ali Can KISMET
                            </p>
                        </div>
                        <div class="properties__group">
                            <p>Computer:</p>
                            <p class="properties__value">
                                GenuineIntel<br/>
                                Pentium(r) Processor<br/>
                                64.0MB RAM
                            </p>
                        </div>
                    </div>
                </div>
                <div class="properties__page properties__page--devices" data-tab="devices">
                    <div class="properties__view">
                        <input type="radio" name="properties-view" id="properties-by-type" checked>
                        <label for="properties-by-type">View devices by <u>t</u>ype</label>
                        <input type="radio" name="properties-view" id="properties-by-connection">
                        <label for="properties-by-connection">View devices by <u>c</u>onnection</label>
                    </div>
                    ${this.createDeviceTree()}
                </div>
                <div class="properties__page properties__page--performance" data-tab="performance">
                    <fieldset class="properties__status">
                        <legend>Performance status</legend>
                        <table>
                            <tr><td>Memory:</td><td>64.0 MB of RAM</td></tr>
                            <tr><td>System Resources:</td><td>72% free</td></tr>
                            <tr><td>File System:</td><td>32-bit</td></tr>
                            <tr><td>Virtual Memory:</td><td>32-bit</td></tr>
                            <tr><td>Disk Compression:</td><td>Not installed</td></tr>
                            <tr><td>PC Cards (PCMCIA):</td><td>No PCMCIA sockets installed</td></tr>
                        </table>
                        <p>Your system is configured for optimal performance.</p>
                    </fieldset>
                </div>
            </div>
            <div class="window__dialog-action properties__action">
                <button autofocus>OK</button>
                <button>Cancel</button>
            </div>
        `

        return [winfo, body]
    }

    showTab(name) {
        this.getBodyHandle()
            .querySelectorAll('.properties__tab')
            .forEach(el => el.classList
                .toggle('properties__tab--active', el.dataset.tab === name)
            )

        this.getBodyHandle()
            .querySelectorAll('.properties__page')
            .forEach(el => el.classList
                .toggle('properties__page--active', el.dataset.tab === name)
            )
    }

    onAttach() {
        // a dialog box: it has the "?" button where other windows have minimize
        const help = document.createElement('button')
        help.setAttribute('aria-label', 'Help')
        this.handle
            .querySelector('button[aria-label="Minimize"]')
            .replaceWith(help)

        this.getBodyHandle()
            .querySelectorAll('.properties__tab[data-tab]')
            .forEach(el => el
                .addEventListener('click', () => this.showTab(el.dataset.tab))
            )

        // device tree: the box (or a double click) opens a class, a click selects
        const tree = this.getBodyHandle().querySelector('.properties__tree')
        const toggle = node => node.classList.toggle('properties__node--open')

        // a row counts across the whole width of the list, indent included
        const rowAt = e => [...tree.querySelectorAll('.properties__row')]
            .find(row => {
                const rect = row.getBoundingClientRect()
                return rect.height > 0 && e.clientY >= rect.top && e.clientY < rect.bottom
            })

        tree.addEventListener('click', e => {
            if (e.target.matches('.properties__toggle')) {
                toggle(e.target.closest('.properties__node'))
                return
            }

            const row = rowAt(e)
            if (!row) return

            tree.querySelectorAll('.properties__name--selected')
                .forEach(el => el.classList.remove('properties__name--selected'))
            row.querySelector('.properties__name')
                .classList.add('properties__name--selected')
        })
        tree.addEventListener('dblclick', e => {
            const row = rowAt(e)
            if (!row || e.target.matches('.properties__toggle')) return

            if (row.parentElement.matches('.properties__node--branch')) {
                toggle(row.parentElement)
            }
        })

        this.getBodyHandle()
            .querySelectorAll('.properties__action button')
            .forEach(el => el
                .addEventListener('click', this.closeWindow.bind(this))
            )
    }
}

window.pm.registerPrototype('properties', PropertiesProgram)
