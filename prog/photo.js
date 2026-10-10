class PhotoProgram extends Program {
  // resolves with the picture's own size, or null if it can't be loaded
  static measure(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async createWindow(argument) {
    let imageName = argument ? argument.toLowerCase() : "";
    let src = `/img/special/${imageName}`;

    // needed up front to open the window at the right size
    this.size = await PhotoProgram.measure(src);

    let winfo = {
      name: imageName || "Photo",
      title: imageName || "Photo",
      icon: `img/desktop/Bitmap.png`,
      resizable: true,
      margin: false,
      app: true,
    };

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
        </div>
        <div class="photo__view">
            <img src="${src}" alt="${imageName}"/>
        </div>
        `;

    return [winfo, body];
  }

  onAttach(win) {
    const view = this.getBodyHandle().querySelector(".photo__view");
    const picture = view.querySelector("img");
    const size = this.size || { width: 320, height: 240 };

    // open at the picture's own size, shrunk if it wouldn't fit on screen
    const scale = Math.min(
      1,
      (window.innerWidth * 0.6) / size.width,
      ((window.innerHeight - 30) * 0.6) / size.height
    );

    const width = Math.round(size.width * scale);
    const height = Math.round(size.height * scale);

    // size the window as if it were all picture, then grow it by whatever
    // the borders, title bar and menu bar turned out to take up
    win.style.width = `${width}px`;
    win.style.height = `${height}px`;

    const chromeWidth = width - picture.offsetWidth;
    const chromeHeight = height - picture.offsetHeight;

    win.style.width = `${width + chromeWidth}px`;
    win.style.height = `${height + chromeHeight}px`;
  }
}

window.pm.registerPrototype("photo", PhotoProgram);
