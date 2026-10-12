class jsdosProgram extends Program {
  isMobileBrowser() {
    return (
      typeof window.orientation !== "undefined" ||
      navigator.userAgent.indexOf("IEMobile") !== -1
    );
  }

  createWindow(argument) {
    const bundle_name = argument ?? "jsdos";
    const htmlFileName = `${bundle_name}.html`;

    let body = "";
    let wminfo = {
      title: `${bundle_name.toUpperCase()}.EXE`,
      name: bundle_name[0].toUpperCase() + bundle_name.slice(1),
      icon: "img/desktop/MSDOS.png",
      resizable: true,
      width: 640,
      height: 480,
      x: 75,
      y: 75,
    };

    if (this.isMobileBrowser()) {
      wminfo = {
        ...wminfo,
        width: 360,
        height: 240,
      };
    }

    const bundle_url = `prog/jsdos/games/${bundle_name}.jsdos`;
    const src = `prog/jsdos/games/${htmlFileName}`;
    body = `
        <iframe
            style="width: calc(100% - 4px); height: 100%"
            src="${src}">
        </iframe>
    `;

    return [wminfo, body];
  }

  onAttach() {
    this.getBodyHandle().style.margin = 0;
    this.getBodyHandle().querySelector("iframe").focus();
  }
}

window.pm.registerPrototype("jsdos", jsdosProgram);
window.pm.registerPrototype("doom", jsdosProgram);
window.pm.registerPrototype("duke", jsdosProgram);
window.pm.registerPrototype("pop", jsdosProgram);
window.pm.registerPrototype("wolfenstein", jsdosProgram);
window.pm.registerPrototype("volfied", jsdosProgram);
