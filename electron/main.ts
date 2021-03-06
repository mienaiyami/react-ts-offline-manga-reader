/* eslint-disable no-case-declarations */
import {
    app,
    session,
    BrowserWindow,
    Menu,
    globalShortcut,
    shell,
    ipcMain,
    MenuItemConstructorOptions,
} from "electron";
import path from "path";
import fs from "fs";
import { homedir, tmpdir } from "os";
import * as remote from "@electron/remote/main";
remote.initialize();
declare const HOME_WEBPACK_ENTRY: string;
import { spawn, spawnSync } from "child_process";
if (require("electron-squirrel-startup")) app.quit();
const handleSquirrelEvent = () => {
    if (process.argv.length === 1) {
        return false;
    }
    const appFolder = path.resolve(process.execPath, "..");
    const rootFolder = path.resolve(appFolder, "..");
    // const updateDotExe = path.resolve(path.join(rootFolder, "Update.exe"));
    const exeName = process.execPath;
    // const spawnUpdate = (args: any) => spawn(updateDotExe, args);
    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case "--squirrel-install":
        case "--squirrel-updated":
            // const createShortcutArgs = ["--createShortcut", exeName, "-l", "Desktop,StartMenu"];
            // spawnUpdate(createShortcutArgs);
            const vbsScript = `
            Set WshShell = CreateObject("Wscript.shell")
            strDesktop = WshShell.SpecialFolders("Desktop")
            Set oMyShortcut = WshShell.CreateShortcut(strDesktop + "\\Manga Reader.lnk")
            oMyShortcut.WindowStyle = "1"
            oMyShortcut.IconLocation = "${path.resolve(rootFolder, "app.ico")}"
            OMyShortcut.TargetPath = "${exeName}"
            oMyShortCut.Save
            strStartMenu = WshShell.SpecialFolders("StartMenu")
            Set oMyShortcut2 = WshShell.CreateShortcut(strStartMenu + "\\programs\\Manga Reader.lnk")
            oMyShortcut2.WindowStyle = "1"
            oMyShortcut2.IconLocation = "${path.resolve(rootFolder, "app.ico")}"
            OMyShortcut2.TargetPath = "${exeName}"
            oMyShortCut2.Save
            `;
            fs.writeFileSync(path.resolve(rootFolder, "shortcut.vbs"), vbsScript);
            spawnSync("cscript.exe", [path.resolve(rootFolder, "shortcut.vbs")]);
            fs.unlinkSync(path.resolve(rootFolder, "shortcut.vbs"));
            app.quit();
            break;

        case "--squirrel-uninstall":
            if (
                fs.existsSync(
                    path.resolve(
                        homedir(),
                        "AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Manga Reader.lnk"
                    )
                )
            )
                fs.unlinkSync(
                    path.resolve(
                        homedir(),
                        "AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Manga Reader.lnk"
                    )
                );
            if (fs.existsSync(path.resolve(homedir(), "Desktop/Manga Reader.lnk")))
                fs.unlinkSync(path.resolve(homedir(), "Desktop/Manga Reader.lnk"));
            const uninstallFull = `
            set WshShell = CreateObject("Wscript.shell")
            WScript.Sleep 30000
            Dim FSO
            set FSO=CreateObject("Scripting.FileSystemObject")
            FSO.DeleteFolder("${app.getPath("userData")}")
            FSO.DeleteFolder("${rootFolder}\\*")
            `;
            const temp = fs.mkdtempSync(path.join(tmpdir(), "foo-"));
            fs.writeFileSync(path.join(temp, "uninstall.vbs"), uninstallFull);
            // const cmd = spawn("cmd.exe", ["/K"], { detached: true });
            // cmd.stdin.write("start " + temp + " \r\n");
            spawn("cscript.exe", [path.resolve(temp, "uninstall.vbs")], {
                detached: true,
            });
            // spawnSync("cscript.exe", [path.resolve(temp, "uninstall.vbs")]);
            // fs.unlinkSync(path.resolve(rootFolder));
            // fs.unlinkSync(app.getPath("userData"));
            app.quit();
            break;

        case "--squirrel-obsolete":
            app.quit();
            break;
    }
};

if (handleSquirrelEvent()) {
    app.quit();
}
// declare const HOME_PRELOAD_WEBPACK_ENTRY: string;
const windowsCont: (BrowserWindow | null)[] = [];
let isFirstWindow = true;

app.setUserTasks([
    {
        program: process.execPath,
        arguments: "--new-window",
        iconPath: process.execPath,
        iconIndex: 0,
        title: "New Window",
        description: "Create a new window",
    },
]);

const createWindow = (link?: string) => {
    const newWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 940,
        minHeight: 560,
        frame: false,
        backgroundColor: "#272727",
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            // preload: HOME_PRELOAD_WEBPACK_ENTRY,
        },
    });
    const currentWindowIndex = windowsCont.length;
    windowsCont.push(newWindow);
    newWindow.on("close", () => (windowsCont[currentWindowIndex] = null));
    newWindow.loadURL(HOME_WEBPACK_ENTRY);
    newWindow.setMenuBarVisibility(false);
    newWindow.webContents.once("dom-ready", () => {
        newWindow.maximize();
        newWindow.webContents.send("loadMangaFromLink", { link: link || "" });
        if (isFirstWindow) {
            newWindow.webContents.send("checkforupdate");
            isFirstWindow = false;
        }
    });
    newWindow.webContents.setWindowOpenHandler(() => {
        return { action: "deny" };
    });
};
const registerListener = () => {
    ipcMain.on("openLinkInNewWindow", (e, link) => {
        createWindow(link);
    });
};
app.on("ready", async () => {
    registerListener();
    createWindow();
    if (!app.isPackaged) {
        try {
            const reactDevToolsPath = path.join(
                homedir(),
                "AppData\\local\\Microsoft\\Edge\\User Data\\Default\\Extensions\\gpphkfbcpidddadnkolkpfckpihlkkil\\4.20.2_0"
            );
            await session.defaultSession.loadExtension(reactDevToolsPath);
        } catch (err) {
            console.error(err);
        }
    }
    const template: MenuItemConstructorOptions[] = [
        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                { role: "pasteAndMatchStyle" },
                { role: "selectAll" },
            ],
        },
        {
            label: "View",
            submenu: [
                { role: "reload" },
                { role: "forceReload" },
                { role: "toggleDevTools" },
                { type: "separator" },
                { role: "resetZoom" },
                { role: "zoomIn", accelerator: "CommandOrControl+=" },
                { role: "zoomOut" },
            ],
        },
        {
            label: "Others",
            submenu: [
                {
                    role: "help",
                    accelerator: "F1",
                    click: () => shell.openExternal("https://github.com/mienaiyami/react-ts-offline-manga-reader"),
                },
                {
                    label: "New Window",
                    accelerator: process.platform === "darwin" ? "Cmd+N" : "Ctrl+N",
                    click: () => createWindow(),
                },
            ],
        },
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
