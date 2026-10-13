class Folder {
    constructor(data) {
        this.parent = null
        this.children = {}

        this.data = {
            name: 'folder',
            icon: 'img/desktop/Folder.png',
            title: 'Folder',
            contents: [],
        }
        
        if (data !== undefined) {
            this.data = {
                ...this.data,
                ...data
            }
        }
    }

    calculatePath() {
        if (this.parent === null) {
            return ['C:']
        }

        return [
            ...this.parent.calculatePath(),
            this.getName()
        ]
    }

    getName() {
        return this.data.name
    }

    getIcon() {
        return this.data.icon
    }

    getContents() {
        return this.data.contents
    }

    getChildren() {
        return this.children
    }

    addChild(child) {
        child.parent = this
        this.children[child.getName()] = child
    }

    async getChild(name) {
        if (!(name in this.children)) {
            return null
        }
        return this.children[name]
    }

    hasChild(name) {
        return (name in this.children)
    }
}

class Filesystem {
    constructor() {
        this.root = new Folder({name: 'C:', title: 'C:'})
    }

    async get(path) {
        const segs = path.split('/')

        if (segs.length === 1) {
            return this.root
        }

        const searcher = async (segs, folder) => {
            if (folder === null) return null

            if (segs.length === 0) {
                return folder
            }

            const next = await folder.getChild(segs[0])

            return await searcher(segs.slice(1), next)
        }

        return await searcher(segs.slice(1), this.root)
    }

    addChild(folder) {
        this.root.addChild(folder)
    }

    async loadFilesystem() {
        // file extension -> thumb image helpers
        const get_extension = name => name.split('.').slice(-1).pop().toLowerCase()
        const extension_map = {
            'exe': 'img/desktop/EXE.png',
            'com': 'img/desktop/EXE.png',
            'ini': 'img/desktop/INI.png',
            'cfg': 'img/desktop/INI.png',
            'txt': 'img/desktop/TextFile.png',
            'wav': 'img/desktop/WavFile.png',
            'dll': 'img/desktop/DLL.png',
            'bat': 'img/desktop/BatchFile.png',
            'bmp': 'img/desktop/Bitmap.png',
            'sys': 'img/desktop/SystemFile.png',
            'png': 'img/desktop/Bitmap.png'
        }
        const get_thumb = name => {
            const ext = get_extension(name)
            if (ext in extension_map) {
                return extension_map[ext]
            }

            return 'img/desktop/File.png'
        }


        // recursion helper through the fs dump
        const recurse_helper = (folder, info) => {
            // if there are files ...
            if ('_files' in info) {
                // ... hydrate them
                folder.data.contents = info._files.map( name => ({
                    img: get_thumb(name),
                    title: name,
                    launch: 'dialog:Error|Disk Error|Disk read error!<br/>Please insert the Windows 98 installation floppy to continue.|ARI'
                }))
            }

            const forbidden = ['.fseventsd', '_files']
            for (let key in info) {
                // skip forbidden file names (leftover from scrapes)
                if (forbidden.indexOf(key) !== -1) {
                    continue
                }

                // don't stomp on default filesystem
                if (folder.hasChild(key)) {
                    continue
                }

                // make a new folder ...
                const new_folder = new Folder({
                    title: key,
                    name: key
                })

                // ... populate it ...
                recurse_helper(new_folder, info[key])

                // ... and add it to this folder
                folder.addChild(new_folder)

            }
        }

        const fs_scrape = await fetch('/data/filesystem.json').then(r => r.json())

        recurse_helper(this.root, fs_scrape)
    }
}

window.fs = new Filesystem()


/* --- DEFAULT FILESYSTEM --- */
window.fs.addChild(new Folder({
    icon: 'img/desktop/MyDocuments.png',
    name: 'My Documents',
    contents: [
/*      Will be edited later  
        {
            img: 'img/desktop/WordPad.png',
            title: 'Resume.pdf',
            launch: 'resume'
        },
        {
            img: 'img/desktop/WordPad.png',
            title: 'CV.pdf',
            launch: 'cv'
        },
        {
            img: 'img/desktop/MyBriefcase.png',
            title: 'My Portfolio',
            shortcut: true,
            launch: 'portfolio'
        },
 */     {
            img: 'img/desktop/InternetExplorer.png',
            title: 'GitHub',
            shortcut: true,
            launch: 'web:https://github.com/bilgedinozor'
        },
        {
            img: 'img/desktop/InternetExplorer.png',
            title: 'LinkedIn',
            shortcut: true,
            launch: 'web:https://www.linkedin.com/in/ali-can-kismet-488b42210/'
        },
        {
            img: 'img/desktop/Email.png',
            title: 'Email',
            shortcut: true,
            launch: 'email'
        },
        {
            img: 'img/desktop/SystemFile.png',
            title: 'Welcome',
            shortcut: true,
            launch: 'welcome'
        }
    ]

/* --- Games Folder --- */
}))
window.fs.addChild(new Folder({
    name: 'MyGames',
    icon: 'img/desktop/MyGames.png',
    contents: [
        {
            img: 'img/special/doom.png',
            title: 'Doom',
            shortcut: true,
            launch: 'jsdos:doom'      
        },
        {
            img: 'img/special/Wolfenstein.png',
            title: 'Wolfenstein 3D',
            shortcut: true,
            launch: 'jsdos:wolfenstein'
        },
        {
            img: 'img/special/volfied.png',
            title: 'Volfied',
            shortcut: true,
            launch: 'jsdos:volfied'
        },
        {
            img: 'img/special/pop.png',
            title: 'Prince of Persia',
            shortcut: true,
            launch: 'jsdos:pop'
        },
        {
            img: 'img/special/duke.png',
            title: 'Duke Nukem 3D',
            shortcut: true,
            launch: 'jsdos:duke'
        },
        {
            img: 'img/special/lotus.png',
            title: 'Lotus III',
            shortcut: true,
            launch: 'jsdos:lotus'
        },
        {
            img: 'img/special/minesweeper.png',
            title: 'Minesweeper',
            shortcut: true,
            launch: 'winmine'
        },
        {
            img: 'img/special/solitaire.png',
            title: 'Solitaire',
            shortcut: true,
            launch: 'sol'
        },
        {
            img: 'img/special/gta5.png',
            title: 'GTA 5',
            shortcut: true,
            launch: 'web:https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        }
    ]
}))
window.fs.addChild(new Folder({
    name: 'Recycling Bin',
    icon: 'img/desktop/RecyclingBin.png',
    contents: [
        {
            img: 'img/desktop/WordPad.png',
            title: 'Bank Passwords',
            shortcut: false,
            launch: 'photo:realy.png'
        }
    ]
}))

window.fs.addChild(new Folder({
    name: 'My Pictures',
    icon: 'img/desktop/Bitmap.png',
    contents: [
        {
            img: 'img/desktop/Bitmap.png',
            title: 'Akide',
            shortcut: false,
            launch: 'photo:akide.jpeg'
        },
        {
            img: 'img/desktop/Bitmap.png',
            title: 'Lotus',
            shortcut: false,
            launch: 'photo:lotus.jpeg'
        }
    ]
}))
window.fs.addChild(new Folder({
    name: 'Network Neighborhood',
    icon: 'img/desktop/NetworkNeighborhood.png',
    contents: [
        {
            img: 'img/desktop/NetDrive.png',
            title: 'Host Computer',
            launch: `dialog:img/dialog/Attention.png|Just kidding.|Just kidding.<br>But that'd be pretty cool though, right?|Yeah.`
        },
        {
            img: 'img/desktop/Web Folders.png',
            title: 'Web Folders',
            launch: 'nop'
        },
        {
            img: 'img/desktop/Entire Internet.png',
            title: 'Entire Internet',
            launch: 'internet'
        }
    ]
}))

window.fs.root.children['My Documents'].addChild(new Folder({
    name: 'My Music',
    icon: 'img/desktop/Favorites.png',
    contents: [
        {
            img: 'img/desktop/Mplayer.png',
            title: 'Bugün Canan Geldi Bize',
            shortcut: true,
            launch: 'web:https://www.youtube.com/watch?v=RguiX0Qck2A&ab_channel=AlicanK%C4%B1smet'
        },
        {
            img: 'img/desktop/Mplayer.png',
            title: 'Misget Düzeni',
            shortcut: true,
            launch: 'web:https://soundcloud.com/alican-k-smet/misket-duzeni/s-HoPRQ?si=7dd84171f9364352b850a1691f706c62&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing'
        }
    ]
}))

window.fs.loadFilesystem()
