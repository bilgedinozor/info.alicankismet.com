class PhotoProgram extends Program {
  createWindow(argument) {
    let title = argument === null ? "Photo" : `Photo (${argument})`;
    let imageName = argument ? argument.toLowerCase() : "";

    let winfo = {
      name: imageName,
      title: imageName,
      icon: `img/desktop/bitmap.png`, // Dynamically generate the image source
      resizable: false,
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
                <div class="window" data-wm_order="0">
            <img src="/img/special/${imageName}" alt="${title}" style="max-width: 100%; height: auto;"/>
        </div>
        `;

    return [winfo, body];
  }
}

window.pm.registerPrototype("photo", PhotoProgram);
